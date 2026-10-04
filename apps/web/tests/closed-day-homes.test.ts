/**
 * B-11 (4 Oct 2026): on a closed day the homes say "no school today".
 *
 * On a Sunday the teacher's home said "All done — nice." beside two classes
 * offered as "Take it", the parent's "Attendance has not been marked yet",
 * the pupil's "your teacher hasn't taken it yet", the driver's "Missed start",
 * and the principal's "Every class is at or above 85%" over a window with no
 * attendance in it at all. Each home is fed by a lib function; this suite
 * pins the clock and asks each of them.
 *
 * One ZZ school of its own on Asia/Kolkata, teaching Monday to Saturday (the
 * schema's default "1,2,3,4,5,6"), with TRANSPORT on: a class with a teacher
 * and a pupil with a guardian, a principal, a driver on a bus and a route.
 * Sunday is 2026-10-04, the holiday Friday 2026-10-02, the teaching day
 * Tuesday 2026-10-06. A SCHEDULED trip is planted on each closed day the way
 * the transport fixture plants today's, since ensureTrips makes none there.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { registersDue, todayAttendanceFor } from "@/lib/attendance";
import { schoolDayOn } from "@/lib/holidays";
import { classInsights, schoolSummary } from "@/lib/insights";
import { driverToday } from "@/lib/transport";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const SUNDAY = "2026-10-04";
const HOLIDAY = "2026-10-02";
const HOLIDAY_NAME = "ZZ Gandhi Jayanti";
const TEACHING_DAY = "2026-10-06";
const WINDOW = { fromDateKey: "2026-09-07", toDateKey: "2026-10-06" };
/** 10:00 on the school's clock (UTC+5:30) of a day key: past the 07:30 first stop. */
const at = (key: string) => new Date(`${key}T04:30:00Z`);

const ids = { school: "", classId: "", teacher: "", pupil: "", principal: "", driver: "", principalUser: "", driverUser: "", assignment: "" };

async function as(userId: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Closed Day ${STAMP}`, slug: `zz-closed-day-${STAMP}`, code: `ZCD${String(STAMP).slice(-6)}`, contactEmail: `zz-cd-school-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true, teachingDays: true },
  });
  expect(school.teachingDays).toBe("1,2,3,4,5,6");
  ids.school = school.id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "TRANSPORT" } });
  await db.holiday.create({ data: { schoolId: ids.school, name: HOLIDAY_NAME, startDateKey: HOLIDAY, endDateKey: HOLIDAY, kind: "HOLIDAY" } });

  const mk = (who: string) => db.user.create({ data: { name: `ZZ CD ${who}`, email: `zz-cd-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [teacherU, pupilU, parentU, principalU, driverU] = await Promise.all(["Teacher", "Pupil", "Parent", "Principal", "Driver"].map(mk));
  ids.principalUser = principalU!.id;
  ids.driverUser = driverU!.id;
  const member = (userId: string, role: string, extra: Record<string, unknown> = {}) =>
    db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE", ...extra }, select: { id: true } });
  ids.teacher = (await member(teacherU!.id, "TEACHER")).id;
  ids.pupil = (await member(pupilU!.id, "STUDENT", { studentCode: `ZCDP${STAMP}` })).id;
  ids.principal = (await member(principalU!.id, "PRINCIPAL")).id;
  ids.driver = (await member(driverU!.id, "DRIVER")).id;
  await db.guardianship.create({ data: { parentUserId: parentU!.id, studentMembershipId: ids.pupil, studentSchoolId: ids.school, status: "ACTIVE" } });

  ids.classId = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ CD 5A", gradeLevel: "5", joinCode: `ZCD-${STAMP}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.classId, teacherMembershipId: ids.teacher, schoolId: ids.school } });
  await db.enrollment.create({ data: { classId: ids.classId, schoolId: ids.school, studentMembershipId: ids.pupil, status: "ACTIVE" } });

  const route = await db.transportRoute.create({ data: { schoolId: ids.school, name: "ZZ CD Route", direction: "MORNING" }, select: { id: true } });
  await db.transportStop.create({ data: { schoolId: ids.school, routeId: route.id, order: 0, name: "ZZ CD Corner", lat: 18.5, lng: 73.8, morningMinute: 450 } });
  const bus = await db.bus.create({ data: { schoolId: ids.school, registration: `MH 12 ZZ ${String(STAMP).slice(-4)}`, capacity: 30 }, select: { id: true } });
  ids.assignment = (await db.busAssignment.create({ data: { schoolId: ids.school, busId: bus.id, routeId: route.id, driverMembershipId: ids.driver, fromDateKey: "2026-09-01" }, select: { id: true } })).id;
  // Waiting rows on the closed days, as the fixture leaves today's.
  await db.trip.createMany({
    data: [SUNDAY, HOLIDAY].map((dateKey) => ({ schoolId: ids.school, assignmentId: ids.assignment, dateKey, direction: "MORNING", status: "SCHEDULED" })),
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the day itself", () => {
  it("a Sunday and a closing holiday are not school days; the holiday is named", async () => {
    expect(await schoolDayOn(ids.school, SUNDAY)).toEqual({ open: false, holidayName: null });
    expect(await schoolDayOn(ids.school, HOLIDAY)).toEqual({ open: false, holidayName: HOLIDAY_NAME });
    expect(await schoolDayOn(ids.school, TEACHING_DAY)).toEqual({ open: true, holidayName: null });
  });
});

describe("the teacher's registers", () => {
  it("on a closed day: not open, nothing missing, the holiday named — never 'all done'", async () => {
    const sunday = await registersDue(ids.school, SUNDAY, { classIds: [ids.classId] });
    expect(sunday).toMatchObject({ open: false, holidayName: null, expected: [], missing: [] });
    const holiday = await registersDue(ids.school, HOLIDAY, { classIds: [ids.classId] });
    expect(holiday).toMatchObject({ open: false, holidayName: HOLIDAY_NAME, missing: [] });
  });

  it("on a teaching day: open, and the untaken register is missing as before", async () => {
    const tuesday = await registersDue(ids.school, TEACHING_DAY, { classIds: [ids.classId] });
    expect(tuesday).toMatchObject({ open: true, holidayName: null, expected: [ids.classId], missing: [ids.classId] });
  });
});

describe("the pupil's and the family's today", () => {
  it("on a closed day there is no school, not a register still to come", async () => {
    expect(await todayAttendanceFor(ids.school, ids.pupil, SUNDAY)).toEqual({ open: false, holidayName: null, record: null });
    expect(await todayAttendanceFor(ids.school, ids.pupil, HOLIDAY)).toEqual({ open: false, holidayName: HOLIDAY_NAME, record: null });
  });

  it("on a teaching day it is open and unmarked until the register is taken", async () => {
    expect(await todayAttendanceFor(ids.school, ids.pupil, TEACHING_DAY)).toEqual({ open: true, holidayName: null, record: null });
  });
});

describe("the driver's today", () => {
  it("on a Sunday and a holiday: no trip waiting, none read as missed, and the closed day said", async () => {
    const driver = await as(ids.driverUser, "DRIVER", ids.school);
    const sunday = await driverToday(driver, at(SUNDAY));
    expect(sunday.dateKey).toBe(SUNDAY);
    expect(sunday.noSchool).toEqual({ holidayName: null });
    expect(sunday.trips).toEqual([]);
    const holiday = await driverToday(driver, at(HOLIDAY));
    expect(holiday.noSchool).toEqual({ holidayName: HOLIDAY_NAME });
    expect(holiday.trips.some((trip) => trip.status === "MISSED")).toBe(false);
    expect(holiday.trips).toEqual([]);
    // The office was not told of a missed start that was never due.
    const told = await db.trip.count({ where: { assignmentId: ids.assignment, dateKey: { in: [SUNDAY, HOLIDAY] }, missedNotifiedAt: { not: null } } });
    expect(told).toBe(0);
  });

  it("on a teaching day the trip is made and reads as missed ten minutes past its first stop, as before", async () => {
    const driver = await as(ids.driverUser, "DRIVER", ids.school);
    const tuesday = await driverToday(driver, at(TEACHING_DAY));
    expect(tuesday.noSchool).toBeNull();
    expect(tuesday.trips).toHaveLength(1);
    expect(tuesday.trips[0]!.status).toBe("MISSED");
  });
});

describe("the principal's dashboard", () => {
  it("with no attendance in the window and a closed day: nothing is claimed about classes, and the day is closed", async () => {
    const principal = await as(ids.principalUser, "PRINCIPAL", ids.school);
    const insights = await classInsights(principal, WINDOW);
    expect(insights).toHaveLength(1);
    const sunday = await schoolSummary(principal, insights, at(SUNDAY));
    expect(sunday).toMatchObject({ openToday: false, holidayToday: null, registersMissingToday: 0, classesWithAttendance: 0, attendancePercent: null });
    const holiday = await schoolSummary(principal, insights, at(HOLIDAY));
    expect(holiday).toMatchObject({ openToday: false, holidayToday: HOLIDAY_NAME });
  });

  it("on a teaching day with a register taken in the window, the class counts and the day is open", async () => {
    const session = await db.attendanceSession.create({ data: { schoolId: ids.school, classId: ids.classId, dateKey: "2026-10-03", takenByMembershipId: ids.teacher }, select: { id: true } });
    await db.attendanceRecord.create({ data: { sessionId: session.id, schoolId: ids.school, studentMembershipId: ids.pupil, status: "PRESENT" } });
    const principal = await as(ids.principalUser, "PRINCIPAL", ids.school);
    const insights = await classInsights(principal, WINDOW);
    const tuesday = await schoolSummary(principal, insights, at(TEACHING_DAY));
    expect(tuesday).toMatchObject({ openToday: true, holidayToday: null, registersMissingToday: 1, classesWithAttendance: 1, attendancePercent: 100 });
    // And the pupil's own Saturday mark reads back, school open.
    expect(await todayAttendanceFor(ids.school, ids.pupil, "2026-10-03")).toEqual({ open: true, holidayName: null, record: { status: "PRESENT", note: null } });
  });
});
