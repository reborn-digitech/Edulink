import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { awardPermanentBadge } from "./academic-year";
import type { ActiveContext } from "./session";

/**
 * Practice — adaptive practice.
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

/* Keys, not words — looked up at render time in the reader's language. Each
   dictionary carries its own word for the rung ("Remember" / "याद रखो"). */
export const QUIZ_LEVELS = [
  {
    level: 1,
    key: "RECALL",
    labelKey: "practice.level1" as TranslationKey,
    descriptionKey: "practice.level1Hint" as TranslationKey,
  },
  {
    level: 2,
    key: "UNDERSTAND",
    labelKey: "practice.level2" as TranslationKey,
    descriptionKey: "practice.level2Hint" as TranslationKey,
  },
  {
    level: 3,
    key: "APPLY",
    labelKey: "practice.level3" as TranslationKey,
    descriptionKey: "practice.level3Hint" as TranslationKey,
  },
  {
    level: 4,
    key: "ANALYSE",
    labelKey: "practice.level4" as TranslationKey,
    descriptionKey: "practice.level4Hint" as TranslationKey,
  },
  {
    level: 5,
    key: "COMPETITIVE",
    labelKey: "practice.level5" as TranslationKey,
    descriptionKey: "practice.level5Hint" as TranslationKey,
  },
  {
    level: 6,
    key: "OLYMPIAD",
    labelKey: "practice.level6" as TranslationKey,
    descriptionKey: "practice.level6Hint" as TranslationKey,
  },
] as const;

export const MAX_LEVEL = 6;
export const MIN_LEVEL = 1;

/** Two in a row either way moves the level. Small on purpose — see below. */
export const PROMOTE_AFTER = 2;
const DEMOTE_AFTER = 2;

// The language a question is READ in is the same setting as the language the
// app is read in — one field on the user row, `prefs.locale`. This module used
// to own a three-entry list of its own; it now borrows the app's, which is what
// stops a Marathi app serving Hindi questions.
//
// Re-exported so every existing `from "@/lib/quiz"` keeps working. The aliases
// are deliberate: inside the quiz engine a locale is what a QUESTION is written
// in, and `language` reads better there than `locale`.
import { normaliseLocale, type Locale } from "./i18n/locales";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export {
  LOCALES as QUIZ_LANGUAGES,
  normaliseLocale as normaliseLanguage,
  type Locale as QuizLanguage,
} from "./i18n/locales";

/**
 * The subject SET is grade-dependent and NCERT-true — the codes here are the
 * union. G3–5 carry Maths and EVS; G6–8 add History, Geography and Civics and
 * trade EVS for Science; G9–10 add Economics; G11–12 split Science into
 * Physics, Chemistry and Biology (Civics reads as Political Science there).
 * Which subjects a child actually sees comes from the topics that exist at
 * their grade, never from this list — language subjects are deliberately
 * absent (grammar drills are a different product than a fact ladder).
 */
export const QUIZ_SUBJECTS = [
  "MATHS",
  "SCIENCE",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "EVS",
  "HISTORY",
  "GEOGRAPHY",
  "CIVICS",
  "ECONOMICS",
] as const;
export type QuizSubject = (typeof QUIZ_SUBJECTS)[number];

/**
 * Subject names are dictionary keys, not strings: "History" in English,
 * "इतिहास" under either Indic toggle. The old bilingual "Itihaas · History"
 * constants predated i18n and had pages splitting on " · " to un-mix them.
 */
export const SUBJECT_KEY: Record<QuizSubject, TranslationKey> = {
  MATHS: "subject.MATHS",
  SCIENCE: "subject.SCIENCE",
  PHYSICS: "subject.PHYSICS",
  CHEMISTRY: "subject.CHEMISTRY",
  BIOLOGY: "subject.BIOLOGY",
  EVS: "subject.EVS",
  HISTORY: "subject.HISTORY",
  GEOGRAPHY: "subject.GEOGRAPHY",
  CIVICS: "subject.CIVICS",
  ECONOMICS: "subject.ECONOMICS",
};

/**
 * Picks the translated string, or the original when there is no translation.
 *
 * FIELD BY FIELD, and that is the whole design. A topic may be translated while
 * one of its questions is not; a question's stem may be done and its solution
 * not. Requiring a complete translation before showing any of it would mean
 * Hindi ships on the day the last solution is written, which is to say never.
 */
function pick(translated: string | null | undefined, original: string): string {
  const value = (translated ?? "").trim();
  return value.length > 0 ? value : original;
}

/**
 * A translated choices array, but only if it is the SAME SHAPE as the original.
 *
 * `answerIndex` is stored once, on the question, and indexes the original
 * array. A translation with a different number of options — or one whose
 * options were reordered — would leave that index pointing at the wrong string,
 * and a child answering correctly in Marathi would be marked wrong. When the
 * lengths disagree the translation is DISCARDED rather than partially applied.
 */
function pickChoices(translatedRaw: string | null | undefined, original: string[]): string[] {
  if (!translatedRaw) return original;
  const translated = parseChoices(translatedRaw);
  if (translated.length !== original.length) return original;
  return translated.map((choice, i) => pick(choice, original[i]!));
}

/** The badge id a topic earns. Built from the slug, which never changes. */
export function topicBadgeId(slug: string): string {
  return `abhyaas:${slug}`;
}

/**
 * One badge per rung of a chapter's ladder, named like a ranking a child
 * would brag about. Index is level − 1: Beginner is proving L1, Master is
 * holding your own at Olympiad level.
 */
export const TIER_NAMES = ["Beginner", "Learner", "Amateur", "Expert", "Pro", "Master"] as const;

/** The badge id one PROVEN LEVEL of a topic earns. Level is part of the
 * identity, so climbing the ladder collects six distinct badges. */
export function topicTierBadgeId(slug: string, level: number): string {
  return `abhyaas:${slug}:tier-${clampLevel(level)}`;
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
  /** Ladder-tier badges earned in this chapter, 0–6 (Beginner … Master). */
  tierCount: number;
};

/** Topics for a class, with this child's progress against each. */
export async function listTopics(
  session: ActiveContext,
  opts: { subject?: string; classLevel?: number; language?: Locale } = {},
): Promise<TopicSummary[]> {
  const membershipId = session.membershipId;
  const schoolId = session.schoolId;
  const language = normaliseLocale(opts.language);

  const topics = await db.quizTopic.findMany({
    where: {
      // Retired topics stop listing everywhere at once; their mastery rows and
      // badges stay put. See the schema note on QuizTopic.retiredAt.
      retiredAt: null,
      ...(opts.subject ? { subject: opts.subject } : {}),
      ...(opts.classLevel ? { classLevel: opts.classLevel } : {}),
    },
    include: {
      // Nothing is fetched for English, so the default path costs exactly what
      // it did before translations existed.
      translations:
        language === "en"
          ? false
          : { where: { language }, select: { name: true, summary: true }, take: 1 },
    },
    orderBy: [{ subject: "asc" }, { classLevel: "asc" }, { position: "asc" }],
  });

  // Counts by GROUP BY, never by loading rows. This used to include every
  // question's id and difficulty per topic to add them up in JS — fine at 105
  // questions, and a million-row page load the day the generated bank landed.
  const grouped = await db.quizQuestion.groupBy({
    by: ["topicId", "difficulty"],
    where: { topicId: { in: topics.map((t) => t.id) } },
    _count: { _all: true },
  });
  const spreadByTopic = new Map<string, number[]>();
  for (const g of grouped) {
    const spread = spreadByTopic.get(g.topicId) ?? (new Array(MAX_LEVEL).fill(0) as number[]);
    spread[clampLevel(g.difficulty) - 1]! += g._count._all;
    spreadByTopic.set(g.topicId, spread);
  }

  const mastery =
    membershipId && schoolId
      ? await db.quizMastery.findMany({
          where: { schoolId, studentMembershipId: membershipId },
        })
      : [];
  const byTopic = new Map(mastery.map((m) => [m.topicId, m]));

  // "Completed" is a finished attempt — every question of the topic answered
  // in one sitting, the rule `finishIfComplete` applies. The seen-count on the
  // mastery row accumulates across sittings and was read against today's bank,
  // so a child who answered the same twelve questions twice looked finished
  // and one who had finished before the bank grew looked unfinished.
  const finished = new Set(
    membershipId && schoolId
      ? (
          await db.quizAttempt.findMany({
            where: { schoolId, studentMembershipId: membershipId, finishedAt: { not: null } },
            select: { topicId: true },
            distinct: ["topicId"],
          })
        ).map((a) => a.topicId)
      : [],
  );

  // Tier badges are stored rows, not derived state, so the card can show them
  // without recomputing anything. One query for the child's whole collection;
  // the badge id carries the slug and the tier, so parsing it is enough.
  const tierRows = membershipId
    ? await db.earnedBadge.findMany({
        where: { studentMembershipId: membershipId, permanent: true, badgeId: { contains: ":tier-" } },
        select: { badgeId: true },
      })
    : [];
  const tiersBySlug = new Map<string, number>();
  for (const row of tierRows) {
    const match = /^abhyaas:(.+):tier-[1-6]$/.exec(row.badgeId);
    if (!match) continue;
    tiersBySlug.set(match[1]!, (tiersBySlug.get(match[1]!) ?? 0) + 1);
  }

  return topics.map((topic) => {
    const mine = byTopic.get(topic.id);
    const spread = spreadByTopic.get(topic.id) ?? (new Array(MAX_LEVEL).fill(0) as number[]);
    const questionCount = spread.reduce((a, b) => a + b, 0);

    const t = "translations" in topic ? topic.translations?.[0] : undefined;

    return {
      id: topic.id,
      slug: topic.slug,
      name: pick(t?.name, topic.name),
      chapter: topic.chapter,
      subject: topic.subject,
      classLevel: topic.classLevel,
      summary: pick(t?.summary, topic.summary),
      questionCount,
      levelSpread: spread,
      level: mine?.level ?? MIN_LEVEL,
      seenCount: mine?.seenCount ?? 0,
      correctCount: mine?.correctCount ?? 0,
      completed: finished.has(topic.id),
      badgeEarned: mine?.cleanCompletionAt != null,
      tierCount: tiersBySlug.get(topic.slug) ?? 0,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Playing                                                                     */
/* -------------------------------------------------------------------------- */

function requireStudent(session: ActiveContext): { schoolId: string; membershipId: string } {
  if (session.role !== "STUDENT" || !session.schoolId || !session.membershipId) {
    throw new AccessError("access.onlyAPupilCanPractise");
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
  if (!topic) throw new AccessError("access.noSuchTopic", "NOT_FOUND");

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
  levelLabelKey: TranslationKey;
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
  language: Locale = "en",
): Promise<ServedQuestion | null> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true, topicId: true },
  });
  if (!attempt) throw new AccessError("access.attemptNotFound", "NOT_FOUND");

  const [seen, mastery, totalCount] = await Promise.all([
    db.quizResponse.findMany({ where: { attemptId }, select: { questionId: true } }),
    db.quizMastery.findUnique({
      where: { studentMembershipId_topicId: { studentMembershipId: membershipId, topicId: attempt.topicId } },
      select: { level: true },
    }),
    db.quizQuestion.count({ where: { topicId: attempt.topicId } }),
  ]);
  const seenIds = new Set(seen.map((s) => s.questionId));

  /**
   * `pickQuestion`, AS A QUERY. This used to load the topic's entire pool and
   * pick in JS — fine at a hundred questions, five thousand rows per served
   * question once the generated bank landed. The unit tests on `pickQuestion`
   * are the spec this must keep: nearest difficulty to the wanted level wins;
   * on a tie in distance the LOWER level wins (it came first in a pool sorted
   * difficulty-asc); within a level, id order decides; seen questions never
   * come back. The ladder below walks distances outward trying lower-first,
   * which is exactly that ordering.
   */
  const wanted = clampLevel(mastery?.level ?? MIN_LEVEL);
  const seenList = [...seenIds];
  // One GROUP BY finds the first unseen candidate (min id) AT EVERY level,
  // then the nearest level to the wanted one wins, lower level breaking ties —
  // which is pickQuestion's pool order (difficulty asc, id asc) exactly. Two
  // queries whether the topic holds twelve questions or ten thousand, and an
  // exhausted topic answers in one.
  const byLevel = await db.quizQuestion.groupBy({
    by: ["difficulty"],
    where: { topicId: attempt.topicId, id: { notIn: seenList } },
    _min: { id: true },
  });
  let bestId: string | null = null;
  let bestLevel = 0;
  for (const g of byLevel) {
    const level = clampLevel(g.difficulty);
    if (
      bestId === null ||
      Math.abs(level - wanted) < Math.abs(bestLevel - wanted) ||
      (Math.abs(level - wanted) === Math.abs(bestLevel - wanted) && level < bestLevel)
    ) {
      bestId = g._min.id;
      bestLevel = level;
    }
  }
  if (bestId === null) return null;
  const full = await db.quizQuestion.findUniqueOrThrow({
    where: { id: bestId },
    select: { id: true, difficulty: true, stem: true, choices: true },
  });

  // Fetched for the ONE question being served, not for the whole pool — the
  // pool query above is the hot path and runs on every question.
  //
  // The translation is looked up by question id and language only. It carries
  // no answerIndex and cannot carry one (see the schema), so a translated
  // question is incapable of disagreeing with the original about which option
  // is correct.
  const lang = normaliseLocale(language);
  const tr =
    lang === "en"
      ? null
      : await db.quizQuestionTranslation.findUnique({
          where: { questionId_language: { questionId: full.id, language: lang } },
          select: { stem: true, choices: true },
        });

  const original = parseChoices(full.choices);
  return {
    questionId: full.id,
    stem: pick(tr?.stem, full.stem),
    choices: pickChoices(tr?.choices, original),
    difficulty: full.difficulty,
    levelLabelKey: QUIZ_LEVELS[clampLevel(full.difficulty) - 1]!.labelKey,
    askedCount: seenIds.size,
    totalCount,
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
  language: Locale = "en",
): Promise<AnswerResult> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true, topicId: true, revealedAny: true, finishedAt: true },
  });
  if (!attempt) throw new AccessError("access.attemptNotFound", "NOT_FOUND");

  const question = await db.quizQuestion.findFirst({
    where: { id: questionId, topicId: attempt.topicId },
    select: { id: true, answerIndex: true, solution: true, difficulty: true, choices: true },
  });
  if (!question) throw new AccessError("access.questionNotFound", "NOT_FOUND");

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

    // TIER BADGES: one per rung of the chapter's ladder, earned the moment a
    // level is PROVEN and kept forever. Proving means the same thing on every
    // rung — two right in a row at that level. For L1–L5 that is exactly the
    // promotion; L6 has nowhere to promote to, so the same streak at the top
    // earns Master. A child who is later demoted keeps the badge (it says the
    // level WAS proven, not that it is still held), and re-proving a level is
    // an idempotent no-op, so the ladder can be climbed, fallen down, and
    // climbed again without ever duplicating a badge.
    const provedLevel =
      next.level > mastery.level
        ? mastery.level
        : next.level === MAX_LEVEL && next.streakRight >= PROMOTE_AFTER
          ? MAX_LEVEL
          : null;
    if (provedLevel !== null) {
      const topic = await db.quizTopic.findUniqueOrThrow({
        where: { id: attempt.topicId },
        select: { slug: true, name: true },
      });
      const created = await awardPermanentBadge(schoolId, membershipId, {
        badgeId: topicTierBadgeId(topic.slug, provedLevel),
        label: `${topic.name} · ${TIER_NAMES[provedLevel - 1]}`,
        description: `Answered ${PROMOTE_AFTER} in a row right at Level ${provedLevel} of ${topic.name}`,
      });
      if (created) {
        await audit({
          schoolId,
          actorUserId: null,
          action: "quiz.tierBadge",
          targetType: "QuizTopic",
          targetId: attempt.topicId,
          meta: { slug: topic.slug, membershipId, level: provedLevel },
        });
      }
    }
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

  // Marking is read in the language the child answered in. Fetched AFTER the
  // response is recorded, so a missing translation can never cost them a
  // recorded answer.
  const lang = normaliseLocale(language);
  const tr =
    lang === "en"
      ? null
      : await db.quizQuestionTranslation.findUnique({
          where: { questionId_language: { questionId: question.id, language: lang } },
          select: { solution: true },
        });

  return {
    correct,
    answerIndex: question.answerIndex,
    solution: pick(tr?.solution, question.solution),
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
  language: Locale = "en",
): Promise<{ solution: string; answerIndex: number; badgeForfeited: boolean }> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true, topicId: true, revealedAny: true },
  });
  if (!attempt) throw new AccessError("access.attemptNotFound", "NOT_FOUND");

  const question = await db.quizQuestion.findFirst({
    where: { id: questionId, topicId: attempt.topicId },
    select: { id: true, solution: true, answerIndex: true, difficulty: true },
  });
  if (!question) throw new AccessError("access.questionNotFound", "NOT_FOUND");

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

  const lang = normaliseLocale(language);
  const tr =
    lang === "en"
      ? null
      : await db.quizQuestionTranslation.findUnique({
          where: { questionId_language: { questionId: question.id, language: lang } },
          select: { solution: true },
        });

  return {
    solution: pick(tr?.solution, question.solution),
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

/**
 * `submitAnswer`, safe to call twice — the offline outbox's contract.
 *
 * `submitAnswer` itself moves streaks and mastery on every call, so a replayed
 * duplicate would climb the ladder twice on one tap. The guard is the response
 * row: (attemptId, questionId) is unique, so a row with a chosen answer means
 * this answer already counted, and the STORED verdict comes back untouched. A
 * row with chosenIndex null is a reveal, not an answer, and does not block.
 */
export async function submitAnswerIdempotent(
  session: ActiveContext,
  attemptId: string,
  questionId: string,
  chosenIndex: number,
  language: Locale = "en",
): Promise<{ replayed: boolean; result: AnswerResult }> {
  const { schoolId, membershipId } = requireStudent(session);

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, schoolId, studentMembershipId: membershipId },
    select: { id: true },
  });
  if (!attempt) throw new AccessError("access.attemptNotFound", "NOT_FOUND");

  const existing = await db.quizResponse.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
    select: {
      chosenIndex: true,
      correct: true,
      question: { select: { id: true, answerIndex: true, solution: true } },
    },
  });

  if (existing && existing.chosenIndex !== null) {
    // The first delivery may have been the answer that finished the topic and
    // won its badge; a phone that answered offline only ever sees the replay,
    // so the replay says what the first delivery said. finishIfComplete
    // awards the badge exactly when it closes the attempt on its last answer
    // with nothing revealed — so: the attempt is closed, this was its latest
    // answer, and nothing was revealed.
    const [closed, latest] = await Promise.all([
      db.quizAttempt.findUniqueOrThrow({ where: { id: attemptId }, select: { finishedAt: true, revealedAny: true } }),
      db.quizResponse.findFirst({ where: { attemptId }, orderBy: { answeredAt: "desc" }, select: { questionId: true } }),
    ]);
    const finishedHere = closed.finishedAt !== null && latest?.questionId === questionId;
    const lang = normaliseLocale(language);
    const translation =
      lang === "en"
        ? null
        : await db.quizQuestionTranslation.findUnique({
            where: { questionId_language: { questionId: existing.question.id, language: lang } },
            select: { solution: true },
          });
    return {
      replayed: true,
      result: {
        correct: existing.correct,
        answerIndex: existing.question.answerIndex,
        solution: translation?.solution ?? existing.question.solution ?? "",
        newLevel: 0,
        finished: finishedHere,
        badgeAwarded: finishedHere && !closed.revealedAny,
      },
    };
  }

  return { replayed: false, result: await submitAnswer(session, attemptId, questionId, chosenIndex, language) };
}
