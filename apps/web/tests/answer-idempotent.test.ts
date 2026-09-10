import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startAttempt, nextQuestion, submitAnswerIdempotent } from "@/lib/quiz";
import type { ActiveContext } from "@/lib/session";

/**
 * The offline outbox's contract: replaying the same answer must not move the
 * ladder twice. One right answer through the idempotent path counts once;
 * three replays return the same stored verdict and leave streaks, mastery and
 * response counts exactly where the first delivery put them.
 */

const db = new PrismaClient();
const SLUG = "history-6-what-where-how-and-when";
const PUPIL_EMAIL = "zz.pupil.idempotent@riverside.test";

let hasBank = false;
let schoolId: string;
let pupil: ActiveContext;
let pupilMembershipId: string;

beforeAll(async () => {
  hasBank = (await db.quizTopic.count({ where: { slug: SLUG } })) > 0;
  if (!hasBank) return;

  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  const user = await db.user.create({
    data: { email: PUPIL_EMAIL, name: "ZZ Idempotent Pupil", prefs: "{}" },
  });
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  pupilMembershipId = membership.id;
  pupil = {
    sessionId: "test-session",
    membershipId: membership.id,
    schoolId,
    role: "STUDENT",
    user: {
      id: user.id,
      name: "ZZ Idempotent Pupil",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
});

afterAll(async () => {
  if (hasBank) {
    await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: pupilMembershipId } } });
    await db.quizAttempt.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.quizMastery.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.earnedBadge.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    const user = await db.user.findUnique({ where: { email: PUPIL_EMAIL }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
    expect(await db.user.count({ where: { email: PUPIL_EMAIL } })).toBe(0);
  }
  await db.$disconnect();
});

describe("replay-safe answering", () => {
  it("one tap counts once, however many times the outbox delivers it", { timeout: 60_000 }, async () => {
    if (!hasBank) return;

    const { attemptId } = await startAttempt(pupil, SLUG);
    const served = await nextQuestion(pupil, attemptId);
    expect(served).not.toBeNull();
    const row = await db.quizQuestion.findUniqueOrThrow({
      where: { id: served!.questionId },
      select: { answerIndex: true },
    });

    const first = await submitAnswerIdempotent(pupil, attemptId, served!.questionId, row.answerIndex);
    expect(first.replayed).toBe(false);
    expect(first.result.correct).toBe(true);

    const masteryAfterFirst = await db.quizMastery.findFirstOrThrow({
      where: { studentMembershipId: pupilMembershipId },
      select: { streakRight: true, level: true, seenCount: true },
    });
    expect(masteryAfterFirst.streakRight).toBe(1);

    // The outbox flush, the recovery poll, and an impatient tap all replay.
    for (let i = 0; i < 3; i++) {
      const replay = await submitAnswerIdempotent(pupil, attemptId, served!.questionId, row.answerIndex);
      expect(replay.replayed).toBe(true);
      expect(replay.result.correct).toBe(true);
      expect(replay.result.answerIndex).toBe(row.answerIndex);
    }

    const masteryAfterReplays = await db.quizMastery.findFirstOrThrow({
      where: { studentMembershipId: pupilMembershipId },
      select: { streakRight: true, level: true, seenCount: true },
    });
    // Nothing moved: not the streak, not the level, not the count.
    expect(masteryAfterReplays).toEqual(masteryAfterFirst);
    expect(
      await db.quizResponse.count({ where: { attemptId, questionId: served!.questionId } }),
    ).toBe(1);
  });
});

describe("a replay of the answer that finished the topic", () => {
  /**
   * A phone that answered offline only ever sees the replay: the first
   * delivery happened while it had no signal, and its answer came back from
   * the outbox later. So the replay of the LAST answer must say what the
   * first delivery said — finished, and the badge won — or a pupil who
   * earned it sees a plain "finished". The replay of any earlier answer must
   * not claim the finish.
   */
  it("says finished and names the badge; an earlier answer's replay does not", async () => {
    if (!hasBank) return;
    // A fresh attempt of its own: the test above left an attempt open on this topic.
    await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: pupilMembershipId } } });
    await db.quizAttempt.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.earnedBadge.deleteMany({ where: { studentMembershipId: pupilMembershipId } });

    const { attemptId } = await startAttempt(pupil, SLUG);
    const answered: { questionId: string; answerIndex: number }[] = [];
    let last: Awaited<ReturnType<typeof submitAnswerIdempotent>> | null = null;
    for (let guard = 0; guard < 200; guard++) {
      const served = await nextQuestion(pupil, attemptId);
      if (!served) break;
      const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: served.questionId }, select: { answerIndex: true } });
      last = await submitAnswerIdempotent(pupil, attemptId, served.questionId, row.answerIndex);
      answered.push({ questionId: served.questionId, answerIndex: row.answerIndex });
    }
    expect(answered.length).toBeGreaterThan(1);
    // The first delivery of the last answer finished the topic cleanly and won the badge.
    expect(last?.replayed).toBe(false);
    expect(last?.result).toMatchObject({ finished: true, badgeAwarded: true });

    // Finishing awards the topic's badge and the tier badges met on the way; count them before replaying.
    const badgesBefore = await db.earnedBadge.count({ where: { studentMembershipId: pupilMembershipId } });
    expect(badgesBefore).toBeGreaterThanOrEqual(1);

    const final = answered[answered.length - 1]!;
    const replayOfLast = await submitAnswerIdempotent(pupil, attemptId, final.questionId, final.answerIndex);
    expect(replayOfLast.replayed).toBe(true);
    expect(replayOfLast.result).toMatchObject({ correct: true, finished: true, badgeAwarded: true });

    const firstAnswer = answered[0]!;
    const replayOfFirst = await submitAnswerIdempotent(pupil, attemptId, firstAnswer.questionId, firstAnswer.answerIndex);
    expect(replayOfFirst.replayed).toBe(true);
    expect(replayOfFirst.result).toMatchObject({ finished: false, badgeAwarded: false });

    // Replays award nothing twice.
    expect(await db.earnedBadge.count({ where: { studentMembershipId: pupilMembershipId } })).toBe(badgesBefore);
  });
});
