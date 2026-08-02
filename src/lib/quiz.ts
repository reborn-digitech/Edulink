import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { awardPermanentBadge } from "./academic-year";
import type { ActiveContext } from "./session";

/**
 * Abhyaas — adaptive practice.
 *
 * THE LADDER IS THE FEATURE. Six levels, from "name the theorem" to Olympiad,
 * and a child is served the level they are actually at rather than the level
 * their class is at. A bank that opens on Olympiad questions teaches a
 * nine-year-old that they are bad at maths; one that never leaves level 1
 * teaches the strongest child that practice is a waste of an afternoon.
 *
 * WHAT MAKES IT ADAPTIVE IS ONE ROW. `QuizMastery` holds a level per child per
 * topic and survives between sittings — two right moves up, two wrong moves
 * down. Everything else here is presentation. Recomputing the level from
 * history on every question was the obvious alternative and is worse: it makes
 * the level depend on questions asked months ago, so a child who has genuinely
 * improved is held down by a bad Tuesday in March.
 *
 * THE BADGE, AND WHY REVEALING COSTS IT. Finishing a topic without opening a
 * single solution earns a permanent badge — permanent in the strict sense used
 * by `academic-year.ts`: no academic year, never recalculated, never archived,
 * never taken away. It records something a child did once. The gate is a flag
 * set the moment a solution is revealed, on the ATTEMPT, and never unset. It is
 * deliberately not derived from the response rows at the end, because a row can
 * be deleted and a flag that has already been set cannot be argued with.
 *
 * Revealing is still the right thing to offer. A child stuck on a question with
 * no way forward stops practising; a child who reads the working learns
 * something and forfeits a badge. That is the correct trade, and it is worth
 * being explicit that the badge is the smaller half of it.
 */

/* -------------------------------------------------------------------------- */
/* The ladder                                                                  */
/* -------------------------------------------------------------------------- */

export const QUIZ_LEVELS = [
  {
    level: 1,
    key: "RECALL",
    label: "Yaad rakho · Remember",
    description: "Name the formula, the theorem, the discoverer.",
  },
  {
    level: 2,
    key: "UNDERSTAND",
    label: "Samjho · Understand",
    description: "State what it means and when it applies.",
  },
  {
    level: 3,
    key: "APPLY",
    label: "Lagao · Apply",
    description: "One step. Put the numbers in.",
  },
  {
    level: 4,
    key: "ANALYSE",
    label: "Socho · Work it out",
    description: "Several steps, the way an exam asks.",
  },
  {
    level: 5,
    key: "COMPETITIVE",
    label: "Muqabla · Competitive",
    description: "NTSE, NSO, NSEJS — the scholarship papers.",
  },
  {
    level: 6,
    key: "OLYMPIAD",
    label: "Olympiad",
    description: "National and international Olympiad standard.",
  },
] as const;

export const MAX_LEVEL = 6;
export const MIN_LEVEL = 1;

/** Two in a row either way moves the level. Small on purpose — see below. */
const PROMOTE_AFTER = 2;
const DEMOTE_AFTER = 2;

export const QUIZ_SUBJECTS = [
  "MATHS",
  "SCIENCE",
  "HISTORY",
  "GEOGRAPHY",
  "CIVICS",
  "ECONOMICS",
] as const;
export type QuizSubject = (typeof QUIZ_SUBJECTS)[number];

export const SUBJECT_LABEL: Record<QuizSubject, string> = {
  MATHS: "Ganit · Maths",
  SCIENCE: "Vigyan · Science",
  HISTORY: "Itihaas · History",
  GEOGRAPHY: "Bhugol · Geography",
  CIVICS: "Nagrik Shastra · Civics",
  ECONOMICS: "Arthashastra · Economics",
};

/** The badge id a topic earns. Built from the slug, which never changes. */
export function topicBadgeId(slug: string): string {
  return `abhyaas:${slug}`;
}

/* -------------------------------------------------------------------------- */
/* The adaptive step — pure, so it can be tested without a database            */
/* -------------------------------------------------------------------------- */

export type MasteryState = {
  level: number;
  streakRight: number;
  streakWrong: number;
};

/**
 * Where the next question comes from, given what just happened.
 *
 * TWO IN A ROW, NOT THREE, and not one. One is noise — a lucky guess on a
 * four-option question happens a quarter of the time, and promoting on it sends
 * a child who guessed straight to a harder question they will also guess at.
 * Three is too slow to feel responsive inside a single sitting of ten or fifteen
 * questions, which is what a child actually plays.
 *
 * The streaks RESET on a level change, both of them. Carrying the losing streak
 * across a demotion means the level below inherits a deficit it did not earn,
 * and a child who drops to level 2 and gets one wrong would fall to level 1 on
 * what is really their first mistake there.
 */
export function nextMastery(current: MasteryState, correct: boolean): MasteryState {
  const level = clampLevel(current.level);

  if (correct) {
    const streakRight = current.streakRight + 1;
    if (streakRight >= PROMOTE_AFTER && level < MAX_LEVEL) {
      return { level: level + 1, streakRight: 0, streakWrong: 0 };
    }
    // A right answer clears the losing streak even without a promotion: two
    // wrong THEN one right is not "nearly demoted", it is recovering.
    return { level, streakRight, streakWrong: 0 };
  }

  const streakWrong = current.streakWrong + 1;
  if (streakWrong >= DEMOTE_AFTER && level > MIN_LEVEL) {
    return { level: level - 1, streakRight: 0, streakWrong: 0 };
  }
  return { level, streakRight: 0, streakWrong };
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.trunc(level)));
}

/**
 * Which question to serve, given the level wanted and what has been seen.
 *
 * FALLS OUTWARD, NEAREST FIRST. A topic will not have questions at every level —
 * authoring an Olympiad question for "Parts of a Plant" is not a sensible use of
 * anybody's time — so asking for level 5 in a topic that stops at 3 must serve a
 * level 3 question rather than nothing. Nothing is the failure that makes a
 * topic look broken to a child.
 *
 * Unseen questions win outright over seen ones at a better level: re-asking a
 * question a child answered ten minutes ago is worse practice than a slightly
 * mis-levelled new one.
 */
export function pickQuestion<T extends { id: string; difficulty: number }>(
  pool: T[],
  wantedLevel: number,
  seenIds: Set<string>,
): T | null {
  const unseen = pool.filter((q) => !seenIds.has(q.id));
  if (unseen.length === 0) return null;

  const wanted = clampLevel(wantedLevel);
  let best: T | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const question of unseen) {
    const distance = Math.abs(question.difficulty - wanted);
    // Strict >: the first question at the best distance wins, so the order the
    // pool arrives in decides ties. The caller sorts, which makes this
    // deterministic — a random tiebreak here would make a run unreplayable.
    if (distance < bestDistance) {
      best = question;
      bestDistance = distance;
    }
  }
  return best;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export type TopicSummary = {
  id: string;
  slug: string;
  name: string;
  chapter: string;
  subject: string;
  classLevel: number;
  summary: string;
  questionCount: number;
  levelSpread: number[];
  level: number;
  seenCount: number;
  correctCount: number;
  completed: boolean;
  badgeEarned: boolean;
};

/** Topics for a class, with this child's progress against each. */
export async function listTopics(
  session: ActiveContext,
  opts: { subject?: string; classLevel?: number } = {},
): Promise<TopicSummary[]> {
  const membershipId = session.membershipId;
  const schoolId = session.schoolId;

  const topics = await db.quizTopic.findMany({
    where: {
      ...(opts.subject ? { subject: opts.subject } : {}),
      ...(opts.classLevel ? { classLevel: opts.classLevel } : {}),
    },
    include: { questions: { select: { id: true, difficulty: true } } },
    orderBy: [{ subject: "asc" }, { classLevel: "asc" }, { position: "asc" }],
  });

  const mastery =
    membershipId && schoolId
      ? await db.quizMastery.findMany({
          where: { schoolId, studentMembershipId: membershipId },
        })
      : [];
  const byTopic = new Map(mastery.map((m) => [m.topicId, m]));

  return topics.map((topic) => {
    const mine = byTopic.get(topic.id);
    const spread = new Array(MAX_LEVEL).fill(0) as number[];
    for (const q of topic.questions) {
      const index = clampLevel(q.difficulty) - 1;
      spread[index] = (spread[index] ?? 0) + 1;
    }

    return {
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      chapter: topic.chapter,
      subject: topic.subject,
      classLevel: topic.classLevel,
      summary: topic.summary,
      questionCount: topic.questions.length,
      levelSpread: spread,
      level: mine?.level ?? MIN_LEVEL,
      seenCount: mine?.seenCount ?? 0,
      correctCount: mine?.correctCount ?? 0,
      completed: (mine?.seenCount ?? 0) >= topic.questions.length && topic.questions.length > 0,
      badgeEarned: mine?.cleanCompletionAt != null,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Playing                                                                     */
/* -------------------------------------------------------------------------- */

function requireStudent(session: ActiveContext): { schoolId: string; membershipId: string } {
  if (session.role !== "STUDENT" || !session.schoolId || !session.membershipId) {
    throw new AccessError("Only a pupil can practise");
  }
  return { schoolId: session.schoolId, membershipId: session.membershipId };
}

/** Starts a sitting, or returns the one already open. */
export async function startAttempt(
  session: ActiveContext,
  topicSlug: string,
): Promise<{ attemptId: string; topicId: string }> {
  const { schoolId, membershipId } = requireStudent(session);

  const topic = await db.quizTopic.findUnique({ where: { slug: topicSlug }, select: { id: true } });
  if (!topic) throw new AccessError("No such topic", "NOT_FOUND");

  // Resuming rather than starting afresh matters for the badge: a child who
  // closes the tab and comes back has not started a clean run, they are in the
  // middle of one, and a new attempt would quietly forgive a revealed solution.
  const open = await db.quizAttempt.findFirst({
    where: { schoolId, studentMembershipId: membershipId, topicId: topic.id, finishedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  if (open) return { attemptId: open.id, topicId: topic.id };

  const attempt = await db.quizAttempt.create({
    data: { schoolId, studentMembershipId: membershipId, topicId: topic.id },
    select: { id: true },
  });
  return { attemptId: attempt.id, topicId: topic.id };
}

export type ServedQuestion = {
  questionId: string;
  stem: string;
  choices: string[];
  difficulty: number;
  levelLabel: string;
  askedCount: number;
  totalCount: number;
};

/**
 * The next question in an attempt, or null when the topic is finished.
 *
 * NEVER RETURNS THE ANSWER. `answerIndex` and `solution` are not selected at
 * all, rather than selected and dropped later — a field that is not in the query
 * cannot be leaked by a future refactor that spreads the row into a response.
 */
export async function nextQuestion(
  session: ActiveContext,
  attemptId: string,
): Promise<ServedQuestion | null> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true, topicId: true },
  });
  if (!attempt) throw new AccessError("Attempt not found", "NOT_FOUND");

  const [pool, seen, mastery] = await Promise.all([
    db.quizQuestion.findMany({
      where: { topicId: attempt.topicId },
      select: { id: true, difficulty: true, stem: true, choices: true },
      orderBy: [{ difficulty: "asc" }, { id: "asc" }],
    }),
    db.quizResponse.findMany({ where: { attemptId }, select: { questionId: true } }),
    db.quizMastery.findUnique({
      where: { studentMembershipId_topicId: { studentMembershipId: membershipId, topicId: attempt.topicId } },
      select: { level: true },
    }),
  ]);

  const seenIds = new Set(seen.map((s) => s.questionId));
  const picked = pickQuestion(pool, mastery?.level ?? MIN_LEVEL, seenIds);
  if (!picked) return null;

  const full = pool.find((q) => q.id === picked.id)!;
  return {
    questionId: full.id,
    stem: full.stem,
    choices: parseChoices(full.choices),
    difficulty: full.difficulty,
    levelLabel: QUIZ_LEVELS[clampLevel(full.difficulty) - 1]!.label,
    askedCount: seenIds.size,
    totalCount: pool.length,
  };
}

export type AnswerResult = {
  correct: boolean;
  answerIndex: number;
  solution: string;
  newLevel: number;
  finished: boolean;
  badgeAwarded: boolean;
};

/**
 * Records an answer, moves the level, and finishes the topic if that was the
 * last question.
 *
 * The solution comes back WITH the result, always. A child who has answered has
 * earned the right to see why, and withholding it until they ask would make
 * "reveal" — which costs the badge — the only way to learn from a mistake.
 * Revealing BEFORE answering is the thing that costs; reading afterwards is
 * just marking.
 */
export async function submitAnswer(
  session: ActiveContext,
  attemptId: string,
  questionId: string,
  chosenIndex: number,
): Promise<AnswerResult> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true, topicId: true, revealedAny: true, finishedAt: true },
  });
  if (!attempt) throw new AccessError("Attempt not found", "NOT_FOUND");

  const question = await db.quizQuestion.findFirst({
    where: { id: questionId, topicId: attempt.topicId },
    select: { id: true, answerIndex: true, solution: true, difficulty: true, choices: true },
  });
  if (!question) throw new AccessError("Question not found", "NOT_FOUND");

  const choices = parseChoices(question.choices);
  // A forged index must not be stored as an answer to something. Out of range is
  // recorded as wrong rather than rejected, so a broken client cannot be used to
  // skip a question it would have got wrong.
  const inRange = Number.isInteger(chosenIndex) && chosenIndex >= 0 && chosenIndex < choices.length;
  const correct = inRange && chosenIndex === question.answerIndex;

  const existing = await db.quizResponse.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
    select: { id: true, correct: true, revealedSolution: true },
  });

  const mastery = await getOrCreateMastery(schoolId, membershipId, attempt.topicId);

  // Only a FIRST answer moves the level. Without this an answer resubmitted by a
  // double-tap or a retried request promotes a child twice for one question.
  let level = mastery.level;
  if (!existing) {
    const next = nextMastery(
      { level: mastery.level, streakRight: mastery.streakRight, streakWrong: mastery.streakWrong },
      correct,
    );
    level = next.level;
    await db.quizMastery.update({
      where: { id: mastery.id },
      data: {
        level: next.level,
        streakRight: next.streakRight,
        streakWrong: next.streakWrong,
        seenCount: { increment: 1 },
        correctCount: correct ? { increment: 1 } : undefined,
      },
    });
  }

  await db.quizResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: {
      schoolId,
      attemptId,
      questionId,
      chosenIndex: inRange ? chosenIndex : null,
      correct,
      servedDifficulty: question.difficulty,
      revealedSolution: false,
    },
    update: { chosenIndex: inRange ? chosenIndex : null, correct },
  });

  const finish = await finishIfComplete(schoolId, membershipId, attempt.id, attempt.topicId);

  return {
    correct,
    answerIndex: question.answerIndex,
    solution: question.solution,
    newLevel: level,
    finished: finish.finished,
    badgeAwarded: finish.badgeAwarded,
  };
}

/**
 * Shows the working, and forfeits the topic badge for this attempt.
 *
 * The flag goes on the ATTEMPT, not on the response, and is never unset. Two
 * reasons. A response row can be replaced by a later answer to the same
 * question, which would erase the evidence; and "did this child look anything
 * up" is a fact about the sitting, not about one question.
 */
export async function revealSolution(
  session: ActiveContext,
  attemptId: string,
  questionId: string,
): Promise<{ solution: string; answerIndex: number; badgeForfeited: boolean }> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true, topicId: true, revealedAny: true },
  });
  if (!attempt) throw new AccessError("Attempt not found", "NOT_FOUND");

  const question = await db.quizQuestion.findFirst({
    where: { id: questionId, topicId: attempt.topicId },
    select: { id: true, solution: true, answerIndex: true, difficulty: true },
  });
  if (!question) throw new AccessError("Question not found", "NOT_FOUND");

  await db.quizAttempt.update({ where: { id: attempt.id }, data: { revealedAny: true } });

  await db.quizResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: {
      schoolId,
      attemptId,
      questionId,
      chosenIndex: null,
      correct: false,
      revealedSolution: true,
      servedDifficulty: question.difficulty,
    },
    update: { revealedSolution: true },
  });

  return {
    solution: question.solution,
    answerIndex: question.answerIndex,
    badgeForfeited: !attempt.revealedAny,
  };
}

/* -------------------------------------------------------------------------- */
/* Finishing                                                                   */
/* -------------------------------------------------------------------------- */

async function getOrCreateMastery(schoolId: string, membershipId: string, topicId: string) {
  const existing = await db.quizMastery.findUnique({
    where: { studentMembershipId_topicId: { studentMembershipId: membershipId, topicId } },
  });
  if (existing) return existing;

  return db.quizMastery.create({
    data: { schoolId, studentMembershipId: membershipId, topicId, level: MIN_LEVEL },
  });
}

/**
 * Closes the attempt once every question in the topic has been seen, and awards
 * the badge if nothing was revealed.
 *
 * "Every question", not "enough questions". The badge says a child finished the
 * topic; a threshold would make it say they finished most of it, which is a
 * different and much smaller claim.
 */
async function finishIfComplete(
  schoolId: string,
  membershipId: string,
  attemptId: string,
  topicId: string,
): Promise<{ finished: boolean; badgeAwarded: boolean }> {
  const [total, answered, attempt, topic] = await Promise.all([
    db.quizQuestion.count({ where: { topicId } }),
    db.quizResponse.count({ where: { attemptId } }),
    db.quizAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: { revealedAny: true, finishedAt: true },
    }),
    db.quizTopic.findUniqueOrThrow({ where: { id: topicId }, select: { slug: true, name: true } }),
  ]);

  if (total === 0 || answered < total) return { finished: false, badgeAwarded: false };
  if (attempt.finishedAt) return { finished: true, badgeAwarded: false };

  await db.quizAttempt.update({ where: { id: attemptId }, data: { finishedAt: new Date() } });

  if (attempt.revealedAny) return { finished: true, badgeAwarded: false };

  await db.quizMastery.updateMany({
    where: { studentMembershipId: membershipId, topicId },
    data: { cleanCompletionAt: new Date() },
  });

  await awardPermanentBadge(schoolId, membershipId, {
    badgeId: topicBadgeId(topic.slug),
    label: topic.name,
    description: "Finished every question without looking at a single solution",
  });

  await audit({
    schoolId,
    actorUserId: null,
    action: "quiz.badge",
    targetType: "QuizTopic",
    targetId: topicId,
    meta: { slug: topic.slug, membershipId },
  });

  return { finished: true, badgeAwarded: true };
}

/* -------------------------------------------------------------------------- */

/**
 * Choices are stored as a JSON string, per the SQLite-portability rule.
 *
 * Malformed JSON returns an empty list rather than throwing: a single bad row
 * imported by hand should make one question unanswerable, not take the whole
 * practice page down with a 500.
 */
export function parseChoices(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === "string");
  } catch {
    return [];
  }
}
