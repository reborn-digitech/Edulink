/**
 * The school across terms (analytics-longitudinal.ts, through GET
 * /principal/trends): two terms of marks and registers make two points,
 * each with its attendance, exam average by subject and by teacher, the
 * share of pupils over the school's pass line, fees collected and
 * incidents; last year's grade sits beside this year's; another school's
 * rows are absent; the head and the office read, a teacher does not; the
 * pass line is read off the school's bands.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as trendsGet } from "@/app/api/v1/principal/trends/route";
import { passLineOf } from "@/lib/analytics-longitudinal";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let otherSchoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let teacherA = "";
let teacherB = "";
let pupil1 = "";
let pupil2 = "";

const read = (query = "") => trendsGet(new Request(`http://localhost/api/v1/principal/trends${query}`));
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
}
const d = (key: string) => new Date(`${key}T00:00:00.000Z`);

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Trends School ${STAMP}`, slug: `zz-trends-${STAMP}`, code: `ZR${suffix}`, contactEmail: `zz-trends-${STAMP}@test.invalid`, timezone: TZ, reportCardConfig: JSON.stringify({ preset: "mh5", bands: [{ label: "A", minPercent: 75, points: null, descriptor: "" }, { label: "D", minPercent: 35, points: null, descriptor: "" }, { label: "E", minPercent: 0, points: null, descriptor: "" }] }) }, select: { id: true } })).id;
  otherSchoolId = (await db.school.create({ data: { name: `ZZ Trends Other ${STAMP}`, slug: `zz-trends-other-${STAMP}`, code: `ZQ${suffix}`, contactEmail: `zz-trends-other-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Trends ${who}`, email: `zz-trends-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, b, p1, p2, op] = await Promise.all([mk("Admin"), mk("Head"), mk("Asha"), mk("Bhavna"), mk("Pupil1"), mk("Pupil2"), mk("Otherpupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }] });
  teacherA = (await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  teacherB = (await db.membership.create({ data: { userId: b.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  pupil1 = (await db.membership.create({ data: { userId: p1.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZR1${STAMP}`, gradeLevel: "8" }, select: { id: true } })).id;
  pupil2 = (await db.membership.create({ data: { userId: p2.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZR2${STAMP}`, gradeLevel: "8" }, select: { id: true } })).id;
  const otherPupil = (await db.membership.create({ data: { userId: op.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZR3${STAMP}`, gradeLevel: "8" }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ 8A", gradeLevel: "8", joinCode: `ZR1${suffix}` }, select: { id: true } });
  const lastClass = await db.class.create({ data: { schoolId, name: "ZZ 8A (last year)", gradeLevel: "8", joinCode: `ZR2${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: teacherA, role: "LEAD" } });
  const period = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } });
  // Bhavna teaches 8A Science by the timetable; Mathematics falls to the lead, Asha.
  await db.timetableSlot.create({ data: { schoolId, classId: klass.id, periodId: period.id, weekday: 1, subject: "Science", teacherMembershipId: teacherB } });
  // Two years: last year with one term, this year with two.
  const lastYear = await db.academicYear.create({ data: { schoolId, name: "ZZ 2025–26", startDate: d("2025-04-01"), endDate: d("2026-03-31"), isCurrent: false }, select: { id: true } });
  const thisYear = await db.academicYear.create({ data: { schoolId, name: "ZZ 2026–27", startDate: d("2026-04-01"), endDate: d("2027-03-31"), isCurrent: true }, select: { id: true } });
  await db.term.create({ data: { schoolId, academicYearId: lastYear.id, name: "ZZ Whole", startDate: d("2025-04-01"), endDate: d("2026-03-31"), position: 1 } });
  const t1 = await db.term.create({ data: { schoolId, academicYearId: thisYear.id, name: "ZZ Term 1", startDate: d("2026-04-01"), endDate: d("2026-09-30"), position: 1 }, select: { id: true } });
  await db.term.create({ data: { schoolId, academicYearId: thisYear.id, name: "ZZ Term 2", startDate: d("2026-10-01"), endDate: d("2027-03-31"), position: 2 } });
  // Term 1: Mathematics 80 and 40 (Asha), Science 60 and 20 (Bhavna): pupil 1 means 70 (passes 35), pupil 2 means 30 (fails).
  // Term 2: Mathematics 90 and 50. Last year: Mathematics 50 and 50 in the last-year class.
  const paper = async (name: string, subject: string, dateKey: string, classId: string, marks: [string, number][], termId: string | null) => {
    const series = await db.examSeries.create({ data: { schoolId, name, gradeLevel: "8", kind: "UNIT_TEST", termId }, select: { id: true } });
    const slot = await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject, dateKey, pointsMilli: 100_000 }, select: { id: true } });
    const sitting = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: teacherA, title: name, examSlotId: slot.id, publishedAt: new Date() }, select: { id: true } });
    await db.grade.createMany({ data: marks.map(([studentMembershipId, m]) => ({ schoolId, assignmentId: sitting.id, studentMembershipId, scoreMilli: m * 1000 })) });
  };
  await paper("ZZ T1 Maths", "Mathematics", "2026-07-10", klass.id, [[pupil1, 80], [pupil2, 40]], t1.id);
  await paper("ZZ T1 Science", "Science", "2026-07-12", klass.id, [[pupil1, 60], [pupil2, 20]], t1.id);
  await paper("ZZ T2 Maths", "Mathematics", "2026-11-10", klass.id, [[pupil1, 90], [pupil2, 50]], null);
  await paper("ZZ Last Maths", "Mathematics", "2025-11-10", lastClass.id, [[pupil1, 50], [pupil2, 50]], null);
  // Registers: term 1 three days, pupil 2 absent once (5 of 6); term 2 one day both present; last year one day, one absent.
  const register = async (classId: string, dateKey: string, absent: string[]) => {
    const session = await db.attendanceSession.create({ data: { schoolId, classId, dateKey }, select: { id: true } });
    await db.attendanceRecord.createMany({ data: [pupil1, pupil2].map((studentMembershipId) => ({ schoolId, sessionId: session.id, studentMembershipId, status: absent.includes(studentMembershipId) ? "ABSENT" : "PRESENT" })) });
  };
  await register(klass.id, "2026-07-01", []);
  await register(klass.id, "2026-07-02", [pupil2]);
  await register(klass.id, "2026-07-03", []);
  await register(klass.id, "2026-11-02", []);
  await register(lastClass.id, "2025-11-02", [pupil1]);
  // Fees: term 1 demands of 1000 and 1000, 1500 paid between them; incidents: two in term 1, none in term 2.
  await db.feeDemand.createMany({
    data: [
      { schoolId, studentMembershipId: pupil1, academicYearId: thisYear.id, label: "ZZ Term 1", dueDate: d("2026-06-15"), grossPaise: 100_000, netPaise: 100_000, paidPaise: 100_000, status: "PAID" },
      { schoolId, studentMembershipId: pupil2, academicYearId: thisYear.id, label: "ZZ Term 1", dueDate: d("2026-06-15"), grossPaise: 100_000, netPaise: 100_000, paidPaise: 50_000, status: "PART" },
    ],
  });
  await db.incident.createMany({
    data: [
      { schoolId, studentMembershipId: pupil1, reportedByMembershipId: teacherA, kind: "INJURY", occurredAt: d("2026-07-05"), title: "ZZ Scraped knee", body: "On the field." },
      { schoolId, studentMembershipId: pupil2, reportedByMembershipId: teacherA, kind: "ILLNESS", occurredAt: d("2026-08-05"), title: "ZZ Fever", body: "Sent home." },
    ],
  });
  // Another school's rows in the same months must not show.
  const otherClass = await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ Other 8A", gradeLevel: "8", joinCode: `ZQ1${suffix}` }, select: { id: true } });
  const otherSession = await db.attendanceSession.create({ data: { schoolId: otherSchoolId, classId: otherClass.id, dateKey: "2026-07-01" }, select: { id: true } });
  await db.attendanceRecord.create({ data: { schoolId: otherSchoolId, sessionId: otherSession.id, studentMembershipId: otherPupil, status: "ABSENT" } });
  await db.incident.create({ data: { schoolId: otherSchoolId, studentMembershipId: otherPupil, reportedByMembershipId: teacherA, kind: "OTHER", occurredAt: d("2026-07-06"), title: "ZZ Elsewhere", body: "Not ours." } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the pass line", () => {
  it("is the lowest band above the floor, or 33 with no bands", () => {
    expect(passLineOf([{ minPercent: 91 }, { minPercent: 33 }, { minPercent: 0 }])).toBe(33);
    expect(passLineOf([{ minPercent: 75 }, { minPercent: 35 }, { minPercent: 0 }])).toBe(35);
    expect(passLineOf([])).toBe(33);
  });
});

describe("the school across terms", () => {
  it("401 signed out; a teacher is refused; years outside 1..3 are 422", async () => {
    await as(null);
    expect((await read()).status).toBe(401);
    await as("TEACHER");
    expect((await read()).status).toBe(403);
    await as("PRINCIPAL");
    expect((await read("?years=9")).status).toBe(422);
  });

  it("two years, three points oldest first, each with its own numbers; the other school's rows are absent; nothing stored", async () => {
    await as("PRINCIPAL");
    const res = await read("?years=2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.passLinePercent).toBe(35);
    expect(body.years.map((y: { name: string }) => y.name)).toEqual(["ZZ 2026–27", "ZZ 2025–26"]);
    expect(body.terms.map((t: { termName: string }) => t.termName)).toEqual(["ZZ Whole", "ZZ Term 1", "ZZ Term 2"]);
    const [last, t1, t2] = body.terms;
    expect(last).toMatchObject({ yearName: "ZZ 2025–26", attendancePercent: 50, examAveragePercent: 50, passPercent: 100, pupilsWithMarks: 2, feeCollectionPercent: null, incidents: 0 });
    expect(t1).toMatchObject({ yearName: "ZZ 2026–27", attendancePercent: 83.3, examAveragePercent: 50, passPercent: 50, pupilsWithMarks: 2, feeCollectionPercent: 75, incidents: 2 });
    expect(t1.bySubject).toEqual([{ subject: "Mathematics", averagePercent: 60, papers: 2 }, { subject: "Science", averagePercent: 40, papers: 2 }]);
    expect(t1.byTeacher).toEqual([{ membershipId: teacherA, name: "ZZ Trends Asha", averagePercent: 60, papers: 2 }, { membershipId: teacherB, name: "ZZ Trends Bhavna", averagePercent: 40, papers: 2 }]);
    expect(t2).toMatchObject({ attendancePercent: 100, examAveragePercent: 70, passPercent: 100, incidents: 0, feeCollectionPercent: null });
    expect(t2.bySubject).toEqual([{ subject: "Mathematics", averagePercent: 70, papers: 2 }]);
    expect(await db.auditLog.count({ where: { schoolId } })).toBe(0);
  });

  it("this year's grade 8 sits beside last year's; one year alone has no comparison; the office reads the same", async () => {
    await as("ADMIN");
    const body = await (await read()).json();
    expect(body.cohorts).toEqual([
      { gradeLevel: "8", thisYear: { yearName: "ZZ 2026–27", attendancePercent: 87.5, examAveragePercent: 56.7, pupils: 2 }, lastYear: { yearName: "ZZ 2025–26", attendancePercent: 50, examAveragePercent: 50, pupils: 2 } },
    ]);
    const one = await (await read("?years=1")).json();
    expect(one.terms.map((t: { termName: string }) => t.termName)).toEqual(["ZZ Term 1", "ZZ Term 2"]);
    expect(one.cohorts[0].lastYear).toBeNull();
  });
});
