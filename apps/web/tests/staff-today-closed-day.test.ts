/**
 * B-11 (4 Oct 2026), the phone's teacher home: GET /api/v1/staff/today said
 * "0 left" and "every register taken" on a Sunday, because a closed day has
 * no register due and none taken. staffToday now says the school is shut
 * (`noSchool`, the holiday named when there is one) and counts no register
 * as left; on a teaching day it is null and the untaken register is left as
 * before.
 *
 * One ZZ school of its own on Asia/Kolkata, teaching Monday to Saturday, a
 * form teacher with one class. Sunday is 2026-10-04, the holiday Friday
 * 2026-10-02, the teaching day Tuesday 2026-10-06; the clock is passed in.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { staffTodaySchema } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { staffToday } from "@/lib/api-reads/staff";

const db = new PrismaClient();
const STAMP = Date.now();
const SUNDAY = "2026-10-04";
const HOLIDAY = "2026-10-02";
const HOLIDAY_NAME = "ZZ Gandhi Jayanti";
const TEACHING_DAY = "2026-10-06";
/** 10:00 on the school's clock (UTC+5:30) of a day key. */
const at = (key: string) => new Date(`${key}T04:30:00Z`);

const ids = { school: "", classId: "", teacher: "", teacherUser: "" };

async function asTeacher() {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.teacherUser, { schoolId: ids.school, role: "TEACHER" as never });
  return (await getSession()) as Parameters<typeof staffToday>[0];
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Staff Today ${STAMP}`, slug: `zz-staff-today-${STAMP}`, code: `ZST${String(STAMP).slice(-6)}`, contactEmail: `zz-st-school-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true, teachingDays: true },
  });
  expect(school.teachingDays).toBe("1,2,3,4,5,6");
  ids.school = school.id;
  await db.holiday.create({ data: { schoolId: ids.school, name: HOLIDAY_NAME, startDateKey: HOLIDAY, endDateKey: HOLIDAY, kind: "HOLIDAY" } });
  const [teacherU, pupilU] = await Promise.all(
    ["Teacher", "Pupil"].map((who) => db.user.create({ data: { name: `ZZ ST ${who}`, email: `zz-st-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })),
  );
  ids.teacherUser = teacherU!.id;
  ids.teacher = (await db.membership.create({ data: { userId: teacherU!.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const pupil = await db.membership.create({ data: { userId: pupilU!.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZSTP${STAMP}` }, select: { id: true } });
  ids.classId = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ ST 5A", gradeLevel: "5", joinCode: `ZST-${STAMP}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.classId, teacherMembershipId: ids.teacher, schoolId: ids.school } });
  await db.enrollment.create({ data: { classId: ids.classId, schoolId: ids.school, studentMembershipId: pupil.id, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the teacher's today on a closed day", () => {
  it("a Sunday: no school, no register left — and the contract parses it", async () => {
    const teacher = await asTeacher();
    const sunday = staffTodaySchema.parse(await staffToday(teacher, at(SUNDAY)));
    expect(sunday.dateKey).toBe(SUNDAY);
    expect(sunday.noSchool).toEqual({ holidayName: null });
    expect(sunday.formClasses?.registersLeft).toBe(0);
    expect(sunday.formClasses?.classes.map((k) => k.id)).toEqual([ids.classId]);
  });

  it("a closing holiday: no school, the holiday named", async () => {
    const teacher = await asTeacher();
    const holiday = await staffToday(teacher, at(HOLIDAY));
    expect(holiday.noSchool).toEqual({ holidayName: HOLIDAY_NAME });
    expect(holiday.formClasses?.registersLeft).toBe(0);
  });

  it("a teaching day: open, and the untaken register is left as before", async () => {
    const teacher = await asTeacher();
    const tuesday = await staffToday(teacher, at(TEACHING_DAY));
    expect(tuesday.noSchool).toBeNull();
    expect(tuesday.formClasses?.registersLeft).toBe(1);
  });
});
