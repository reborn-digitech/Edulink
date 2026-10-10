import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  MAX_LEVEL,
  MIN_LEVEL,
  clampLevel,
  listTopics,
  nextMastery,
  nextQuestion,
  parseChoices,
  pickQuestion,
  revealSolution,
  startAttempt,
  submitAnswer,
  topicBadgeId,
} from "@/lib/quiz";
import type { ActiveContext } from "@/lib/session";

/**
 * Practice.
 *
 * Three things are being checked, and the third is the one that matters most.
 *
 * The LADDER is pure arithmetic on a mastery row, so it is tested without a
 * database: two right up, two wrong down, streaks reset on a move, and the ends
 * of the range hold.
 *
 * The SELECTION falls outward to the nearest available level, because a topic
 * will not have questions at all six and asking for one that does not exist must
 * not return nothing — nothing is what makes a topic look broken to a child.
 *
 * The BADGE GATE is the one worth being strict about. Finishing a topic without
 * opening a single solution earns a permanent badge. Revealing one — even one,
 * even without answering, even in a sitting resumed days later — forfeits it for
 * that run. Every path that could quietly forgive a reveal is tested here,
 * because a badge that can be got by peeking is not a badge.
 *
 * Tenant isolation is checked at the QUERY level as everywhere in this suite —
 * it runs as the database owner, so the policies are not in play.
 * `npm run rls:verify` covers those.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      email: `${over.userId}@example.test`,
      name: over.userId,
      preferredName: null,
      avatarKey: null,
    },
  } as ActiveContext;
}

/* -------------------------------------------------------------------------- */
/* Pure — the ladder                                                           */
/* -------------------------------------------------------------------------- */

const at = (level: number, right = 0, wrong = 0) => ({
  level,
  streakRight: right,
  streakWrong: wrong,
});

describe("the ladder", () => {
  it("does not promote on a single right answer", () => {
    // A four-option guess is right a quarter of the time. Promoting on one
    // sends a child who guessed to a harder question they will also guess at.
    expect(nextMastery(at(2), true)).toEqual(at(2, 1, 0));
  });

  it("promotes on the second right answer in a row", () => {
    expect(nextMastery(at(2, 1, 0), true).level).toBe(3);
  });

  it("does not demote on a single wrong answer", () => {
    expect(nextMastery(at(3), false)).toEqual(at(3, 0, 1));
  });

  it("demotes on the second wrong answer in a row", () => {
    expect(nextMastery(at(3, 0, 1), false).level).toBe(2);
  });

  it("resets both streaks when the level moves up", () => {
    const next = nextMastery(at(2, 1, 0), true);
    expect(next).toEqual(at(3, 0, 0));
  });

  /**
   * Carrying the losing streak across a demotion would mean the level below
   * inherits a deficit it did not earn — one mistake there would drop the child
   * again, on what is really their first attempt at that level.
   */
  it("resets both streaks when the level moves down", () => {
    expect(nextMastery(at(4, 0, 1), false)).toEqual(at(3, 0, 0));
  });

  it("clears a losing streak on a right answer without promoting", () => {
    // Wrong, wrong would have demoted. Wrong, right is recovering, not "nearly
    // demoted" — the next wrong answer must start a fresh count.
    expect(nextMastery(at(3, 0, 1), true)).toEqual(at(3, 1, 0));
  });

  it("clears a winning streak on a wrong answer", () => {
    expect(nextMastery(at(3, 1, 0), false)).toEqual(at(3, 0, 1));
  });

  it("cannot climb above the top level", () => {
    expect(nextMastery(at(MAX_LEVEL, 1, 0), true).level).toBe(MAX_LEVEL);
  });

  it("keeps counting right answers at the top rather than stalling", () => {
    // Not a no-op: the streak still advances, so the row stays honest about a
    // child answering Olympiad questions correctly for the tenth time.
    expect(nextMastery(at(MAX_LEVEL, 1, 0), true).streakRight).toBe(2);
  });

  it("cannot fall below the bottom level", () => {
    expect(nextMastery(at(MIN_LEVEL, 0, 1), false).level).toBe(MIN_LEVEL);
  });

  it("clamps a level that somehow arrived out of range", () => {
    expect(clampLevel(0)).toBe(MIN_LEVEL);
    expect(clampLevel(99)).toBe(MAX_LEVEL);
    expect(clampLevel(Number.NaN)).toBe(MIN_LEVEL);
    expect(clampLevel(3.7)).toBe(3);
  });

  it("climbs from the bottom to the top in ten right answers", () => {
    let state = at(MIN_LEVEL);
    for (let i = 0; i < 10; i++) state = nextMastery(state, true);
    expect(state.level).toBe(MAX_LEVEL);
  });
});

/* -------------------------------------------------------------------------- */
/* Pure — which question gets served                                           */
/* -------------------------------------------------------------------------- */

describe("choosing the next question", () => {
  const pool = [
    { id: "a", difficulty: 1 },
    { id: "b", difficulty: 3 },
    { id: "c", difficulty: 6 },
  ];

  it("serves the exact level when it exists", () => {
    expect(pickQuestion(pool, 3, new Set())?.id).toBe("b");
  });

  /** A topic with no Olympiad question must not become unplayable at level 6. */
  it("falls to the nearest level below when the level asked for is missing", () => {
    expect(pickQuestion([pool[0]!, pool[1]!], 6, new Set())?.id).toBe("b");
  });

  it("falls upward when the nearest available level is higher", () => {
    expect(pickQuestion([pool[1]!, pool[2]!], 1, new Set())?.id).toBe("b");
  });

  it("never serves a question already seen in this attempt", () => {
    expect(pickQuestion(pool, 3, new Set(["b"]))?.id).not.toBe("b");
  });

  /**
   * An unseen question at the wrong level beats a seen one at the right level.
   * Re-asking something answered ten minutes ago is worse practice than a
   * slightly mis-levelled new question.
   */
  it("prefers an unseen question over a seen one at the perfect level", () => {
    const picked = pickQuestion(pool, 3, new Set(["b"]));
    expect(picked).not.toBeNull();
    expect(["a", "c"]).toContain(picked!.id);
  });

  it("returns null once every question has been seen", () => {
    expect(pickQuestion(pool, 3, new Set(["a", "b", "c"]))).toBeNull();
  });

  it("returns null for an empty topic rather than throwing", () => {
    expect(pickQuestion([], 3, new Set())).toBeNull();
  });

  it("is deterministic — the same pool and level always give the same question", () => {
    const first = pickQuestion(pool, 4, new Set())?.id;
    const second = pickQuestion(pool, 4, new Set())?.id;
    expect(first).toBe(second);
  });
});

describe("choices", () => {
  it("parses a stored JSON array", () => {
    expect(parseChoices('["a","b"]')).toEqual(["a", "b"]);
  });

  /** One bad row must break one question, not the whole practice page. */
  it("returns nothing for malformed JSON rather than throwing", () => {
    expect(parseChoices("{not json")).toEqual([]);
  });

  it("drops non-string members rather than serving them", () => {
    expect(parseChoices('["a",7,null,"b"]')).toEqual(["a", "b"]);
  });

  it("returns nothing for JSON that is not an array", () => {
    expect(parseChoices('{"a":1}')).toEqual([]);
  });
});

describe("badge ids", () => {
  it("is built from the slug, which never changes", () => {
    expect(topicBadgeId("maths-8-linear-equations")).toBe("abhyaas:maths-8-linear-equations");
  });
});

/* -------------------------------------------------------------------------- */
/* Against the database — playing, revealing, earning                          */
/* -------------------------------------------------------------------------- */

let schoolId = "";
let otherSchoolId = "";
/** Users this file creates, removed in `afterAll` — see the note in `mk`. */
const madeUserIds: string[] = [];
let topicId = "";
let student: ActiveContext;
let otherStudent: ActiveContext;
let teacher: ActiveContext;
const questionIds: string[] = [];

const SLUG = "test-topic-abhyaas";

beforeAll(async () => {
  const stamp = Date.now();
  // ZZ schools and @demo.relay.test people only (CLAUDE.md; integration, 11 Oct 2026: these were "Quiz Test School"
  // and @example.test addresses, outside the prefix every test and script may create and destroy).
  const school = await db.school.create({
    data: {
      name: "ZZ Quiz Test School",
      slug: `zz-quiz-a-${stamp}`,
      code: `QUIZA${stamp % 100000}`,
      contactEmail: "zz-quiz-a@demo.relay.test",
      timezone: "Asia/Kolkata",
    },
  });
  const other = await db.school.create({
    data: {
      name: "ZZ Quiz Other School",
      slug: `zz-quiz-b-${stamp}`,
      code: `QUIZB${stamp % 100000}`,
      contactEmail: "zz-quiz-b@demo.relay.test",
      timezone: "Asia/Kolkata",
    },
  });
  schoolId = school.id;
  otherSchoolId = other.id;

  const mk = async (email: string, sid: string, role: "STUDENT" | "TEACHER") => {
    const user = await db.user.create({
      data: { email, name: email, passwordHash: "x" },
    });
    // Remembered so `afterAll` can remove them. Deleting the school cascades
    // the membership and leaves the USER behind — a User carries no schoolId,
    // so nothing cascades it. Three per run, every run, until now.
    madeUserIds.push(user.id);
    const membership = await db.membership.create({
      data: { userId: user.id, schoolId: sid, role, status: "ACTIVE" },
    });
    return ctx({ userId: user.id, schoolId: sid, role, membershipId: membership.id });
  };

  student = await mk(`zz-quiz-student-${stamp}@demo.relay.test`, schoolId, "STUDENT");
  otherStudent = await mk(`zz-quiz-other-${stamp}@demo.relay.test`, otherSchoolId, "STUDENT");
  teacher = await mk(`zz-quiz-teacher-${stamp}@demo.relay.test`, schoolId, "TEACHER");

  const topic = await db.quizTopic.create({
    data: {
      subject: "MATHS",
      classLevel: 8,
      chapter: "Test chapter",
      name: "Test topic",
      slug: SLUG,
      position: 1,
    },
  });
  topicId = topic.id;

  // Three questions, one each at levels 1, 2 and 3 — enough to finish a topic
  // in a test, and enough for the ladder to move.
  for (const difficulty of [1, 2, 3]) {
    const q = await db.quizQuestion.create({
      data: {
        topicId,
        difficulty,
        stem: `Question at level ${difficulty}?`,
        choices: JSON.stringify(["right", "wrong", "also wrong"]),
        answerIndex: 0,
        solution: "The worked solution, which is long enough to be a real one.",
        source: "test",
        licence: "test",
      },
      select: { id: true },
    });
    questionIds.push(q.id);
  }
});

beforeEach(async () => {
  await db.quizResponse.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.quizAttempt.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.quizMastery.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.earnedBadge.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
});

afterAll(async () => {
  await db.quizResponse.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.quizAttempt.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.quizMastery.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.earnedBadge.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.quizTopic.deleteMany({ where: { slug: SLUG } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { id: { in: madeUserIds } } });
  await db.$disconnect();
});

/** Answers every question in the topic. `reveal` peeks at the first one. */
async function playThrough(who: ActiveContext, opts: { correct: boolean; reveal?: boolean }) {
  const { attemptId } = await startAttempt(who, SLUG);
  let last: Awaited<ReturnType<typeof submitAnswer>> | null = null;

  for (let i = 0; i < questionIds.length; i++) {
    const served = await nextQuestion(who, attemptId);
    if (!served) break;
    if (opts.reveal && i === 0) {
      await revealSolution(who, attemptId, served.questionId);
    }
    last = await submitAnswer(who, attemptId, served.questionId, opts.correct ? 0 : 1);
  }
  return { attemptId, last };
}

describe("who may practise", () => {
  it("refuses a teacher", async () => {
    await expect(startAttempt(teacher, SLUG)).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses a topic that does not exist", async () => {
    await expect(startAttempt(student, "no-such-topic")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses another school's pupil access to this pupil's attempt", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    await expect(nextQuestion(otherStudent, attemptId)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("serving questions", () => {
  it("starts a new pupil at the bottom of the ladder", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    expect(served?.difficulty).toBe(1);
  });

  /**
   * The answer is not merely hidden from the response — it is never selected.
   * A field absent from the query cannot be leaked by a later refactor that
   * spreads the row.
   */
  it("never includes the answer or the solution in a served question", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    expect(served).not.toHaveProperty("answerIndex");
    expect(served).not.toHaveProperty("solution");
    expect(JSON.stringify(served)).not.toContain("worked solution");
  });

  it("resumes the open attempt instead of starting a second one", async () => {
    const first = await startAttempt(student, SLUG);
    const second = await startAttempt(student, SLUG);
    expect(second.attemptId).toBe(first.attemptId);
  });

  it("returns null once the topic is exhausted", async () => {
    const { attemptId } = await playThrough(student, { correct: true });
    expect(await nextQuestion(student, attemptId)).toBeNull();
  });

  it("⚠ 'completed' means a finished sitting: seeing as many questions as the bank holds across two half-sittings is not it", async () => {
    const topicFor = async () => (await listTopics(student)).find((t) => t.slug === SLUG)!;
    expect((await topicFor()).completed).toBe(false);

    // Half the bank answered, the answers lost (a response row can go; the
    // mastery row's seen-count cannot come back down), and half answered
    // again: the seen-count reaches the bank's size while the sitting holds
    // half the answers and no sitting has finished.
    const half = Math.ceil(questionIds.length / 2);
    const { attemptId } = await startAttempt(student, SLUG);
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < half; i++) {
        const served = await nextQuestion(student, attemptId);
        if (!served) break;
        await submitAnswer(student, attemptId, served.questionId, 0);
      }
      if (round === 0) await db.quizResponse.deleteMany({ where: { attemptId } });
    }
    const mastery = await db.quizMastery.findFirstOrThrow({ where: { studentMembershipId: student.membershipId!, topicId: (await topicFor()).id } });
    expect(mastery.seenCount).toBeGreaterThanOrEqual(questionIds.length);
    expect((await db.quizAttempt.findUniqueOrThrow({ where: { id: attemptId } })).finishedAt).toBeNull();
    expect((await topicFor()).completed).toBe(false);

    await playThrough(student, { correct: true });
    expect((await topicFor()).completed).toBe(true);
  });
});

describe("answering", () => {
  it("marks a right answer right and returns the solution with it", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    const result = await submitAnswer(student, attemptId, served!.questionId, 0);
    expect(result.correct).toBe(true);
    // Given freely AFTER answering: withholding it would make "reveal", which
    // costs the badge, the only way to learn from a mistake.
    expect(result.solution).toContain("worked solution");
  });

  it("marks a wrong answer wrong", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    const result = await submitAnswer(student, attemptId, served!.questionId, 1);
    expect(result.correct).toBe(false);
  });

  /** A forged index is recorded as wrong, not rejected — otherwise a broken
   * client could skip any question it was about to get wrong. */
  it("treats an out-of-range choice as a wrong answer", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    const result = await submitAnswer(student, attemptId, served!.questionId, 99);
    expect(result.correct).toBe(false);
    const row = await db.quizResponse.findFirstOrThrow({ where: { attemptId } });
    expect(row.chosenIndex).toBeNull();
  });

  it("raises the level after two right answers", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    for (let i = 0; i < 2; i++) {
      const served = await nextQuestion(student, attemptId);
      await submitAnswer(student, attemptId, served!.questionId, 0);
    }
    const mastery = await db.quizMastery.findFirstOrThrow({
      where: { studentMembershipId: student.membershipId!, topicId },
    });
    expect(mastery.level).toBe(2);
  });

  /**
   * A double-tap or a retried request must not promote a child twice for one
   * question. Only a FIRST answer moves the level.
   */
  it("does not move the level when the same question is answered again", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    await submitAnswer(student, attemptId, served!.questionId, 0);
    await submitAnswer(student, attemptId, served!.questionId, 0);
    const mastery = await db.quizMastery.findFirstOrThrow({
      where: { studentMembershipId: student.membershipId!, topicId },
    });
    expect(mastery.seenCount).toBe(1);
    expect(mastery.level).toBe(1);
  });

  it("keeps the level between sittings", async () => {
    const first = await startAttempt(student, SLUG);
    for (let i = 0; i < 2; i++) {
      const served = await nextQuestion(student, first.attemptId);
      await submitAnswer(student, first.attemptId, served!.questionId, 0);
    }
    await db.quizAttempt.update({ where: { id: first.attemptId }, data: { finishedAt: new Date() } });

    const second = await startAttempt(student, SLUG);
    expect(second.attemptId).not.toBe(first.attemptId);
    const served = await nextQuestion(student, second.attemptId);
    // Level 2 was reached last time, so it must not open at "name the formula".
    expect(served?.difficulty).toBeGreaterThan(1);
  });
});

describe("the badge, and what forfeits it", () => {
  it("is awarded for finishing a topic with nothing revealed", async () => {
    const { last } = await playThrough(student, { correct: true });
    expect(last?.finished).toBe(true);
    expect(last?.badgeAwarded).toBe(true);

    const badge = await db.earnedBadge.findFirstOrThrow({
      where: { studentMembershipId: student.membershipId!, badgeId: topicBadgeId(SLUG) },
    });
    expect(badge.permanent).toBe(true);
    // Permanent means no academic year, so closing a year cannot archive it and
    // no absence can take it away.
    expect(badge.academicYearId).toBeNull();
  });

  it("is awarded even when the answers were wrong", async () => {
    // The badge says "finished without peeking", not "got everything right".
    const { last } = await playThrough(student, { correct: false });
    expect(last?.badgeAwarded).toBe(true);
  });

  it("is NOT awarded when a single solution was revealed", async () => {
    const { last } = await playThrough(student, { correct: true, reveal: true });
    expect(last?.finished).toBe(true);
    expect(last?.badgeAwarded).toBe(false);
    const badge = await db.earnedBadge.findFirst({
      where: { studentMembershipId: student.membershipId!, badgeId: topicBadgeId(SLUG) },
    });
    expect(badge).toBeNull();
  });

  /**
   * The flag lives on the ATTEMPT and is never unset. Deleting the response row
   * that recorded the reveal — the obvious way to launder it — changes nothing.
   */
  it("stays forfeited even if the response recording the reveal is deleted", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    await revealSolution(student, attemptId, served!.questionId);
    await db.quizResponse.deleteMany({ where: { attemptId } });

    let last = null;
    for (let i = 0; i < questionIds.length; i++) {
      const next = await nextQuestion(student, attemptId);
      if (!next) break;
      last = await submitAnswer(student, attemptId, next.questionId, 0);
    }
    expect(last?.badgeAwarded).toBe(false);
  });

  /**
   * Closing the tab and coming back must not launder a reveal either — the
   * attempt is RESUMED, not restarted.
   */
  it("stays forfeited across a resumed sitting", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    await revealSolution(student, attemptId, served!.questionId);

    const resumed = await startAttempt(student, SLUG);
    expect(resumed.attemptId).toBe(attemptId);

    let last = null;
    for (let i = 0; i < questionIds.length; i++) {
      const next = await nextQuestion(student, resumed.attemptId);
      if (!next) break;
      last = await submitAnswer(student, resumed.attemptId, next.questionId, 0);
    }
    expect(last?.badgeAwarded).toBe(false);
  });

  it("records the clean completion on the mastery row", async () => {
    await playThrough(student, { correct: true });
    const mastery = await db.quizMastery.findFirstOrThrow({
      where: { studentMembershipId: student.membershipId!, topicId },
    });
    expect(mastery.cleanCompletionAt).not.toBeNull();
  });

  it("does not award the badge twice for a second clean run", async () => {
    await playThrough(student, { correct: true });
    await db.quizAttempt.updateMany({
      where: { studentMembershipId: student.membershipId! },
      data: { finishedAt: new Date() },
    });
    await db.quizResponse.deleteMany({ where: { schoolId } });
    await playThrough(student, { correct: true });

    const badges = await db.earnedBadge.findMany({
      where: { studentMembershipId: student.membershipId!, badgeId: topicBadgeId(SLUG) },
    });
    expect(badges).toHaveLength(1);
  });

  it("does not finish, or award, before every question has been answered", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    const result = await submitAnswer(student, attemptId, served!.questionId, 0);
    expect(result.finished).toBe(false);
    expect(result.badgeAwarded).toBe(false);
  });
});

describe("revealing", () => {
  it("returns the worked solution", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const served = await nextQuestion(student, attemptId);
    const revealed = await revealSolution(student, attemptId, served!.questionId);
    expect(revealed.solution).toContain("worked solution");
  });

  it("says the badge was forfeited the first time, and not again after", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const a = await nextQuestion(student, attemptId);
    const first = await revealSolution(student, attemptId, a!.questionId);
    expect(first.badgeForfeited).toBe(true);

    const second = await revealSolution(student, attemptId, a!.questionId);
    expect(second.badgeForfeited).toBe(false);
  });

  it("refuses a question from another topic", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const foreign = await db.quizTopic.create({
      data: {
        subject: "MATHS",
        classLevel: 8,
        chapter: "x",
        name: "x",
        slug: `foreign-${Date.now()}`,
      },
    });
    const q = await db.quizQuestion.create({
      data: {
        topicId: foreign.id,
        difficulty: 1,
        stem: "Foreign question?",
        choices: JSON.stringify(["a", "b"]),
        answerIndex: 0,
        solution: "A solution long enough to count as a worked one.",
        source: "test",
        licence: "test",
      },
    });
    await expect(revealSolution(student, attemptId, q.id)).rejects.toBeInstanceOf(AccessError);
    await db.quizTopic.delete({ where: { id: foreign.id } });
  });
});
