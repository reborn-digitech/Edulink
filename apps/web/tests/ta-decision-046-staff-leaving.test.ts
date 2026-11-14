/**
 * TA-046, the owner's decision of 14 November 2026 (option 1): a staff leaving step, paused staff named on the draft,
 * and no silent loss of a slip with hand-typed figures.
 *
 * The office records a member of staff's last working day with a coded reason (writes leftAt); access ends after that
 * day and payroll pays them up to it in that month's run. A paused member with no leaving day stays off the roll but
 * is listed on the draft as paused, not on this run. Drawing a month again never silently deletes a slip that carries
 * hand-typed figures: the office is told and the slip is kept.
 *
 * One scratch ZZ school of this suite's own, PAYROLL on: an ADMIN, a head, eight teachers and a pupil, every
 * membership joined on 1 April 2026; removed afterwards. October 2026 is the month drafted (no month after today's
 * may be drafted), and the current month for the kept day.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { draftRun, editSlip, runView, saveSalary, saveStructure, savePayrollSettings } from "@/lib/payroll";
import { suspendMembership } from "@/lib/membership";
import { cancelScheduledDeparture, runDueDepartures } from "@/lib/school-record";
import { dateKeyInZone, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-5);
const MONTH = "2026-10";
const TZ = "Asia/Kolkata";
const ids = { school: "", admin: "", adminM: "", head: "", structure: "", pupilM: "", t: [] as { userId: string; m: string }[] };

async function as(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.school, role: role as never });
  return (await getSession())!;
}
const admin = () => as(ids.admin, "ADMIN");
const T = (n: number) => ids.t[n - 1]!.m;
const req = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const lastAudit = async (action: string, targetId: string) => {
  const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action, targetId }, orderBy: { createdAt: "desc" }, select: { meta: true } });
  return (typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta) as Record<string, unknown>;
};
const slipOf = (run: Awaited<ReturnType<typeof runView>>, membershipId: string) => run.slips?.find((s) => s.membershipId === membershipId);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA046 ${STAMP}`, slug: `zz-ta046-${STAMP}`, code: `Z46${SUFFIX}`, contactEmail: `zz-ta046-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "PAYROLL" } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ TA046 ${who}`, email: `zz-ta046-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const joinedAt = new Date("2026-04-01T06:00:00Z");
  const mem = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE", joinedAt }, select: { id: true } });
  ids.admin = (await user("Admin")).id;
  ids.adminM = (await mem(ids.admin, "ADMIN")).id;
  ids.head = (await user("Head")).id;
  await mem(ids.head, "PRINCIPAL");
  for (let n = 1; n <= 8; n++) {
    const u = (await user(`Teacher${n}`)).id;
    ids.t.push({ userId: u, m: (await mem(u, "TEACHER")).id });
  }
  ids.pupilM = (await mem((await user("Pupil")).id, "STUDENT")).id;
  const ctx = await admin();
  await savePayrollSettings(ctx, { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ TA046 Trust", pfEstablishmentCode: "", esiEmployerCode: "" });
  ids.structure = (await saveStructure(ctx, { name: `ZZ TA046 ${STAMP}`, components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }, { code: "TDS", label: "", formula: "FIXED", value: 0 }] })).id;
  for (let n = 1; n <= 8; n++) {
    await saveSalary(await admin(), { membershipId: T(n), structureId: ids.structure, effectiveFrom: "2026-04-01", basicPaise: 3_100_000, overrides: {}, pfUan: "", esiNumber: "", pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" });
  }
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = people.map((p) => p.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-046: a paused member of staff and a redraw", () => {
  it("TA-046: a paused member with no leaving day stays off the roll and is listed on the draft as paused, not on this run", async () => {
    await draftRun(await admin(), MONTH);
    expect(await suspendMembership(await admin(), T(3), "ZZ TA-046 paused")).toEqual({ ok: true });
    const run = await draftRun(await admin(), MONTH);
    expect(slipOf(run, T(3))).toBeUndefined();
    expect(run.paused).toEqual([{ membershipId: T(3), name: "ZZ TA046 Teacher3" }]);
    expect(run.missingSalary.map((m) => m.membershipId)).not.toContain(T(3));
  });

  it("TA-046: drawing the month again keeps a slip carrying hand-typed figures of somebody paused since, marks it for the office and says so in the audit", async () => {
    await editSlip(await admin(), MONTH, T(2), { arrearsPaise: 50_000, notes: "ZZ TA-046 arrears" });
    expect(await suspendMembership(await admin(), T(2), "ZZ TA-046 paused")).toEqual({ ok: true });
    const run = await draftRun(await admin(), MONTH);
    const kept = slipOf(run, T(2));
    expect(kept).toBeDefined();
    expect(kept!.arrearsPaise).toBe(50_000);
    expect(kept!.notes).toBe("ZZ TA-046 arrears");
    expect(kept!.warnings).toContain("OFF_ROLL_KEPT");
    // In the run, so not among the paused not on it; the plain paused slip stays dropped.
    expect(run.paused.map((p) => p.membershipId)).toEqual([T(3)]);
    expect(slipOf(run, T(3))).toBeUndefined();
    expect(await lastAudit("payroll.run.draft", MONTH)).toMatchObject({ keptOffRoll: 1 });
    // Nobody on the roll carries the mark.
    expect(run.slips!.filter((s) => s.warnings.includes("OFF_ROLL_KEPT")).map((s) => s.membershipId)).toEqual([T(2)]);
  });
});

describe("TA-046: the staff leaving step", () => {
  it("TA-046: a past last working day with a coded reason writes leftAt and its audit row, and October pays them up to it", async () => {
    const { recordStaffLeaving } = await import("@/lib/staff-leaving");
    const done = await recordStaffLeaving(await admin(), T(4), { lastDay: "2026-10-20", reason: "RESIGNED" });
    expect(done).toEqual({ ok: true, leftOn: "2026-10-20", scheduledFor: null });
    const row = await db.membership.findUniqueOrThrow({ where: { id: T(4) }, select: { leftAt: true } });
    expect(row.leftAt && dateKeyInZone(row.leftAt, TZ)).toBe("2026-10-20");
    expect(await lastAudit("staff.leave", T(4))).toMatchObject({ lastDay: "2026-10-20", reason: "RESIGNED", role: "TEACHER" });
    const run = await draftRun(await admin(), MONTH);
    // 21 to 31 October off the roll: eleven days without pay, twenty paid.
    expect(slipOf(run, T(4))).toMatchObject({ lopDays: 11, paidDays: 20 });
  });

  it("TA-046: a paused member with a leaving day is back on the month's roll and paid up to that day", async () => {
    const { recordStaffLeaving } = await import("@/lib/staff-leaving");
    expect(await suspendMembership(await admin(), T(5), "ZZ TA-046 paused")).toEqual({ ok: true });
    expect(await recordStaffLeaving(await admin(), T(5), { lastDay: "2026-10-10", reason: "DISMISSED" })).toMatchObject({ ok: true, leftOn: "2026-10-10" });
    const run = await draftRun(await admin(), MONTH);
    expect(slipOf(run, T(5))).toMatchObject({ lopDays: 21, paidDays: 10 });
    expect(slipOf(run, T(5))!.warnings).not.toContain("OFF_ROLL_KEPT");
    expect(run.paused.map((p) => p.membershipId)).not.toContain(T(5));
    expect(await lastAudit("staff.leave", T(5))).toMatchObject({ reason: "DISMISSED", wasPaused: true });
  });

  it("TA-046: today as the last working day is kept, access lasting through it; the run pays up to it, and the morning after the night job writes leftAt", async () => {
    const { recordStaffLeaving } = await import("@/lib/staff-leaving");
    const today = todayKey(TZ);
    const done = await recordStaffLeaving(await admin(), T(6), { lastDay: today, reason: "RETIRED" });
    expect(done).toEqual({ ok: true, leftOn: null, scheduledFor: today });
    expect((await db.membership.findUniqueOrThrow({ where: { id: T(6) }, select: { leftAt: true } })).leftAt).toBeNull();
    expect(await db.scheduledDeparture.findUnique({ where: { membershipId: T(6) }, select: { leaveOnKey: true, reason: true } })).toEqual({ leaveOnKey: today, reason: "RETIRED" });
    expect(await lastAudit("staff.leave.schedule", T(6))).toMatchObject({ lastDay: today, reason: "RETIRED" });
    const [y, m, d] = today.split("-").map(Number) as [number, number, number];
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const run = await draftRun(await admin(), today.slice(0, 7));
    expect(slipOf(run, T(6))).toMatchObject({ lopDays: daysInMonth - d });
    // The morning after: the job records it through the one writer.
    const result = await runDueDepartures(new Date(Date.now() + 2 * 86_400_000), { schoolIds: [ids.school] });
    expect(result.executed).toBe(1);
    const left = await db.membership.findUniqueOrThrow({ where: { id: T(6) }, select: { leftAt: true } });
    expect(left.leftAt && dateKeyInZone(left.leftAt, TZ)).toBe(today);
    expect(await db.scheduledDeparture.count({ where: { membershipId: T(6) } })).toBe(0);
    expect(await lastAudit("staff.leave", T(6))).toMatchObject({ lastDay: today, reason: "RETIRED", via: "scheduled" });
  });

  it("TA-046: a kept day is given up by the cancel door's rule and audited as a member of staff's", async () => {
    const { recordStaffLeaving } = await import("@/lib/staff-leaving");
    const later = dateKeyInZone(new Date(Date.now() + 10 * 86_400_000), TZ);
    expect(await recordStaffLeaving(await admin(), T(7), { lastDay: later, reason: "CONTRACT_ENDED" })).toEqual({ ok: true, leftOn: null, scheduledFor: later });
    expect(await cancelScheduledDeparture(await admin(), T(7))).toEqual({ ok: true });
    expect(await db.scheduledDeparture.count({ where: { membershipId: T(7) } })).toBe(0);
    await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "staff.leave.unschedule", targetId: T(7) } });
  });

  it("TA-046: refused, with nothing written, for a pupil, one's own leaving, a reason not on the list, a day before joining and somebody already left; a teacher may not record one", async () => {
    const { recordStaffLeaving } = await import("@/lib/staff-leaving");
    expect(await recordStaffLeaving(await admin(), ids.pupilM, { lastDay: "2026-10-20", reason: "RESIGNED" })).toEqual({ ok: false, errorKey: "refusal.onlyStaffLeaves" });
    expect(await recordStaffLeaving(await admin(), ids.adminM, { lastDay: "2026-10-20", reason: "RESIGNED" })).toEqual({ ok: false, errorKey: "refusal.staffLeaveSelf" });
    expect(await recordStaffLeaving(await admin(), T(8), { lastDay: "2026-10-20", reason: "BORED" })).toEqual({ ok: false, errorKey: "refusal.sayStaffLeavingReason" });
    expect(await recordStaffLeaving(await admin(), T(8), { lastDay: "2026-03-31", reason: "RESIGNED" })).toEqual({ ok: false, errorKey: "refusal.leaveBeforeJoin" });
    expect(await recordStaffLeaving(await admin(), T(4), { lastDay: "2026-10-25", reason: "RESIGNED" })).toEqual({ ok: false, errorKey: "refusal.alreadyLeft" });
    await expect(recordStaffLeaving(await as(ids.t[0]!.userId, "TEACHER"), T(8), { lastDay: "2026-10-20", reason: "RESIGNED" })).rejects.toMatchObject({ message: "access.onlyAnAdminCanRecordStaffLeaving" });
    const untouched = await db.membership.findMany({ where: { id: { in: [ids.pupilM, ids.adminM, T(8)] } }, select: { leftAt: true } });
    expect(untouched.every((m) => m.leftAt === null)).toBe(true);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: { startsWith: "staff.leave" }, targetId: { in: [ids.pupilM, ids.adminM, T(8)] } } })).toBe(0);
  });

  it("TA-046: the door: an empty body is a 422, a pupil's id a 422, and a member of staff's past day a 200 naming the day", async () => {
    const { POST } = await import("@/app/api/v1/admin/people/[membershipId]/staff-leaving/route");
    const path = (m: string) => `/api/v1/admin/people/${m}/staff-leaving`;
    await admin();
    expect((await POST(req(path(T(8)), {}), { params: Promise.resolve({ membershipId: T(8) }) })).status).toBe(422);
    expect((await POST(req(path(ids.pupilM), { lastDay: "2026-10-20", reason: "RESIGNED" }), { params: Promise.resolve({ membershipId: ids.pupilM }) })).status).toBe(422);
    const res = await POST(req(path(T(8)), { lastDay: "2026-10-31", reason: "TRANSFERRED" }), { params: Promise.resolve({ membershipId: T(8) }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ leftOn: "2026-10-31", scheduledFor: null });
    const row = await db.membership.findUniqueOrThrow({ where: { id: T(8) }, select: { leftAt: true } });
    expect(row.leftAt && dateKeyInZone(row.leftAt, TZ)).toBe("2026-10-31");
  });
});

describe("TA-046: whom Record leaving is offered to", () => {
  it("TA-046: the step is offered on staff rows only: the web's row menu reads the staff roles, not the staff-record prop a guardian's or an alumnus's row also carries, and the phone's list is the same", async () => {
    const { offersStaffLeaving } = await import("@/lib/staff-leaving");
    const { SCHOOL_STAFF_ROLES } = await import("@/lib/staff-records");
    const { STAFF_LEAVING_ROLES } = await import("@edulink/contracts");
    for (const role of ["TEACHER", "PRINCIPAL", "ADMIN", "SUPPORT", "FACULTY", "DRIVER"]) expect(offersStaffLeaving(role)).toBe(true);
    for (const role of ["STUDENT", "PARENT", "ALUMNUS", "RECRUITER", "", null, undefined]) expect(offersStaffLeaving(role)).toBe(false);
    expect([...STAFF_LEAVING_ROLES].sort()).toEqual([...SCHOOL_STAFF_ROLES].sort());
    const page = readFileSync("src/app/(app)/admin/people/page.tsx", "utf8");
    expect(page).toContain("staffLeaving={offersStaffLeaving(role)}");
    const menu = readFileSync("src/app/(app)/admin/people/directory-menu.tsx", "utf8");
    expect(menu).toMatch(/\{staffLeaving &&\s*!hasLeft &&\s*\(leavingOnKey \?/);
    expect(menu).not.toMatch(/\{staffRecord &&\s*!hasLeft &&\s*\(leavingOnKey \?/);
    const phone = readFileSync("../mobile/src/screens/staff/person.tsx", "utf8");
    expect(phone).toContain("{isStaff && !left && !leavingOn ? (");
    expect(phone).not.toContain("{!isPupil && !left && !leavingOn ? (");
  });

  it("TA-046: a guardian's and an alumnus's membership are refused by the step, with nothing written", async () => {
    const { recordStaffLeaving } = await import("@/lib/staff-leaving");
    const joinedAt = new Date("2026-04-01T06:00:00Z");
    const made: string[] = [];
    for (const role of ["PARENT", "ALUMNUS"]) {
      const u = await db.user.create({ data: { name: `ZZ TA046 ${role}`, email: `zz-ta046-${role.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
      made.push((await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role, status: "ACTIVE", joinedAt }, select: { id: true } })).id);
    }
    for (const m of made) expect(await recordStaffLeaving(await admin(), m, { lastDay: "2026-10-20", reason: "RESIGNED" })).toEqual({ ok: false, errorKey: "refusal.onlyStaffLeaves" });
    expect((await db.membership.findMany({ where: { id: { in: made } }, select: { leftAt: true } })).every((m) => m.leftAt === null)).toBe(true);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: { startsWith: "staff.leave" }, targetId: { in: made } } })).toBe(0);
  });
});
