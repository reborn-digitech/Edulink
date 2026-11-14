import "server-only";
import { db } from "./db";
import { AccessError, assertClassAccess, assertGuardianAccess } from "./tenancy";
import type { ActiveContext } from "./session";
import { clampLevel, MAX_LEVEL, MIN_LEVEL, PROMOTE_AFTER, replayedAnswer, schoolQuizBoard, startAttempt, submitAnswer, TIER_NAMES, type AnswerResult, type QuizLanguage } from "./quiz";
import { SERVED_QUESTION, servedTranslation } from "./quiz-served";
import { asQuizBoard, type QuizBoard } from "@edulink/contracts"; // quiz-board (11 Oct 2026)
import { normaliseLocale } from "./i18n/locales";
import { servedFigure, type ServedFigure } from "./quiz-figure";
import { audit } from "./audit";
import { addDaysToKey, isDateKey, zonedStartOfDay } from "./dates";
// college-content (12 Oct 2026): what a tenant lists, on every practice read here too.
import { practiceTenantOf, practiceTopicsWhere } from "./practice-audience";
import { onceResultsFor } from "./practice-once";
import { asCollegeTerm, practiceSectionOf, type CollegeTerm, type PracticeKind, type PracticeSection } from "@edulink/contracts";

/**
 * Practice insights — the read side of the drill bank, for everyone AROUND the
 * child: the child's own "continue" card and revision queue, the parent's
 * progress view, and the teacher's heatmap and chapter assignments.
 *
 * Two rules carried over from the rest of the practice surface:
 *
 * NOTHING HERE COMPARES CHILDREN TO EACH OTHER. The teacher's heatmap counts
 * how many pupils stand on each rung — it never ranks them, and the per-pupil
 * assignment table exists so a teacher can help the ones who are stuck, which
 * is the opposite of a leaderboard.
 *
 * ATTAINMENT IS DERIVED, NEVER STORED. A practice assignment has no submission
 * and no marking: whether a child reached the rung is read from QuizMastery at
 * render time, so it cannot drift from what the child actually did.
 */

function pick(translated: string | null | undefined, original: string): string {
  const value = (translated ?? "").trim();
  return value.length > 0 ? value : original;
}

/** Narrow a context to a school-scoped one, the shape assertClassAccess wants. */
function requireScope(ctx: ActiveContext): {
  schoolId: string;
  membershipId: string;
  role: NonNullable<ActiveContext["role"]>;
} {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role) {
    throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
  }
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role };
}

const topicWithTranslation = (language: QuizLanguage) => ({
  select: {
    id: true,
    slug: true,
    name: true,
    subject: true,
    classLevel: true,
    board: true, // quiz-board (11 Oct 2026)
    // college-content (12 Oct 2026)
    audience: true,
    streams: true,
    programme: true,
    yearOrSemester: true,
    translations:
      language === "en"
        ? undefined
        : { where: { language }, select: { name: true }, take: 1 },
  },
});

type TopicRow = {
  id: string;
  slug: string;
  name: string;
  subject: string;
  classLevel: number;
  translations?: { name: string }[];
};

const topicName = (topic: TopicRow) => pick(topic.translations?.[0]?.name, topic.name);

/* -------------------------------------------------------------------------- */
/* The child's own cards                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The grade this pupil is enrolled in, or null when no active enrolment names
 * one. Drives the practice page's default filter: a Grade 5 child should land
 * on Grade 5 chapters, not on Class 3 civics.
 */
export async function enrolledGradeLevel(ctx: ActiveContext): Promise<number | null> {
  if (!ctx.membershipId || !ctx.schoolId) return null;
  const rows = await db.enrollment.findMany({
    where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId, status: "ACTIVE" },
    select: { class: { select: { gradeLevel: true } } },
  });
  const grades = rows
    .map((r) => Number.parseInt(r.class.gradeLevel ?? "", 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  if (grades.length === 0) return null;
  // A child in a form group AND a subject class across grades takes the lowest
  // — the form group is where they live.
  return Math.min(...grades);
}

export type ContinueCard = {
  slug: string;
  name: string;
  subject: string;
  level: number;
  tierCount: number;
  /** Consecutive right answers still needed at this level to prove it — the
   * promotion streak. Null once every rung of this chapter is proven. */
  remainingForBadge: number | null;
  nextTierName: string | null;
};

/** The chapter this child most recently practised, to resume in one tap. */
export async function continueCard(
  ctx: ActiveContext,
  language: QuizLanguage = "en",
): Promise<ContinueCard | null> {
  if (!ctx.membershipId || !ctx.schoolId) return null;
  const mastery = await db.quizMastery.findFirst({
    // college-content (12 Oct 2026): only a chapter this tenant still lists.
    where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId, seenCount: { gt: 0 }, topic: practiceTopicsWhere(await practiceTenantOf(ctx.schoolId)) },
    orderBy: { updatedAt: "desc" },
    include: { topic: topicWithTranslation(language) },
  });
  if (!mastery) return null;

  const tiers = await db.earnedBadge.count({
    where: {
      studentMembershipId: ctx.membershipId,
      permanent: true,
      badgeId: { startsWith: `abhyaas:${mastery.topic.slug}:tier-` },
    },
  });
  const level = clampLevel(mastery.level);
  const allProven = tiers >= MAX_LEVEL;
  return {
    slug: mastery.topic.slug,
    name: topicName(mastery.topic),
    subject: mastery.topic.subject,
    level,
    tierCount: tiers,
    remainingForBadge: allProven ? null : Math.max(1, PROMOTE_AFTER - mastery.streakRight),
    nextTierName: allProven ? null : TIER_NAMES[level - 1]!,
  };
}

/**
 * Questions answered in the last seven days — a rolling window rather than a
 * calendar week, so the number never resets to zero at midnight on a day
 * that depends on the server's idea of Monday.
 */
export async function weeklyPracticeCount(ctx: ActiveContext): Promise<number> {
  if (!ctx.membershipId || !ctx.schoolId) return 0;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db.quizResponse.count({
    where: {
      attempt: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId },
      answeredAt: { gte: since },
      // An answer, not a reveal (TA-600): revealSolution writes a row with no choice, and showing the working is not answering.
      chosenIndex: { not: null },
    },
  });
}

/** The child's own weekly target. Fixed, private, and deliberately modest —
 * a number to beat yourself with, not each other. */
export const WEEKLY_GOAL = 50;

export type RevisionItem = {
  questionId: string;
  topicSlug: string;
  topicName: string;
  subject: string;
};

/**
 * Questions whose LATEST answer was wrong, once they have rested for at least
 * `minAgeDays` — asking again ten minutes later tests short-term memory, which
 * is not the thing revision is for.
 *
 * Reads the child's most recent responses (bounded) and keeps only each
 * question's latest verdict, so a question later answered right never comes
 * back. Capped small: a revision queue a child can finish is one they will
 * actually start.
 */
export async function revisionQueue(
  ctx: ActiveContext,
  opts: { minAgeDays?: number; limit?: number; language?: QuizLanguage } = {},
): Promise<RevisionItem[]> {
  if (!ctx.membershipId || !ctx.schoolId) return [];
  const minAgeDays = opts.minAgeDays ?? 2;
  const limit = opts.limit ?? 12;
  const language = normaliseLocale(opts.language ?? "en");
  const cutoff = new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000);

  const recent = await db.quizResponse.findMany({
    where: { attempt: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId } },
    orderBy: { answeredAt: "desc" },
    take: 500,
    select: { questionId: true, correct: true, answeredAt: true },
  });

  const latest = new Map<string, { correct: boolean; answeredAt: Date }>();
  for (const row of recent) {
    if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  }
  const due = [...latest.entries()]
    .filter(([, r]) => !r.correct && r.answeredAt <= cutoff)
    .sort((a, b) => a[1].answeredAt.getTime() - b[1].answeredAt.getTime())
    .slice(0, limit)
    .map(([questionId]) => questionId);
  if (due.length === 0) return [];

  const questions = await db.quizQuestion.findMany({
    // quiz-publish-jobs (11 Oct 2026): an item taken down on the bank desk leaves the revision queue at once (quiz-served.ts).
    // college-content (12 Oct 2026): and only from a chapter this tenant lists.
    where: { id: { in: due }, ...SERVED_QUESTION, topic: practiceTopicsWhere(await practiceTenantOf(ctx.schoolId)) },
    select: { id: true, topic: topicWithTranslation(language) },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  return due
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({
      questionId: q.id,
      topicSlug: q.topic.slug,
      topicName: topicName(q.topic),
      subject: q.topic.subject,
    }));
}

/**
 * One revision question, re-served. The child must have answered it before —
 * this is a queue of THEIR history, not a second way to browse the bank.
 * Never returns the answer; marking goes through submitAnswer as usual.
 */
export async function reviseQuestion(
  ctx: ActiveContext,
  questionId: string,
  language: QuizLanguage = "en",
): Promise<{ questionId: string; topicSlug: string; stem: string; choices: string[]; difficulty: number; image: ServedFigure | null }> {
  if (!ctx.membershipId || !ctx.schoolId) throw new AccessError("access.onlyAPupilCanPractise");
  const prior = await db.quizResponse.findFirst({
    where: { questionId, attempt: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId } },
    select: { id: true },
  });
  if (!prior) throw new AccessError("access.questionNotFound", "NOT_FOUND");

  // quiz-publish-jobs (11 Oct 2026): a question taken down (or held for its figure) is not re-served either.
  const question = await db.quizQuestion.findFirst({
    where: { id: questionId, ...SERVED_QUESTION, topic: practiceTopicsWhere(await practiceTenantOf(ctx.schoolId)) }, // college-content (12 Oct 2026)
    // figures (10 Oct 2026): a re-served question keeps its figure, or a figure question could not be answered.
    select: { id: true, stem: true, choices: true, difficulty: true, imageKey: true, imageAlt: true, editedAfterSolvingAt: true, topic: { select: { slug: true } } },
  });
  if (!question) throw new AccessError("access.questionNotFound", "NOT_FOUND");
  const lang = normaliseLocale(language);
  // A language row older than the desk's last English edit gives way to the English (TA-199, quiz-served.ts).
  const tr =
    lang === "en"
      ? null
      : servedTranslation(
          await db.quizQuestionTranslation.findFirst({
            where: { questionId, language: lang },
            select: { stem: true, choices: true, imageKey: true, imageAlt: true, updatedAt: true },
          }),
          question,
        );
  const original = JSON.parse(question.choices) as string[];
  const translated = tr?.choices ? (JSON.parse(tr.choices) as string[]) : null;
  const choices =
    translated && translated.length === original.length
      ? translated.map((c, i) => pick(c, original[i]!))
      : original;
  return {
    questionId: question.id,
    topicSlug: question.topic.slug,
    stem: pick(tr?.stem, question.stem),
    choices,
    difficulty: question.difficulty,
    image: servedFigure(question, tr),
  };
}

/**
 * The sitting a revision answer is marked in: the question's own chapter,
 * opened or resumed exactly as practice opens it, so revision moves the same
 * ladder and earns the same badges — revision is practice, not a parallel
 * scoring system. The question is re-checked against the pupil's own history
 * first (reviseQuestion), so a revision answer is never a way into a question
 * they were not served. The web's reviseAnswer and the phone's endpoint both
 * start here, then mark with submitAnswer.
 */
export async function revisionAttempt(
  ctx: ActiveContext,
  questionId: string,
  language: QuizLanguage = "en",
): Promise<{ attemptId: string; topicSlug: string }> {
  const q = await reviseQuestion(ctx, questionId, language);
  const { attemptId } = await startAttempt(ctx, q.topicSlug);
  return { attemptId, topicSlug: q.topicSlug };
}

/** How long after it closed a sitting a revision answer delivered again is taken for the same answer (TA-374). */
export const REVISION_REPLAY_WINDOW_MS = 60 * 60 * 1000;

/**
 * One revision answer, marked in the chapter's sitting (revisionAttempt, then submitAnswer) — the web's reviseAnswer
 * and the phone's POST /api/v1/practice/revision/answer.
 *
 * A REPLAY OF THE ANSWER THAT CLOSED THE SITTING (TA-374 of the testing analysis of 13 November 2026). submitAnswer
 * moves the ladder only on a question's first answer in a sitting, which holds a replay to nothing while the sitting
 * is open; but when the first delivery was the chapter's last unanswered question it closed the sitting, and the
 * outbox's second delivery (its reply lost) found none open, opened a new one, and counted the answer again. So when
 * no sitting of the chapter is open, the latest one closed within REVISION_REPLAY_WINDOW_MS, its closing answer was
 * this question and the choice is the same, the stored verdict is answered and nothing is opened or moved.
 */
export async function answerRevision(
  ctx: ActiveContext,
  questionId: string,
  chosenIndex: number,
  language: QuizLanguage = "en",
): Promise<AnswerResult> {
  const q = await reviseQuestion(ctx, questionId, language);
  const topic = await db.quizTopic.findUnique({ where: { slug: q.topicSlug }, select: { id: true } });
  if (topic && ctx.membershipId && ctx.schoolId) {
    const mine = { schoolId: ctx.schoolId, studentMembershipId: ctx.membershipId, topicId: topic.id };
    const open = await db.quizAttempt.findFirst({ where: { ...mine, finishedAt: null }, select: { id: true } });
    if (!open) {
      const closed = await db.quizAttempt.findFirst({
        where: { ...mine, finishedAt: { gte: new Date(Date.now() - REVISION_REPLAY_WINDOW_MS) } },
        orderBy: { finishedAt: "desc" },
        select: { id: true },
      });
      const last = closed
        ? await db.quizResponse.findFirst({ where: { attemptId: closed.id }, orderBy: { answeredAt: "desc" }, select: { questionId: true, chosenIndex: true } })
        : null;
      if (closed && last && last.questionId === questionId && last.chosenIndex === chosenIndex) return replayedAnswer(closed.id, questionId, language);
    }
  }
  const { attemptId } = await startAttempt(ctx, q.topicSlug);
  return submitAnswer(ctx, attemptId, questionId, chosenIndex, language);
}

/* -------------------------------------------------------------------------- */
/* The parent's view                                                           */
/* -------------------------------------------------------------------------- */

export type ChildTopicProgress = {
  slug: string;
  name: string;
  subject: string;
  classLevel: number;
  level: number;
  seenCount: number;
  correctCount: number;
  tierCount: number;
  cleanCompletion: boolean;
  /** quiz-board (11 Oct 2026): the chapter's board; null for a bank that follows no book. */
  board: QuizBoard | null;
  // ---- college-content (12 Oct 2026): at a college, the section, the programme and the year or semester ----
  section: PracticeSection | null;
  programme: string | null;
  yearOrSemester: CollegeTerm | null;
};

/**
 * Every chapter this child has touched, for their guardian. Guardianship is
 * asserted here — the page passes the requested child id straight through.
 */
export async function childPracticeProgress(
  parentUserId: string,
  studentMembershipId: string,
  language: QuizLanguage = "en",
): Promise<{ childName: string; topics: ChildTopicProgress[]; weeklyCount: number; /** quiz-board: the child's school's practice board, shown first. */ schoolBoard: QuizBoard | null; /** college-content: the school's page or the college's two sections. */ practiceKind: PracticeKind }> {
  // An adult at a college shares it under RESULTS (DS-1, 10 Oct 2026): quiz progress is learning results.
  const link = await assertGuardianAccess(parentUserId, studentMembershipId, "RESULTS");
  // college-content (12 Oct 2026): the chapters the child's school lists, as on the child's own page.
  const tenant = await practiceTenantOf(link.student.school.id);

  const masteries = await db.quizMastery.findMany({
    where: { studentMembershipId, seenCount: { gt: 0 }, topic: practiceTopicsWhere(tenant) },
    orderBy: { updatedAt: "desc" },
    include: { topic: topicWithTranslation(language) },
  });
  const tiers = await db.earnedBadge.findMany({
    where: { studentMembershipId, permanent: true, badgeId: { contains: ":tier-" } },
    select: { badgeId: true },
  });
  const tierCount = new Map<string, number>();
  for (const row of tiers) {
    const match = /^abhyaas:(.+):tier-[1-6]$/.exec(row.badgeId);
    if (!match) continue;
    tierCount.set(match[1]!, (tierCount.get(match[1]!) ?? 0) + 1);
  }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCount = await db.quizResponse.count({
    // Answers, not reveals (TA-600), the child's own week count's rule.
    where: { attempt: { studentMembershipId }, answeredAt: { gte: since }, chosenIndex: { not: null } },
  });

  return {
    childName: link.student.user.preferredName ?? link.student.user.name,
    weeklyCount,
    schoolBoard: await schoolQuizBoard(link.student.school.id),
    practiceKind: tenant.college ? "COLLEGE" : "SCHOOL",
    topics: masteries.map((m) => ({
      slug: m.topic.slug,
      name: topicName(m.topic),
      subject: m.topic.subject,
      classLevel: m.topic.classLevel,
      level: clampLevel(m.level),
      seenCount: m.seenCount,
      correctCount: m.correctCount,
      tierCount: tierCount.get(m.topic.slug) ?? 0,
      cleanCompletion: m.cleanCompletionAt != null,
      board: asQuizBoard(m.topic.board),
      section: collegeSection(m.topic, tenant),
      programme: m.topic.programme,
      yearOrSemester: asCollegeTerm(m.topic.yearOrSemester),
    })),
  };
}

/** college-content (12 Oct 2026): STREAM or PREP at a college; null at a school. */
function collegeSection(topic: { audience: string; streams: string[]; board: string | null }, tenant: Awaited<ReturnType<typeof practiceTenantOf>>): PracticeSection | null {
  const section = practiceSectionOf(topic, tenant);
  return section === "STREAM" || section === "PREP" ? section : null;
}

/* -------------------------------------------------------------------------- */
/* The teacher's view                                                          */
/* -------------------------------------------------------------------------- */

export type HeatmapRow = {
  slug: string;
  name: string;
  subject: string;
  classLevel: number;
  /** How many of the class's pupils currently stand on each rung, index = level − 1. */
  atLevel: number[];
  tried: number;
};

/**
 * Chapter × rung, for one class: how many pupils stand where. Counts, never
 * names — the per-pupil view lives on the assignment table, where a teacher
 * is looking at one chapter with a reason.
 */
export async function classPracticeHeatmap(
  ctx: ActiveContext,
  classId: string,
  language: QuizLanguage = "en",
): Promise<{ pupilCount: number; rows: HeatmapRow[] }> {
  await assertClassAccess(requireScope(ctx), classId);
  const enrolled = await db.enrollment.findMany({
    where: { classId, schoolId: ctx.schoolId!, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  const pupilIds = enrolled.map((e) => e.studentMembershipId);
  if (pupilIds.length === 0) return { pupilCount: 0, rows: [] };

  const masteries = await db.quizMastery.findMany({
    where: { studentMembershipId: { in: pupilIds }, seenCount: { gt: 0 } },
    include: { topic: topicWithTranslation(language) },
  });
  const byTopic = new Map<string, HeatmapRow>();
  for (const m of masteries) {
    const row =
      byTopic.get(m.topic.slug) ??
      ({
        slug: m.topic.slug,
        name: topicName(m.topic),
        subject: m.topic.subject,
        classLevel: m.topic.classLevel,
        atLevel: new Array(MAX_LEVEL).fill(0) as number[],
        tried: 0,
      } satisfies HeatmapRow);
    row.atLevel[clampLevel(m.level) - 1]! += 1;
    row.tried += 1;
    byTopic.set(m.topic.slug, row);
  }
  const rows = [...byTopic.values()].sort((a, b) => b.tried - a.tried).slice(0, 30);
  return { pupilCount: pupilIds.length, rows };
}

export type PracticeAssignmentView = {
  id: string;
  topicId: string;
  topicSlug: string;
  topicName: string;
  subject: string;
  classLevel: number;
  targetLevel: number;
  targetTierName: string;
  note: string | null;
  dueAt: Date | null;
  createdAt: Date;
};

/**
 * The due instant of a practice set due on `dueDate` (YYYY-MM-DD): the last millisecond of that day on the SCHOOL's
 * clock (TA-533). `new Date(\`${d}T23:59:59\`)` read the day in the server process's zone, so a host without
 * TZ=Asia/Kolkata moved every due time five and a half hours. Null for no day or one that is not a day.
 */
export async function practiceDueAt(schoolId: string, dueDate: string | null | undefined): Promise<Date | null> {
  if (!dueDate || !isDateKey(dueDate)) return null;
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  return new Date(zonedStartOfDay(addDaysToKey(dueDate, 1), school.timezone).getTime() - 1);
}

/** Teacher sets a chapter and a rung for a class. Nothing to hand in. */
export async function createPracticeAssignment(
  ctx: ActiveContext,
  input: { classId: string; topicSlug: string; targetLevel: number; note?: string; dueAt?: Date | null },
): Promise<{ id: string }> {
  if (ctx.role !== "TEACHER" && ctx.role !== "ADMIN") {
    throw new AccessError("access.onlyTeachersSetPractice");
  }
  await assertClassAccess(requireScope(ctx), input.classId, { write: true });
  // college-content (12 Oct 2026): a teacher sets only a chapter the school lists.
  const topic = await db.quizTopic.findFirst({
    where: { slug: input.topicSlug, ...practiceTopicsWhere(await practiceTenantOf(ctx.schoolId)) },
    select: { id: true },
  });
  if (!topic) throw new AccessError("access.noSuchTopic", "NOT_FOUND");
  const target = Math.trunc(input.targetLevel);
  if (!Number.isInteger(target) || target < MIN_LEVEL || target > MAX_LEVEL) {
    throw new AccessError("access.practiceTargetOutOfRange");
  }
  const note = (input.note ?? "").trim().slice(0, 200) || null;

  const created = await db.practiceAssignment.create({
    data: {
      schoolId: ctx.schoolId!,
      classId: input.classId,
      topicId: topic.id,
      targetLevel: target,
      note,
      dueAt: input.dueAt ?? null,
      createdById: ctx.membershipId!,
    },
    select: { id: true },
  });
  await audit({
    schoolId: ctx.schoolId!,
    actorUserId: ctx.user.id,
    action: "practice.assign",
    targetType: "PracticeAssignment",
    targetId: created.id,
    meta: { classId: input.classId, topicSlug: input.topicSlug, targetLevel: target },
  });
  return created;
}

export async function archivePracticeAssignment(ctx: ActiveContext, id: string): Promise<void> {
  const assignment = await db.practiceAssignment.findFirst({
    where: { id, schoolId: ctx.schoolId ?? "" },
    select: { id: true, classId: true },
  });
  if (!assignment) throw new AccessError("access.noSuchTopic", "NOT_FOUND");
  await assertClassAccess(requireScope(ctx), assignment.classId, { write: true });
  await db.practiceAssignment.update({ where: { id }, data: { archivedAt: new Date() } });
}

/** Active assignments for a class, each with derived attainment per pupil. */
export async function assignmentsForClass(
  ctx: ActiveContext,
  classId: string,
  language: QuizLanguage = "en",
): Promise<
  (PracticeAssignmentView & {
    reached: number;
    pupilCount: number;
    pupils: { name: string; level: number; reached: boolean; /** The pupil's one-time attempt without the plan (decision 0008): the score, or null when never opened. */ once: { correct: number; total: number; answered: number; finished: boolean } | null }[];
  })[]
> {
  await assertClassAccess(requireScope(ctx), classId);
  const assignments = await db.practiceAssignment.findMany({
    where: { classId, schoolId: ctx.schoolId!, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { topic: topicWithTranslation(language) },
  });
  if (assignments.length === 0) return [];

  const enrolled = await db.enrollment.findMany({
    where: { classId, schoolId: ctx.schoolId!, status: "ACTIVE" },
    select: {
      studentMembershipId: true,
      student: { select: { user: { select: { name: true, preferredName: true } } } },
    },
    take: 60,
  });
  const pupilIds = enrolled.map((e) => e.studentMembershipId);
  const masteries = await db.quizMastery.findMany({
    where: {
      studentMembershipId: { in: pupilIds },
      topicId: { in: assignments.map((a) => a.topicId) },
    },
    select: { studentMembershipId: true, topicId: true, level: true },
  });
  const levelOf = new Map(masteries.map((m) => [`${m.studentMembershipId}|${m.topicId}`, m.level]));
  // decision 0008: a pupil without the plan opened the set once; the teacher reads the score beside the rung.
  const once = await onceResultsFor(ctx.schoolId!, assignments.map((a) => a.id), pupilIds);

  return assignments.map((a) => {
    const pupils = enrolled.map((e) => {
      // 0 means "never opened the chapter" — distinct from standing on L1,
      // which every pupil who has answered anything does by definition.
      const raw = levelOf.get(`${e.studentMembershipId}|${a.topicId}`);
      const level = raw === undefined ? 0 : clampLevel(raw);
      return {
        name: e.student.user.preferredName ?? e.student.user.name,
        level,
        reached: level >= a.targetLevel,
        once: once.get(`${e.studentMembershipId}|${a.id}`) ?? null,
      };
    });
    return {
      id: a.id,
      topicId: a.topicId,
      topicSlug: a.topic.slug,
      topicName: topicName(a.topic),
      subject: a.topic.subject,
      classLevel: a.topic.classLevel,
      targetLevel: a.targetLevel,
      targetTierName: TIER_NAMES[a.targetLevel - 1]!,
      note: a.note,
      dueAt: a.dueAt,
      createdAt: a.createdAt,
      reached: pupils.filter((p) => p.reached).length,
      pupilCount: pupils.length,
      pupils,
    };
  });
}

/** Active assignments for the pupil's own classes, with their own standing. */
export async function assignmentsForStudent(
  ctx: ActiveContext,
  language: QuizLanguage = "en",
): Promise<(PracticeAssignmentView & { myLevel: number; reached: boolean })[]> {
  if (!ctx.membershipId || !ctx.schoolId) return [];
  return assignmentsForMembership(ctx.schoolId, ctx.membershipId, language);
}

/**
 * ONE of the pupil's own classes' live sets, by id, or null (TA-198 of the testing analysis of 13 November 2026). The
 * list above holds the ten newest; opening a set, answering in it and beginning its chapter look the set up here, so a
 * set the eleventh-newest assignment pushed off the list can still be opened, and a one-time set half answered can be
 * finished. Anybody else's set, an archived one or another school's is null, as before.
 */
export async function assignmentForStudent(
  ctx: ActiveContext,
  assignmentId: string,
  language: QuizLanguage = "en",
): Promise<(PracticeAssignmentView & { myLevel: number; reached: boolean }) | null> {
  if (!ctx.membershipId || !ctx.schoolId) return null;
  return (await assignmentsForMembership(ctx.schoolId, ctx.membershipId, language, assignmentId))[0] ?? null;
}

/**
 * The same list for one pupil's membership, for a reader who is not the pupil and has already proved their reach —
 * the guardian's practice page (decision 0008's follow-up, 12 Nov 2026) after assertGuardianAccess. Never called from
 * a handler on a bare id: the caller binds the person first.
 */
export async function assignmentsForMembership(
  schoolId: string,
  membershipId: string,
  language: QuizLanguage = "en",
  /** One set by id, among the same live sets, with no limit (TA-198): see assignmentForStudent. */
  onlyId?: string,
): Promise<(PracticeAssignmentView & { myLevel: number; reached: boolean })[]> {
  const enrolments = await db.enrollment.findMany({
    where: { studentMembershipId: membershipId, schoolId, status: "ACTIVE" },
    select: { classId: true },
  });
  if (enrolments.length === 0) return [];
  const assignments = await db.practiceAssignment.findMany({
    where: { classId: { in: enrolments.map((e) => e.classId) }, archivedAt: null, ...(onlyId !== undefined ? { id: onlyId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { topic: topicWithTranslation(language) },
    ...(onlyId !== undefined ? {} : { take: 10 }),
  });
  if (assignments.length === 0) return [];
  const masteries = await db.quizMastery.findMany({
    where: { studentMembershipId: membershipId, topicId: { in: assignments.map((a) => a.topicId) } },
    select: { topicId: true, level: true },
  });
  const levelOf = new Map(masteries.map((m) => [m.topicId, m.level]));
  return assignments.map((a) => {
    const raw = levelOf.get(a.topicId);
    const myLevel = raw === undefined ? 0 : clampLevel(raw);
    return {
      id: a.id,
      topicId: a.topicId,
      topicSlug: a.topic.slug,
      topicName: topicName(a.topic),
      subject: a.topic.subject,
      classLevel: a.topic.classLevel,
      targetLevel: a.targetLevel,
      targetTierName: TIER_NAMES[a.targetLevel - 1]!,
      note: a.note,
      dueAt: a.dueAt,
      createdAt: a.createdAt,
      myLevel,
      reached: myLevel >= a.targetLevel,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* The child's own journey                                                     */
/* -------------------------------------------------------------------------- */

/** India Standard Time's offset from UTC, the schools' calendar (no daylight saving). */
const INDIA_OFFSET_MS = 330 * 60_000;

export type Journey = {
  /** Every badge, newest first. Bounded, because a page is not an archive. */
  badges: { label: string; description: string; earnedAt: Date; isTier: boolean }[];
  /** Tier badges per month, oldest first, the last six months. */
  monthly: { label: string; month: string; tiers: number }[];
  /** Consecutive weeks (ending now, with a one-week grace) with any practice. */
  practiceWeeks: number;
  totalAnswers: number;
  totalTiers: number;
};

/**
 * A child's private "how far I've come" view. PRIVATE is the design: this
 * reads one membership's rows and compares them only with that child's own
 * past — the no-leaderboard rule holds here the way it holds everywhere.
 */
export async function journey(ctx: ActiveContext): Promise<Journey> {
  const { schoolId, membershipId, role } = requireScope(ctx);
  if (role !== "STUDENT") throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");

  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - 26 * WEEK);

  const [badges, totalTiers, recentTiers, totalAnswers, recent] = await Promise.all([
    db.earnedBadge.findMany({
      where: { schoolId, studentMembershipId: membershipId },
      orderBy: { earnedAt: "desc" },
      take: 60,
      select: { label: true, description: true, earnedAt: true, badgeId: true },
    }),
    db.earnedBadge.count({
      where: { schoolId, studentMembershipId: membershipId, badgeId: { contains: ":tier-" } },
    }),
    db.earnedBadge.findMany({
      // The monthly bars must not inherit the timeline's 60-row cap.
      where: {
        schoolId,
        studentMembershipId: membershipId,
        badgeId: { contains: ":tier-" },
        earnedAt: { gte: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000) },
      },
      select: { earnedAt: true },
    }),
    db.quizResponse.count({
      // Answers only (TA-600): a revealed solution's row has no choice.
      where: { attempt: { studentMembershipId: membershipId, schoolId }, chosenIndex: { not: null } },
    }),
    db.quizResponse.findMany({
      where: {
        attempt: { studentMembershipId: membershipId, schoolId },
        answeredAt: { gte: since },
      },
      select: { answeredAt: true },
    }),
  ]);

  // Weeks-in-a-row, counted in rolling 7-day steps back from today so the
  // streak never resets because of what the server calls Monday. Grace of one
  // step: a streak survives until a whole week has passed empty.
  const weeksAgo = new Set(recent.map((r) => Math.floor((Date.now() - r.answeredAt.getTime()) / WEEK)));
  let practiceWeeks = 0;
  let cursor = weeksAgo.has(0) ? 0 : 1;
  while (weeksAgo.has(cursor)) {
    practiceWeeks += 1;
    cursor += 1;
  }

  const isTier = (badgeId: string) => /:tier-[1-6]$/.test(badgeId);

  // The last six calendar months, oldest first, zero-filled so a quiet month
  // shows as quiet rather than vanishing.
  //
  // In India's calendar (TA-599): a badge earned at 00:30 IST on the 1st is that month's, not the one before, which
  // the UTC month made it. The instant is moved by India's offset and its UTC fields read as the local date, and the
  // six months are built from today's Indian month the same way.
  const monthly: { label: string; month: string; tiers: number }[] = [];
  const india = (d: Date) => new Date(d.getTime() + INDIA_OFFSET_MS);
  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
  const counts = new Map<string, number>();
  for (const badge of recentTiers) {
    const key = monthKey(india(badge.earnedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const now = india(new Date());
  for (let back = 5; back >= 0; back--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    monthly.push({
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(d),
      // YYYY-MM, so a reader in another language names the month itself (the door, A3-inventory-14).
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      tiers: counts.get(monthKey(d)) ?? 0,
    });
  }

  return {
    badges: badges.map((b) => ({
      label: b.label,
      description: b.description,
      earnedAt: b.earnedAt,
      isTier: isTier(b.badgeId),
    })),
    monthly,
    practiceWeeks,
    totalAnswers,
    totalTiers,
  };
}

/* -------------------------------------------------------------------------- */
/* The teacher's week, and where the class is stuck                            */
/* -------------------------------------------------------------------------- */

export type ClassWeekly = {
  pupilCount: number;
  practiced: number;
  answers: number;
  climbs: number;
  misses: number;
};

/** The heatmap's time-derivative: what moved in the last seven days. */
export async function classWeekly(ctx: ActiveContext, classId: string): Promise<ClassWeekly> {
  await assertClassAccess(requireScope(ctx), classId);
  const enrolled = await db.enrollment.findMany({
    where: { classId, schoolId: ctx.schoolId!, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  const pupilIds = enrolled.map((e) => e.studentMembershipId);
  if (pupilIds.length === 0) return { pupilCount: 0, practiced: 0, answers: 0, climbs: 0, misses: 0 };

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [responses, climbs] = await Promise.all([
    db.quizResponse.findMany({
      where: {
        attempt: { studentMembershipId: { in: pupilIds }, schoolId: ctx.schoolId! },
        answeredAt: { gte: since },
        chosenIndex: { not: null }, // answers, not reveals (TA-600)
      },
      select: { correct: true, attempt: { select: { studentMembershipId: true } } },
    }),
    db.earnedBadge.count({
      where: {
        schoolId: ctx.schoolId!,
        studentMembershipId: { in: pupilIds },
        badgeId: { contains: ":tier-" },
        earnedAt: { gte: since },
      },
    }),
  ]);

  const whoPracticed = new Set(responses.map((r) => r.attempt.studentMembershipId));
  return {
    pupilCount: pupilIds.length,
    practiced: whoPracticed.size,
    answers: responses.length,
    climbs,
    misses: responses.filter((r) => !r.correct).length,
  };
}

export type GapAlert = {
  slug: string;
  name: string;
  subject: string;
  /** The rung most of the trouble is on. */
  level: number;
  /** How many pupils are stuck there. A count, never a list of names. */
  stuckCount: number;
};

/**
 * Where the CLASS is stuck, as opposed to where one child is: chapters where
 * several pupils are missing more than they make at the same rung, over the
 * last fortnight. That pattern is not six individual problems — it is one
 * teaching problem, which is why it surfaces here and nowhere on any child's
 * own page. Counts only; the heatmap's no-names rule holds.
 *
 * "Stuck" is deliberately conservative: at least four recent answers at the
 * rung and at least half of them wrong. Two pupils stuck flags the chapter —
 * in a class of forty that is early, and early is the point.
 */
export async function classGapAlerts(
  ctx: ActiveContext,
  classId: string,
  language: QuizLanguage = "en",
): Promise<GapAlert[]> {
  await assertClassAccess(requireScope(ctx), classId);
  const enrolled = await db.enrollment.findMany({
    where: { classId, schoolId: ctx.schoolId!, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  const pupilIds = enrolled.map((e) => e.studentMembershipId);
  if (pupilIds.length === 0) return [];

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const responses = await db.quizResponse.findMany({
    where: {
      attempt: { studentMembershipId: { in: pupilIds }, schoolId: ctx.schoolId! },
      answeredAt: { gte: since },
    },
    select: {
      correct: true,
      attempt: { select: { studentMembershipId: true, topicId: true } },
      question: { select: { difficulty: true } },
    },
  });
  if (responses.length === 0) return [];

  // pupil × topic × rung -> [wrong, total]
  const tally = new Map<string, { wrong: number; total: number }>();
  for (const r of responses) {
    const key = `${r.attempt.studentMembershipId}|${r.attempt.topicId}|${clampLevel(r.question.difficulty)}`;
    const cell = tally.get(key) ?? { wrong: 0, total: 0 };
    cell.total += 1;
    if (!r.correct) cell.wrong += 1;
    tally.set(key, cell);
  }

  // topic -> rung -> stuck pupil count
  const stuck = new Map<string, Map<number, number>>();
  for (const [key, cell] of tally) {
    if (cell.total < 4 || cell.wrong * 2 < cell.total) continue;
    const [, topicId, levelRaw] = key.split("|") as [string, string, string];
    const level = Number(levelRaw);
    const byLevel = stuck.get(topicId) ?? new Map<number, number>();
    byLevel.set(level, (byLevel.get(level) ?? 0) + 1);
    stuck.set(topicId, byLevel);
  }

  const flagged: { topicId: string; level: number; stuckCount: number }[] = [];
  for (const [topicId, byLevel] of stuck) {
    let bestLevel = 0;
    let bestCount = 0;
    let total = 0;
    for (const [level, count] of byLevel) {
      total += count;
      if (count > bestCount) {
        bestCount = count;
        bestLevel = level;
      }
    }
    if (total >= 2) flagged.push({ topicId, level: bestLevel, stuckCount: total });
  }
  if (flagged.length === 0) return [];

  const topics = await db.quizTopic.findMany({
    where: { id: { in: flagged.map((f) => f.topicId) } },
    ...{ include: { translations: { where: { language } } } },
  });
  const topicById = new Map(topics.map((t) => [t.id, t]));

  return flagged
    .map((f) => {
      const topic = topicById.get(f.topicId);
      if (!topic) return null;
      const translated = topic.translations[0]?.name;
      return {
        slug: topic.slug,
        name: translated ?? topic.name,
        subject: topic.subject,
        level: f.level,
        stuckCount: f.stuckCount,
      };
    })
    .filter((f): f is GapAlert => f !== null)
    .sort((a, b) => b.stuckCount - a.stuckCount);
}
