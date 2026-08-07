import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { childWork } from "@/lib/grading";
import { AccessError } from "@/lib/tenancy";

/**
 * The homework diary: a guardian reads their own child's set work with the
 * handed-in/overdue/marked flags; a stranger's userId is a NOT_FOUND, never a
 * peek. Disposable ZZ fixtures; deletion asserted.
 */

const db = new PrismaClient();
const PUPIL_EMAIL = "zz.pupil.diary@riverside.test";
const TEACHER_EMAIL = "zz.teacher.diary@riverside.test";
const PARENT_EMAIL = "zz.parent.diary@riverside.test";
const STRANGER_EMAIL = "zz.stranger.diary@riverside.test";

let schoolId: string;
let classId: string;
let pupilMembershipId: string;
let parentUserId: string;
let strangerUserId: string;

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const [pupilUser, teacherUser, parentUser, strangerUser] = await Promise.all([
    db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ Diary Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: TEACHER_EMAIL, name: "ZZ Diary Teacher", prefs: "{}" } }),
    db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ Diary Parent", prefs: "{}" } }),
    db.user.create({ data: { email: STRANGER_EMAIL, name: "ZZ Diary Stranger", prefs: "{}" } }),
  ]);
  parentUserId = parentUser.id;
  strangerUserId = strangerUser.id;

  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  pupilMembershipId = pupilMembership.id;
  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Diary Class", gradeLevel: "5", joinCode: "ZZDIARY001" },
  });
  classId = klass.id;
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilMembership.id },
  });
  await db.guardianship.create({
    data: { parentUserId: parentUser.id, studentMembershipId: pupilMembership.id, studentSchoolId: schoolId },
  });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // One overdue, one handed in and due later, one marked with a comment.
  const overdue = await db.assignment.create({
    data: {
      schoolId,
      classId,
      authorMembershipId: teacherMembership.id,
      title: "ZZ Fractions sheet",
      dueAt: yesterday,
      publishedAt: new Date(),
    },
  });
  void overdue;
  const handedIn = await db.assignment.create({
    data: {
      schoolId,
      classId,
      authorMembershipId: teacherMembership.id,
      title: "ZZ Reading log",
      dueAt: nextWeek,
      publishedAt: new Date(),
    },
  });
  await db.submission.create({
    data: {
      schoolId,
      assignmentId: handedIn.id,
      studentMembershipId: pupilMembership.id,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  const marked = await db.assignment.create({
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
      assignmentId: marked.id,
      studentMembershipId: pupilMembership.id,
      scoreMilli: 9_000,
      comment: "Lovely work",
    },
  });
});

afterAll(async () => {
  await db.grade.deleteMany({ where: { assignment: { classId } } });
  await db.submission.deleteMany({ where: { assignment: { classId } } });
  await db.assignment.deleteMany({ where: { classId } });
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  for (const email of [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL, STRANGER_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(
    await db.user.count({
      where: { email: { in: [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL, STRANGER_EMAIL] } },
    }),
  ).toBe(0);
  await db.$disconnect();
});

describe("the homework diary", () => {
  it("shows the guardian what was set, what went in, and what came back", async () => {
    const diary = await childWork(parentUserId, pupilMembershipId);
    expect(diary.childName).toBe("ZZ Diary Pupil");

    const overdue = diary.upcoming.find((r) => r.title === "ZZ Fractions sheet");
    expect(overdue?.overdue).toBe(true);
    expect(overdue?.submittedAt).toBeNull();

    const handedIn = diary.upcoming.find((r) => r.title === "ZZ Reading log");
    expect(handedIn?.submittedAt).not.toBeNull();
    expect(handedIn?.overdue).toBe(false);

    const marked = diary.past.find((r) => r.title === "ZZ Spelling test");
    expect(marked?.scoreMilli).toBe(9_000);
    expect(marked?.comment).toBe("Lovely work");
  });

  it("a stranger gets NOT_FOUND, not a peek", async () => {
    await expect(childWork(strangerUserId, pupilMembershipId)).rejects.toThrow(AccessError);
  });
});
