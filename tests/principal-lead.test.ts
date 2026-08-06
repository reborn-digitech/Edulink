import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { assignTeacher } from "@/lib/cohort";
import {
  assertMayWriteCards,
  cardsForClass,
  generateCards,
  getCard,
  publishCards,
} from "@/lib/report-cards";
import type { ActiveContext } from "@/lib/session";

/**
 * The principal who IS the class teacher.
 *
 * report-cards.test.ts proves the refusal half: a principal, as principal, may
 * not write report cards — they read what came out. This file proves the other
 * half, which until now was only reasoned about: `cohort.ts` deliberately lets
 * a school appoint a PRINCIPAL membership as LEAD of a class ("the head teaches
 * Class 5 on Tuesdays"), and from that moment `assertMayWriteCards` must treat
 * them exactly as it treats a class teacher — because at that moment they ARE
 * one. The test is the job, not the role.
 *
 * Every row here is this suite's own: its own school staff, its own class, its
 * own pupil. The pupil deliberately has no guardian, so publishing notifies
 * only a user this suite created and deletes.
 */

const db = new PrismaClient();

const HEAD_EMAIL = "zz.head.plead@riverside.test";
const ADMIN_EMAIL = "zz.admin.plead@riverside.test";
const PUPIL_EMAIL = "zz.pupil.plead@riverside.test";
const MADE = [HEAD_EMAIL, ADMIN_EMAIL, PUPIL_EMAIL];
const JOIN_CODE = "ZZZ-PLEAD";
const TITLE = "ZZ Principal Term";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
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
}

let riversideId: string;
let classId: string;
let assignmentId: string;

let head: ActiveContext;
let admin: ActiveContext;
let headMembershipId: string;
let adminMembershipId: string;
let pupilMembershipId: string;

async function make(email: string, name: string, role: string) {
  const user =
    (await db.user.findUnique({ where: { email } })) ??
    (await db.user.create({ data: { email, name, prefs: "{}" } }));
  const membership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: user.id, schoolId: riversideId, role } },
    create: { userId: user.id, schoolId: riversideId, role, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
  return { userId: user.id, membershipId: membership.id };
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  riversideId = riverside.id;

  const h = await make(HEAD_EMAIL, "ZZ Head Teacher", "PRINCIPAL");
  const a = await make(ADMIN_EMAIL, "ZZ Office Admin", "ADMIN");
  const p = await make(PUPIL_EMAIL, "ZZ Pupil", "STUDENT");
  headMembershipId = h.membershipId;
  adminMembershipId = a.membershipId;
  pupilMembershipId = p.membershipId;

  head = ctx({
    userId: h.userId,
    membershipId: h.membershipId,
    schoolId: riversideId,
    role: "PRINCIPAL",
  });
  admin = ctx({
    userId: a.userId,
    membershipId: a.membershipId,
    schoolId: riversideId,
    role: "ADMIN",
  });

  const klass = await db.class.upsert({
    where: { joinCode: JOIN_CODE },
    create: {
      schoolId: riversideId,
      name: "ZZ Principal's Class",
      gradeLevel: "5",
      joinCode: JOIN_CODE,
    },
    update: {},
  });
  classId = klass.id;

  await db.enrollment.upsert({
    where: { classId_studentMembershipId: { classId, studentMembershipId: pupilMembershipId } },
    create: { classId, schoolId: riversideId, studentMembershipId: pupilMembershipId, status: "ACTIVE" },
    update: { status: "ACTIVE", removedAt: null },
  });

  const assignment = await db.assignment.create({
    data: {
      schoolId: riversideId,
      classId,
      authorMembershipId: h.membershipId,
      title: "ZZ Tuesday Test",
      pointsMilli: 100_000,
      publishedAt: new Date(),
    },
  });
  assignmentId = assignment.id;
});

afterAll(async () => {
  await db.reportCard.deleteMany({ where: { classId } });
  await db.grade.deleteMany({ where: { assignmentId } });
  await db.assignment.deleteMany({ where: { classId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  const users = await db.user.findMany({ where: { email: { in: MADE } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  // assignTeacher and publishCards audit and notify as this suite's own actors;
  // those rows leave with them.
  await db.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.membership.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("⚠ the principal appointed LEAD writes the report cards", () => {
  it("is refused BEFORE the appointment — being the head is not the job", async () => {
    await expect(assertMayWriteCards(head, classId)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ an ADMIN membership cannot be appointed at all — that is an office role", async () => {
    const result = await assignTeacher(admin, classId, adminMembershipId, { role: "LEAD" });
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.notTeachingStaff");
  });

  it("⚠ the appointment goes through, and the gate opens", async () => {
    const appointed = await assignTeacher(admin, classId, headMembershipId, { role: "LEAD" });
    expect(appointed.ok).toBe(true);

    await expect(assertMayWriteCards(head, classId)).resolves.toBeTruthy();
  });

  it("⚠ and the principal builds, generates and publishes like any class teacher", async () => {
    await db.grade.create({
      data: {
        schoolId: riversideId,
        assignmentId,
        studentMembershipId: pupilMembershipId,
        gradedByMembershipId: headMembershipId,
        scoreMilli: 90_000,
      },
    });

    const generated = await generateCards(head, classId, {
      title: TITLE,
      assignmentIds: [assignmentId],
    });
    expect(generated.ok).toBe(true);
    expect(generated.created).toBe(1);

    const published = await publishCards(head, classId, TITLE);
    expect(published.ok).toBe(true);
    expect(published.published).toBe(1);

    const cards = await cardsForClass(head, classId, TITLE);
    const card = await getCard(head, cards[0]!.id);
    expect(card!.status).toBe("PUBLISHED");
    expect(card!.overallPercent).toBeCloseTo(90, 1);
  });

  it("⚠ demoted to CO, the door shuts again", async () => {
    const demoted = await assignTeacher(admin, classId, headMembershipId, { role: "CO" });
    expect(demoted.ok).toBe(true);
    await expect(assertMayWriteCards(head, classId)).rejects.toBeInstanceOf(AccessError);
  });
});
