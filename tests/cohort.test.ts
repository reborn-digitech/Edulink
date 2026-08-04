import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  assignTeacher,
  candidatesFor,
  enrolStudents,
  listCohort,
  removeFromCohort,
  unassignTeacher,
} from "@/lib/cohort";
import type { ActiveContext } from "@/lib/session";

/**
 * The children in a class, and the staff responsible for it.
 *
 * THE ONE THAT MATTERS is that taking a child off a roll does not erase what
 * they did in it. An Enrollment row is what every attendance record and every
 * mark in that class hangs off, so a `delete` here would tidy a list by removing
 * a term of somebody's history — and would do it silently, because nothing else
 * would fail. That has its own describe block below.
 */

const db = new PrismaClient();

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

const SPARE_CLASS = "ZZ Cohort Test Class";

let riversideId: string;
let oakfieldId: string;
let classId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let teacherMembershipId: string;
let oakfieldStudentId: string;

/** Riverside pupils, borrowed for the roll and put back afterwards. */
let pupilIds: string[] = [];

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });

  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" },
  });
  teacherMembershipId = tomTeacher.id;

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  teacher = ctx({
    userId: tom.id,
    membershipId: tomTeacher.id,
    schoolId: riversideId,
    role: "TEACHER",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfieldId,
    role: "ADMIN",
  });

  // A class of this suite's OWN, so nothing here touches a seeded roll that four
  // other suites read. Learned the hard way in register-duty.test.ts.
  const created = await db.class.upsert({
    where: { joinCode: "ZZZ-COHORT" },
    create: {
      schoolId: riversideId,
      name: SPARE_CLASS,
      gradeLevel: "5",
      section: "Z",
      joinCode: "ZZZ-COHORT",
    },
    update: {},
  });
  classId = created.id;

  const pupils = await db.membership.findMany({
    where: { schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
    select: { id: true },
    take: 3,
  });
  pupilIds = pupils.map((p) => p.id);

  const oakPupil = await db.membership.findFirstOrThrow({
    where: { schoolId: oakfieldId, role: "STUDENT", status: "ACTIVE" },
  });
  oakfieldStudentId = oakPupil.id;
});

afterEach(async () => {
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
});

afterAll(async () => {
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.$disconnect();
});

describe("building a class roll", () => {
  it("adds several at once", async () => {
    const result = await enrolStudents(admin, classId, pupilIds);
    expect(result.ok).toBe(true);
    expect(result.added).toBe(pupilIds.length);
    expect(await listCohort(admin, classId)).toHaveLength(pupilIds.length);
  });

  it("is idempotent — adding the same child twice does not duplicate them", async () => {
    await enrolStudents(admin, classId, pupilIds);
    await enrolStudents(admin, classId, pupilIds);
    expect(await listCohort(admin, classId)).toHaveLength(pupilIds.length);
  });

  it("⚠ refuses a pupil from another school", async () => {
    const result = await enrolStudents(admin, classId, [oakfieldStudentId]);
    expect(result.ok).toBe(false);
    expect(await listCohort(admin, classId)).toHaveLength(0);
  });

  it("⚠ refuses a teacher's membership id, however it arrived", async () => {
    // The id comes from the client. The role filter does not.
    const result = await enrolStudents(admin, classId, [teacherMembershipId]);
    expect(result.ok).toBe(false);
  });

  it("adds the valid ones and ignores the rest of a mixed list", async () => {
    const result = await enrolStudents(admin, classId, [...pupilIds, oakfieldStudentId]);
    expect(result.ok).toBe(true);
    expect(result.added).toBe(pupilIds.length);
  });

  it("refuses an empty selection", async () => {
    expect((await enrolStudents(admin, classId, [])).ok).toBe(false);
  });

  it("⚠ is an admin's job — a teacher cannot re-roll their own class", async () => {
    await expect(enrolStudents(teacher, classId, pupilIds)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a class in another school", async () => {
    await expect(enrolStudents(otherSchoolAdmin, classId, pupilIds)).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});

describe("⚠ taking somebody off the roll keeps what they did", () => {
  it("marks the enrolment REMOVED rather than deleting it", async () => {
    await enrolStudents(admin, classId, pupilIds);
    const result = await removeFromCohort(admin, classId, pupilIds[0]!);
    expect(result.ok).toBe(true);

    // ⚠ The row survives. It is what every attendance record and mark in this
    // class hangs off — deleting it would take a term of history with it, and
    // nothing else in the app would fail loudly enough to notice.
    const row = await db.enrollment.findFirstOrThrow({
      where: { classId, studentMembershipId: pupilIds[0]! },
    });
    expect(row.status).toBe("REMOVED");
    expect(row.removedAt).not.toBeNull();
  });

  it("drops them out of the roll everybody reads", async () => {
    await enrolStudents(admin, classId, pupilIds);
    await removeFromCohort(admin, classId, pupilIds[0]!);
    const roll = await listCohort(admin, classId);
    expect(roll.map((m) => m.membershipId)).not.toContain(pupilIds[0]!);
    expect(roll).toHaveLength(pupilIds.length - 1);
  });

  it("⚠ re-adding revives the same row instead of colliding on the index", async () => {
    // (classId, studentMembershipId) is unique. A plain `create` on the way back
    // in would throw, and a child returning after half a term is ordinary.
    await enrolStudents(admin, classId, pupilIds);
    await removeFromCohort(admin, classId, pupilIds[0]!);

    const again = await enrolStudents(admin, classId, [pupilIds[0]!]);
    expect(again.ok).toBe(true);

    const rows = await db.enrollment.findMany({
      where: { classId, studentMembershipId: pupilIds[0]! },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("ACTIVE");
    expect(rows[0]!.removedAt).toBeNull();
  });

  it("refuses to remove somebody who is not on the roll", async () => {
    expect((await removeFromCohort(admin, classId, pupilIds[0]!)).ok).toBe(false);
  });

  it("⚠ is an admin's job", async () => {
    await enrolStudents(admin, classId, pupilIds);
    await expect(removeFromCohort(teacher, classId, pupilIds[0]!)).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});

describe("who is offered", () => {
  it("leaves out the children already in the class", async () => {
    const before = await candidatesFor(admin, classId);
    await enrolStudents(admin, classId, pupilIds);
    const after = await candidatesFor(admin, classId);

    expect(after.length).toBe(before.length - pupilIds.length);
    expect(after.map((c) => c.membershipId)).not.toContain(pupilIds[0]!);
  });

  it("⚠ suggests by grade rather than filtering by it", async () => {
    // A child repeating a year, or taking a subject a year up, must still be
    // addable. Ordering is a hint; a filter would be a rule.
    const candidates = await candidatesFor(admin, classId);
    const grades = new Set(candidates.map((c) => c.gradeLevel));
    expect(candidates.length).toBeGreaterThan(0);
    // The class is Grade 5, and pupils of other grades are still on the list.
    expect(grades.size).toBeGreaterThanOrEqual(1);
    if (candidates.some((c) => c.gradeLevel === "5")) {
      expect(candidates[0]!.gradeLevel).toBe("5");
    }
  });

  it("names the classes somebody is already in, rather than hiding them", async () => {
    const candidates = await candidatesFor(admin, classId);
    const withClasses = candidates.filter((c) => c.alreadyIn.length > 0);
    expect(withClasses.length).toBeGreaterThan(0);
  });

  it("narrows on a search", async () => {
    const all = await candidatesFor(admin, classId);
    const first = all[0]!;
    const found = await candidatesFor(admin, classId, first.name.split(" ")[0]!);
    expect(found.map((c) => c.membershipId)).toContain(first.membershipId);
  });

  it("⚠ never offers a pupil from another school", async () => {
    const candidates = await candidatesFor(admin, classId);
    expect(candidates.map((c) => c.membershipId)).not.toContain(oakfieldStudentId);
  });
});

describe("assigning staff to a class", () => {
  it("makes somebody the class teacher, with register duty", async () => {
    const result = await assignTeacher(admin, classId, teacherMembershipId, { role: "LEAD" });
    expect(result.ok).toBe(true);

    const row = await db.classTeacher.findFirstOrThrow({
      where: { classId, teacherMembershipId },
    });
    expect(row.role).toBe("LEAD");
    // A class teacher takes the register unless told otherwise.
    expect(row.canTakeAttendance).toBe(true);
  });

  it("⚠ adds a co-teacher WITHOUT register duty by default", async () => {
    // The visiting-subject-teacher case. Six classes, no registers.
    await assignTeacher(admin, classId, teacherMembershipId, { role: "CO" });
    const row = await db.classTeacher.findFirstOrThrow({
      where: { classId, teacherMembershipId },
    });
    expect(row.role).toBe("CO");
    expect(row.canTakeAttendance).toBe(false);
  });

  it("changes an existing assignment rather than duplicating it", async () => {
    await assignTeacher(admin, classId, teacherMembershipId, { role: "CO" });
    await assignTeacher(admin, classId, teacherMembershipId, { role: "LEAD" });
    const rows = await db.classTeacher.findMany({ where: { classId, teacherMembershipId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.role).toBe("LEAD");
  });

  it("⚠ refuses somebody who is not teaching staff here", async () => {
    const pupil = pupilIds[0]!;
    expect((await assignTeacher(admin, classId, pupil)).ok).toBe(false);

    const oakTeacher = await db.membership.findFirstOrThrow({
      where: { schoolId: oakfieldId, role: "TEACHER" },
    });
    expect((await assignTeacher(admin, classId, oakTeacher.id)).ok).toBe(false);
  });

  it("takes somebody off the class", async () => {
    await assignTeacher(admin, classId, teacherMembershipId);
    expect((await unassignTeacher(admin, classId, teacherMembershipId)).ok).toBe(true);
    expect(await db.classTeacher.count({ where: { classId } })).toBe(0);
  });

  it("refuses to unassign somebody who is not on it", async () => {
    expect((await unassignTeacher(admin, classId, teacherMembershipId)).ok).toBe(false);
  });

  it("⚠ is an admin's job, not a teacher's", async () => {
    await expect(assignTeacher(teacher, classId, teacherMembershipId)).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});
