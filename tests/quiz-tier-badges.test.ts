import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startAttempt, nextQuestion, submitAnswer, topicTierBadgeId, TIER_NAMES, MAX_LEVEL } from "@/lib/quiz";
import type { ActiveContext } from "@/lib/session";

/**
 * Ladder-tier badges: one per rung of a chapter, Beginner (L1) to Master (L6).
 *
 * The award rule is the same on every rung — two right in a row at that level.
 * For L1–L5 that is exactly the promotion the mastery ladder already makes;
 * L6 has nowhere to promote to, so the same streak at the top earns Master.
 * This suite drives a REAL attempt with a disposable pupil and checks:
 *
 *   1. Proving L1 (one promotion) creates exactly the tier-1 badge, named
 *      "<chapter> · Beginner", permanent, with no other tiers alongside it.
 *   2. Re-proving a level after a demotion does NOT duplicate the badge —
 *      the badge says the level WAS proven, and idempotency is the contract.
 *   3. A streak at the top rung earns Master without needing a promotion.
 *
 * Correct answers come from reading answerIndex straight off the row — this
 * is a test, not a pupil. Skips cleanly when the drill bank is absent.
 */

const db = new PrismaClient();
const EMAIL = "zz.pupil.tiers@riverside.test";
const SLUG = "history-6-what-where-how-and-when";

let hasBank = false;
let riversideId: string;
let pupil: ActiveContext;
let membershipId: string;
let topicId: string;

beforeAll(async () => {
  hasBank = (await db.quizTopic.count({ where: { slug: SLUG } })) > 0;
  if (!hasBank) return;

  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  riversideId = riverside.id;
  topicId = (await db.quizTopic.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true } })).id;
  const user = await db.user.create({ data: { email: EMAIL, name: "ZZ Tier Pupil", prefs: "{}" } });
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
  });
  membershipId = membership.id;
  pupil = {
    sessionId: "test-session",
    membershipId,
    schoolId: riversideId,
    role: "STUDENT",
    user: {
      id: user.id,
      name: "ZZ Tier Pupil",
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
    const user = await db.user.findUnique({ where: { email: EMAIL }, select: { id: true } });
    if (user) {
      await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: membershipId } } });
      await db.quizAttempt.deleteMany({ where: { studentMembershipId: membershipId } });
      await db.quizMastery.deleteMany({ where: { studentMembershipId: membershipId } });
      await db.earnedBadge.deleteMany({ where: { studentMembershipId: membershipId } });
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
    const gone = await db.earnedBadge.count({ where: { studentMembershipId: membershipId } });
    expect(gone).toBe(0);
  }
  await db.$disconnect();
});

/** Answer the next served question, correctly or not, through the real path. */
async function answerNext(attemptId: string, correctly: boolean): Promise<void> {
  const served = await nextQuestion(pupil, attemptId);
  expect(served).not.toBeNull();
  const row = await db.quizQuestion.findUniqueOrThrow({
    where: { id: served!.questionId },
    select: { answerIndex: true, choices: true },
  });
  const wrong = (row.answerIndex + 1) % (JSON.parse(row.choices) as string[]).length;
  await submitAnswer(pupil, attemptId, served!.questionId, correctly ? row.answerIndex : wrong);
}

async function tierBadges(): Promise<string[]> {
  const rows = await db.earnedBadge.findMany({
    where: { studentMembershipId: membershipId, permanent: true, badgeId: { contains: ":tier-" } },
    orderBy: { badgeId: "asc" },
    select: { badgeId: true },
  });
  return rows.map((r) => r.badgeId);
}

describe("quiz ladder tier badges", () => {
  it("awards Beginner on the first promotion, and only Beginner", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const { attemptId } = await startAttempt(pupil, SLUG);

    await answerNext(attemptId, true);
    expect(await tierBadges()).toEqual([]); // one right is a lucky guess, not a proof

    await answerNext(attemptId, true); // two in a row at L1 → promoted, L1 proven
    expect(await tierBadges()).toEqual([topicTierBadgeId(SLUG, 1)]);

    const badge = await db.earnedBadge.findFirstOrThrow({
      where: { studentMembershipId: membershipId, badgeId: topicTierBadgeId(SLUG, 1) },
    });
    const topic = await db.quizTopic.findUniqueOrThrow({ where: { slug: SLUG }, select: { name: true } });
    expect(badge.label).toBe(`${topic.name} · ${TIER_NAMES[0]}`);
    expect(badge.permanent).toBe(true);
    expect(badge.academicYearId).toBeNull();

    const mastery = await db.quizMastery.findUniqueOrThrow({
      where: { studentMembershipId_topicId: { studentMembershipId: membershipId, topicId } },
    });
    expect(mastery.level).toBe(2);
  });

  it("does not duplicate a badge when a level is proven twice", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const { attemptId } = await startAttempt(pupil, SLUG);

    // Fall back to L1 (two wrong), then prove it again (two right).
    await answerNext(attemptId, false);
    await answerNext(attemptId, false);
    await answerNext(attemptId, true);
    await answerNext(attemptId, true);

    const badges = await tierBadges();
    expect(badges.filter((b) => b === topicTierBadgeId(SLUG, 1))).toHaveLength(1);
  });

  it("awards Master for a streak at the top rung, where no promotion exists", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    // Place the child at the summit directly; the climb itself is covered above.
    await db.quizMastery.update({
      where: { studentMembershipId_topicId: { studentMembershipId: membershipId, topicId } },
      data: { level: MAX_LEVEL, streakRight: 0, streakWrong: 0 },
    });
    const { attemptId } = await startAttempt(pupil, SLUG);

    await answerNext(attemptId, true);
    expect(await tierBadges()).not.toContain(topicTierBadgeId(SLUG, MAX_LEVEL));

    await answerNext(attemptId, true);
    const badges = await tierBadges();
    expect(badges).toContain(topicTierBadgeId(SLUG, MAX_LEVEL));

    const master = await db.earnedBadge.findFirstOrThrow({
      where: { studentMembershipId: membershipId, badgeId: topicTierBadgeId(SLUG, MAX_LEVEL) },
    });
    expect(master.label).toMatch(/ · Master$/);
  });
});
