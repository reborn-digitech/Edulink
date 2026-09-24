import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createSeries,
  addSlot,
  removeSlot,
  publishSeries,
  dateSheetsFor,
  examClassesFor,
  marksGrid,
  saveMarks,
  ensureSittings,
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

/**
 * Holidays quarantined for the suite's two date windows and put back after.
 *
 * ⚠ THE SUITE USED TO ASSUME RIVERSIDE'S CALENDAR WAS EMPTY where it
 * scheduled papers — and `npm run demo:seed` puts Ganesh Chaturthi on the
 * exact September day the first paper lands, so running the documented demo
 * seed broke six exam tests with "paperOnHoliday". A test that depends on
 * another tool never having run is a test that fails on somebody else's
 * machine first. Rows are captured and restored, not deleted: the demo
 * content is not this suite's to discard.
 */
type ParkedHoliday = { name: string; startDateKey: string; endDateKey: string; kind: string };
let parkedHolidays: ParkedHoliday[] = [];

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const colliding = await db.holiday.findMany({
    where: {
      schoolId,
      OR: [
        { startDateKey: { lte: "2026-09-20" }, endDateKey: { gte: "2026-09-10" } },
        { startDateKey: { lte: "2026-11-20" }, endDateKey: { gte: "2026-11-05" } },
      ],
      NOT: { name: "ZZ Guard Break" },
    },
    select: { name: true, startDateKey: true, endDateKey: true, kind: true },
  });
  parkedHolidays = colliding;
  if (colliding.length > 0) {
    await db.holiday.deleteMany({ where: { schoolId, name: { in: colliding.map((h) => h.name) } } });
  }

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
  for (const h of parkedHolidays) {
    await db.holiday.create({ data: { schoolId, ...h } }).catch(() => {});
  }
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

describe("a series name comes round every year", () => {
  it("⚠ a new 'Unit Test 1' never resurrects last year's archived one", async () => {
    const first = await createSeries(admin, { name: "ZZ Unit Test 1", gradeLevel: GRADE });
    await db.examSeries.update({ where: { id: first }, data: { archivedAt: new Date("2025-04-30T00:00:00Z") } });
    const second = await createSeries(admin, { name: "ZZ Unit Test 1", gradeLevel: GRADE });
    expect(second).not.toBe(first);
    const old = await db.examSeries.findUniqueOrThrow({ where: { id: first } });
    expect(old.archivedAt).not.toBeNull();
    expect(old.name).toBe("ZZ Unit Test 1 (2025-04-30)");
    await db.examSeries.deleteMany({ where: { id: { in: [first, second] } } });
  });

  it("⚠ two years archived on the SAME DAY still both step aside", async () => {
    // A school catching up on two overdue year-closes archives both years'
    // "Unit Test 1" with the same date-stamp — and the second rename used to
    // collide with the first on the unique, killing series creation for that
    // grade and name for good. The third year of a three-year simulation hit
    // it on its first exam.
    const sameDay = new Date("2026-08-28T00:00:00Z");
    const first = await createSeries(admin, { name: "ZZ Unit Test 1", gradeLevel: GRADE });
    await db.examSeries.update({ where: { id: first }, data: { archivedAt: sameDay } });
    const second = await createSeries(admin, { name: "ZZ Unit Test 1", gradeLevel: GRADE });
    await db.examSeries.update({ where: { id: second }, data: { archivedAt: sameDay } });
    const third = await createSeries(admin, { name: "ZZ Unit Test 1", gradeLevel: GRADE });

    const oldFirst = await db.examSeries.findUniqueOrThrow({ where: { id: first } });
    const oldSecond = await db.examSeries.findUniqueOrThrow({ where: { id: second } });
    expect(oldFirst.name).toBe("ZZ Unit Test 1 (2026-08-28)");
    expect(oldSecond.name).toBe("ZZ Unit Test 1 (2026-08-28) 2");
    const fresh = await db.examSeries.findUniqueOrThrow({ where: { id: third } });
    expect(fresh.name).toBe("ZZ Unit Test 1");
    await db.examSeries.deleteMany({ where: { id: { in: [first, second, third] } } });
  });
});


describe("the date sheet warns like the register", () => {
  let guardSeriesId: string;
  const cleanup = async () => {
    await db.holiday.deleteMany({ where: { schoolId, name: "ZZ Guard Break" } });
    if (guardSeriesId) await db.examSeries.deleteMany({ where: { id: guardSeriesId } });
    await db.examSeries.deleteMany({ where: { schoolId, name: { in: ["ZZ Guard Round", "ZZ Guard Rival"] } } });
  };
  beforeAll(async () => {
    await cleanup();
    guardSeriesId = await createSeries(admin, { name: "ZZ Guard Round", gradeLevel: GRADE });
  });
  afterAll(cleanup);

  it("⚠ refuses a paper inside a holiday BY NAME, and a Sunday — unless the office insists", async () => {
    await db.holiday.create({ data: { schoolId, name: "ZZ Guard Break", startDateKey: "2026-11-09", endDateKey: "2026-11-13", kind: "HOLIDAY" } });
    await expect(addSlot(admin, guardSeriesId, { subject: "Science", dateKey: "2026-11-10", maxMarks: 50 }))
      .rejects.toMatchObject({ key: "access.paperOnHoliday", vars: { name: "ZZ Guard Break" } });
    // 2026-11-15 is a Sunday.
    await expect(addSlot(admin, guardSeriesId, { subject: "Science", dateKey: "2026-11-15", maxMarks: 50 }))
      .rejects.toMatchObject({ key: "access.paperOnSunday" });
    // An EXAM span is on the calendar but the school is OPEN — no refusal.
    await addSlot(admin, guardSeriesId, { subject: "Science", dateKey: "2026-11-16", maxMarks: 50 });
    // The office insists: the override schedules it.
    await addSlot(admin, guardSeriesId, { subject: "Drawing", dateKey: "2026-11-10", maxMarks: 50, evenIfClosed: true });
    expect(await db.examSlot.count({ where: { seriesId: guardSeriesId } })).toBe(2);
  });

  it("⚠ refuses two papers of one grade at the same time; different times on one day are fine", async () => {
    await addSlot(admin, guardSeriesId, { subject: "Maths", dateKey: "2026-11-17", maxMarks: 80, startMinute: 540, endMinute: 660 });
    const rival = await createSeries(admin, { name: "ZZ Guard Rival", gradeLevel: GRADE });
    await expect(
      addSlot(admin, rival, { subject: "History", dateKey: "2026-11-17", maxMarks: 50, startMinute: 600, endMinute: 720 }),
    ).rejects.toMatchObject({ key: "access.papersClash", vars: { subject: "Maths" } });
    // Afternoon after the morning paper: no overlap, no refusal.
    await addSlot(admin, rival, { subject: "History", dateKey: "2026-11-17", maxMarks: 50, startMinute: 780, endMinute: 900 });

    // ⚠ The SAME series clashes too — a battery scheduled an overlapping
    // paper into its own series and the first guard let it by.
    await expect(
      addSlot(admin, guardSeriesId, { subject: "Geography", dateKey: "2026-11-17", maxMarks: 50, startMinute: 600, endMinute: 700 }),
    ).rejects.toMatchObject({ key: "access.papersClash", vars: { subject: "Maths" } });
    // Moving a subject's OWN time never clashes with its old self.
    await addSlot(admin, guardSeriesId, { subject: "Maths", dateKey: "2026-11-17", maxMarks: 80, startMinute: 555, endMinute: 675 });
    // ⚠ And the refused Geography was never written — a refusal that
    // persists its row is worse than no refusal at all.
    expect(await db.examSlot.count({ where: { seriesId: guardSeriesId, subject: "Geography" } })).toBe(0);
  });

  it("⚠ refuses to remove a paper with marks saved", async () => {
    // A mark of our own, on our own paper — the guard must fire on one row.
    const slot = await db.examSlot.findFirstOrThrow({ where: { seriesId: guardSeriesId, subject: "Science" }, select: { id: true } });
    const assignment = await db.assignment.create({
      data: {
        schoolId,
        classId,
        title: "ZZ Guard Sitting",
        pointsMilli: 50_000,
        examSlotId: slot.id,
        publishedAt: new Date(),
        authorMembershipId: (await db.classTeacher.findFirstOrThrow({ where: { classId } })).teacherMembershipId,
      },
    });
    await db.grade.create({
      data: { schoolId, assignmentId: assignment.id, studentMembershipId: pupilMembershipId, scoreMilli: 40_000, gradedByMembershipId: null },
    });
    try {
      await expect(removeSlot(admin, slot.id)).rejects.toMatchObject({ key: "access.paperHasMarks", vars: { count: 1 } });
    } finally {
      await db.grade.deleteMany({ where: { assignmentId: assignment.id } });
      await db.assignment.deleteMany({ where: { id: assignment.id } });
    }
    // An unmarked one goes quietly.
    const unmarked = await db.examSlot.findFirstOrThrow({ where: { seriesId: guardSeriesId, subject: "Drawing" } });
    await removeSlot(admin, unmarked.id);
  });
});

describe("the term and the sittings follow the sheet", () => {
  // A year of its own, far in the past, so no seeded term and no holiday
  // touches it. Riverside teaches Monday to Saturday; every date below is a
  // weekday. Terms cascade with the year.
  const YEAR_NAME = "ZZ EXAMS TERMS 1997";
  const SERIES_NAME = "ZZ Termed Round";
  let yearId: string;
  let term1Id: string;
  let term2Id: string;
  let termedSeriesId: string;

  const termOf = async (id: string) =>
    (await db.examSeries.findUniqueOrThrow({ where: { id }, select: { termId: true } })).termId;
  const cleanup = async () => {
    const series = await db.examSeries.findMany({
      where: { schoolId, gradeLevel: GRADE, name: { startsWith: SERIES_NAME } },
      select: { id: true },
    });
    const ids = series.map((s) => s.id);
    await db.assignment.deleteMany({ where: { examSlot: { seriesId: { in: ids } } } });
    await db.examSeries.deleteMany({ where: { id: { in: ids } } });
    await db.academicYear.deleteMany({ where: { schoolId, name: YEAR_NAME } });
  };

  beforeAll(async () => {
    await cleanup();
    yearId = (
      await db.academicYear.create({
        data: { schoolId, name: YEAR_NAME, startDate: new Date("1997-06-01T00:00:00Z"), endDate: new Date("1998-04-30T00:00:00Z") },
      })
    ).id;
    term1Id = (
      await db.term.create({
        data: { schoolId, academicYearId: yearId, name: "ZZ Term 1", position: 1, startDate: new Date("1997-06-01T00:00:00Z"), endDate: new Date("1997-09-30T00:00:00Z") },
      })
    ).id;
    term2Id = (
      await db.term.create({
        data: { schoolId, academicYearId: yearId, name: "ZZ Term 2", position: 2, startDate: new Date("1997-10-01T00:00:00Z"), endDate: new Date("1997-12-20T00:00:00Z") },
      })
    ).id;
  });
  afterAll(async () => {
    await cleanup();
    expect(await db.academicYear.count({ where: { id: yearId } })).toBe(0);
  });

  it("⚠ a series takes the term of its EARLIEST paper, and follows it as the sheet changes", async () => {
    termedSeriesId = await createSeries(admin, { name: SERIES_NAME, gradeLevel: GRADE });
    expect(await termOf(termedSeriesId)).toBeNull(); // no paper yet, nothing to place it by

    // Papers inside Term 1: the series reports into Term 1.
    await addSlot(admin, termedSeriesId, { subject: "Maths", dateKey: "1997-07-15", maxMarks: 80 });
    await addSlot(admin, termedSeriesId, { subject: "Science", dateKey: "1997-08-12", maxMarks: 50 });
    expect(await termOf(termedSeriesId)).toBe(term1Id);

    // Moving the LATER paper into Term 2 changes nothing: the earliest still sits in Term 1.
    await addSlot(admin, termedSeriesId, { subject: "Science", dateKey: "1997-10-14", maxMarks: 50 });
    expect(await termOf(termedSeriesId)).toBe(term1Id);
    // Moving the FIRST paper into Term 2 too moves the series — the old
    // fill-once rule would have left it on Term 1 for good.
    await addSlot(admin, termedSeriesId, { subject: "Maths", dateKey: "1997-10-21", maxMarks: 80 });
    expect(await termOf(termedSeriesId)).toBe(term2Id);

    // A paper added back in Term 1 is now the earliest: Term 1 again…
    await addSlot(admin, termedSeriesId, { subject: "Hindi", dateKey: "1997-09-09", maxMarks: 40 });
    expect(await termOf(termedSeriesId)).toBe(term1Id);
    // …and removing it hands the series back to Term 2.
    const hindi = await db.examSlot.findFirstOrThrow({ where: { seriesId: termedSeriesId, subject: "Hindi" }, select: { id: true } });
    await removeSlot(admin, hindi.id);
    expect(await termOf(termedSeriesId)).toBe(term2Id);
  });

  it("a paper outside every term leaves the series on none", async () => {
    // 1997-03-10 is a Monday before the year's first term.
    await addSlot(admin, termedSeriesId, { subject: "Maths", dateKey: "1997-03-10", maxMarks: 80 });
    expect(await termOf(termedSeriesId)).toBeNull();
    // Back inside Term 2 and the term is back.
    await addSlot(admin, termedSeriesId, { subject: "Maths", dateKey: "1997-10-21", maxMarks: 80 });
    expect(await termOf(termedSeriesId)).toBe(term2Id);
  });

  it("a term named at creation is the office's word until the first paper is dated", async () => {
    const named = await createSeries(admin, { name: `${SERIES_NAME} Named`, gradeLevel: GRADE, termId: term2Id });
    expect(await termOf(named)).toBe(term2Id);
    await addSlot(admin, named, { subject: "Maths", dateKey: "1997-07-15", maxMarks: 80 });
    expect(await termOf(named)).toBe(term1Id);
    await expect(
      createSeries(admin, { name: `${SERIES_NAME} Stranger`, gradeLevel: GRADE, termId: "not-a-term" }),
    ).rejects.toMatchObject({ key: "access.termNotFound" });
  });

  it("⚠ changing a paper's max marks updates the sitting's max — without a teacher saving marks again", async () => {
    await ensureSittings(schoolId, classId, admin.membershipId!);
    const maths = await db.examSlot.findFirstOrThrow({ where: { seriesId: termedSeriesId, subject: "Maths" }, select: { id: true } });
    const before = await db.assignment.findUniqueOrThrow({ where: { examSlotId_classId: { examSlotId: maths.id, classId } } });
    expect(before.pointsMilli).toBe(80_000);
    expect(before.title).toBe(`${SERIES_NAME} · Maths`);

    await addSlot(admin, termedSeriesId, { subject: "Maths", dateKey: "1997-10-21", maxMarks: 100 });
    const after = await db.assignment.findUniqueOrThrow({ where: { examSlotId_classId: { examSlotId: maths.id, classId } } });
    expect(after.pointsMilli).toBe(100_000);
    expect(after.id).toBe(before.id);

    // ensureSittings on a sitting already there brings it level too (it used
    // to be an empty update).
    await db.examSlot.update({ where: { id: maths.id }, data: { pointsMilli: 90_000 } });
    await ensureSittings(schoolId, classId, admin.membershipId!);
    expect((await db.assignment.findUniqueOrThrow({ where: { id: before.id } })).pointsMilli).toBe(90_000);
  });

  it("⚠ renaming the series retitles its sittings", async () => {
    // The one rename this library performs: an archived series stepping
    // aside for a new one of the same name, stamped with its archive date.
    await db.examSeries.update({ where: { id: termedSeriesId }, data: { archivedAt: new Date("1998-04-30T00:00:00Z") } });
    const fresh = await createSeries(admin, { name: SERIES_NAME, gradeLevel: GRADE });
    expect(fresh).not.toBe(termedSeriesId);
    const old = await db.examSeries.findUniqueOrThrow({ where: { id: termedSeriesId } });
    expect(old.name).toBe(`${SERIES_NAME} (1998-04-30)`);

    const sittings = await db.assignment.findMany({
      where: { classId, examSlot: { seriesId: termedSeriesId } },
      select: { title: true, examSlot: { select: { subject: true } } },
    });
    expect(sittings.length).toBeGreaterThan(0);
    for (const sitting of sittings) {
      expect(sitting.title).toBe(`${SERIES_NAME} (1998-04-30) · ${sitting.examSlot!.subject}`);
    }
  });
});
