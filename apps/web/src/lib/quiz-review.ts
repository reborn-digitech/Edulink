import "server-only";
import { fixtureTopicsWhere, reviewerSeesFixtureTopics } from "./quiz-fixtures";
import { Prisma } from "@prisma/client";
import {
  FIXTURE_TOPIC_SLUG_PREFIX,
  QUIZ_TAKEDOWN_REASONS,
  type QuizBankKind,
  type QuizBankKindSplit,
  type QuizBankStanding,
  type QuizBankState,
  type QuizReviewAction,
  type QuizReviewEditBody,
  type QuizReviewItem,
  type QuizReviewList,
  type QuizReviewNext,
  type QuizReviewQuery,
  type QuizReviewRole,
  type QuizTakeDownReason,
} from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { assertAppAdmin, type BankResult } from "./app-admin";
import { AUTHORED_IN_THE_APP } from "./bank-source";
import { SERVED_QUESTION, translationKeepsItsPlace } from "./quiz-served";
import { clampLevel, parseChoices } from "./quiz";
import { checkExprProblem } from "./bank-csv";
import type { ActiveContext } from "./session";

/**
 * THE QUESTION BANK'S DESK (docs/plans/assistant-and-quiz-bank.md, Phase 1 "Output and review"), as
 * the owner decided on 11 October 2026: the generator's items are PUBLISHED WITHOUT REVIEW — loaded by
 * scripts/quiz-queue-load.ts and served at once with their Hindi and Marathi (src/lib/quiz-served.ts) —
 * and the app admins and the operator, never teachers, walk the bank afterwards at /appadmin/quiz-review
 * and /root/quiz-review (it was the review queue, 10–11 October). This module is THE ONE WRITER of what
 * the desk does to an item, each act a QuizReviewStamp row (who, as which role, what, why, the words
 * before) written in the same transaction as the change the serving filter reads:
 *
 *   EDIT       → the English and, when sent, the Hindi and Marathi rows (all three languages, one
 *                writer: the bank editor and the translations page refuse a generated item); the solver's
 *                answers kept with editedAfterSolvingAt when the English changed
 *   TAKE_DOWN  → takenDownAt / takenDownReason / takenDownBy: not served from that moment
 *   PUT_BACK   → those three cleared: served again
 *
 * The answers pupils gave (QuestionStat, QuizResponse) stay attached to a taken-down item. The review
 * queue's stamps (ACCEPT, EDIT_ACCEPT, DISCARD and the language stamps) stay as the items' history.
 *
 * The native-review page (/appadmin/translations, translation-review.ts) stamps an AUTHORED question's
 * language through `writeLanguageStamp` below.
 *
 * The walk's order is the plan's (section 8 item 9): grades 6 to 10 mathematics and science first, then
 * the rest; within each band by grade, subject, the chapter's position, the level and the id.
 *
 * ONE BANK ON THE DESK (the owner's ask of 7 November 2026). The desk had counted, listed and acted on the
 * generated rows alone while the curated bank (content/quiz/*.json through scripts/import-quiz.ts) sat
 * beside it unseen. Now the list (`listQueue`) and the one-item door (`getItem`) answer the whole bank,
 * curated and generated together, each item with its `kind` and every count with its split; TAKE_DOWN
 * and PUT_BACK act on either kind, since the flags they set are the row's and quiz-served.ts reads them
 * the same for both; EDIT stays the generated item's and refuses a curated one with
 * quizReview.refuseEditCurated (its words are changed in its file and imported again; a curated row
 * typed in the app is the bank editor's, app-admin.ts). `nextItem` keeps walking the generated items:
 * that is the review queue's purpose. Provenance is untouched: `generated` is never flipped here.
 */

export const FIRST_BAND = { classLevel: { gte: 6, lte: 10 }, subject: { in: ["MATHS", "SCIENCE"] } } satisfies Prisma.QuizTopicWhereInput;

/** What Next walks: the generated items of the bank (the review queue's purpose). */
export const QUEUE = { generated: true, topic: { retiredAt: null } } satisfies Prisma.QuizQuestionWhereInput;

/** Held: a generated item whose figure is not drawn (src/lib/quiz-served.ts isHeldForFigure, the same rule). */
const HELD = { generated: true, takenDownAt: null, needsFigure: true, imageKey: null } satisfies Prisma.QuizQuestionWhereInput;

/** A standing as a where clause, the one serving rule (quiz-served.ts) for SERVED and HELD, so a curated row is never between the two. */
export function stateWhere(state: QuizBankState): Prisma.QuizQuestionWhereInput {
  if (state === "DOWN") return { takenDownAt: { not: null } };
  if (state === "HELD") return HELD;
  return SERVED_QUESTION;
}

export function stateOfRow(row: { generated: boolean; takenDownAt: Date | null; needsFigure: boolean; imageKey: string | null }): QuizBankState {
  if (row.takenDownAt) return "DOWN";
  if (row.generated && row.needsFigure && !row.imageKey) return "HELD";
  return "SERVED";
}

export const kindOf = (generated: boolean): QuizBankKind => (generated ? "GENERATED" : "CURATED");

/** The curated bank's folder; a chapter's file in it is named by the chapter's slug (scripts/import-quiz.ts reads them all). */
export const CURATED_FOLDER = "content/quiz";

/**
 * The file a curated item's words are changed in and imported again, "content/quiz/<slug>.json" (every file of the
 * folder is named by its chapter's slug; the importer matches its questions by stem). Null for a generated item, and
 * for a curated row written in the app (the content team's bank page, its sheet, a teacher's contribution:
 * bank-source.ts), which no file holds and the importer never orphans. Pure.
 */
export function curatedFileOf(row: { generated: boolean; source: string }, slug: string): string | null {
  if (row.generated || AUTHORED_IN_THE_APP.has(row.source)) return null;
  return `${CURATED_FOLDER}/${slug}.json`;
}

const ORDER: Prisma.QuizQuestionOrderByWithRelationInput[] = [
  { topic: { classLevel: "asc" } },
  { topic: { subject: "asc" } },
  { topic: { position: "asc" } },
  { difficulty: "asc" },
  { id: "asc" },
];

const MAX_SKIP = 200;
const MAX_GROUPS = 300;
/** The acts the desk writes, counted per person. */
const DESK_ACTIONS = ["EDIT", "TAKE_DOWN", "PUT_BACK"] as const;

class Refusal extends Error {
  constructor(readonly errorKey: TranslationKey) {
    super(errorKey);
  }
}

/** The person's standing at the desk: the content team, or the operator (who passes the content team's gate too). */
export function reviewerRole(session: ActiveContext): QuizReviewRole {
  assertAppAdmin(session);
  return session.user.isSuperuser ? "OPERATOR" : "APP_ADMIN";
}

/** The ids skipped this sitting, from the comma-separated query value; at most two hundred. */
export function parseSkip(skip: string | undefined): string[] {
  if (!skip) return [];
  return [...new Set(skip.split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{1,64}$/.test(s)))].slice(0, MAX_SKIP);
}

/** The fixtures' zz- chapters, for a reviewer who is a fixture only (quiz-fixtures.ts; integration, 11 Oct 2026). */
async function fixtureScope(session: ActiveContext): Promise<Prisma.QuizQuestionWhereInput[]> {
  return (await reviewerSeesFixtureTopics(session.user.id)) ? [] : [{ topic: fixtureTopicsWhere(false) }];
}

function filterWhere(q: Omit<QuizReviewQuery, "skip">): Prisma.QuizQuestionWhereInput[] {
  const and: Prisma.QuizQuestionWhereInput[] = [];
  // A generated item's board is its own (the file's); a curated item's is its chapter's (the importer's, NCERT unless the file names one).
  if (q.board) and.push({ OR: [{ generatedBoard: q.board }, { generated: false, topic: { board: q.board } }] });
  if (q.topic) and.push({ topicId: q.topic });
  if (q.level) and.push({ difficulty: q.level });
  if (q.grade || q.subject) and.push({ topic: { ...(q.grade ? { classLevel: q.grade } : {}), ...(q.subject ? { subject: q.subject } : {}) } });
  if (q.state) and.push(stateWhere(q.state));
  return and;
}

/** Midnight in India, as an instant: "today" for a person's count. */
export function startOfIndianDay(now = new Date()): Date {
  const offset = 330 * 60_000;
  const local = new Date(now.getTime() + offset);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offset);
}

/** Whether a chapter is in the plan's first band (section 8 item 9). */
export function inFirstBand(topic: { classLevel: number; subject: string }): boolean {
  return topic.classLevel >= 6 && topic.classLevel <= 10 && (topic.subject === "MATHS" || topic.subject === "SCIENCE");
}

/* -------------------------------------------------------------------------- */
/* The generator's material, as stored                                         */
/* -------------------------------------------------------------------------- */

type GenerationTranslation = { imageAlt?: string | null; critique?: string | null; flag?: string | null };
export type Generation = {
  distractorReason?: (string | null)[];
  solverAnswers?: number[];
  levelFlag?: string | null;
  critique?: string | null;
  figure?: { kind: string; spec: Record<string, unknown> } | null;
  needsFigure?: boolean;
  /** quiz-board (11 Oct 2026): why scripts/quiz-queue.ts could not draw the figure, when it could not. */
  figureError?: string | null;
  edition?: string | null;
  generatedAt?: string | null;
  model?: string | null;
  translations?: Partial<Record<"hi" | "mr", GenerationTranslation>>;
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** The stored JSON, read defensively: a field the generator did not write is absent, never a crash. */
export function readGeneration(raw: string | null): Generation {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object") return {};
  const g = parsed as Record<string, unknown>;
  const figure = g.figure && typeof g.figure === "object" && typeof (g.figure as { kind?: unknown }).kind === "string" && (g.figure as { spec?: unknown }).spec && typeof (g.figure as { spec?: unknown }).spec === "object"
    ? { kind: (g.figure as { kind: string }).kind, spec: (g.figure as { spec: Record<string, unknown> }).spec }
    : null;
  const translations: Generation["translations"] = {};
  if (g.translations && typeof g.translations === "object") {
    for (const language of ["hi", "mr"] as const) {
      const t = (g.translations as Record<string, unknown>)[language];
      if (t && typeof t === "object") {
        const r = t as Record<string, unknown>;
        translations[language] = { imageAlt: str(r.imageAlt), critique: str(r.critique), flag: str(r.flag) };
      }
    }
  }
  return {
    distractorReason: Array.isArray(g.distractorReason) ? g.distractorReason.map((r) => str(r)) : [],
    solverAnswers: Array.isArray(g.solverAnswers) ? g.solverAnswers.filter((n): n is number => Number.isInteger(n)) : [],
    levelFlag: str(g.levelFlag),
    critique: str(g.critique),
    figure,
    needsFigure: g.needsFigure === true,
    figureError: str(g.figureError),
    edition: str(g.edition),
    generatedAt: str(g.generatedAt),
    model: str(g.model),
    translations,
  };
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

const ITEM_SELECT = {
  id: true,
  generated: true,
  difficulty: true,
  stem: true,
  choices: true,
  answerIndex: true,
  solution: true,
  checkExpr: true,
  source: true,
  generatedBoard: true,
  generation: true,
  imageKey: true,
  imageAlt: true,
  needsFigure: true,
  editedAfterSolvingAt: true,
  takenDownAt: true,
  takenDownReason: true,
  takenDownBy: true,
  topic: { select: { id: true, slug: true, name: true, chapter: true, subject: true, classLevel: true } },
  translations: { where: { language: { in: ["hi", "mr"] } }, select: { language: true, stem: true, choices: true, solution: true, updatedAt: true } },
  reviewStamps: { orderBy: { at: "asc" }, take: 50, select: { action: true, language: true, reason: true, reviewerUserId: true, role: true, at: true } },
  stats: { select: { asked: true, correct: true } },
} satisfies Prisma.QuizQuestionSelect;

type ItemRow = Prisma.QuizQuestionGetPayload<{ select: typeof ITEM_SELECT }>;

async function namesOf(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (unique.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

const asReason = (r: string | null): QuizTakeDownReason | null => ((QUIZ_TAKEDOWN_REASONS as readonly string[]).includes(r ?? "") ? (r as QuizTakeDownReason) : null);

async function toItem(row: ItemRow): Promise<QuizReviewItem> {
  const g = readGeneration(row.generation);
  const names = await namesOf([...row.reviewStamps.map((s) => s.reviewerUserId), row.takenDownBy]);
  const translation = (language: "hi" | "mr") => {
    const t = row.translations.find((x) => x.language === language);
    if (!t) return null;
    const extra = g.translations?.[language];
    return {
      stem: t.stem,
      choices: t.choices ? parseChoices(t.choices) : [],
      solution: t.solution,
      imageAlt: extra?.imageAlt ?? null,
      critique: extra?.critique ?? null,
      flag: extra?.flag ?? null,
      stale: row.editedAfterSolvingAt !== null && t.updatedAt < row.editedAfterSolvingAt,
    };
  };
  return {
    id: row.id,
    kind: kindOf(row.generated),
    file: curatedFileOf(row, row.topic.slug),
    board: row.generatedBoard,
    topic: { id: row.topic.id, slug: row.topic.slug, name: row.topic.name, chapter: row.topic.chapter, subject: row.topic.subject, grade: row.topic.classLevel },
    difficulty: clampLevel(row.difficulty),
    stem: row.stem,
    choices: parseChoices(row.choices),
    answerIndex: row.answerIndex,
    solution: row.solution,
    checkExpr: row.checkExpr,
    distractorReasons: g.distractorReason ?? [],
    solverAnswers: g.solverAnswers ?? [],
    levelFlag: g.levelFlag ?? null,
    critique: g.critique ?? null,
    edition: g.edition ?? null,
    source: row.source,
    model: g.model ?? null,
    generatedAt: g.generatedAt ?? null,
    figure: g.figure ?? null,
    needsFigure: row.needsFigure || g.needsFigure === true,
    imageKey: row.imageKey,
    imageAlt: row.imageAlt,
    figureError: g.figureError ?? null,
    editedAfterSolvingAt: row.editedAfterSolvingAt?.toISOString() ?? null,
    state: stateOfRow(row),
    takenDownAt: row.takenDownAt?.toISOString() ?? null,
    takenDownReason: asReason(row.takenDownReason),
    takenDownBy: row.takenDownBy ? (names.get(row.takenDownBy) ?? null) : null,
    answers: { asked: row.stats.reduce((n, s) => n + s.asked, 0), correct: row.stats.reduce((n, s) => n + s.correct, 0) },
    translations: { hi: translation("hi"), mr: translation("mr") },
    stamps: row.reviewStamps.map((s) => ({
      action: s.action as QuizReviewAction,
      language: s.language === "hi" || s.language === "mr" ? s.language : null,
      reason: asReason(s.reason),
      reviewer: names.get(s.reviewerUserId) ?? "—",
      role: s.role === "OPERATOR" ? "OPERATOR" : "APP_ADMIN",
      at: s.at.toISOString(),
    })),
  };
}

/**
 * THE BANK IN ONE QUERY. The list's counts were thirteen parallel groupBy calls, each a tenant transaction of its own
 * (db.ts runs every model query inside one), which starved the pool the moment the bank was the whole 15,000 rows and
 * the suites ran beside the generation run ("unable to start a transaction in the given time", 7 Nov 2026). The quiz
 * tables carry no policy (prisma/rls.sql), so one plain GROUP BY over the bank — per chapter, kind, level, board and
 * standing, a few thousand rows at most however large the bank grows — serves every count, and the desk's filters are
 * applied to those rows here. The standing is the serving rule's (quiz-served.ts): taken down, else held when the
 * generator asked for a figure nobody drew, else served.
 */
type BankCell = { topicId: string; generated: boolean; difficulty: number; generatedBoard: string | null; down: boolean; held: boolean; n: number };

async function bankCells(sees: boolean): Promise<BankCell[]> {
  const scope = sees ? Prisma.empty : Prisma.sql`AND t."slug" NOT LIKE ${`${FIXTURE_TOPIC_SLUG_PREFIX}%`}`;
  return db.$queryRaw<BankCell[]>`
    SELECT q."topicId", q."generated", q."difficulty", q."generatedBoard",
           (q."takenDownAt" IS NOT NULL) AS "down",
           (q."takenDownAt" IS NULL AND q."generated" AND q."needsFigure" AND q."imageKey" IS NULL) AS "held",
           COUNT(*)::int AS "n"
    FROM "QuizQuestion" q JOIN "QuizTopic" t ON t."id" = q."topicId"
    WHERE t."retiredAt" IS NULL ${scope}
    GROUP BY 1, 2, 3, 4, 5, 6`;
}

const cellState = (c: BankCell): QuizBankState => (c.down ? "DOWN" : c.held ? "HELD" : "SERVED");

type BankTopic = { id: string; name: string; chapter: string; subject: string; classLevel: number; position: number; board: string | null };

/** Whether a cell is under the desk's filters: a generated item by its own board, a curated one by its chapter's. */
function underFilter(c: BankCell, topic: BankTopic, q: Omit<QuizReviewQuery, "skip">): boolean {
  if (q.topic && c.topicId !== q.topic) return false;
  if (q.level && c.difficulty !== q.level) return false;
  if (q.grade && topic.classLevel !== q.grade) return false;
  if (q.subject && topic.subject !== q.subject) return false;
  if (q.board && (c.generated ? c.generatedBoard : topic.board) !== q.board) return false;
  if (q.state && cellState(c) !== q.state) return false;
  return true;
}

const emptySplit = (): QuizBankKindSplit => ({ curated: 0, generated: 0 });
const addTo = (split: QuizBankKindSplit, c: BankCell) => {
  split[c.generated ? "generated" : "curated"] += c.n;
};
const sumOf = (split: QuizBankKindSplit) => split.curated + split.generated;

/** The whole bank by chapter and level under the filter, curated and generated together, with the counts the desk works against. */
export async function listQueue(session: ActiveContext, query: Omit<QuizReviewQuery, "skip"> = {}): Promise<QuizReviewList> {
  reviewerRole(session);
  const sees = await reviewerSeesFixtureTopics(session.user.id);
  const dayStart = startOfIndianDay();
  const mineWhere = { reviewerUserId: session.user.id, action: { in: [...DESK_ACTIONS] } };
  const [cells, topics, myToday, myTotal, perReviewer] = await Promise.all([
    bankCells(sees),
    db.quizTopic.findMany({ where: { AND: [{ retiredAt: null }, fixtureTopicsWhere(sees)] }, select: { id: true, name: true, chapter: true, subject: true, classLevel: true, position: true, board: true } }),
    db.quizReviewStamp.count({ where: { ...mineWhere, at: { gte: dayStart } } }),
    db.quizReviewStamp.count({ where: mineWhere }),
    db.quizReviewStamp.groupBy({ by: ["reviewerUserId", "role", "action"], where: { action: { in: [...DESK_ACTIONS] } }, _count: { _all: true } }),
  ]);
  const topicById = new Map<string, BankTopic>(topics.map((t) => [t.id, t]));

  const whole = emptySplit();
  const split = { served: emptySplit(), takenDown: emptySplit(), held: emptySplit(), filtered: emptySplit() };
  const subjects = new Set<string>();
  const boards = new Set<string>();
  // One group per chapter (a curated row carries no generated board, so the chapter's board is its own, else the generator's).
  const groups = new Map<string, QuizReviewList["groups"][number] & { position: number }>();
  for (const c of cells) {
    const topic = topicById.get(c.topicId);
    if (!topic) continue;
    subjects.add(topic.subject);
    if (c.generatedBoard) boards.add(c.generatedBoard);
    addTo(whole, c);
    const state = cellState(c);
    addTo(state === "DOWN" ? split.takenDown : state === "HELD" ? split.held : split.served, c);
    if (!underFilter(c, topic, query)) continue;
    addTo(split.filtered, c);
    const row = groups.get(c.topicId) ?? {
      board: topic.board ?? c.generatedBoard,
      topicId: topic.id,
      subject: topic.subject,
      grade: topic.classLevel,
      chapter: topic.chapter,
      name: topic.name,
      levels: [0, 0, 0, 0, 0, 0],
      total: 0,
      curated: 0,
      generated: 0,
      down: 0,
      held: 0,
      first: inFirstBand(topic),
      position: topic.position,
    };
    if (!row.board && c.generatedBoard) row.board = c.generatedBoard;
    row.levels[clampLevel(c.difficulty) - 1]! += c.n;
    row.total += c.n;
    row[c.generated ? "generated" : "curated"] += c.n;
    if (state === "DOWN") row.down += c.n;
    else if (state === "HELD") row.held += c.n;
    groups.set(c.topicId, row);
  }
  for (const t of topics) if (t.board) boards.add(t.board);
  const ordered = [...groups.values()]
    .sort((a, b) => Number(b.first) - Number(a.first) || a.grade - b.grade || a.subject.localeCompare(b.subject) || a.position - b.position || (a.board ?? "").localeCompare(b.board ?? ""))
    .slice(0, MAX_GROUPS)
    .map((g) => ({ board: g.board, topicId: g.topicId, subject: g.subject, grade: g.grade, chapter: g.chapter, name: g.name, levels: g.levels, total: g.total, curated: g.curated, generated: g.generated, down: g.down, held: g.held, first: g.first }));

  const reviewers = new Map<string, { role: QuizReviewRole; edits: number; takenDown: number; putBack: number }>();
  for (const r of perReviewer) {
    const row = reviewers.get(r.reviewerUserId) ?? { role: r.role === "OPERATOR" ? "OPERATOR" : "APP_ADMIN", edits: 0, takenDown: 0, putBack: 0 };
    if (r.action === "EDIT") row.edits += r._count._all;
    else if (r.action === "TAKE_DOWN") row.takenDown += r._count._all;
    else if (r.action === "PUT_BACK") row.putBack += r._count._all;
    reviewers.set(r.reviewerUserId, row);
  }
  const names = await namesOf([...reviewers.keys()]);

  return {
    total: sumOf(whole),
    curated: whole.curated,
    generated: whole.generated,
    served: sumOf(split.served),
    takenDown: sumOf(split.takenDown),
    held: sumOf(split.held),
    filtered: sumOf(split.filtered),
    split,
    boards: [...boards].sort(),
    subjects: [...subjects].sort(),
    groups: ordered,
    mine: { today: myToday, total: myTotal },
    reviewers: [...reviewers.entries()]
      .map(([id, r]) => ({ name: names.get(id) ?? "—", ...r }))
      .sort((a, b) => b.edits + b.takenDown + b.putBack - (a.edits + a.takenDown + a.putBack))
      .slice(0, 50),
  };
}

/** The id skipped last this sitting (the walk goes on from it), read from the raw value: parseSkip keeps the first two hundred. */
function lastSkipped(skip: string | undefined): string | null {
  const ids = (skip ?? "").split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{1,64}$/.test(s));
  return ids.at(-1) ?? null;
}

/** The items after this one in the desk's ORDER (the chapter's grade, subject and position, the level, the id), and its band. */
async function afterInOrder(id: string): Promise<{ firstBand: boolean; where: Prisma.QuizQuestionWhereInput } | null> {
  const at = await db.quizQuestion.findUnique({ where: { id }, select: { id: true, difficulty: true, topic: { select: { classLevel: true, subject: true, position: true } } } });
  if (!at) return null;
  const { classLevel, subject, position } = at.topic;
  const same = { classLevel, subject, position };
  return {
    firstBand: inFirstBand(at.topic),
    where: {
      OR: [
        { topic: { classLevel: { gt: classLevel } } },
        { topic: { classLevel, subject: { gt: subject } } },
        { topic: { classLevel, subject, position: { gt: position } } },
        { topic: same, difficulty: { gt: at.difficulty } },
        { topic: same, difficulty: at.difficulty, id: { gt: at.id } },
      ],
    },
  };
}

/**
 * The next GENERATED item under the filter, skipping those skipped this sitting: the first band, then the rest.
 *
 * TA-375 (the testing analysis of 13 November 2026). A taken-down item is not walked unless the DOWN standing is
 * asked for, so Take down moves on, as its action says, rather than showing the item again (nothing else changes its
 * place in the order). And the walk goes on from the item skipped last — after it in the band's order, then the next
 * band, then from the top — rather than from the top each time with the skipped ids left out: the list is cut at two
 * hundred, and the two hundred and first skip used to bring back the same item on every press.
 */
export async function nextItem(session: ActiveContext, query: QuizReviewQuery = {}): Promise<QuizReviewNext> {
  reviewerRole(session);
  const skip = parseSkip(query.skip);
  const scope = await fixtureScope(session);
  const standing: Prisma.QuizQuestionWhereInput[] = query.state ? [] : [{ takenDownAt: null }];
  const base: Prisma.QuizQuestionWhereInput[] = [QUEUE, ...scope, ...filterWhere(query), ...standing, ...(skip.length ? [{ id: { notIn: skip } }] : [])];
  const pick = async (...more: Prisma.QuizQuestionWhereInput[]) =>
    db.quizQuestion.findFirst({ where: { AND: [...base, ...more] }, orderBy: ORDER, select: ITEM_SELECT });
  const last = lastSkipped(query.skip);
  const after = last ? await afterInOrder(last) : null;
  let row = after
    ? after.firstBand
      ? ((await pick({ topic: FIRST_BAND }, after.where)) ?? (await pick({ NOT: { topic: FIRST_BAND } })))
      : await pick({ NOT: { topic: FIRST_BAND } }, after.where)
    : null;
  row ??= (await pick({ topic: FIRST_BAND })) ?? (await pick({ NOT: { topic: FIRST_BAND } }));
  const remaining = await db.quizQuestion.count({ where: { AND: base } });
  return { item: row ? await toItem(row) : null, remaining };
}

/** One item of either kind, in any state (a curated one read-only, with its file); anything else is not found. */
export async function getItem(session: ActiveContext, questionId: string): Promise<QuizReviewItem> {
  reviewerRole(session);
  const row = await db.quizQuestion.findFirst({ where: { id: questionId }, select: ITEM_SELECT });
  if (!row) throw new AccessError("quizReview.noSuchItem", "NOT_FOUND");
  return toItem(row);
}

/* -------------------------------------------------------------------------- */
/* The writer                                                                  */
/* -------------------------------------------------------------------------- */

type Tx = typeof db;

async function standingOf(questionId: string): Promise<QuizBankStanding> {
  const s = await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { generated: true, takenDownAt: true, takenDownReason: true, needsFigure: true, imageKey: true, editedAfterSolvingAt: true } });
  return {
    ok: true,
    state: stateOfRow(s),
    takenDownAt: s.takenDownAt?.toISOString() ?? null,
    takenDownReason: asReason(s.takenDownReason),
    editedAfterSolvingAt: s.editedAfterSolvingAt?.toISOString() ?? null,
  };
}

async function inTransaction<T>(work: (tx: Tx) => Promise<T>): Promise<BankResult<{ value: T }>> {
  try {
    const value = await db.$tenantTransaction(async (raw) => work(raw as Tx));
    return { ok: true, value };
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, errorKey: error.errorKey };
    throw error;
  }
}

/** The checks an edited English must pass before it is served; the verifier's arithmetic rule, the same evaluator. */
export function checkEdit(input: Pick<QuizReviewEditBody, "choices" | "answerIndex" | "checkExpr">, optionCount: number): TranslationKey | null {
  const choices = input.choices.map((c) => c.trim());
  if (choices.length !== optionCount) return "quizReview.choicesMustStay";
  if (choices.some((c) => c.length === 0)) return "quizReview.choicesMustStay";
  if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) return "quizReview.choicesRepeat";
  if (input.answerIndex < 0 || input.answerIndex >= choices.length) return "quizReview.keyOutOfRange";
  // The one arithmetic rule, which the sheet import asks too (bank-csv.ts, TA-567).
  return checkExprProblem(input.checkExpr, choices[input.answerIndex]!);
}

/** A language row's corrected words: as many options as the English, none empty, none repeated. */
export function checkTranslationEdit(t: { choices: string[] }, optionCount: number): TranslationKey | null {
  const choices = t.choices.map((c) => c.trim());
  if (choices.length !== optionCount || choices.some((c) => c.length === 0)) return "quizReview.choicesMustStay";
  if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) return "quizReview.choicesRepeat";
  return null;
}

/**
 * EDIT, a GENERATED item's alone (a curated one is refused with quizReview.refuseEditCurated: its words are changed
 * in its file under content/quiz and imported again, or in the bank editor when it was written in the app),
 * in all three languages at once, in any state (served, taken down, held). The English as corrected;
 * the Hindi and the Marathi rows as corrected when sent. The stamp keeps every field as it stood (`before`),
 * the audit log names the fields changed ("stem", "hi.choices", …); a change to the English words (stem, options,
 * key, working) keeps the solver's answers and sets editedAfterSolvingAt (they were given to the old words), a level
 * or a check expression alone does not, and a language row not
 * corrected with it reads "stale" on the desk. A press that changes nothing writes nothing.
 */
export async function editItem(session: ActiveContext, questionId: string, input: QuizReviewEditBody): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  const now = new Date();
  let changed: string[] = [];
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      select: {
        generated: true,
        difficulty: true,
        stem: true,
        choices: true,
        answerIndex: true,
        solution: true,
        checkExpr: true,
        editedAfterSolvingAt: true,
        translations: { where: { language: { in: ["hi", "mr"] } }, select: { language: true, stem: true, choices: true, solution: true, updatedAt: true } },
      },
    });
    if (!row) throw new Refusal("quizReview.noSuchItem");
    if (!row.generated) throw new Refusal("quizReview.refuseEditCurated");
    const before = { difficulty: row.difficulty, stem: row.stem, choices: parseChoices(row.choices), answerIndex: row.answerIndex, solution: row.solution, checkExpr: row.checkExpr };
    const problem = checkEdit(input, before.choices.length);
    if (problem) throw new Refusal(problem);
    const after = {
      difficulty: clampLevel(input.difficulty),
      stem: input.stem.trim(),
      choices: input.choices.map((c) => c.trim()),
      answerIndex: input.answerIndex,
      solution: input.solution.trim(),
      checkExpr: input.checkExpr?.trim() || null,
    };
    const englishChanged = (Object.keys(after) as (keyof typeof after)[]).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));

    const beforeTr: Record<string, { stem: string; choices: string[]; solution: string } | null> = {};
    const languageChanges: { language: "hi" | "mr"; words: { stem: string; choices: string[]; solution: string }; fields: string[] }[] = [];
    for (const language of ["hi", "mr"] as const) {
      const current = row.translations.find((t) => t.language === language);
      const was = current ? { stem: current.stem, choices: current.choices ? parseChoices(current.choices) : [], solution: current.solution } : null;
      beforeTr[language] = was;
      const sent = input.translations?.[language];
      if (!sent) continue;
      const trProblem = checkTranslationEdit(sent, after.choices.length);
      if (trProblem) throw new Refusal(trProblem);
      const words = { stem: sent.stem.trim(), choices: sent.choices.map((c) => c.trim()), solution: sent.solution.trim() };
      const fields = (["stem", "choices", "solution"] as const).filter((k) => JSON.stringify(words[k]) !== JSON.stringify(was?.[k] ?? null)).map((k) => `${language}.${k}`);
      if (fields.length) languageChanges.push({ language, words, fields });
    }
    // Only a change to the words a pupil reads (and the key into them) dates the solver's answers and the Hindi and
    // Marathi rows: a level or a check expression alone leaves both as they were, since a language row older than
    // this stamp is not served (TA-199, quiz-served.ts servedTranslation).
    const wordsChanged = englishChanged.some((k) => k === "stem" || k === "choices" || k === "answerIndex" || k === "solution");

    // The "still right" ticks (the owner's follow-up to TA-199, 14 November 2026): a ticked language not corrected in
    // this press, which would be out of date once this edit is saved, is confirmed against the English as saved,
    // unless the English since that language was written reordered the options or moved the answer, which refuses the
    // whole press. A tick on a language that would not be out of date has nothing to confirm.
    const markAfter = wordsChanged ? now : row.editedAfterSolvingAt;
    const confirmations: { language: "hi" | "mr"; updatedAt: Date }[] = [];
    for (const language of [...new Set(input.confirmTranslations ?? [])]) {
      if (languageChanges.some((c) => c.language === language)) continue;
      const current = row.translations.find((t) => t.language === language);
      if (!current || !markAfter || current.updatedAt >= markAfter) continue;
      const base = await englishTranslatedFrom(tx, questionId, current.updatedAt, before);
      if (!base || !translationKeepsItsPlace(base, after)) throw new Refusal("quizReview.confirmRefusedOrder");
      confirmations.push({ language, updatedAt: current.updatedAt });
    }

    changed = [...englishChanged, ...languageChanges.flatMap((c) => c.fields), ...confirmations.map((c) => `${c.language}.confirmed`)];
    if (changed.length === 0) return false;

    if (englishChanged.length) {
      await tx.quizQuestion.update({
        where: { id: questionId },
        data: {
          difficulty: after.difficulty,
          stem: after.stem,
          choices: JSON.stringify(after.choices),
          answerIndex: after.answerIndex,
          solution: after.solution,
          checkExpr: after.checkExpr,
          ...(wordsChanged ? { editedAfterSolvingAt: now } : {}),
        },
      });
    }
    for (const c of languageChanges) {
      const payload = { stem: c.words.stem, choices: JSON.stringify(c.words.choices), solution: c.words.solution };
      await tx.quizQuestionTranslation.upsert({ where: { questionId_language: { questionId, language: c.language } }, create: { questionId, language: c.language, ...payload }, update: payload });
    }
    if (englishChanged.length || languageChanges.length) {
      await tx.quizReviewStamp.create({
        data: { questionId, reviewerUserId: session.user.id, role, action: "EDIT", before: JSON.stringify({ ...before, translations: beforeTr }), at: now },
      });
    }
    for (const c of confirmations) {
      // The row moved since it was read (another press saved it): nothing of this press is kept.
      if (!(await writeConfirmation(tx, { questionId, language: c.language, was: c.updatedAt, reviewerUserId: session.user.id, role, at: now }))) throw new Refusal("common.tryAgainMoment");
    }
    return true;
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizBank.edit", targetType: "QuizQuestion", targetId: questionId, meta: { role, changed } });
  return standingOf(questionId);
}

/** TAKE DOWN an item of either kind with a coded reason: not served from this moment, anywhere; the answers given stay. Again changes nothing. */
export async function takeDownItem(session: ActiveContext, questionId: string, reason: QuizTakeDownReason): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  if (!(QUIZ_TAKEDOWN_REASONS as readonly string[]).includes(reason)) return { ok: false, errorKey: "quizReview.reasonNeeded" };
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({ where: { id: questionId }, select: { id: true } });
    if (!row) throw new Refusal("quizReview.noSuchItem");
    // Conditional on still being up, so two people pressing together make one stamp.
    const { count } = await tx.quizQuestion.updateMany({ where: { id: questionId, takenDownAt: null }, data: { takenDownAt: now, takenDownReason: reason, takenDownBy: session.user.id } });
    if (count === 0) return false;
    await tx.quizReviewStamp.create({ data: { questionId, reviewerUserId: session.user.id, role, action: "TAKE_DOWN", reason, at: now } });
    return true;
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizBank.takeDown", targetType: "QuizQuestion", targetId: questionId, meta: { role, reason } });
  return standingOf(questionId);
}

/** PUT BACK a taken-down item of either kind: served again at once (unless its figure is still to be drawn). Again changes nothing. */
export async function putBackItem(session: ActiveContext, questionId: string): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({ where: { id: questionId }, select: { id: true } });
    if (!row) throw new Refusal("quizReview.noSuchItem");
    const { count } = await tx.quizQuestion.updateMany({ where: { id: questionId, takenDownAt: { not: null } }, data: { takenDownAt: null, takenDownReason: null, takenDownBy: null } });
    if (count === 0) return false;
    await tx.quizReviewStamp.create({ data: { questionId, reviewerUserId: session.user.id, role, action: "PUT_BACK", at: now } });
    return true;
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizBank.putBack", targetType: "QuizQuestion", targetId: questionId, meta: { role } });
  return standingOf(questionId);
}

/**
 * The English a language row was written against: the words before the first desk edit made after the row was last
 * written (EDIT, or the review queue's EDIT_ACCEPT, each keeping the words as they stood in `before`), else the English
 * as it stands. Null when that edit's earlier words cannot be read. The owner's follow-up to TA-199.
 */
async function englishTranslatedFrom(tx: Tx, questionId: string, since: Date, current: { choices: string[]; answerIndex: number }): Promise<{ choices: string[]; answerIndex: number } | null> {
  const first = await tx.quizReviewStamp.findFirst({
    where: { questionId, action: { in: ["EDIT", "EDIT_ACCEPT"] }, at: { gt: since } },
    orderBy: { at: "asc" },
    select: { before: true },
  });
  if (!first) return current;
  try {
    const was = JSON.parse(first.before ?? "") as { choices?: unknown; answerIndex?: unknown };
    if (!Array.isArray(was.choices) || !was.choices.every((c) => typeof c === "string") || typeof was.answerIndex !== "number" || !Number.isInteger(was.answerIndex)) return null;
    return { choices: was.choices as string[], answerIndex: was.answerIndex };
  } catch {
    return null;
  }
}

/**
 * A CONFIRMATION'S ONE WRITER, inside the caller's transaction (the owner's follow-up to TA-199, 14 November 2026): the
 * language row's last-written time moved to `at`, so it is no longer older than editedAfterSolvingAt and is served
 * again (quiz-served.ts servedTranslation; the desk's STALE note reads the same), conditional on the row being as the
 * caller read it; the native-review column set to who confirmed and when; a STAMP_TRANSLATION stamp in that language,
 * which the desk's history shows; and the audit row. False, writing nothing, when the row moved since it was read.
 */
async function writeConfirmation(tx: Tx, input: { questionId: string; language: "hi" | "mr"; was: Date; reviewerUserId: string; role: QuizReviewRole; at: Date }): Promise<boolean> {
  const { count } = await tx.quizQuestionTranslation.updateMany({ where: { questionId: input.questionId, language: input.language, updatedAt: input.was }, data: { updatedAt: input.at } });
  if (count === 0) return false;
  await tx.quizQuestion.update({
    where: { id: input.questionId },
    data: input.language === "hi" ? { hiReviewedAt: input.at, hiReviewedBy: input.reviewerUserId } : { mrReviewedAt: input.at, mrReviewedBy: input.reviewerUserId },
  });
  await tx.quizReviewStamp.create({ data: { questionId: input.questionId, reviewerUserId: input.reviewerUserId, role: input.role, language: input.language, action: "STAMP_TRANSLATION", at: input.at } });
  await audit({ schoolId: null, actorUserId: input.reviewerUserId, action: "appadmin.quizBank.confirmTranslation", targetType: "QuizQuestion", targetId: input.questionId, meta: { role: input.role, language: input.language } }, tx);
  return true;
}

/**
 * STILL RIGHT, on a language already marked out of date (the owner's follow-up to TA-199, 14 November 2026): a generated
 * item's Hindi or Marathi row written before the English's last word change is confirmed still right against the
 * English as it stands, served again to pupils reading in it, and the desk records who confirmed (writeConfirmation).
 * Refused with quizReview.confirmRefusedOrder when the English since that row was written reordered the options or
 * moved the answer (quiz-served.ts translationKeepsItsPlace): such a row is corrected through Edit. A language with no
 * row is refused; a row that is not out of date (confirmed already, corrected, or never dated) changes nothing.
 */
export async function confirmTranslation(session: ActiveContext, questionId: string, language: "hi" | "mr"): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  if (language !== "hi" && language !== "mr") return { ok: false, errorKey: "quizReview.translationMissing" };
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      select: { generated: true, choices: true, answerIndex: true, editedAfterSolvingAt: true, translations: { where: { language }, select: { updatedAt: true } } },
    });
    if (!row) throw new Refusal("quizReview.noSuchItem");
    if (!row.generated) throw new Refusal("quizReview.refuseEditCurated");
    const current = row.translations[0];
    if (!current) throw new Refusal("quizReview.translationMissing");
    if (!row.editedAfterSolvingAt || current.updatedAt >= row.editedAfterSolvingAt) return false;
    const english = { choices: parseChoices(row.choices), answerIndex: row.answerIndex };
    const base = await englishTranslatedFrom(tx, questionId, current.updatedAt, english);
    if (!base || !translationKeepsItsPlace(base, english)) throw new Refusal("quizReview.confirmRefusedOrder");
    // A second press racing this one finds the row moved and changes nothing.
    return writeConfirmation(tx, { questionId, language, was: current.updatedAt, reviewerUserId: session.user.id, role, at: now });
  });
  if (!result.ok) return result;
  return standingOf(questionId);
}

/**
 * THE LANGUAGE STAMP'S ONE WRITER, inside a caller's transaction: the native-review column and the stamp
 * row, together; nothing when the stamp already stands as asked. The caller has asserted the content
 * team's gate. Used by the native-review page for the authored bank (translation-review.ts); since 11
 * October 2026 it gates no serving (an authored draft was always served, a generated row is published).
 */
export async function writeLanguageStamp(
  tx: Tx,
  input: { questionId: string; language: "hi" | "mr"; stamped: boolean; reviewerUserId: string; role: QuizReviewRole; at: Date },
): Promise<boolean> {
  const at = input.stamped ? input.at : null;
  const by = input.stamped ? input.reviewerUserId : null;
  const standing = input.stamped ? null : { not: null };
  const { count } =
    input.language === "hi"
      ? await tx.quizQuestion.updateMany({ where: { id: input.questionId, hiReviewedAt: standing }, data: { hiReviewedAt: at, hiReviewedBy: by } })
      : await tx.quizQuestion.updateMany({ where: { id: input.questionId, mrReviewedAt: standing }, data: { mrReviewedAt: at, mrReviewedBy: by } });
  if (count === 0) return false;
  await tx.quizReviewStamp.create({
    data: { questionId: input.questionId, reviewerUserId: input.reviewerUserId, role: input.role, language: input.language, action: input.stamped ? "STAMP_TRANSLATION" : "UNSTAMP_TRANSLATION", at: input.at },
  });
  return true;
}
