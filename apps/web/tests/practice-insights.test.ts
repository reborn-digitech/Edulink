import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startAttempt, nextQuestion, submitAnswer } from "@/lib/quiz";
import {
  enrolledGradeLevel,
  continueCard,
  weeklyPracticeCount,
  revisionQueue,
  reviseQuestion,
  childPracticeProgress,
  classPracticeHeatmap,
  createPracticeAssignment,
  archivePracticeAssignment,
  assignmentsForClass,
  assignmentsForStudent,
  journey,
  classWeekly,
  classGapAlerts,
} from "@/lib/practice-insights";
import type { ActiveContext } from "@/lib/session";

/**
 * Practice insights, end to end on real rows: a disposable ZZ class in the
 * seeded school, a disposable pupil enrolled in it, a disposable teacher who
 * teaches it, and a disposable guardian. Everything a fixture creates is
 * deleted in afterAll and the deletion is asserted, not assumed.
 *
 * The pupil's answers go through the REAL submit path, so the assignment
 * attainment these tests read is derived from the same mastery the child's
 * own page shows — which is the design claim under test.
 */

const db = new PrismaClient();
const SLUG = "history-6-what-where-how-and-when";
const PUPIL_EMAIL = "zz.pupil.insights@riverside.test";
const TEACHER_EMAIL = "zz.teacher.insights@riverside.test";
const PARENT_EMAIL = "zz.parent.insights@riverside.test";
const STUCK_EMAILS = ["zz.stuck.a@riverside.test", "zz.stuck.b@riverside.test"];

let hasBank = false;
let schoolId: string;
let classId: string;
let pupil: ActiveContext;
let teacher: ActiveContext;
let pupilMembershipId: string;
let parentUserId: string;

function ctxFor(userId: string, name: string, membershipId: string, role: "STUDENT" | "TEACHER"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId,
    role,
    user: {
      id: userId,
      name,
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
}

beforeAll(async () => {
  hasBank = (await db.quizTopic.count({ where: { slug: SLUG } })) > 0;
  if (!hasBank) return;

  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const pupilUser = await db.user.create({
    data: { email: PUPIL_EMAIL, name: "ZZ Insights Pupil", prefs: "{}" },
  });
  const teacherUser = await db.user.create({
    data: { email: TEACHER_EMAIL, name: "ZZ Insights Teacher", prefs: "{}" },
  });
  const parentUser = await db.user.create({
    data: { email: PARENT_EMAIL, name: "ZZ Insights Parent", prefs: "{}" },
  });
  parentUserId = parentUser.id;

  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });
  pupilMembershipId = pupilMembership.id;

  const klass = await db.class.create({
    data: {
      schoolId,
      name: "ZZ Insights Class",
      gradeLevel: "3",
      joinCode: "ZZINSIGHT1",
    },
  });
  classId = klass.id;
  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherMembership.id },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilMembership.id },
  });
  await db.guardianship.create({
    data: {
      parentUserId: parentUser.id,
      studentMembershipId: pupilMembership.id,
      studentSchoolId: schoolId,
    },
  });

  pupil = ctxFor(pupilUser.id, "ZZ Insights Pupil", pupilMembership.id, "STUDENT");
  teacher = ctxFor(teacherUser.id, "ZZ Insights Teacher", teacherMembership.id, "TEACHER");
});

afterAll(async () => {
  if (hasBank) {
    await db.practiceAssignment.deleteMany({ where: { classId } });
    await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: pupilMembershipId } } });
    await db.quizAttempt.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.quizMastery.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.earnedBadge.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.guardianship.deleteMany({ where: { parentUserId } });
    await db.enrollment.deleteMany({ where: { classId } });
    await db.classTeacher.deleteMany({ where: { classId } });
    await db.class.deleteMany({ where: { id: classId } });
    for (const email of [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL, ...STUCK_EMAILS]) {
      const user = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (user) {
        const memberships = await db.membership.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        const ids = memberships.map((m) => m.id);
        await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: { in: ids } } } });
        await db.quizAttempt.deleteMany({ where: { studentMembershipId: { in: ids } } });
        await db.quizMastery.deleteMany({ where: { studentMembershipId: { in: ids } } });
        await db.earnedBadge.deleteMany({ where: { studentMembershipId: { in: ids } } });
        await db.enrollment.deleteMany({ where: { studentMembershipId: { in: ids } } });
        await db.membership.deleteMany({ where: { userId: user.id } });
        await db.user.delete({ where: { id: user.id } });
      }
    }
    expect(await db.class.count({ where: { id: classId } })).toBe(0);
    expect(
      await db.user.count({
        where: { email: { in: [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL, ...STUCK_EMAILS] } },
      }),
    ).toBe(0);
  }
  await db.$disconnect();
});

async function answerNext(attemptId: string, correctly: boolean): Promise<string> {
  const served = await nextQuestion(pupil, attemptId);
  expect(served).not.toBeNull();
  const row = await db.quizQuestion.findUniqueOrThrow({
    where: { id: served!.questionId },
    select: { answerIndex: true, choices: true },
  });
  const wrong = (row.answerIndex + 1) % (JSON.parse(row.choices) as string[]).length;
  await submitAnswer(pupil, attemptId, served!.questionId, correctly ? row.answerIndex : wrong);
  return served!.questionId;
}

describe("practice insights", () => {
  it("defaults to the enrolled grade", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    expect(await enrolledGradeLevel(pupil)).toBe(3);
  });

  it("shows an assignment as unreached before the child has climbed", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    await createPracticeAssignment(teacher, { classId, topicSlug: SLUG, targetLevel: 2 });
    const mine = await assignmentsForStudent(pupil);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.reached).toBe(false);
    expect(mine[0]!.myLevel).toBe(0); // never opened the chapter — not L1
  });

  it("derives attainment, the continue card, and the weekly count from real answers", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const { attemptId } = await startAttempt(pupil, SLUG);
    await answerNext(attemptId, true);
    await answerNext(attemptId, true); // two right → promoted to L2

    const mine = await assignmentsForStudent(pupil);
    expect(mine[0]!.reached).toBe(true);
    expect(mine[0]!.myLevel).toBe(2);

    const resume = await continueCard(pupil);
    expect(resume?.slug).toBe(SLUG);
    expect(resume?.level).toBe(2);
    expect(resume?.tierCount).toBe(1); // Beginner arrived with the promotion

    expect(await weeklyPracticeCount(pupil)).toBe(2);

    const forClass = await assignmentsForClass(teacher, classId);
    expect(forClass[0]!.reached).toBe(1);
    expect(forClass[0]!.pupilCount).toBe(1);

    const heatmap = await classPracticeHeatmap(teacher, classId);
    expect(heatmap.pupilCount).toBe(1);
    const row = heatmap.rows.find((r) => r.slug === SLUG);
    expect(row?.atLevel[1]).toBe(1); // one pupil standing on L2
  });

  it("queues a rested wrong answer for revision, and clears it once re-answered right", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const { attemptId } = await startAttempt(pupil, SLUG);
    const missedId = await answerNext(attemptId, false);

    // Fresh mistakes rest first: nothing due yet.
    expect(await revisionQueue(pupil)).toHaveLength(0);

    // Age the mistake past the rest window.
    await db.quizResponse.updateMany({
      where: { questionId: missedId, attempt: { studentMembershipId: pupilMembershipId } },
      data: { answeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    });
    const queue = await revisionQueue(pupil);
    expect(queue.map((q) => q.questionId)).toContain(missedId);

    // Re-answer it right through the same machinery the revision player uses.
    const served = await reviseQuestion(pupil, missedId);
    const { attemptId: again } = await startAttempt(pupil, served.topicSlug);
    const row = await db.quizQuestion.findUniqueOrThrow({
      where: { id: missedId },
      select: { answerIndex: true },
    });
    await submitAnswer(pupil, again, missedId, row.answerIndex);

    expect((await revisionQueue(pupil)).map((q) => q.questionId)).not.toContain(missedId);
  });

  it("shows the guardian the same ladder the child sees", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const view = await childPracticeProgress(parentUserId, pupilMembershipId);
    expect(view.childName).toBe("ZZ Insights Pupil");
    const topic = view.topics.find((row) => row.slug === SLUG);
    expect(topic).toBeDefined();
    expect(topic!.level).toBeGreaterThanOrEqual(1);
    expect(topic!.tierCount).toBeGreaterThanOrEqual(1);
    expect(view.weeklyCount).toBeGreaterThanOrEqual(3);
  });

  it("tells the child their own journey, and only theirs", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const view = await journey(pupil);
    // 3, not 4: the revision re-answer lands in the same open attempt and
    // replaces the wrong response for that question rather than adding a row.
    expect(view.totalAnswers).toBeGreaterThanOrEqual(3);
    expect(view.totalTiers).toBeGreaterThanOrEqual(1); // the Beginner climb
    expect(view.practiceWeeks).toBeGreaterThanOrEqual(1); // practiced this week
    expect(view.monthly).toHaveLength(6);
    expect(view.monthly.reduce((sum, m) => sum + m.tiers, 0)).toBeGreaterThanOrEqual(1);
    expect(view.badges.some((b) => b.isTier)).toBe(true);

    // A teacher has no journey here: the page is the child's alone.
    await expect(journey(teacher)).rejects.toThrow();
  });

  it("sees the week move, and flags a chapter the class is stuck on", { timeout: 60_000 }, async () => {
    if (!hasBank) return;

    // No gap yet: one child having a bad day is not a teaching problem.
    expect(await classGapAlerts(teacher, classId)).toEqual([]);

    // Two more pupils, each missing four in a row at L1 of the same chapter —
    // that is the pattern that means the CLASS needs the chapter re-taught.
    for (const email of STUCK_EMAILS) {
      const user = await db.user.create({
        data: { email, name: `ZZ Stuck ${email.includes(".a@") ? "A" : "B"}`, prefs: "{}" },
      });
      const membership = await db.membership.create({
        data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE" },
      });
      await db.enrollment.create({
        data: { classId, schoolId, studentMembershipId: membership.id },
      });
      const stuck = ctxFor(user.id, "ZZ Stuck", membership.id, "STUDENT");
      const { attemptId } = await startAttempt(stuck, SLUG);
      for (let i = 0; i < 4; i++) {
        const served = await nextQuestion(stuck, attemptId);
        expect(served).not.toBeNull();
        const row = await db.quizQuestion.findUniqueOrThrow({
          where: { id: served!.questionId },
          select: { answerIndex: true, choices: true },
        });
        const wrong = (row.answerIndex + 1) % (JSON.parse(row.choices) as string[]).length;
        await submitAnswer(stuck, attemptId, served!.questionId, wrong);
      }
    }

    const gaps = await classGapAlerts(teacher, classId);
    const flagged = gaps.find((g) => g.slug === SLUG);
    expect(flagged).toBeDefined();
    expect(flagged!.stuckCount).toBe(2);
    expect(flagged!.level).toBe(1);

    const week = await classWeekly(teacher, classId);
    expect(week.pupilCount).toBe(3);
    expect(week.practiced).toBe(3);
    expect(week.misses).toBeGreaterThanOrEqual(8);
    expect(week.climbs).toBeGreaterThanOrEqual(1); // the first pupil's Beginner
  });

  it("archives an assignment out of every list", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const list = await assignmentsForClass(teacher, classId);
    await archivePracticeAssignment(teacher, list[0]!.id);
    expect(await assignmentsForClass(teacher, classId)).toHaveLength(0);
    expect(await assignmentsForStudent(pupil)).toHaveLength(0);
  });
});
