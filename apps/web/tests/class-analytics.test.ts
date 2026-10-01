/**
 * A class as numbers (class-analytics.ts, through GET
 * /teaching/classes/{classId}/analytics): the attendance rate and its weekly
 * trend, each exam's average and spread, hand-ins made and late, and the
 * three flags — attendance under 75 %, marks lower at each of the last two
 * exams, three late hand-ins — each on the pupil that earns it and on
 * nobody else. The class's teacher and the office read it; a teacher of
 * another class is not shown the class at all. The window is the term
 * today falls in, or the last thirty days.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as analyticsGet } from "@/app/api/v1/teaching/classes/[classId]/analytics/route";
import { addDaysToKey, todayKey, zonedStartOfDay } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let adminUserId = "";
let userA = "";
let userB = "";
let teacherA = "";
let classA = "";
let pupilLow = "";
let pupilFalling = "";
let pupilLate = "";
let pupilFine = "";
const today = todayKey(TZ);
const day = (back: number) => addDaysToKey(today, -back);
const at = (key: string) => zonedStartOfDay(key, TZ);

const read = (classId: string, window?: string) => analyticsGet(new Request(`http://localhost/api/v1/teaching/classes/${classId}/analytics${window ? `?window=${window}` : ""}`), { params: Promise.resolve({ classId }) });
async function as(who: "ADMIN" | "A" | "B" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "A") await createSession(userA, { schoolId, role: "TEACHER" });
  if (who === "B") await createSession(userB, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Analytics School ${STAMP}`, slug: `zz-analytics-${STAMP}`, code: `ZN${suffix}`, contactEmail: `zz-analytics-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Analytics ${who}`, email: `zz-analytics-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, a, b, low, falling, late, fine] = await Promise.all([mk("Admin"), mk("Asha"), mk("Bhavna"), mk("Low"), mk("Falling"), mk("Late"), mk("Fine")]);
  adminUserId = admin.id;
  userA = a.id;
  userB = b.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  teacherA = (await db.membership.create({ data: { userId: userA, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const teacherB = (await db.membership.create({ data: { userId: userB, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const pupil = async (u: { id: string }, code: string) => (await db.membership.create({ data: { userId: u.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `${code}${STAMP}`, gradeLevel: "8" }, select: { id: true } })).id;
  pupilLow = await pupil(low, "ZNL");
  pupilFalling = await pupil(falling, "ZNF");
  pupilLate = await pupil(late, "ZNT");
  pupilFine = await pupil(fine, "ZNX");
  classA = (await db.class.create({ data: { schoolId, name: "ZZ 8A", gradeLevel: "8", joinCode: `ZN1${suffix}` }, select: { id: true } })).id;
  const classB = (await db.class.create({ data: { schoolId, name: "ZZ 8B", gradeLevel: "8", joinCode: `ZN2${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.createMany({ data: [{ schoolId, classId: classA, teacherMembershipId: teacherA, role: "LEAD" }, { schoolId, classId: classB, teacherMembershipId: teacherB, role: "LEAD" }] });
  await db.enrollment.createMany({ data: [pupilLow, pupilFalling, pupilLate, pupilFine].map((studentMembershipId) => ({ schoolId, classId: classA, studentMembershipId, status: "ACTIVE" })) });
  // A year and a term that hold today, so the term window is the term's.
  const year = await db.academicYear.create({ data: { schoolId, name: "ZZ 2026–27", startDate: at(day(120)), endDate: at(addDaysToKey(today, 200)), isCurrent: true }, select: { id: true } });
  await db.term.create({ data: { schoolId, academicYearId: year.id, name: "ZZ Term 1", startDate: at(day(60)), endDate: at(addDaysToKey(today, 30)), position: 1 } });
  // Four registers in the last fortnight: Low is absent on two of them (50 %), everyone else present.
  for (const back of [10, 7, 3, 1]) {
    const session = await db.attendanceSession.create({ data: { schoolId, classId: classA, dateKey: day(back), takenByMembershipId: teacherA }, select: { id: true } });
    await db.attendanceRecord.createMany({
      data: [pupilLow, pupilFalling, pupilLate, pupilFine].map((studentMembershipId) => ({ schoolId, sessionId: session.id, studentMembershipId, status: studentMembershipId === pupilLow && back >= 7 ? "ABSENT" : "PRESENT" })),
    });
  }
  // Three exams in the term, oldest first: Falling goes 80, 70, 60; Fine goes 60, 70, 80; Low and Late sit only the last one.
  const scores: Record<string, number[]> = { [pupilFalling]: [80, 70, 60], [pupilFine]: [60, 70, 80] };
  for (const [i, back] of [40, 20, 5].entries()) {
    const series = await db.examSeries.create({ data: { schoolId, name: `ZZ Exam ${i + 1}`, gradeLevel: "8", kind: "UNIT_TEST" }, select: { id: true } });
    const slot = await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Mathematics", dateKey: day(back), pointsMilli: 100_000 }, select: { id: true } });
    const sitting = await db.assignment.create({ data: { schoolId, classId: classA, authorMembershipId: teacherA, title: `ZZ Exam ${i + 1}`, examSlotId: slot.id, publishedAt: new Date() }, select: { id: true } });
    const marked = i === 2 ? [pupilFalling, pupilFine, pupilLow, pupilLate] : [pupilFalling, pupilFine];
    await db.grade.createMany({ data: marked.map((studentMembershipId) => ({ schoolId, assignmentId: sitting.id, studentMembershipId, scoreMilli: (scores[studentMembershipId]?.[i] ?? 50) * 1000 })) });
  }
  // Three pieces of work due in the window: Late hands each in a day late; Fine on time; Low and Falling not at all.
  for (const back of [9, 6, 2]) {
    const due = at(day(back));
    const work = await db.assignment.create({ data: { schoolId, classId: classA, authorMembershipId: teacherA, title: `ZZ Work ${back}`, publishedAt: at(day(back + 3)), dueAt: due }, select: { id: true } });
    await db.submission.createMany({
      data: [
        { schoolId, assignmentId: work.id, studentMembershipId: pupilLate, status: "SUBMITTED", submittedAt: new Date(due.getTime() + 86_400_000) },
        { schoolId, assignmentId: work.id, studentMembershipId: pupilFine, status: "SUBMITTED", submittedAt: new Date(due.getTime() - 3_600_000) },
      ],
    });
  }
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, userA, userB] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who reads", () => {
  it("401 signed out; a teacher of another class is shown nothing (404); the class's teacher and the office read", async () => {
    await as(null);
    expect((await read(classA)).status).toBe(401);
    await as("B");
    expect((await read(classA)).status).toBe(404);
    await as("ADMIN");
    expect((await read(classA)).status).toBe(200);
    await as("A");
    expect((await read(classA, "week")).status).toBe(422);
    expect((await read(classA)).status).toBe(200);
  });
});

describe("the numbers", () => {
  it("the term window names the term; attendance is present and late over every mark; the trend is week by week", async () => {
    await as("A");
    const d = await (await read(classA)).json();
    expect(d).toMatchObject({ classId: classA, className: "ZZ 8A", window: "term", windowName: "ZZ Term 1", fromDateKey: day(60), toDateKey: today, pupils: 4 });
    // 16 marks, 2 absent.
    expect(d.attendance).toMatchObject({ percent: 87.5, marks: 16, registers: 4 });
    expect(d.attendance.trend.length).toBeGreaterThanOrEqual(9);
    expect(d.attendance.trend.reduce((n: number, p: { marks: number }) => n + p.marks, 0)).toBe(16);
    expect(d.attendance.trend[d.attendance.trend.length - 1].label).toBe([today.slice(8, 10), today.slice(5, 7)].join("/"));
  });

  it("each exam in the window has its average and spread; the hand-ins count expected, made, late and missing", async () => {
    await as("A");
    const d = await (await read(classA)).json();
    expect(d.exams.map((e: { name: string }) => e.name)).toEqual(["ZZ Exam 1", "ZZ Exam 2", "ZZ Exam 3"]);
    expect(d.exams[0]).toMatchObject({ kind: "UNIT_TEST", dateKey: day(40), marked: 2, averagePercent: 70, distribution: { under33: 0, from33: 0, from50: 1, from75: 1 } });
    expect(d.exams[2]).toMatchObject({ marked: 4, averagePercent: 60, distribution: { under33: 0, from33: 0, from50: 3, from75: 1 } });
    expect(d.work).toEqual({ assignments: 3, expected: 12, submitted: 6, late: 3, missing: 6, completionPercent: 50 });
  });

  it("flags attendance under 75 %, marks lower at each of the last two exams, and three late hand-ins — each on its pupil, nobody else, by name", async () => {
    await as("A");
    const d = await (await read(classA)).json();
    expect(d.flagged.map((p: { name: string }) => p.name)).toEqual(["ZZ Analytics Falling", "ZZ Analytics Late", "ZZ Analytics Low"]);
    const by = Object.fromEntries(d.flagged.map((p: { membershipId: string }) => [p.membershipId, p]));
    expect(by[pupilLow]).toMatchObject({ flags: ["ATTENDANCE"], attendancePercent: 50, recentPercents: [], lateHandIns: 0 });
    expect(by[pupilFalling]).toMatchObject({ flags: ["MARKS_FALLING"], attendancePercent: 100, recentPercents: [80, 70, 60] });
    expect(by[pupilLate]).toMatchObject({ flags: ["LATE_WORK"], lateHandIns: 3 });
    expect(by[pupilFine]).toBeUndefined();
  });

  it("the month window is the last thirty days: two exams and the same registers, and nothing is stored", async () => {
    await as("A");
    const d = await (await read(classA, "month")).json();
    expect(d).toMatchObject({ window: "month", windowName: null, fromDateKey: day(29), toDateKey: today });
    expect(d.exams.map((e: { name: string }) => e.name)).toEqual(["ZZ Exam 2", "ZZ Exam 3"]);
    expect(d.attendance.registers).toBe(4);
    expect(await db.auditLog.count({ where: { schoolId } })).toBe(0);
  });
});
