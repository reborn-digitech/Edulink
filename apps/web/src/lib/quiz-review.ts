import "server-only";
import { fixtureTopicsWhere, reviewerSeesFixtureTopics } from "./quiz-fixtures";
import type { Prisma } from "@prisma/client";
import {
  QUIZ_DISCARD_REASONS,
  type QuizDiscardReason,
  type QuizReviewAction,
  type QuizReviewEditBody,
  type QuizReviewItem,
  type QuizReviewList,
  type QuizReviewNext,
  type QuizReviewQuery,
  type QuizReviewRole,
  type QuizReviewStamped,
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
 * THE GENERATED BANK'S REVIEW QUEUE (docs/plans/assistant-and-quiz-bank.md, Phase 1 "Output and
 * review", as the owner amended it on 10 October 2026).
 *
 * scripts/quiz-queue.ts loads the generator's files (content/quiz/generated/*.json) into QuizQuestion
 * as `generated` rows with reviewedAt null; src/lib/quiz-served.ts keeps every such row away from a
 * pupil until it is stamped. This module is the queue the app admins and the operator work through —
 * never teachers — and THE ONE WRITER of a review: each act is a QuizReviewStamp row (who, as which
 * role, which language, what, why, when) written in the same transaction as the column the serving
 * filter reads:
 *
 *   ACCEPT, EDIT_ACCEPT   → reviewedAt / reviewedBy (one stamp serves the English item)
 *   DISCARD               → discardedAt / discardReason (never served, never queued again)
 *   STAMP_TRANSLATION     → hiReviewedAt / mrReviewedAt (the language row is served from then on)
 *   UNSTAMP_TRANSLATION   → the language column back to null
 *
 * The native-review page (/appadmin/translations, translation-review.ts) stamps a language through
 * `writeLanguageStamp` below, so a Hindi stamp made there is the same row as one made here.
 *
 * The queue's order is the plan's (section 8 item 9): grades 6 to 10 mathematics and science first,
 * then the rest; within each band by grade, subject, the chapter's position, the level and the id.
 */

export const FIRST_BAND = { classLevel: { gte: 6, lte: 10 }, subject: { in: ["MATHS", "SCIENCE"] } } satisfies Prisma.QuizTopicWhereInput;

/** Waiting: generated, neither stamped nor discarded, in a chapter that still lists. */
export const WAITING = { generated: true, reviewedAt: null, discardedAt: null, topic: { retiredAt: null } } satisfies Prisma.QuizQuestionWhereInput;

const ORDER: Prisma.QuizQuestionOrderByWithRelationInput[] = [
  { topic: { classLevel: "asc" } },
  { topic: { subject: "asc" } },
  { topic: { position: "asc" } },
  { difficulty: "asc" },
  { id: "asc" },
];

const MAX_SKIP = 200;
const MAX_GROUPS = 300;

class Refusal extends Error {
  constructor(readonly errorKey: TranslationKey) {
    super(errorKey);
  }
}

/** The reviewer's standing: the content team, or the operator (who passes the content team's gate too). */
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
  return and;
}

/** Midnight in India, as an instant: "today" for a reviewer's count. */
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
  editedAfterSolvingAt: true,
  reviewedAt: true,
  discardedAt: true,
  discardReason: true,
  hiReviewedAt: true,
  hiReviewedBy: true,
  mrReviewedAt: true,
  mrReviewedBy: true,
  topic: { select: { id: true, name: true, chapter: true, subject: true, classLevel: true } },
  translations: { where: { language: { in: ["hi", "mr"] } }, select: { language: true, stem: true, choices: true, solution: true, updatedAt: true } },
  reviewStamps: { orderBy: { at: "asc" }, take: 50, select: { action: true, language: true, reason: true, reviewerUserId: true, role: true, at: true } },
} satisfies Prisma.QuizQuestionSelect;

type ItemRow = Prisma.QuizQuestionGetPayload<{ select: typeof ITEM_SELECT }>;

async function namesOf(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (unique.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

const asReason = (r: string | null): QuizDiscardReason | null => ((QUIZ_DISCARD_REASONS as readonly string[]).includes(r ?? "") ? (r as QuizDiscardReason) : null);

async function toItem(row: ItemRow): Promise<QuizReviewItem> {
  const g = readGeneration(row.generation);
  const names = await namesOf([...row.reviewStamps.map((s) => s.reviewerUserId), row.hiReviewedBy, row.mrReviewedBy]);
  const translation = (language: "hi" | "mr") => {
    const t = row.translations.find((x) => x.language === language);
    if (!t) return null;
    const at = language === "hi" ? row.hiReviewedAt : row.mrReviewedAt;
    const by = language === "hi" ? row.hiReviewedBy : row.mrReviewedBy;
    const extra = g.translations?.[language];
    return {
      stem: t.stem,
      choices: t.choices ? parseChoices(t.choices) : [],
      solution: t.solution,
      imageAlt: extra?.imageAlt ?? null,
      critique: extra?.critique ?? null,
      flag: extra?.flag ?? null,
      stampedAt: at?.toISOString() ?? null,
      stampedBy: by ? (names.get(by) ?? null) : null,
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
    needsFigure: g.needsFigure === true,
    imageKey: row.imageKey,
    imageAlt: row.imageAlt,
    figureError: g.figureError ?? null,
    editedAfterSolvingAt: row.editedAfterSolvingAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    discardedAt: row.discardedAt?.toISOString() ?? null,
    discardReason: asReason(row.discardReason),
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

/** The queue by chapter and level, with the counts a reviewer works against. */
export async function listQueue(session: ActiveContext, query: Omit<QuizReviewQuery, "skip"> = {}): Promise<QuizReviewList> {
  reviewerRole(session);
  const scope = await fixtureScope(session);
  const waiting: Prisma.QuizQuestionWhereInput = { AND: [WAITING, ...scope] };
  const filtered: Prisma.QuizQuestionWhereInput = { AND: [WAITING, ...scope, ...filterWhere(query)] };
  const dayStart = startOfIndianDay();

  const [remaining, filteredCount, hiWaiting, mrWaiting, byGroup, everyTopic, boardRows, myToday, myTotal, perReviewer] = await Promise.all([
    db.quizQuestion.count({ where: waiting }),
    db.quizQuestion.count({ where: filtered }),
    db.quizQuestion.count({ where: { AND: [{ generated: true, reviewedAt: { not: null }, discardedAt: null, hiReviewedAt: null, translations: { some: { language: "hi" } } }, ...scope] } }),
    db.quizQuestion.count({ where: { AND: [{ generated: true, reviewedAt: { not: null }, discardedAt: null, mrReviewedAt: null, translations: { some: { language: "mr" } } }, ...scope] } }),
    db.quizQuestion.groupBy({ by: ["topicId", "generatedBoard", "difficulty"], where: filtered, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId"], where: waiting, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["generatedBoard"], where: { generated: true } }),
    db.quizReviewStamp.count({ where: { reviewerUserId: session.user.id, action: { not: "UNSTAMP_TRANSLATION" }, at: { gte: dayStart } } }),
    db.quizReviewStamp.count({ where: { reviewerUserId: session.user.id, action: { not: "UNSTAMP_TRANSLATION" } } }),
    db.quizReviewStamp.groupBy({ by: ["reviewerUserId", "role", "action"], _count: { _all: true } }),
  ]);

  const topicIds = [...new Set([...byGroup.map((g) => g.topicId), ...everyTopic.map((g) => g.topicId)])];
  const topics = topicIds.length
    ? await db.quizTopic.findMany({ where: { id: { in: topicIds } }, select: { id: true, name: true, chapter: true, subject: true, classLevel: true, position: true } })
    : [];
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const groups = new Map<string, QuizReviewList["groups"][number] & { position: number }>();
  for (const g of byGroup) {
    const topic = topicById.get(g.topicId);
    if (!topic) continue;
    const key = `${g.topicId}|${g.generatedBoard ?? ""}`;
    const row = groups.get(key) ?? {
      board: g.generatedBoard,
      topicId: topic.id,
      subject: topic.subject,
      grade: topic.classLevel,
      chapter: topic.chapter,
      name: topic.name,
      levels: [0, 0, 0, 0, 0, 0],
      total: 0,
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
    .map((g) => ({ board: g.board, topicId: g.topicId, subject: g.subject, grade: g.grade, chapter: g.chapter, name: g.name, levels: g.levels, total: g.total, first: g.first }));

  const reviewers = new Map<string, { role: QuizReviewRole; accepted: number; discarded: number; languages: number }>();
  for (const r of perReviewer) {
    const row = reviewers.get(r.reviewerUserId) ?? { role: r.role === "OPERATOR" ? "OPERATOR" : "APP_ADMIN", accepted: 0, discarded: 0, languages: 0 };
    if (r.action === "ACCEPT" || r.action === "EDIT_ACCEPT") row.accepted += r._count._all;
    else if (r.action === "DISCARD") row.discarded += r._count._all;
    else if (r.action === "STAMP_TRANSLATION") row.languages += r._count._all;
    reviewers.set(r.reviewerUserId, row);
  }
  const names = await namesOf([...reviewers.keys()]);

  return {
    remaining,
    filtered: filteredCount,
    languagesWaiting: { hi: hiWaiting, mr: mrWaiting },
    boards: boardRows.map((b) => b.generatedBoard).filter((b): b is string => !!b).sort(),
    subjects: [...new Set(everyTopic.map((g) => topicById.get(g.topicId)?.subject).filter((s): s is string => !!s))].sort(),
    groups: ordered,
    mine: { today: myToday, total: myTotal },
    reviewers: [...reviewers.entries()]
      .map(([id, r]) => ({ name: names.get(id) ?? "—", ...r }))
      .sort((a, b) => b.accepted + b.discarded + b.languages - (a.accepted + a.discarded + a.languages))
      .slice(0, 50),
  };
}

/** The first waiting item under the filter, skipping those skipped this sitting: the first band, then the rest. */
export async function nextItem(session: ActiveContext, query: QuizReviewQuery = {}): Promise<QuizReviewNext> {
  reviewerRole(session);
  const skip = parseSkip(query.skip);
  const scope = await fixtureScope(session);
  const base: Prisma.QuizQuestionWhereInput[] = [WAITING, ...scope, ...filterWhere(query), ...(skip.length ? [{ id: { notIn: skip } }] : [])];
  const pick = async (band: Prisma.QuizQuestionWhereInput) =>
    db.quizQuestion.findFirst({ where: { AND: [...base, band] }, orderBy: ORDER, select: ITEM_SELECT });
  const row = (await pick({ topic: FIRST_BAND })) ?? (await pick({ NOT: { topic: FIRST_BAND } }));
  const remaining = await db.quizQuestion.count({ where: { AND: [WAITING, ...scope, ...filterWhere(query)] } });
  return { item: row ? await toItem(row) : null, remaining };
}

/** One generated item, waiting or not; anything else is not found. */
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

const STATE_SELECT = { reviewedAt: true, discardedAt: true, hiReviewedAt: true, mrReviewedAt: true } satisfies Prisma.QuizQuestionSelect;

async function stateOf(questionId: string): Promise<QuizReviewStamped> {
  const s = await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: STATE_SELECT });
  return {
    ok: true,
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    discardedAt: s.discardedAt?.toISOString() ?? null,
    hiStampedAt: s.hiReviewedAt?.toISOString() ?? null,
    mrStampedAt: s.mrReviewedAt?.toISOString() ?? null,
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

const WAITING_ROW = { id: true, generated: true, reviewedAt: true, discardedAt: true, generation: true, imageKey: true, choices: true, stem: true, solution: true, answerIndex: true, checkExpr: true, difficulty: true } satisfies Prisma.QuizQuestionSelect;

async function waitingRow(tx: Tx, questionId: string) {
  const row = await tx.quizQuestion.findUnique({ where: { id: questionId }, select: WAITING_ROW });
  if (!row || !row.generated) throw new Refusal("quizReview.noSuchItem");
  if (row.discardedAt) throw new Refusal("quizReview.alreadyDiscarded");
  return row;
}

/** A figure the item needs must be drawn and stored before a pupil sees the item. */
function figureMissing(row: { generation: string | null; imageKey: string | null }): boolean {
  return readGeneration(row.generation).needsFigure === true && !row.imageKey;
}

/** Accept: the first stamp serves the item. Accepting an accepted item changes nothing. */
export async function acceptItem(session: ActiveContext, questionId: string): Promise<BankResult<QuizReviewStamped>> {
  const role = reviewerRole(session);
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await waitingRow(tx, questionId);
    if (row.reviewedAt) return false;
    if (figureMissing(row)) throw new Refusal("quizReview.figureNotDrawn");
    // Conditional on reviewedAt still null, so two reviewers pressing together make one stamp.
    const { count } = await tx.quizQuestion.updateMany({ where: { id: questionId, reviewedAt: null, discardedAt: null }, data: { reviewedAt: now, reviewedBy: session.user.id } });
    if (count === 0) return false;
    await tx.quizReviewStamp.create({ data: { questionId, reviewerUserId: session.user.id, role, action: "ACCEPT", at: now } });
    return true;
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizReview.accept", targetType: "QuizQuestion", targetId: questionId, meta: { role } });
  return stateOf(questionId);
}

/** The checks an edited English must pass before it is served; the verifier's arithmetic rule, the same evaluator. */
export function checkEdit(input: QuizReviewEditBody, optionCount: number): TranslationKey | null {
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

/**
 * Edit then accept: the English as corrected, stamped in the same transaction. The stamp row keeps the
 * English as it stood (`before`), the audit log names the fields changed, and the solver's answers are
 * kept with `editedAfterSolvingAt` set — they were given to the old words. A changed stem, option or
 * solution takes any language stamp off: the Hindi and the Marathi were read against the old English.
 */
export async function editAndAccept(session: ActiveContext, questionId: string, input: QuizReviewEditBody): Promise<BankResult<QuizReviewStamped>> {
  const role = reviewerRole(session);
  const now = new Date();
  let changed: string[] = [];
  const result = await inTransaction(async (tx) => {
    const row = await waitingRow(tx, questionId);
    if (row.reviewedAt) throw new Refusal("quizReview.alreadyAccepted");
    if (figureMissing(row)) throw new Refusal("quizReview.figureNotDrawn");
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
    changed = (Object.keys(after) as (keyof typeof after)[]).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
    const wordsChanged = changed.some((k) => k === "stem" || k === "choices" || k === "solution");
    const { count } = await tx.quizQuestion.updateMany({
      where: { id: questionId, reviewedAt: null, discardedAt: null },
      data: {
        difficulty: after.difficulty,
        stem: after.stem,
        choices: JSON.stringify(after.choices),
        answerIndex: after.answerIndex,
        solution: after.solution,
        checkExpr: after.checkExpr,
        reviewedAt: now,
        reviewedBy: session.user.id,
        ...(changed.length ? { editedAfterSolvingAt: now } : {}),
        ...(wordsChanged ? { hiReviewedAt: null, hiReviewedBy: null, mrReviewedAt: null, mrReviewedBy: null } : {}),
      },
    });
    if (count === 0) throw new Refusal("quizReview.alreadyAccepted");
    await tx.quizReviewStamp.create({
      data: { questionId, reviewerUserId: session.user.id, role, action: changed.length ? "EDIT_ACCEPT" : "ACCEPT", before: changed.length ? JSON.stringify(before) : null, at: now },
    });
    return true;
  });
  if (!result.ok) return result;
  await audit({ schoolId: null, actorUserId: session.user.id, action: changed.length ? "appadmin.quizReview.edit" : "appadmin.quizReview.accept", targetType: "QuizQuestion", targetId: questionId, meta: { role, changed } });
  return stateOf(questionId);
}

/** Discard with a coded reason: never served, out of the queue. Discarding a discarded item changes nothing. */
export async function discardItem(session: ActiveContext, questionId: string, reason: QuizDiscardReason): Promise<BankResult<QuizReviewStamped>> {
  const role = reviewerRole(session);
  if (!(QUIZ_DISCARD_REASONS as readonly string[]).includes(reason)) return { ok: false, errorKey: "quizReview.reasonNeeded" };
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({ where: { id: questionId }, select: { generated: true, reviewedAt: true, discardedAt: true } });
    if (!row || !row.generated) throw new Refusal("quizReview.noSuchItem");
    if (row.discardedAt) return false;
    if (row.reviewedAt) throw new Refusal("quizReview.alreadyAccepted");
    const { count } = await tx.quizQuestion.updateMany({ where: { id: questionId, reviewedAt: null, discardedAt: null }, data: { discardedAt: now, discardReason: reason } });
    if (count === 0) return false;
    await tx.quizReviewStamp.create({ data: { questionId, reviewerUserId: session.user.id, role, action: "DISCARD", reason, at: now } });
    return true;
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizReview.discard", targetType: "QuizQuestion", targetId: questionId, meta: { role, reason } });
  return stateOf(questionId);
}

/**
 * THE LANGUAGE STAMP'S ONE WRITER, inside a caller's transaction: the column the serving filter reads
 * and the stamp row, together; nothing when the stamp already stands as asked. The caller has asserted
 * the content team's gate. Used by this queue and by the native-review page (translation-review.ts).
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

/** Stamp the Hindi or the Marathi row read (or take the stamp off): the row is served once the English is too. */
export async function stampTranslation(session: ActiveContext, questionId: string, language: "hi" | "mr", stamped = true): Promise<BankResult<QuizReviewStamped>> {
  const role = reviewerRole(session);
  const now = new Date();
  const result = await inTransaction(async (tx) => {
    const row = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      select: { generated: true, discardedAt: true, translations: { where: { language }, select: { id: true }, take: 1 } },
    });
    if (!row || !row.generated) throw new Refusal("quizReview.noSuchItem");
    if (row.discardedAt) throw new Refusal("quizReview.alreadyDiscarded");
    if (stamped && row.translations.length === 0) throw new Refusal("translationReview.nothingToReview");
    return writeLanguageStamp(tx, { questionId, language, stamped, reviewerUserId: session.user.id, role, at: now });
  });
  if (!result.ok) return result;
  if (result.value) await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizReview.language", targetType: "QuizQuestion", targetId: questionId, meta: { role, language, stamped } });
  return stateOf(questionId);
}
