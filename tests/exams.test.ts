import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createSeries,
  addSlot,
  publishSeries,
  dateSheetsFor,
  examClassesFor,
  marksGrid,
  saveMarks,
} from "@/lib/exams";
import { assessmentsFor } from "@/lib/report-cards";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Term exams end to end: an admin writes the date sheet, a family sees it once
 * it is published, a teacher fills the marks grid, and the marks land as
 * ordinary Grade rows on a published category-"Exam" Assignment — which is
 * exactly what the report-card builder picks up. Disposable ZZ fixtures in the
 * seeded school; deletion asserted in afterAll.
 */

const db = new PrismaClient();
const PUPIL_EMAIL = "zz.pupil.exams@riverside.test";
const TEACHER_EMAIL = "zz.teacher.exams@riverside.test";
const ADMIN_EMAIL = "zz.admin.exams@riverside.test";
const PARENT_EMAIL = "zz.parent.exams@riverside.test";
const GRADE = "3";

let schoolId: string;
let classId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let pupil: ActiveContext;
let parent: ActiveContext;
let pupilMembershipId: string;
let parentUserId: string;
let seriesId: string;
let slotId: string;

function ctxFor(
  userId: string,
  name: string,
  membershipId: string | null,
  role: "STUDENT" | "TEACHER" | "ADMIN" | "PARENT",
): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    // The real shape: a guardian's session carries no school (see the note in
    // bulletin-circulars.test.ts). dateSheetsFor must resolve it itself.
    schoolId: role === "PARENT" ? null : schoolId,
    role,
    user: {
      id: userId,
      name,
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

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const [pupilUser, teacherUser, adminUser, parentUser] = await Promise.all([
    db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ Exams Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: TEACHER_EMAIL, name: "ZZ Exams Teacher", prefs: "{}" } }),
    db.user.create({ data: { email: ADMIN_EMAIL, name: "ZZ Exams Admin", prefs: "{}" } }),
    db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ Exams Parent", prefs: "{}" } }),
  ]);
  parentUserId = parentUser.id;

  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  pupilMembershipId = pupilMembership.id;
  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });
  const adminMembership = await db.membership.create({
    data: { userId: adminUser.id, schoolId, role: "ADMIN", status: "ACTIVE" },
  });

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Exams Class", gradeLevel: GRADE, joinCode: "ZZEXAM0001" },
  });
  classId = klass.id;
  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherMembership.id, role: "LEAD" },
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

  pupil = ctxFor(pupilUser.id, "ZZ Exams Pupil", pupilMembership.id, "STUDENT");
  teacher = ctxFor(teacherUser.id, "ZZ Exams Teacher", teacherMembership.id, "TEACHER");
  admin = ctxFor(adminUser.id, "ZZ Exams Admin", adminMembership.id, "ADMIN");
  parent = ctxFor(parentUser.id, "ZZ Exams Parent", null, "PARENT");
});

afterAll(async () => {
  if (seriesId) {
    // Marks outlive the sheet by design; the fixture removes its own.
    await db.grade.deleteMany({ where: { assignment: { classId } } });
    await db.assignment.deleteMany({ where: { classId } });
    await db.examSeries.deleteMany({ where: { id: seriesId } }); // slots cascade
  }
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  for (const email of [PUPIL_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL, PARENT_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(await db.examSeries.count({ where: { schoolId, name: "ZZ Term 1" } })).toBe(0);
  expect(
    await db.user.count({
      where: { email: { in: [PUPIL_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL, PARENT_EMAIL] } },
    }),
  ).toBe(0);
  await db.$disconnect();
});

describe("term exams", () => {
  it("an admin writes the date sheet; a teacher cannot", async () => {
    seriesId = await createSeries(admin, { name: "ZZ Term 1", gradeLevel: GRADE });
    await addSlot(admin, seriesId, {
      subject: "Maths",
      dateKey: "2026-09-14",
      maxMarks: 80,
      startMinute: 540,
      endMinute: 660,
    });
    await expect(createSeries(teacher, { name: "ZZ Rogue", gradeLevel: GRADE })).rejects.toThrow(
      AccessError,
    );
    const slot = await db.examSlot.findFirstOrThrow({ where: { seriesId } });
    slotId = slot.id;
    expect(slot.pointsMilli).toBe(80_000);
  });

  it("the family sees the sheet only once it is published", async () => {
    expect(await dateSheetsFor(parent)).toHaveLength(0);
    expect(await dateSheetsFor(pupil)).toHaveLength(0);

    await publishSeries(admin, seriesId);

    const parentSheets = await dateSheetsFor(parent);
    expect(parentSheets).toHaveLength(1);
    expect(parentSheets[0]!.slots[0]!.subject).toBe("Maths");
    expect(parentSheets[0]!.slots[0]!.maxMarks).toBe(80);
    expect(parentSheets[0]!.schoolName).toBe("Riverside Primary School");
    expect((await dateSheetsFor(pupil))[0]!.name).toBe("ZZ Term 1");
  });

  it("the teacher's marks land as ordinary grades on an Exam assignment", async () => {
    const classes = await examClassesFor(teacher);
    const mine = classes.find((c) => c.id === classId);
    expect(mine?.series.map((s) => s.name)).toContain("ZZ Term 1");

    const result = await saveMarks(teacher, slotId, classId, [
      { membershipId: pupilMembershipId, marks: 67.5 },
    ]);
    expect(result.saved).toBe(1);

    const sitting = await db.assignment.findUniqueOrThrow({
      where: { examSlotId_classId: { examSlotId: slotId, classId } },
      include: { grades: true },
    });
    expect(sitting.category).toBe("Exam");
    expect(sitting.publishedAt).not.toBeNull();
    expect(sitting.grades[0]!.scoreMilli).toBe(67_500);

    // …which is exactly what the report-card builder offers the class teacher.
    const assessments = await assessmentsFor(teacher, classId);
    const exam = assessments.find((a) => a.assignmentId === sitting.id);
    expect(exam).toBeDefined();
    expect(exam!.gradedCount).toBe(1);
  });

  it("a blank clears the mark rather than writing a zero", async () => {
    const grid = await marksGrid(teacher, slotId, classId);
    expect(grid.pupils[0]!.marks).toBe(67.5);

    const result = await saveMarks(teacher, slotId, classId, [
      { membershipId: pupilMembershipId, marks: null },
    ]);
    expect(result.cleared).toBe(1);
    expect((await marksGrid(teacher, slotId, classId)).pupils[0]!.marks).toBeNull();
  });

  it("marks over the maximum are refused whole", async () => {
    await expect(
      saveMarks(teacher, slotId, classId, [{ membershipId: pupilMembershipId, marks: 81 }]),
    ).rejects.toThrow(AccessError);
  });
});
