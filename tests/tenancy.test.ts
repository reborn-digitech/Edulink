import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  AccessError,
  assertClassAccess,
  assertStudentAccess,
  assertGuardianAccess,
  assertAssignmentAccess,
  teacherClassIds,
  scope,
} from "@/lib/tenancy";

/**
 * Tenant-isolation suite.
 *
 * This is the file that matters most in the whole repo. Every check here is an
 * IDOR attempt: take a real id from School B and hand it to a session scoped to
 * School A. The correct answer is always "not found" — never a partial result,
 * never a different error that confirms the row exists.
 *
 * Requires the seed (two schools). Read-only, so it needs no cleanup.
 */

const db = new PrismaClient();

type Ctx = { schoolId: string; membershipId: string; role: "ADMIN" | "TEACHER" | "STUDENT" };

let riversideAdmin: Ctx;
let riversideTeacher: Ctx; // Tom — leads exactly one class
let otherTeacher: Ctx; // Priya — leads a different class
let oakfieldAdmin: Ctx;

let tomClassId: string;
let priyaClassId: string;
let oakfieldClassId: string;
let riversideStudentInTomsClass: string;
let riversideStudentNotInTomsClass: string;
let oakfieldStudentId: string;
let parentUserId: string;
let parentChildRiverside: string;
let unrelatedStudentId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });

  const priyaUser = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tomUser = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const samUser = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });

  const priyaTeacher = await db.membership.findFirstOrThrow({
    where: { userId: priyaUser.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priyaUser.id, schoolId: riverside.id, role: "ADMIN" },
  });
  const tom = await db.membership.findFirstOrThrow({
    where: { userId: tomUser.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const sam = await db.membership.findFirstOrThrow({
    where: { userId: samUser.id, schoolId: oakfield.id, role: "ADMIN" },
  });

  riversideAdmin = { schoolId: riverside.id, membershipId: priyaAdmin.id, role: "ADMIN" };
  riversideTeacher = { schoolId: riverside.id, membershipId: tom.id, role: "TEACHER" };
  otherTeacher = { schoolId: riverside.id, membershipId: priyaTeacher.id, role: "TEACHER" };
  oakfieldAdmin = { schoolId: oakfield.id, membershipId: sam.id, role: "ADMIN" };

  const tomClass = await db.classTeacher.findFirstOrThrow({
    where: { teacherMembershipId: tom.id },
    include: { class: true },
  });
  tomClassId = tomClass.classId;

  const priyaClass = await db.classTeacher.findFirstOrThrow({
    where: { teacherMembershipId: priyaTeacher.id, classId: { not: tomClassId } },
  });
  priyaClassId = priyaClass.classId;

  oakfieldClassId = (await db.class.findFirstOrThrow({ where: { schoolId: oakfield.id } })).id;

  riversideStudentInTomsClass = (
    await db.enrollment.findFirstOrThrow({ where: { classId: tomClassId, status: "ACTIVE" } })
  ).studentMembershipId;

  riversideStudentNotInTomsClass = (
    await db.membership.findFirstOrThrow({
      where: {
        schoolId: riverside.id,
        role: "STUDENT",
        enrollments: { none: { classId: tomClassId } },
      },
    })
  ).id;

  // Must be an Oakfield student with no FAMILY guardian link — the seed
  // deliberately links the test parent to one child in EACH school, so
  // grabbing "the first Oakfield student" would pick their own child and make
  // the negative guardian test assert the opposite of what it means to.
  // (`none: {}` is no longer satisfiable: since standin-guardian.ts, every
  // unclaimed pupil carries a `relation: "SCHOOL"` row held by their teacher —
  // which is not this parent, so the negative below still means what it says.)
  oakfieldStudentId = (
    await db.membership.findFirstOrThrow({
      where: {
        schoolId: oakfield.id,
        role: "STUDENT",
        guardianships: { none: { relation: { not: "SCHOOL" } } },
      },
    })
  ).id;

  const parent = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });
  parentUserId = parent.id;
  parentChildRiverside = (
    await db.guardianship.findFirstOrThrow({
      where: { parentUserId: parent.id, student: { schoolId: riverside.id } },
    })
  ).studentMembershipId;

  // "Unrelated" means no guardianship FROM THIS PARENT — a SCHOOL-relation
  // stand-in held by a teacher (standin-guardian.ts) does not relate the
  // parent to the child, and `none: {}` stopped being satisfiable the day
  // every unclaimed pupil gained one.
  unrelatedStudentId = (
    await db.membership.findFirstOrThrow({
      where: {
        schoolId: riverside.id,
        role: "STUDENT",
        id: { not: parentChildRiverside },
        guardianships: { none: { parentUserId: parent.id } },
      },
    })
  ).id;
});

afterAll(() => db.$disconnect());

/** Asserts the call rejects as NOT_FOUND — never a leakier error. */
async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toBeInstanceOf(AccessError);
  await promise.catch((error: AccessError) => {
    expect(error.code).toBe("NOT_FOUND");
  });
}

describe("assertClassAccess", () => {
  it("lets an admin open any class in their own school", async () => {
    const klass = await assertClassAccess(riversideAdmin, tomClassId);
    expect(klass.id).toBe(tomClassId);
  });

  it("lets a teacher open a class they are assigned to", async () => {
    const klass = await assertClassAccess(riversideTeacher, tomClassId);
    expect(klass.id).toBe(tomClassId);
  });

  it("refuses a teacher a class in their school they do NOT teach", async () => {
    // The tempting shortcut is "same school is good enough". It is not: this is
    // another teacher's register and another teacher's grades.
    await expectNotFound(assertClassAccess(riversideTeacher, priyaClassId));
  });

  it("refuses an admin a class in ANOTHER school", async () => {
    await expectNotFound(assertClassAccess(riversideAdmin, oakfieldClassId));
    await expectNotFound(assertClassAccess(oakfieldAdmin, tomClassId));
  });

  it("refuses a teacher a class in another school", async () => {
    await expectNotFound(assertClassAccess(riversideTeacher, oakfieldClassId));
  });

  it("refuses a made-up class id", async () => {
    await expectNotFound(assertClassAccess(riversideAdmin, "cl000000000000000000000"));
    await expectNotFound(assertClassAccess(riversideAdmin, ""));
  });

  it("blocks students from writing to a class", async () => {
    const studentCtx = { ...riversideAdmin, role: "STUDENT" as const };
    await expect(assertClassAccess(studentCtx, tomClassId, { write: true })).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});

describe("assertStudentAccess", () => {
  it("lets an admin see any student in their school", async () => {
    const student = await assertStudentAccess(riversideAdmin, riversideStudentInTomsClass);
    expect(student.id).toBe(riversideStudentInTomsClass);
  });

  it("lets a teacher see a student they actually teach", async () => {
    const student = await assertStudentAccess(riversideTeacher, riversideStudentInTomsClass);
    expect(student.id).toBe(riversideStudentInTomsClass);
  });

  it("refuses a teacher a student in their school they do not teach", async () => {
    await expectNotFound(assertStudentAccess(riversideTeacher, riversideStudentNotInTomsClass));
  });

  it("refuses any cross-school student lookup", async () => {
    await expectNotFound(assertStudentAccess(riversideAdmin, oakfieldStudentId));
    await expectNotFound(assertStudentAccess(riversideTeacher, oakfieldStudentId));
    await expectNotFound(assertStudentAccess(oakfieldAdmin, riversideStudentInTomsClass));
  });

  it("refuses a teacher membership id passed where a student is expected", async () => {
    await expectNotFound(assertStudentAccess(riversideAdmin, riversideTeacher.membershipId));
  });
});

describe("assertGuardianAccess", () => {
  it("lets a parent see their own child", async () => {
    const link = await assertGuardianAccess(parentUserId, parentChildRiverside);
    expect(link.studentMembershipId).toBe(parentChildRiverside);
  });

  it("refuses a parent a child who is not theirs", async () => {
    // Same school, same class even — but not their child.
    await expectNotFound(assertGuardianAccess(parentUserId, unrelatedStudentId));
  });

  it("refuses a parent a child in another school they have no link to", async () => {
    await expectNotFound(assertGuardianAccess(parentUserId, oakfieldStudentId));
  });

  it("refuses a teacher trying to use the guardian path", async () => {
    const tomUser = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
    await expectNotFound(assertGuardianAccess(tomUser.id, parentChildRiverside));
  });

  it("still works for a parent whose children span two schools", async () => {
    const links = await db.guardianship.findMany({
      where: { parentUserId, status: "ACTIVE" },
      include: { student: { select: { schoolId: true } } },
    });
    // The seed deliberately links this parent across both schools.
    expect(new Set(links.map((l) => l.student.schoolId)).size).toBe(2);
    for (const link of links) {
      await expect(
        assertGuardianAccess(parentUserId, link.studentMembershipId),
      ).resolves.toBeTruthy();
    }
  });
});

describe("assertAssignmentAccess", () => {
  it("refuses an assignment from another school", async () => {
    const assignment = await db.assignment.findFirst({
      where: { class: { id: priyaClassId } },
      select: { id: true },
    });
    if (!assignment) return; // seed only puts assignments on one class
    await expectNotFound(assertAssignmentAccess(oakfieldAdmin, assignment.id));
  });

  it("refuses a teacher an assignment for a class they do not teach", async () => {
    const assignment = await db.assignment.findFirst({
      where: { classId: priyaClassId },
      select: { id: true },
    });
    if (!assignment) return;
    await expectNotFound(assertAssignmentAccess(riversideTeacher, assignment.id));
  });
});

describe("teacherClassIds", () => {
  it("returns only the classes that teacher leads", async () => {
    const ids = await teacherClassIds(riversideTeacher.schoolId, riversideTeacher.membershipId);
    expect(ids).toContain(tomClassId);
    expect(ids).not.toContain(priyaClassId);
  });

  it("returns nothing when asked with another school's id", async () => {
    const ids = await teacherClassIds(oakfieldAdmin.schoolId, riversideTeacher.membershipId);
    expect(ids).toEqual([]);
  });

  it("does not return two teachers the same list", async () => {
    const tom = await teacherClassIds(riversideTeacher.schoolId, riversideTeacher.membershipId);
    const priya = await teacherClassIds(otherTeacher.schoolId, otherTeacher.membershipId);
    expect(tom).not.toEqual(priya);
  });
});

describe("scope", () => {
  it("forces schoolId into a merged filter even when the caller supplies one", () => {
    const merged = scope("school-a").and({ schoolId: "school-b", role: "STUDENT" });
    // The caller's attempt to override loses. That is the whole point.
    expect(merged.schoolId).toBe("school-a");
    expect(merged.role).toBe("STUDENT");
  });
});
