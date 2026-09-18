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
import { minuteOfDayIn } from "@/lib/staff-attendance";
import { todayKey } from "@/lib/dates";

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
