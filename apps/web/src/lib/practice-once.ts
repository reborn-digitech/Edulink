import "server-only";
import { Prisma } from "@prisma/client";
import type { PracticeOnceSet } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { assignmentsForMembership, assignmentsForStudent } from "./practice-insights";
import { parseChoices, QUIZ_LEVELS, clampLevel, type QuizLanguage, type ServedQuestion } from "./quiz";
import { SERVED_QUESTION } from "./quiz-served";
import { servedFigure } from "./quiz-figure";
import { normaliseLocale } from "./i18n/locales";
import type { ActiveContext } from "./session";

/**
 * ONE-TIME PRACTICE (decision 0008, the owner's decision of 7 November 2026).
 *
 * A teacher may set bank work for any pupil. A pupil WITHOUT the Student plan opens an assigned set ONCE: a fixed
 * draw of the chapter's served questions nearest the target rung (ONCE_QUESTIONS of them, fewer when the chapter
 * holds fewer), each answered once, scored, and a second open shows the result rather than the questions. It
 * counts toward nothing else — no QuizAttempt, no QuizResponse, no QuizMastery, no badge, no journey — so the
 * bank itself, the journey and revision stay behind the plan card, and a pupil with the plan plays the chapter
 * through the ordinary attempt (src/lib/quiz.ts), where the assignment's rung is proven.
 *
 * THE ROW IS THE RECORD. `PracticeOnce`, one per pupil and assignment: the drawn ids in serving order, the answers
 * in order with their verdicts, the counts. An answer is recorded by a conditional update on the answers as they
 * were read, so a double tap or the outbox's second delivery gets the stored verdict and moves nothing twice.
 *
 * WHO. The pupil's own classes' assignments (assignmentsForStudent, not archived), their own school's row, re-read
 * on every call; another pupil's set, an archived set or a set of a chapter the tenant does not list is not found.
 * The doors are `planFree`: the platform switch alone (QUESTION_BANK off is 404), never the plan.
 */
export const ONCE_QUESTIONS = 10;

type Answer = { questionId: string; chosenIndex: number; correct: boolean };
type OnceRow = { id: string; assignmentId: string; topicId: string; questionIds: Prisma.JsonValue; answers: Prisma.JsonValue; total: number; correct: number; finishedAt: Date | null };
const ONCE_SELECT = { id: true, assignmentId: true, topicId: true, questionIds: true, answers: true, total: true, correct: true, finishedAt: true } as const;

const ids = (raw: Prisma.JsonValue): string[] => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : []);
const answersOf = (raw: Prisma.JsonValue): Answer[] =>
  Array.isArray(raw)
    ? raw.flatMap((x) => {
        const a = x as Partial<Answer> | null;
        return a && typeof a.questionId === "string" && typeof a.chosenIndex === "number" && typeof a.correct === "boolean" ? [{ questionId: a.questionId, chosenIndex: a.chosenIndex, correct: a.correct }] : [];
      })
    : [];

function requireStudent(ctx: ActiveContext): { schoolId: string; membershipId: string } {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId };
}

type Assigned = Awaited<ReturnType<typeof assignmentsForStudent>>[number];

/** The set as the contract carries it: the assignment's words and where the one-time attempt stands. */
function setView(a: Assigned, row: OnceRow | null, drawable: number): PracticeOnceSet {
  const answered = row ? answersOf(row.answers).length : 0;
  return {
    assignmentId: a.id,
    topicSlug: a.topicSlug,
    topicName: a.topicName,
    subject: a.subject,
    classLevel: a.classLevel,
    targetLevel: a.targetLevel,
    targetTierName: a.targetTierName,
    note: a.note,
    dueAt: a.dueAt ? a.dueAt.toISOString() : null,
    state: !row ? "NOT_OPENED" : row.finishedAt ? "DONE" : "OPEN",
    total: row ? row.total : drawable,
    answered,
    correct: row ? row.correct : 0,
  };
}

/** How many questions an open would draw from this chapter (the served ones, at most ONCE_QUESTIONS). */
async function drawableOf(topicIds: string[]): Promise<Map<string, number>> {
  if (topicIds.length === 0) return new Map();
  const grouped = await db.quizQuestion.groupBy({ by: ["topicId"], where: { topicId: { in: topicIds }, ...SERVED_QUESTION }, _count: { _all: true } });
  return new Map(grouped.map((g) => [g.topicId, Math.min(ONCE_QUESTIONS, g._count._all)]));
}

/** Every set assigned to the pupil's classes, with where its one-time attempt stands. */
export async function onceSets(ctx: ActiveContext, language: QuizLanguage = "en"): Promise<PracticeOnceSet[]> {
  const { membershipId } = requireStudent(ctx);
  const assigned = await assignmentsForStudent(ctx, language);
  if (assigned.length === 0) return [];
  const rows = await db.practiceOnce.findMany({ where: { studentMembershipId: membershipId, assignmentId: { in: assigned.map((a) => a.id) } }, select: ONCE_SELECT });
  const byAssignment = new Map(rows.map((r) => [r.assignmentId, r]));
  const topicIds = [...new Set(assigned.filter((a) => !byAssignment.has(a.id)).map((a) => a.topicId))];
  const drawable = await drawableOf(topicIds);
  return assigned.map((a) => setView(a, byAssignment.get(a.id) ?? null, drawable.get(a.topicId) ?? 0));
}

/**
 * The draw: the chapter's served questions nearest the target rung, the lower rung first on a tie, id order within
 * a rung — the same order pickQuestion's spec gives a sitting — and ONCE_QUESTIONS of them. Ids and difficulties
 * only; a chapter holds hundreds at most.
 */
async function draw(topicId: string, targetLevel: number): Promise<string[]> {
  const pool = await db.quizQuestion.findMany({ where: { topicId, ...SERVED_QUESTION }, select: { id: true, difficulty: true }, orderBy: [{ difficulty: "asc" }, { id: "asc" }] });
  const target = clampLevel(targetLevel);
  return pool
    .map((q, i) => ({ id: q.id, distance: Math.abs(clampLevel(q.difficulty) - target), level: clampLevel(q.difficulty), i }))
    .sort((a, b) => a.distance - b.distance || a.level - b.level || a.i - b.i)
    .slice(0, ONCE_QUESTIONS)
    .map((q) => q.id);
}

/** The question to answer now — the first drawn id without an answer — never with its answer; null when every one is answered. */
async function nextOnce(row: OnceRow, language: QuizLanguage): Promise<ServedQuestion | null> {
  const answered = new Set(answersOf(row.answers).map((a) => a.questionId));
  const next = ids(row.questionIds).find((id) => !answered.has(id));
  if (!next) return null;
  const full = await db.quizQuestion.findUnique({ where: { id: next }, select: { id: true, difficulty: true, stem: true, choices: true, imageKey: true, imageAlt: true } });
  if (!full) return null;
  const lang = normaliseLocale(language);
  const tr = lang === "en" ? null : await db.quizQuestionTranslation.findFirst({ where: { questionId: full.id, language: lang }, select: { stem: true, choices: true, imageKey: true, imageAlt: true } });
  const original = parseChoices(full.choices);
  const translated = tr?.choices ? parseChoices(tr.choices) : [];
  const choices = translated.length === original.length ? translated.map((c, i) => (c.trim().length > 0 ? c : original[i]!)) : original;
  return {
    questionId: full.id,
    stem: (tr?.stem ?? "").trim().length > 0 ? tr!.stem : full.stem,
    choices,
    difficulty: full.difficulty,
    levelLabelKey: QUIZ_LEVELS[clampLevel(full.difficulty) - 1]!.labelKey,
    askedCount: answered.size,
    totalCount: row.total,
    image: servedFigure(full, tr),
  };
}

/** The pupil's assignment by id, among their own classes' live sets; anybody else's is not found. */
async function assignedSet(ctx: ActiveContext, assignmentId: string, language: QuizLanguage): Promise<Assigned> {
  const set = (await assignmentsForStudent(ctx, language)).find((a) => a.id === assignmentId);
  if (!set) throw new AccessError("access.noSuchTopic", "NOT_FOUND");
  return set;
}

export type OnceView = { onceId: string; set: PracticeOnceSet; question: ServedQuestion | null };

/**
 * Open a set once, or read it back as it stands. The first open fixes the draw and writes the row; two opens at
 * once meet the unique index and the second reads the first's row. A finished set answers with no question and
 * the result in `set`. A chapter with nothing served to draw from is refused.
 */
export async function openOnce(ctx: ActiveContext, assignmentId: string, language: QuizLanguage = "en"): Promise<OnceView> {
  const { schoolId, membershipId } = requireStudent(ctx);
  const set = await assignedSet(ctx, assignmentId, language);
  let row = await db.practiceOnce.findUnique({ where: { studentMembershipId_assignmentId: { studentMembershipId: membershipId, assignmentId } }, select: ONCE_SELECT });
  if (!row) {
    const questionIds = await draw(set.topicId, set.targetLevel);
    if (questionIds.length === 0) throw new AccessError("practiceOnce.refuseEmpty", "NOT_FOUND");
    try {
      row = await db.practiceOnce.create({ data: { schoolId, studentMembershipId: membershipId, assignmentId, topicId: set.topicId, questionIds, answers: [], total: questionIds.length }, select: ONCE_SELECT });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      row = await db.practiceOnce.findUniqueOrThrow({ where: { studentMembershipId_assignmentId: { studentMembershipId: membershipId, assignmentId } }, select: ONCE_SELECT });
    }
  }
  return { onceId: row.id, set: setView(set, row, row.total), question: await nextOnce(row, language) };
}

export type OnceAnswered = { replayed: boolean; correct: boolean; answerIndex: number; solution: string; set: PracticeOnceSet; question: ServedQuestion | null };

/**
 * One answer. The question must be in the draw; one already answered comes back as the stored verdict (replayed),
 * so the outbox may deliver twice. An out-of-range choice is recorded wrong, never refused, so a broken client
 * cannot skip a question. The last answer finishes the set and fixes the score.
 */
export async function answerOnce(ctx: ActiveContext, onceId: string, questionId: string, chosenIndex: number, language: QuizLanguage = "en"): Promise<OnceAnswered> {
  const { schoolId, membershipId } = requireStudent(ctx);
  const row = await db.practiceOnce.findFirst({ where: { id: onceId, schoolId, studentMembershipId: membershipId }, select: ONCE_SELECT });
  if (!row) throw new AccessError("access.attemptNotFound", "NOT_FOUND");
  const set = await assignedSet(ctx, row.assignmentId, language);
  if (!ids(row.questionIds).includes(questionId)) throw new AccessError("access.questionNotFound", "NOT_FOUND");
  const question = await db.quizQuestion.findFirst({ where: { id: questionId, topicId: row.topicId }, select: { answerIndex: true, solution: true, choices: true } });
  if (!question) throw new AccessError("access.questionNotFound", "NOT_FOUND");
  const lang = normaliseLocale(language);
  const tr = lang === "en" ? null : await db.quizQuestionTranslation.findFirst({ where: { questionId, language: lang }, select: { solution: true } });
  const solution = (tr?.solution ?? "").trim().length > 0 ? tr!.solution : question.solution;

  const before = answersOf(row.answers);
  const already = before.find((a) => a.questionId === questionId);
  if (already) return { replayed: true, correct: already.correct, answerIndex: question.answerIndex, solution, set: setView(set, row, row.total), question: await nextOnce(row, language) };

  const choices = parseChoices(question.choices);
  const inRange = Number.isInteger(chosenIndex) && chosenIndex >= 0 && chosenIndex < choices.length;
  const correct = inRange && chosenIndex === question.answerIndex;
  const after = [...before, { questionId, chosenIndex: inRange ? chosenIndex : -1, correct }];
  const finished = after.length >= row.total;
  // Recorded once: the update holds only while the answers are as they were read (the Json equality is Postgres's jsonb =).
  const { count } = await db.practiceOnce.updateMany({
    where: { id: row.id, answers: { equals: row.answers as Prisma.InputJsonValue } },
    data: { answers: after, correct: row.correct + (correct ? 1 : 0), finishedAt: finished ? new Date() : null },
  });
  const fresh = await db.practiceOnce.findUniqueOrThrow({ where: { id: row.id }, select: ONCE_SELECT });
  if (count === 0) {
    const stored = answersOf(fresh.answers).find((a) => a.questionId === questionId);
    return { replayed: true, correct: stored?.correct ?? correct, answerIndex: question.answerIndex, solution, set: setView(set, fresh, fresh.total), question: await nextOnce(fresh, language) };
  }
  return { replayed: false, correct, answerIndex: question.answerIndex, solution, set: setView(set, fresh, fresh.total), question: await nextOnce(fresh, language) };
}

/**
 * THE GUARDIAN'S READ (decision 0008's follow-up, the owner's confirmation of 12 November 2026): the child's assigned
 * sets with where each one-time attempt stands — not opened, open with so many answered, done with the score — for
 * the guardian of a pupil without the plan, beside the plan card on /parent/practice. Read-only: a guardian opens
 * nothing and plays nothing; the set is the pupil's own. The guardian's reach is proved here (assertGuardianAccess
 * under RESULTS, as the child's practice progress is), never by a bare pupil id, and the rows are read exactly as
 * the teacher's page reads them (onceResultsFor).
 */
export async function childOnceSets(parentUserId: string, studentMembershipId: string, language: QuizLanguage = "en"): Promise<PracticeOnceSet[]> {
  const link = await assertGuardianAccess(parentUserId, studentMembershipId, "RESULTS");
  const schoolId = link.student.school.id;
  const assigned = await assignmentsForMembership(schoolId, studentMembershipId, language);
  if (assigned.length === 0) return [];
  const results = await onceResultsFor(schoolId, assigned.map((a) => a.id), [studentMembershipId]);
  const drawable = await drawableOf([...new Set(assigned.filter((a) => !results.has(`${studentMembershipId}|${a.id}`)).map((a) => a.topicId))]);
  return assigned.map((a) => {
    const r = results.get(`${studentMembershipId}|${a.id}`) ?? null;
    return {
      assignmentId: a.id,
      topicSlug: a.topicSlug,
      topicName: a.topicName,
      subject: a.subject,
      classLevel: a.classLevel,
      targetLevel: a.targetLevel,
      targetTierName: a.targetTierName,
      note: a.note,
      dueAt: a.dueAt ? a.dueAt.toISOString() : null,
      state: !r ? "NOT_OPENED" : r.finished ? "DONE" : "OPEN",
      total: r ? r.total : (drawable.get(a.topicId) ?? 0),
      answered: r ? r.answered : 0,
      correct: r ? r.correct : 0,
    };
  });
}

/** For the teacher's class view and the guardian's: each pupil's one-time result on each assignment, by `${membershipId}|${assignmentId}`. */
export async function onceResultsFor(schoolId: string, assignmentIds: string[], membershipIds: string[]): Promise<Map<string, { correct: number; total: number; answered: number; finished: boolean }>> {
  if (assignmentIds.length === 0 || membershipIds.length === 0) return new Map();
  const rows = await db.practiceOnce.findMany({ where: { schoolId, assignmentId: { in: assignmentIds }, studentMembershipId: { in: membershipIds } }, select: { assignmentId: true, studentMembershipId: true, correct: true, total: true, answers: true, finishedAt: true } });
  return new Map(rows.map((r) => [`${r.studentMembershipId}|${r.assignmentId}`, { correct: r.correct, total: r.total, answered: answersOf(r.answers).length, finished: r.finishedAt !== null }]));
}
