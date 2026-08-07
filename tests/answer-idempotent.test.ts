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
const SLUG = "drill-g3-addsub";
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
