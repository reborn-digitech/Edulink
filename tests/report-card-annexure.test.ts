import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startAttempt, nextQuestion, submitAnswer } from "@/lib/quiz";
import { generateCards, publishCards, getCard, cardsForClass } from "@/lib/report-cards";
import type { ActiveContext } from "@/lib/session";

/**
 * The practice annexure: a child climbs one rung of one chapter through the
 * REAL submit path, the class teacher generates a card, and the card carries a
 * snapshot of the ladder — chapter, rung, badges. Publishing freezes it: more
 * practice afterwards must not change a document a family has read.
 */

const db = new PrismaClient();
const SLUG = "history-6-what-where-how-and-when";
const PUPIL_EMAIL = "zz.pupil.annexure@riverside.test";
const TEACHER_EMAIL = "zz.teacher.annexure@riverside.test";

let hasBank = false;
let schoolId: string;
let classId: string;
let pupil: ActiveContext;
let teacher: ActiveContext;
let pupilMembershipId: string;

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
    data: { email: PUPIL_EMAIL, name: "ZZ Annexure Pupil", prefs: "{}" },
  });
  const teacherUser = await db.user.create({
    data: { email: TEACHER_EMAIL, name: "ZZ Annexure Teacher", prefs: "{}" },
  });
  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  pupilMembershipId = pupilMembership.id;
  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });
  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Annexure Class", gradeLevel: "3", joinCode: "ZZANNEX001" },
  });
  classId = klass.id;
  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherMembership.id, role: "LEAD" },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilMembership.id },
  });

  pupil = ctxFor(pupilUser.id, "ZZ Annexure Pupil", pupilMembership.id, "STUDENT");
  teacher = ctxFor(teacherUser.id, "ZZ Annexure Teacher", teacherMembership.id, "TEACHER");

  // One marked assessment, so the card has something conventional to report.
  const assignment = await db.assignment.create({
    data: {
      schoolId,
      classId,
      authorMembershipId: teacherMembership.id,
      title: "ZZ Spelling test",
      pointsMilli: 10_000,
      publishedAt: new Date(),
    },
  });
  await db.grade.create({
    data: {
      schoolId,
      assignmentId: assignment.id,
      studentMembershipId: pupilMembership.id,
      scoreMilli: 8_000,
      gradedByMembershipId: teacherMembership.id,
    },
  });
});

afterAll(async () => {
  if (hasBank) {
    await db.reportCardItem.deleteMany({ where: { reportCard: { classId } } });
    await db.reportCard.deleteMany({ where: { classId } });
    await db.grade.deleteMany({ where: { assignment: { classId } } });
    await db.assignment.deleteMany({ where: { classId } });
    await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: pupilMembershipId } } });
    await db.quizAttempt.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.quizMastery.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.earnedBadge.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await db.enrollment.deleteMany({ where: { classId } });
    await db.classTeacher.deleteMany({ where: { classId } });
    await db.class.deleteMany({ where: { id: classId } });
    for (const email of [PUPIL_EMAIL, TEACHER_EMAIL]) {
      const user = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (user) {
        await db.membership.deleteMany({ where: { userId: user.id } });
        await db.user.delete({ where: { id: user.id } });
      }
    }
    expect(await db.class.count({ where: { id: classId } })).toBe(0);
    expect(await db.user.count({ where: { email: { in: [PUPIL_EMAIL, TEACHER_EMAIL] } } })).toBe(0);
  }
  await db.$disconnect();
});

async function answerNextCorrectly(attemptId: string): Promise<void> {
  const served = await nextQuestion(pupil, attemptId);
  expect(served).not.toBeNull();
  const row = await db.quizQuestion.findUniqueOrThrow({
    where: { id: served!.questionId },
    select: { answerIndex: true },
  });
  await submitAnswer(pupil, attemptId, served!.questionId, row.answerIndex);
}

describe("the practice annexure", () => {
  it("snapshots the ladder onto a generated card", { timeout: 60_000 }, async () => {
    if (!hasBank) return;

    const { attemptId } = await startAttempt(pupil, SLUG);
    await answerNextCorrectly(attemptId);
    await answerNextCorrectly(attemptId); // two right -> L2, Beginner badge

    const assignment = await db.assignment.findFirstOrThrow({
      where: { classId, title: "ZZ Spelling test" },
      select: { id: true },
    });
    const result = await generateCards(teacher, classId, {
      title: "ZZ Term 1",
      assignmentIds: [assignment.id],
    });
    expect(result.ok).toBe(true);

    const cards = await cardsForClass(teacher, classId, "ZZ Term 1");
    const card = await getCard(teacher, cards[0]!.id);
    expect(card).not.toBeNull();
    expect(card!.practice).not.toBeNull();
    const chapter = card!.practice!.find((row) => row.name.length > 0 && row.level === 2);
    expect(chapter).toBeDefined();
    expect(chapter!.tiers).toBe(1); // Beginner arrived with the promotion
  });

  it("a published card keeps its snapshot however far the ladder moves", { timeout: 60_000 }, async () => {
    if (!hasBank) return;

    const cards = await cardsForClass(teacher, classId, "ZZ Term 1");
    await publishCards(teacher, classId, "ZZ Term 1");

    // The child keeps practicing after the card went home.
    const { attemptId } = await startAttempt(pupil, SLUG);
    await answerNextCorrectly(attemptId);
    await answerNextCorrectly(attemptId); // -> L3

    const assignment = await db.assignment.findFirstOrThrow({
      where: { classId, title: "ZZ Spelling test" },
      select: { id: true },
    });
    const regen = await generateCards(teacher, classId, {
      title: "ZZ Term 1",
      assignmentIds: [assignment.id],
    });
    expect(regen.skippedPublished).toBe(1);

    const card = await getCard(teacher, cards[0]!.id);
    expect(card!.practice!.some((row) => row.level === 2)).toBe(true); // still the day it was written
  });
});
