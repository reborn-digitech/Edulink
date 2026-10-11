import "server-only";
import { fixtureTopicsWhere, reviewerSeesFixtureTopics } from "./quiz-fixtures";
import type { Prisma } from "@prisma/client";
import {
  QUIZ_TAKEDOWN_REASONS,
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
import { clampLevel, parseChoices } from "./quiz";
import { evaluate, numberIn } from "../../scripts/quiz-arith";
import type { ActiveContext } from "./session";

/**
 * THE GENERATED BANK'S DESK (docs/plans/assistant-and-quiz-bank.md, Phase 1 "Output and review"), as
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
 */

export const FIRST_BAND = { classLevel: { gte: 6, lte: 10 }, subject: { in: ["MATHS", "SCIENCE"] } } satisfies Prisma.QuizTopicWhereInput;

/** The desk's bank: every generated item in a chapter that still lists, served or not. */
export const BANK = { generated: true, topic: { retiredAt: null } } satisfies Prisma.QuizQuestionWhereInput;

/** Held: the figure the item needs is not drawn (src/lib/quiz-served.ts). */
const HELD = { takenDownAt: null, needsFigure: true, imageKey: null } satisfies Prisma.QuizQuestionWhereInput;

export function stateWhere(state: QuizBankState): Prisma.QuizQuestionWhereInput {
  if (state === "DOWN") return { takenDownAt: { not: null } };
  if (state === "HELD") return HELD;
  return { takenDownAt: null, NOT: { needsFigure: true, imageKey: null } };
}

export function stateOfRow(row: { takenDownAt: Date | null; needsFigure: boolean; imageKey: string | null }): QuizBankState {
  if (row.takenDownAt) return "DOWN";
  if (row.needsFigure && !row.imageKey) return "HELD";
  return "SERVED";
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
  if (q.board) and.push({ generatedBoard: q.board });
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
  topic: { select: { id: true, name: true, chapter: true, subject: true, classLevel: true } },
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
    board: row.generatedBoard,
    topic: { id: row.topic.id, name: row.topic.name, chapter: row.topic.chapter, subject: row.topic.subject, grade: row.topic.classLevel },
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

/** The generated bank by chapter and level under the filter, with the counts the desk works against. */
export async function listQueue(session: ActiveContext, query: Omit<QuizReviewQuery, "skip"> = {}): Promise<QuizReviewList> {
  reviewerRole(session);
  const scope = await fixtureScope(session);
  const bank: Prisma.QuizQuestionWhereInput = { AND: [BANK, ...scope] };
  const filtered: Prisma.QuizQuestionWhereInput = { AND: [BANK, ...scope, ...filterWhere(query)] };
  const dayStart = startOfIndianDay();
  const mineWhere = { reviewerUserId: session.user.id, action: { in: [...DESK_ACTIONS] } };

  const [total, served, takenDown, held, filteredCount, byGroup, downByTopic, heldByTopic, everyTopic, boardRows, myToday, myTotal, perReviewer] = await Promise.all([
    db.quizQuestion.count({ where: bank }),
    db.quizQuestion.count({ where: { AND: [bank, stateWhere("SERVED")] } }),
    db.quizQuestion.count({ where: { AND: [bank, stateWhere("DOWN")] } }),
    db.quizQuestion.count({ where: { AND: [bank, stateWhere("HELD")] } }),
    db.quizQuestion.count({ where: filtered }),
    db.quizQuestion.groupBy({ by: ["topicId", "generatedBoard", "difficulty"], where: filtered, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId", "generatedBoard"], where: { AND: [filtered, stateWhere("DOWN")] }, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId", "generatedBoard"], where: { AND: [filtered, stateWhere("HELD")] }, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId"], where: bank, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["generatedBoard"], where: { generated: true } }),
    db.quizReviewStamp.count({ where: { ...mineWhere, at: { gte: dayStart } } }),
    db.quizReviewStamp.count({ where: mineWhere }),
    db.quizReviewStamp.groupBy({ by: ["reviewerUserId", "role", "action"], where: { action: { in: [...DESK_ACTIONS] } }, _count: { _all: true } }),
  ]);

  const topicIds = [...new Set([...byGroup.map((g) => g.topicId), ...everyTopic.map((g) => g.topicId)])];
  const topics = topicIds.length
    ? await db.quizTopic.findMany({ where: { id: { in: topicIds } }, select: { id: true, name: true, chapter: true, subject: true, classLevel: true, position: true } })
    : [];
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const keyOf = (topicId: string, board: string | null) => `${topicId}|${board ?? ""}`;
  const downOf = new Map(downByTopic.map((g) => [keyOf(g.topicId, g.generatedBoard), g._count._all]));
  const heldOf = new Map(heldByTopic.map((g) => [keyOf(g.topicId, g.generatedBoard), g._count._all]));

  const groups = new Map<string, QuizReviewList["groups"][number] & { position: number }>();
  for (const g of byGroup) {
    const topic = topicById.get(g.topicId);
    if (!topic) continue;
    const key = keyOf(g.topicId, g.generatedBoard);
    const row = groups.get(key) ?? {
      board: g.generatedBoard,
      topicId: topic.id,
      subject: topic.subject,
      grade: topic.classLevel,
      chapter: topic.chapter,
      name: topic.name,
      levels: [0, 0, 0, 0, 0, 0],
      total: 0,
      down: downOf.get(key) ?? 0,
      held: heldOf.get(key) ?? 0,
      first: inFirstBand(topic),
      position: topic.position,
    };
    row.levels[clampLevel(g.difficulty) - 1]! += g._count._all;
    row.total += g._count._all;
    groups.set(key, row);
  }
  const ordered = [...groups.values()]
    .sort((a, b) => Number(b.first) - Number(a.first) || a.grade - b.grade || a.subject.localeCompare(b.subject) || a.position - b.position || (a.board ?? "").localeCompare(b.board ?? ""))
    .slice(0, MAX_GROUPS)
    .map((g) => ({ board: g.board, topicId: g.topicId, subject: g.subject, grade: g.grade, chapter: g.chapter, name: g.name, levels: g.levels, total: g.total, down: g.down, held: g.held, first: g.first }));

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
    total,
    served,
    takenDown,
    held,
    filtered: filteredCount,
    boards: boardRows.map((b) => b.generatedBoard).filter((b): b is string => !!b).sort(),
    subjects: [...new Set(everyTopic.map((g) => topicById.get(g.topicId)?.subject).filter((s): s is string => !!s))].sort(),
    groups: ordered,
    mine: { today: myToday, total: myTotal },
    reviewers: [...reviewers.entries()]
      .map(([id, r]) => ({ name: names.get(id) ?? "—", ...r }))
      .sort((a, b) => b.edits + b.takenDown + b.putBack - (a.edits + a.takenDown + a.putBack))
      .slice(0, 50),
  };
}

/** The next item under the filter, skipping those skipped this sitting: the first band, then the rest. */
export async function nextItem(session: ActiveContext, query: QuizReviewQuery = {}): Promise<QuizReviewNext> {
  reviewerRole(session);
  const skip = parseSkip(query.skip);
  const scope = await fixtureScope(session);
  const base: Prisma.QuizQuestionWhereInput[] = [BANK, ...scope, ...filterWhere(query), ...(skip.length ? [{ id: { notIn: skip } }] : [])];
  const pick = async (band: Prisma.QuizQuestionWhereInput) =>
    db.quizQuestion.findFirst({ where: { AND: [...base, band] }, orderBy: ORDER, select: ITEM_SELECT });
  const row = (await pick({ topic: FIRST_BAND })) ?? (await pick({ NOT: { topic: FIRST_BAND } }));
  const remaining = await db.quizQuestion.count({ where: { AND: base } });
  return { item: row ? await toItem(row) : null, remaining };
}

/** One generated item, in any state; anything else is not found. */
export async function getItem(session: ActiveContext, questionId: string): Promise<QuizReviewItem> {
  reviewerRole(session);
  const row = await db.quizQuestion.findFirst({ where: { id: questionId, generated: true }, select: ITEM_SELECT });
  if (!row) throw new AccessError("quizReview.noSuchItem", "NOT_FOUND");
  return toItem(row);
}

/* -------------------------------------------------------------------------- */
/* The writer                                                                  */
/* -------------------------------------------------------------------------- */

type Tx = typeof db;

async function standingOf(questionId: string): Promise<QuizBankStanding> {
  const s = await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { takenDownAt: true, takenDownReason: true, needsFigure: true, imageKey: true, editedAfterSolvingAt: true } });
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
  const expr = input.checkExpr?.trim();
  if (expr) {
    if (!/[+\-*/^]/.test(expr)) return "quizReview.checkExprBare";
    const expected = evaluate(expr);
    const stated = numberIn(choices[input.answerIndex]!);
    if (expected === null || stated === null || Math.abs(expected - stated) > 1e-6) return "quizReview.checkExprMismatch";
  }
  return null;
}

/** A language row's corrected words: as many options as the English, none empty, none repeated. */
export function checkTranslationEdit(t: { choices: string[] }, optionCount: number): TranslationKey | null {
  const choices = t.choices.map((c) => c.trim());
  if (choices.length !== optionCount || choices.some((c) => c.length === 0)) return "quizReview.choicesMustStay";
  if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) return "quizReview.choicesRepeat";
  return null;
}

/**
 * EDIT, in all three languages at once, in any state (served, taken down, held). The English as corrected;
 * the Hindi and the Marathi rows as corrected when sent. The stamp keeps every field as it stood (`before`),
 * the audit log names the fields changed ("stem", "hi.choices", …); an English change keeps the solver's
 * answers and sets editedAfterSolvingAt (they were given to the old words), and a language row not
 * corrected with it reads "stale" on the desk. A press that changes nothing writes nothing.
 */
export async function editItem(session: ActiveContext, questionId: string, input: QuizReviewEditBody): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  const now = new Date();
  let changed: string[] = [];
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      select: { generated: true, difficulty: true, stem: true, choices: true, answerIndex: true, solution: true, checkExpr: true, translations: { where: { language: { in: ["hi", "mr"] } }, select: { language: true, stem: true, choices: true, solution: true } } },
    });
    if (!row || !row.generated) throw new Refusal("quizReview.noSuchItem");
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
    changed = [...englishChanged, ...languageChanges.flatMap((c) => c.fields)];
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
          editedAfterSolvingAt: now,
        },
      });
    }
    for (const c of languageChanges) {
      const payload = { stem: c.words.stem, choices: JSON.stringify(c.words.choices), solution: c.words.solution };
      await tx.quizQuestionTranslation.upsert({ where: { questionId_language: { questionId, language: c.language } }, create: { questionId, language: c.language, ...payload }, update: payload });
    }
    await tx.quizReviewStamp.create({
      data: { questionId, reviewerUserId: session.user.id, role, action: "EDIT", before: JSON.stringify({ ...before, translations: beforeTr }), at: now },
    });
    return true;
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizBank.edit", targetType: "QuizQuestion", targetId: questionId, meta: { role, changed } });
  return standingOf(questionId);
}

/** TAKE DOWN with a coded reason: not served from this moment, anywhere; the answers given stay. Again changes nothing. */
export async function takeDownItem(session: ActiveContext, questionId: string, reason: QuizTakeDownReason): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  if (!(QUIZ_TAKEDOWN_REASONS as readonly string[]).includes(reason)) return { ok: false, errorKey: "quizReview.reasonNeeded" };
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({ where: { id: questionId }, select: { generated: true } });
    if (!row || !row.generated) throw new Refusal("quizReview.noSuchItem");
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

/** PUT BACK a taken-down item: served again at once (unless its figure is still to be drawn). Again changes nothing. */
export async function putBackItem(session: ActiveContext, questionId: string): Promise<BankResult<QuizBankStanding>> {
  const role = reviewerRole(session);
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({ where: { id: questionId }, select: { generated: true } });
    if (!row || !row.generated) throw new Refusal("quizReview.noSuchItem");
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
