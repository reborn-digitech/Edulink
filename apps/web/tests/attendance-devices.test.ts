/**
 * THE ATTENDANCE DEVICES' SIGNED PUNCHES (the risks batch, R-2, package 5B,
 * 5 October 2026), at a school of this suite's own.
 *
 * What is proved: a device's key is shown once and kept sealed (one writer);
 * a punch is believed only with the device's own HMAC over the body and a
 * fresh timestamp (401 otherwise, a disabled device and a rotated-out key
 * included); a member of staff's punch is their check-in through the staff
 * register's own writer and a pupil's marks them PRESENT in the day's class
 * register through the register's own writer, with no taker, so the register
 * is still due from its teacher; nothing already marked is overwritten; a
 * resent punch writes nothing and answers its first outcome; an unknown code,
 * a person outside the device's scope, a closed day, an OUT punch and an old
 * punch are kept and change nothing; the office alone registers devices and
 * badges.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PUNCH_HEADERS } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { classCode } from "@/lib/codes";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";
import { registerDevice, receivePunches, rotateDeviceKey, saveBadge, updateDevice, devicesView } from "@/lib/attendance-devices";
import { signPunches, verifyPunches } from "@/lib/punch-signature";
import { saveAttendanceBatch, registersDue } from "@/lib/attendance";
import { POST as punchPost } from "@/app/api/v1/punch/[schoolId]/route";
import { parseLog } from "../scripts/punch-adapter";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-punch-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const ids: Record<string, string> = {};
let key = "";
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  return (await getSession()) as ActiveContext;
}
async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ Punch ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE" }, select: { id: true } })).id;
}
/** A signed request as the device would send it. */
function signed(body: unknown, opts: { key?: string; device?: string; at?: number } = {}): Headers {
  const raw = JSON.stringify(body);
  const ts = String(opts.at ?? Math.floor(Date.now() / 1000));
  return new Headers({ [PUNCH_HEADERS.device]: opts.device ?? ids.device!, [PUNCH_HEADERS.timestamp]: ts, [PUNCH_HEADERS.signature]: signPunches(opts.key ?? key, ts, raw) });
}
const send = (body: unknown, opts: { key?: string; device?: string; at?: number } = {}) => receivePunches(ids.school!, signed(body, opts), JSON.stringify(body));
/** The most recent Monday-to-Saturday day before today, at 09:00 in Kolkata (03:30 UTC). */
function teachingDay(): { dateKey: string; at: string } {
  let d = addDaysToKey(todayKey(TZ), -1);
  while (weekdayOfKey(d) === 0) d = addDaysToKey(d, -1);
  return { dateKey: d, at: `${d}T03:30:00.000Z` };
}
function sundayWithinAWeek(): string {
  let d = addDaysToKey(todayKey(TZ), -1);
  while (weekdayOfKey(d) !== 0) d = addDaysToKey(d, -1);
  return `${d}T04:00:00.000Z`;
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  ids.operator = (await db.user.create({ data: { name: "ZZ Punch Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ Punch School ${STAMP}`, contactEmail: MAIL("contact"), timezone: TZ });
  if (!made.ok) throw new Error(made.errorKey);
  ids.school = made.schoolId;
  await db.school.update({ where: { id: ids.school }, data: { isTestFixture: true, staffCheckInMinute: 9 * 60, staffLateGraceMinutes: 10 } });
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["teacher", "TEACHER"], ["p1", "STUDENT"], ["p2", "STUDENT"], ["p3", "STUDENT"]] as const) await person(who, role);
  ids.klass = (await db.class.create({ data: { schoolId: ids.school!, name: `ZZ Punch 6A ${STAMP}`, gradeLevel: "6", joinCode: classCode() }, select: { id: true } })).id;
  for (const p of ["p1", "p2"]) await db.enrollment.create({ data: { schoolId: ids.school!, classId: ids.klass!, studentMembershipId: ids[`${p}M`]! } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { targetId: ids.school }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the signature", () => {
  it("checks the key, the body and the clock", () => {
    const now = 1_800_000_000;
    const sig = signPunches("k1", now, '{"a":1}');
    expect(verifyPunches("k1", String(now), sig, '{"a":1}', now)).toBe(true);
    expect(verifyPunches("k2", String(now), sig, '{"a":1}', now)).toBe(false);
    expect(verifyPunches("k1", String(now), sig, '{"a":2}', now)).toBe(false);
    expect(verifyPunches("k1", String(now), sig, '{"a":1}', now + 301)).toBe(false);
    expect(verifyPunches("k1", null, sig, '{"a":1}', now)).toBe(false);
  });
});

describe("a device", () => {
  it("is registered by the office alone, its key shown once and kept sealed", async () => {
    const principal = await as("principal", "PRINCIPAL");
    await expect(registerDevice(principal, { name: "ZZ Gate", kind: "RFID", location: "", scope: "BOTH" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const admin = await as("admin", "ADMIN");
    const issued = await registerDevice(admin, { name: "ZZ Gate", kind: "RFID", location: "Main gate", scope: "BOTH" });
    ids.device = issued.device.id;
    key = issued.key;
    expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(issued.endpoint).toContain(`/api/v1/punch/${ids.school}`);
    const row = await db.attendanceDevice.findUniqueOrThrow({ where: { id: ids.device } });
    expect(row.keySealed).not.toContain(key);
    expect(row.keySealed.startsWith("v2.")).toBe(true);
    expect(row.keyLast4).toBe(key.slice(-4));
    expect(row.keyVersion).toBe(1);
    // The page shows the last four, never the key.
    expect(JSON.stringify(await devicesView(admin))).not.toContain(key);
    for (const [code, who] of [["CARD-T1", "teacher"], ["CARD-P1", "p1"], ["CARD-P2", "p2"], ["CARD-P3", "p3"]] as const) await saveBadge(admin, { code, membershipId: ids[`${who}M`]! });
    await expect(saveBadge(admin, { code: "CARD-T1", membershipId: ids.p1M! })).rejects.toMatchObject({ key: "punch.refuseBadgeTaken" });
  });
});

describe("a punch", () => {
  it("is refused 401 without the device's signature, stale, or at the door with nothing", async () => {
    const body = { punches: [{ id: "x1", code: "CARD-T1", at: new Date().toISOString() }] };
    expect((await send(body, { key: "not-the-key" })).status).toBe(401);
    expect((await send(body, { at: Math.floor(Date.now() / 1000) - 3600 })).status).toBe(401);
    expect((await send(body, { device: "cnotadevice0000000000000" })).status).toBe(401);
    const res = await punchPost(new Request(`http://localhost/api/v1/punch/${ids.school}`, { method: "POST", body: "{}" }), { params: Promise.resolve({ schoolId: ids.school! }) });
    expect(res.status).toBe(401);
    expect(await db.attendancePunch.count({ where: { schoolId: ids.school } })).toBe(0);
  });

  it("checks a member of staff in through the staff register's writer, once a day, and a resend writes nothing", async () => {
    const day = teachingDay();
    const body = { punches: [{ id: "t-1", code: "CARD-T1", at: day.at }, { id: "t-2", code: "CARD-T1", at: day.at.replace("03:30", "05:00") }] };
    const r = await send(body);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ received: 2, applied: 1, replayed: 0 });
    const row = await db.staffAttendance.findUniqueOrThrow({ where: { membershipId_dateKey: { membershipId: ids.teacherM!, dateKey: day.dateKey } } });
    expect(row).toMatchObject({ status: "PRESENT", source: "SELF", markedByUserId: ids.teacher });
    expect(row.checkedInAt?.toISOString()).toBe(day.at);
    const again = await send(body);
    expect(again.body).toMatchObject({ received: 2, applied: 0, replayed: 2 });
    expect((again.body as { results: { outcome: string }[] }).results.map((x) => x.outcome)).toEqual(["APPLIED", "ALREADY_MARKED"]);
    expect(await db.attendancePunch.count({ where: { deviceId: ids.device } })).toBe(2);
  });

  it("marks a pupil present in the day's register with no taker, so the register is still due, and never over a teacher's mark", async () => {
    const day = teachingDay();
    // The teacher has already marked p2 absent that day.
    await saveAttendanceBatch({ schoolId: ids.school!, classId: ids.klass!, dateKey: day.dateKey, marks: [{ studentMembershipId: ids.p2M!, status: "ABSENT", clientId: `teacher-${STAMP}`, markedAt: day.at.replace("03:30", "03:00") }], takenByMembershipId: ids.teacherM!, actorUserId: ids.teacher!, notify: false });
    const r = await send({ punches: [{ id: "p-1", code: "CARD-P1", at: day.at }, { id: "p-2", code: "CARD-P2", at: day.at }, { id: "p-3", code: "CARD-P3", at: day.at }] });
    expect((r.body as { results: { outcome: string }[] }).results.map((x) => x.outcome)).toEqual(["APPLIED", "ALREADY_MARKED", "NO_REGISTER"]);
    const marks = await db.attendanceRecord.findMany({ where: { session: { classId: ids.klass, dateKey: day.dateKey } }, select: { studentMembershipId: true, status: true } });
    expect(marks.find((m) => m.studentMembershipId === ids.p1M)?.status).toBe("PRESENT");
    expect(marks.find((m) => m.studentMembershipId === ids.p2M)?.status).toBe("ABSENT");
    // The teacher took it, and the device did not become its taker.
    const session = await db.attendanceSession.findUniqueOrThrow({ where: { classId_dateKey: { classId: ids.klass!, dateKey: day.dateKey } } });
    expect(session.takenByMembershipId).toBe(ids.teacherM);
  });

  it("starts a register nobody has taken without taking it: the class is still due", async () => {
    const day = teachingDay();
    const earlier = addDaysToKey(day.dateKey, weekdayOfKey(addDaysToKey(day.dateKey, -1)) === 0 ? -2 : -1);
    const r = await send({ punches: [{ id: "p-early", code: "CARD-P1", at: `${earlier}T03:30:00.000Z` }] });
    expect((r.body as { results: { outcome: string }[] }).results[0]?.outcome).toBe("APPLIED");
    const session = await db.attendanceSession.findUniqueOrThrow({ where: { classId_dateKey: { classId: ids.klass!, dateKey: earlier } } });
    expect(session.takenByMembershipId).toBeNull();
    const due = await registersDue(ids.school!, earlier);
    expect(due.missing).toContain(ids.klass);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "attendance.device.punch" } })).toBeGreaterThan(0);
  });

  it("keeps and changes nothing for an unknown code, an OUT punch, a closed day, an old punch and someone outside the scope", async () => {
    const day = teachingDay();
    const old = `${addDaysToKey(todayKey(TZ), -10)}T03:30:00.000Z`;
    const r = await send({ punches: [{ id: "u-1", code: "NOPE", at: day.at }, { id: "o-1", code: "CARD-T1", at: day.at, direction: "OUT" }, { id: "c-1", code: "CARD-T1", at: sundayWithinAWeek() }, { id: "n-1", code: "CARD-T1", at: old }] });
    expect((r.body as { results: { outcome: string }[] }).results.map((x) => x.outcome)).toEqual(["UNKNOWN_BADGE", "LOGGED", "CLOSED_DAY", "NOT_RECENT"]);
    const admin = await as("admin", "ADMIN");
    await updateDevice(admin, ids.device!, { scope: "STAFF" });
    const s = await send({ punches: [{ id: "s-1", code: "CARD-P1", at: new Date().toISOString() }] });
    expect((s.body as { results: { outcome: string }[] }).results[0]?.outcome).toBe("OUT_OF_SCOPE");
  });

  it("stops at once for a disabled device and for a rotated-out key", async () => {
    const admin = await as("admin", "ADMIN");
    const body = { punches: [{ id: "r-1", code: "CARD-T1", at: new Date().toISOString() }] };
    await updateDevice(admin, ids.device!, { disabled: true });
    expect((await send(body)).status).toBe(401);
    await updateDevice(admin, ids.device!, { disabled: false });
    const old = key;
    const issued = await rotateDeviceKey(admin, ids.device!);
    expect(issued.key).not.toBe(old);
    expect(issued.device.keyVersion).toBe(2);
    expect((await send(body, { key: old })).status).toBe(401);
    key = issued.key;
    expect((await send(body)).status).toBe(200);
  });
});

describe("the vendor adapter's reading of a log (untested against any vendor's device)", () => {
  it("reads code, local time and direction, the same id for the same line, and skips what does not parse", () => {
    const { punches, skipped } = parseLog("CARD-T1\t2026-10-05 09:02:11\t0\nCARD-T1,2026-10-05 17:30,OUT\nnot a line\n\n", "+05:30");
    expect(skipped).toBe(1);
    expect(punches).toHaveLength(2);
    expect(punches[0]).toMatchObject({ code: "CARD-T1", at: "2026-10-05T09:02:11+05:30", direction: "IN" });
    expect(punches[1]).toMatchObject({ at: "2026-10-05T17:30:00+05:30", direction: "OUT" });
    expect(parseLog("CARD-T1\t2026-10-05 09:02:11\t0").punches[0]!.id).toBe(punches[0]!.id);
  });
});
