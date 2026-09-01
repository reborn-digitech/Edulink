import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { closeAcademicYear, reopenAcademicYear } from "@/lib/academic-year";
import { finishTerm, reopenTerm } from "@/lib/terms";
import { saveMarks } from "@/lib/exams";
import { saveGrades } from "@/lib/grading";
import { assignTeacher } from "@/lib/cohort";
import type { ActiveContext } from "@/lib/session";

/**
 * The year's milestones, and what finishing one locks.
 *
 * What is pinned: the PRINCIPAL shares the year's lifecycle with the admin
 * (finish a term, close a year, reopen one); a finished term is a reversible
 * milestone; a CLOSED year freezes marks against TEACHERS — the exam grid and
 * the gradebook both — while the office keeps the pen; reopening is offered
 * for the latest closed year only, brings back the exam series that close
 * archived, and unfreezes the marks; and a SUBJECT teacher is attached to a
 * class without the register, while the same person can be LEAD of another.
 */

const db = new PrismaClient();
const STAMP = Date.now();

const Y1_START = new Date("2024-06-01T00:00:00.000Z");
const Y1_END = new Date("2025-04-30T00:00:00.000Z");

let schoolId = "";
let y0 = ""; // an older, already-closed year — the "not the latest" case
let y1 = "";
let y2 = "";
let termId = "";
let classId = "";
let otherClassId = "";
let slotId = "";
let assignmentId = "";
let admin: ActiveContext;
let principal: ActiveContext;
let teacher: ActiveContext;
let teacherM = "";
let subjectM = "";
let pupilM = "";

function ctx(over: { userId: string; membershipId?: string | null; role?: ActiveContext["role"] }): ActiveContext {
  return {
    sessionId: "test", membershipId: over.membershipId ?? null, schoolId, role: over.role ?? null,
    user: {
      id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Lifecycle High ${STAMP}`,
      slug: `zz-lifecycle-${STAMP}`,
      code: `ZL${String(STAMP).slice(-6)}`,
      contactEmail: `zz-lifecycle-${STAMP}@test.invalid`,
      timezone: "Asia/Kolkata",
    },
  });
  schoolId = school.id;

  y0 = (await db.academicYear.create({ data: { schoolId, name: "ZZ 2023–24", startDate: new Date("2023-06-01T00:00:00Z"), endDate: new Date("2024-04-30T00:00:00Z"), isCurrent: false, closedAt: new Date("2024-05-01T00:00:00Z") } })).id;
  y1 = (await db.academicYear.create({ data: { schoolId, name: "ZZ 2024–25", startDate: Y1_START, endDate: Y1_END, isCurrent: true } })).id;
  y2 = (await db.academicYear.create({ data: { schoolId, name: "ZZ 2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false } })).id;
  termId = (await db.term.create({ data: { schoolId, academicYearId: y1, name: "ZZ Term 1", startDate: Y1_START, endDate: new Date("2024-11-30T00:00:00Z") } })).id;

  const mkUser = (tag: string) => db.user.create({ data: { name: `ZZ LC ${tag}`, email: `zz-lc-${tag}-${STAMP}@test.invalid`, prefs: "{}" } });
  const adminU = await mkUser("admin");
  const principalU = await mkUser("principal");
  const teacherU = await mkUser("teacher");
  const subjectU = await mkUser("subject");
  const pupilU = await mkUser("pupil");
  const mk = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
  const adminM = (await mk(adminU.id, "ADMIN")).id;
  const principalM = (await mk(principalU.id, "PRINCIPAL")).id;
  teacherM = (await mk(teacherU.id, "TEACHER")).id;
  subjectM = (await mk(subjectU.id, "TEACHER")).id;
  pupilM = (await mk(pupilU.id, "STUDENT")).id;
  admin = ctx({ userId: adminU.id, membershipId: adminM, role: "ADMIN" });
  principal = ctx({ userId: principalU.id, membershipId: principalM, role: "PRINCIPAL" });
  teacher = ctx({ userId: teacherU.id, membershipId: teacherM, role: "TEACHER" });

  classId = (await db.class.create({ data: { schoolId, name: "ZZ LC 5A", gradeLevel: "5", section: "A", joinCode: `ZLC${String(STAMP).slice(-5)}` } })).id;
  otherClassId = (await db.class.create({ data: { schoolId, name: "ZZ LC 6A", gradeLevel: "6", section: "A", joinCode: `ZLD${String(STAMP).slice(-5)}` } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: teacherM, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupilM, status: "ACTIVE" } });

  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ LC Round", gradeLevel: "5", kind: "MID_TERM" } });
  slotId = (await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Maths", dateKey: "2024-09-20", pointsMilli: 80000 } })).id;

  assignmentId = (await db.assignment.create({
    data: { schoolId, classId, authorMembershipId: teacherM, title: "ZZ LC Homework", pointsMilli: 10000, createdAt: new Date("2024-08-01T00:00:00Z"), publishedAt: new Date("2024-08-01T00:00:00Z") },
  })).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } }); // cascades the rest
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the term milestone", () => {
  it("⚠ the principal marks a term finished, and can take it back", async () => {
    const done = await finishTerm(principal, termId);
    expect(done.termId).toBe(termId);
    expect((await db.term.findUniqueOrThrow({ where: { id: termId } })).finishedAt).not.toBeNull();

    const undone = await reopenTerm(principal, termId);
    expect(undone.termId).toBe(termId);
    expect((await db.term.findUniqueOrThrow({ where: { id: termId } })).finishedAt).toBeNull();
  });

  it("⚠ a teacher may not", async () => {
    await expect(finishTerm(teacher, termId)).rejects.toBeInstanceOf(AccessError);
  });

  /**
   * ⚠ A refusal is THROWN, not soft-returned — the contract the two-school
   * stress test flagged as inconsistent with every neighbouring guard. A term
   * id from ANOTHER school (or one that does not exist) throws NOT_FOUND, and
   * the real term is never touched.
   */
  it("⚠ refuses a term from another school by throwing, and touches nothing", async () => {
    const other = await db.school.create({
      data: { name: `ZZ LC Other ${STAMP}`, slug: `zz-lc-other-${STAMP}`, code: `ZO${String(STAMP).slice(-6)}`, contactEmail: `zz-lc-other-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    });
    const otherYear = await db.academicYear.create({ data: { schoolId: other.id, name: "ZZ Other Year", startDate: Y1_START, endDate: Y1_END } });
    const otherTerm = await db.term.create({ data: { schoolId: other.id, academicYearId: otherYear.id, name: "ZZ Other Term", startDate: Y1_START, endDate: Y1_END } });

    await expect(finishTerm(admin, otherTerm.id)).rejects.toMatchObject({ key: "access.termNotFound", code: "NOT_FOUND" });
    await expect(reopenTerm(admin, otherTerm.id)).rejects.toMatchObject({ key: "access.termNotFound", code: "NOT_FOUND" });
    // The other school's term is untouched by the refused cross-tenant call.
    expect((await db.term.findUniqueOrThrow({ where: { id: otherTerm.id } })).finishedAt).toBeNull();

    // A wholly unknown id throws the same way.
    await expect(finishTerm(admin, "not-a-real-term-id")).rejects.toMatchObject({ key: "access.termNotFound" });

    await db.school.delete({ where: { id: other.id } });
  });
});

describe("finishing the year freezes marks", () => {
  it("⚠ a teacher writes while the year runs, is refused once it closes — the office is not", async () => {
    // While open: the teacher's pen works in both books.
    await saveMarks(teacher, slotId, classId, [{ membershipId: pupilM, marks: 60 }]);
    await saveGrades(
      { schoolId, membershipId: teacherM, role: "TEACHER", userId: teacher.user.id },
      assignmentId,
      [{ studentMembershipId: pupilM, score: 8 }],
    );

    // THE PRINCIPAL closes the year — the shared milestone.
    const closed = await closeAcademicYear(principal, y1, y2);
    expect(closed.studentsArchived).toBe(1);
    expect((await db.examSeries.findFirstOrThrow({ where: { schoolId, gradeLevel: "5" } })).archivedAt).not.toBeNull();

    // Now the teacher's pen is refused by name, in both books…
    await expect(saveMarks(teacher, slotId, classId, [{ membershipId: pupilM, marks: 70 }])).rejects.toMatchObject({ key: "access.yearFinishedMarksLocked" });
    await expect(
      saveGrades({ schoolId, membershipId: teacherM, role: "TEACHER", userId: teacher.user.id }, assignmentId, [{ studentMembershipId: pupilM, score: 9 }]),
    ).rejects.toMatchObject({ key: "access.yearFinishedMarksLocked" });

    // …while the office still holds it.
    await saveMarks(admin, slotId, classId, [{ membershipId: pupilM, marks: 62 }]);
  });

  it("⚠ only the LATEST closed year reopens; reopening restores the series and the pen", async () => {
    await expect(reopenAcademicYear(admin, y0)).rejects.toMatchObject({ key: "access.onlyTheLatestClosedYearReopens" });

    const result = await reopenAcademicYear(admin, y1);
    expect(result.seriesRestored).toBeGreaterThanOrEqual(1);

    const year = await db.academicYear.findUniqueOrThrow({ where: { id: y1 } });
    expect(year.closedAt).toBeNull();
    expect(year.isCurrent).toBe(true);
    expect((await db.academicYear.findUniqueOrThrow({ where: { id: y2 } })).isCurrent).toBe(false);
    expect((await db.examSeries.findFirstOrThrow({ where: { schoolId, gradeLevel: "5" } })).archivedAt).toBeNull();

    // The teacher writes again.
    await saveMarks(teacher, slotId, classId, [{ membershipId: pupilM, marks: 71 }]);
  });
});

describe("the subject teacher", () => {
  it("⚠ teaches without the register — and is class teacher of another class all the same", async () => {
    const asSubject = await assignTeacher(admin, classId, subjectM, { role: "SUBJECT" });
    expect(asSubject.ok).toBe(true);
    const subjectRow = await db.classTeacher.findUniqueOrThrow({
      where: { classId_teacherMembershipId: { classId, teacherMembershipId: subjectM } },
    });
    expect(subjectRow.role).toBe("SUBJECT");
    expect(subjectRow.canTakeAttendance).toBe(false);

    const asLead = await assignTeacher(admin, otherClassId, subjectM, { role: "LEAD" });
    expect(asLead.ok).toBe(true);
    const leadRow = await db.classTeacher.findUniqueOrThrow({
      where: { classId_teacherMembershipId: { classId: otherClassId, teacherMembershipId: subjectM } },
    });
    expect(leadRow.role).toBe("LEAD");
    expect(leadRow.canTakeAttendance).toBe(true);
  });
});
