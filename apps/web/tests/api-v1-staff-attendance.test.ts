/**
 * The staff register through its handlers: the office marks a day and reads
 * the month, a teacher checks in — present or late by the school's own
 * clock — once and never on a closed day, an approved leave shows itself,
 * and the register is the office's alone.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as registerGet, POST as markPost } from "@/app/api/v1/office/staff-attendance/route";
import { POST as settingsPost } from "@/app/api/v1/office/staff-attendance/settings/route";
import { GET as monthGet } from "@/app/api/v1/office/staff-attendance/month/route";
import { GET as meGet } from "@/app/api/v1/staff/attendance/me/route";
import { POST as checkInPost } from "@/app/api/v1/staff/attendance/check-in/route";
import { GET as exportGet } from "@/app/(app)/admin/staff-attendance/export/route";
import { parseCsvRecords } from "@/lib/csv";
import { minuteOfDayIn } from "@/lib/staff-attendance";
import { todayKey, zonedStartOfDay } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let teacher2UserId = "";
let parentUserId = "";
let teacherMembershipId = "";
let teacher2MembershipId = "";
const today = todayKey(TZ);

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "TEACHER2" | "PARENT" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "TEACHER2") await createSession(teacher2UserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}
function yesterdayWorking(): string {
  for (let back = 1; back < 10; back += 1) {
    const d = new Date(Date.now() - back * 86_400_000);
    const key = todayKey(TZ, d);
    if (new Date(`${key}T00:00:00Z`).getUTCDay() !== 0) return key;
  }
  throw new Error("no working day");
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Staff Att School ${STAMP}`, slug: `zz-satt-${STAMP}`, code: `ZM${suffix}`, contactEmail: `zz-satt-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Satt ${who}`, email: `zz-satt-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, teacher2, parent, pupil] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Teacher Two"), mk("Parent"), mk("Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  teacher2UserId = teacher2.id;
  parentUserId = parent.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }] });
  teacherMembershipId = (await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  teacher2MembershipId = (await db.membership.create({ data: { userId: teacher2UserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZMP${STAMP}` }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  // Teacher two is on approved leave today.
  await db.leaveRequest.create({ data: { schoolId, teacherMembershipId: teacher2MembershipId, fromDateKey: today, toDateKey: today, kind: "CASUAL", reason: "ZZ family", status: "APPROVED" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, teacher2UserId, parentUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the clock", () => {
  it("reads the minute of the day in the school's zone", () => {
    const noonUtc = new Date("2026-09-18T12:00:00Z");
    expect(minuteOfDayIn("Asia/Kolkata", noonUtc)).toBe(17 * 60 + 30);
    expect(minuteOfDayIn("UTC", noonUtc)).toBe(12 * 60);
  });
});

describe("the register", () => {
  it("401 signed out; a teacher and a guardian are refused the office's register; the office reads today with the leave shown", async () => {
    await as(null);
    expect((await registerGet(get("/api/v1/office/staff-attendance"))).status).toBe(401);
    await as("TEACHER");
    expect((await registerGet(get("/api/v1/office/staff-attendance"))).status).toBe(403);
    await as("PARENT");
    expect((await registerGet(get("/api/v1/office/staff-attendance"))).status).toBe(403);
    await as("ADMIN");
    const res = await registerGet(get("/api/v1/office/staff-attendance"));
    expect(res.status).toBe(200);
    const reg = await res.json();
    expect(reg.dateKey).toBe(today);
    expect(reg.rows).toHaveLength(4);
    const t2 = reg.rows.find((r: { membershipId: string }) => r.membershipId === teacher2MembershipId);
    expect(t2).toMatchObject({ status: "ON_LEAVE", source: "LEAVE", onLeave: true });
    expect(reg.counts).toMatchObject({ total: 4, onLeave: 1, unmarked: 3 });
    expect(reg.checkInMinute).toBe(540);
    expect((await registerGet(get("/api/v1/office/staff-attendance?date=2999-01-01"))).status).toBe(403);
  });

  it("the office marks a past day and today; a person left out stays as they were; a pupil id is ignored; the month adds up", async () => {
    await as("PRINCIPAL");
    const y = yesterdayWorking();
    const marked = await markPost(json("/x", { date: y, entries: [{ membershipId: teacherMembershipId, status: "LATE", note: "Bus" }, { membershipId: teacher2MembershipId, status: "PRESENT" }] }));
    expect(marked.status).toBe(200);
    expect(await marked.json()).toEqual({ marked: 2 });
    expect((await markPost(json("/x", { date: today, entries: [{ membershipId: "c" + "x".repeat(24), status: "PRESENT" }] }))).status).toBe(404);
    expect((await markPost(json("/x", { date: "2999-01-01", entries: [{ membershipId: teacherMembershipId, status: "PRESENT" }] }))).status).toBe(403);
    expect((await markPost(json("/x", { date: today, entries: [] }))).status).toBe(422);
    const reg = await (await registerGet(get(`/api/v1/office/staff-attendance?date=${y}`))).json();
    expect(reg.rows.find((r: { membershipId: string }) => r.membershipId === teacherMembershipId)).toMatchObject({ status: "LATE", source: "OFFICE", note: "Bus" });
    expect(reg.counts.unmarked).toBe(2);
    const month = await (await monthGet(get("/api/v1/office/staff-attendance/month"))).json();
    const row = month.rows.find((r: { membershipId: string }) => r.membershipId === teacherMembershipId);
    expect(row).toMatchObject({ late: 1, present: 0 });
    expect(row.percent).toBe(100);
    expect(month.workingDays).toBeGreaterThan(0);
    const audits = await db.auditLog.findMany({ where: { schoolId, action: "staffAttendance.mark" }, select: { meta: true } });
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0]!.meta)).not.toContain("Bus");
  });

  it("a teacher checks in — present or late by the school's clock — a second tap a no-op, never on a closed day; the office sees the check-in; the month is theirs", async () => {
    await as("ADMIN");
    // Whether the check-in lands present or late depends on the wall clock; pin it by setting the day's start around now.
    const nowMinute = minuteOfDayIn(TZ);
    expect((await settingsPost(json("/x", { checkInMinute: Math.max(0, nowMinute - 30), lateGraceMinutes: 5 }))).status).toBe(200);
    await as("TEACHER");
    const before = await (await meGet(get("/api/v1/staff/attendance/me"))).json();
    expect(before.canCheckIn).toBe(true);
    expect(before.todayStatus).toBeNull();
    const res = await checkInPost();
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out).toMatchObject({ status: "LATE", late: true });
    // A second tap is a no-op that says what stands, not a refusal.
    const twice = await checkInPost();
    expect(twice.status).toBe(200);
    expect(await twice.json()).toMatchObject({ status: "LATE", late: true, checkedInAt: out.checkedInAt });
    expect(await db.staffAttendance.count({ where: { membershipId: teacherMembershipId, dateKey: today } })).toBe(1);
    const after = await (await meGet(get("/api/v1/staff/attendance/me"))).json();
    expect(after).toMatchObject({ todayStatus: "LATE", canCheckIn: false });
    expect(after.days[0]).toMatchObject({ dateKey: today, status: "LATE", source: "SELF" });
    expect(after.summary.late).toBe(2);
    await as("TEACHER2");
    const mine = await (await meGet(get("/api/v1/staff/attendance/me"))).json();
    expect(mine).toMatchObject({ todayStatus: "ON_LEAVE", canCheckIn: true });
    await as("ADMIN");
    expect((await settingsPost(json("/x", { checkInMinute: Math.min(1439, nowMinute + 30), lateGraceMinutes: 15 }))).status).toBe(200);
    const reg = await (await registerGet(get("/api/v1/office/staff-attendance"))).json();
    const t1 = reg.rows.find((r: { membershipId: string }) => r.membershipId === teacherMembershipId);
    expect(t1).toMatchObject({ status: "LATE", source: "SELF" });
    expect(t1.checkedInAt).toEqual(expect.any(String));
    await as("PARENT");
    expect((await checkInPost()).status).toBe(403);
    expect((await meGet(get("/api/v1/staff/attendance/me"))).status).toBe(403);
  });
});

describe("the month's file and the days it counts", () => {
  it("a closing holiday has no column, a teacher who left mid-month keeps a row to their last day, and every count equals its cells and adds up to workingDays", async () => {
    await as("ADMIN");
    const thisMonth = today.slice(0, 7);
    // The past working days of this month, Sundays out — the same week every other test assumes.
    const pastOpen: string[] = [];
    for (let d = `${thisMonth}-01`; d < today; d = todayKey("UTC", new Date(new Date(`${d}T00:00:00Z`).getTime() + 86_400_000))) {
      if (new Date(`${d}T00:00:00Z`).getUTCDay() !== 0) pastOpen.push(d);
    }
    const holidayDay = pastOpen[0] ?? null;
    const lastDay = pastOpen[pastOpen.length - 1] ?? today;
    // A third teacher, marked on the day that is about to close and on their last day, who then leaves.
    const suffix = String(STAMP);
    const three = await db.user.create({ data: { name: `ZZ Satt Teacher Three`, email: `zz-satt-teacher-three-${suffix}@test.invalid` }, select: { id: true } });
    const threeM = (await db.membership.create({ data: { userId: three.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
    const entries = [...new Set([holidayDay, lastDay].filter((d): d is string => Boolean(d)))];
    for (const d of entries) expect((await markPost(json("/x", { date: d, entries: [{ membershipId: threeM, status: "PRESENT" }] }))).status).toBe(200);
    if (holidayDay) await db.holiday.create({ data: { schoolId, name: "ZZ Closing Day", kind: "HOLIDAY", startDateKey: holidayDay, endDateKey: holidayDay } });
    await db.membership.update({ where: { id: threeM }, data: { leftAt: new Date(zonedStartOfDay(lastDay, TZ).getTime() + 12 * 3_600_000) } });

    const month = await (await monthGet(get("/api/v1/office/staff-attendance/month"))).json();
    expect(month.workingDaysInMonth).toBeGreaterThanOrEqual(month.workingDays);
    // Open days up to today: the past working days less the holiday, plus today when it is a working day.
    const todayOpen = new Date(`${today}T00:00:00Z`).getUTCDay() !== 0 ? 1 : 0;
    expect(month.workingDays).toBe(pastOpen.length - (holidayDay ? 1 : 0) + todayOpen);
    const rows: { membershipId: string; present: number; late: number; halfDay: number; absent: number; onLeave: number; unmarked: number; workingDays: number }[] = month.rows;
    for (const r of rows) expect(r.present + r.late + r.halfDay + r.absent + r.onLeave + r.unmarked).toBe(r.workingDays);
    const leaver = rows.find((r) => r.membershipId === threeM);
    expect(leaver).toBeTruthy();
    // Counted to their last day only; the mark on the closed day counts for nothing.
    expect(leaver!.workingDays).toBe(pastOpen.filter((d) => d !== holidayDay && d <= lastDay).length);
    // Their mark on the last day counts once that day is open; the one on the holiday never does.
    const lastDayOpen = lastDay !== holidayDay && new Date(`${lastDay}T00:00:00Z`).getUTCDay() !== 0;
    expect(leaver!.present).toBe(lastDayOpen ? 1 : 0);

    const res = await exportGet(get("/admin/staff-attendance/export"));
    expect(res.status).toBe(200);
    const [headers = [], ...records] = parseCsvRecords(await res.text()).records;
    const dayCols = headers.map((h, i) => [h, i] as const).filter(([h]) => /^\d{4}-\d{2}-\d{2}$/.test(h));
    if (holidayDay) expect(headers).not.toContain(holidayDay);
    for (const [d] of dayCols) expect(new Date(`${d}T00:00:00Z`).getUTCDay()).not.toBe(0);
    expect(dayCols.length).toBe(month.workingDays);
    const col = (name: string) => headers.indexOf(name);
    expect(records.length).toBe(rows.length);
    for (const rec of records) {
      const cells = dayCols.map(([, i]) => rec[i] ?? "");
      const n = (mark: string) => cells.filter((c) => c === mark).length;
      expect(n("P") + n("L") + n("H") + n("A")).toBe(Number(rec[col("present")]) + Number(rec[col("late")]) + Number(rec[col("half_day")]) + Number(rec[col("absent")]));
      expect(n("LV")).toBe(Number(rec[col("on_leave")]));
    }
    const leaverRec = records.find((r) => r[col("name")] === "ZZ Satt Teacher Three");
    expect(leaverRec).toBeTruthy();
    for (const [d, i] of dayCols) if (d > lastDay) expect(leaverRec![i] ?? "").toBe("");
    await db.holiday.deleteMany({ where: { schoolId, name: "ZZ Closing Day" } });
  });
});
