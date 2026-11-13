/**
 * A pupil's leaving, kept, executed and undone: findings TA-200, TA-203,
 * TA-411 and TA-601 of the testing analysis of 13 November 2026, held by cases
 * that FAIL while the defect stands and pass once it is fixed.
 *
 *   TA-200  Undoing a leaving did not bring back the fee instalments the
 *           leaving cancelled, nor the lines a settlement on leaving waived,
 *           and the settlement row (one per membership) stayed, so a later
 *           real leaving could not be settled.
 *   TA-203  runDueDepartures deleted a kept leaving whose execution threw,
 *           counting it stale: the pupil stayed on the roll and the office
 *           was told nothing.
 *   TA-411  Undoing a leaving told nobody, though the leaving told the
 *           guardians.
 *   TA-601  The leaving door kept a last day that does not exist
 *           (2026-13-01), and the night job later dropped it.
 *
 * One scratch ZZ school of this suite's own (its stamp in every name and
 * address), made through the owner connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { leavingBodySchema } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import type { Role } from "@/lib/constants";
import { db as appDb } from "@/lib/db";
import { recordDeparture, runDueDepartures, scheduleDeparture, undoDeparture } from "@/lib/school-record";
import { recordOrScheduleLeaving } from "@/lib/leaving";
import { settleOnLeaving, leavingSettlementFor } from "@/lib/leaving-settlement";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-leaving-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};

function ctx(who: string, role: Role): ActiveContext {
  return {
    sessionId: `zz-ta-rl-${who}`,
    membershipId: ids[`${who}M`] ?? null,
    schoolId: ids.school!,
    role,
    user: {
      id: ids[who]!, name: who, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ RL ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE", joinedAt: new Date(Date.now() - 300 * 86_400_000) }, select: { id: true } })).id;
}

async function guardianOf(pupil: string): Promise<string> {
  const who = `${pupil}Parent`;
  ids[who] = (await db.user.create({ data: { name: `ZZ RL ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids[who]!, studentMembershipId: ids[`${pupil}M`]!, studentSchoolId: ids.school!, relation: "PARENT", status: "ACTIVE" } });
  return ids[who]!;
}

/** Three instalments: one fallen due a month ago, two falling due after today. */
async function instalments(pupil: string, partPaidLater = false): Promise<void> {
  const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
  const rows = [
    { label: "ZZ Term 1", dueDate: day(addDaysToKey(TODAY, -30)), paidPaise: 0, status: "OPEN" },
    { label: "ZZ Term 2", dueDate: day(addDaysToKey(TODAY, 30)), paidPaise: partPaidLater ? 10_000 : 0, status: partPaidLater ? "PART" : "OPEN" },
    { label: "ZZ Term 3", dueDate: day(addDaysToKey(TODAY, 90)), paidPaise: 0, status: "OPEN" },
  ];
  for (const r of rows) {
    await db.feeDemand.create({ data: { schoolId: ids.school!, studentMembershipId: ids[`${pupil}M`]!, academicYearId: ids.year!, label: r.label, dueDate: r.dueDate, grossPaise: 100_000, netPaise: 100_000, paidPaise: r.paidPaise, status: r.status } });
  }
}

const statuses = async (pupil: string) =>
  (await db.feeDemand.findMany({ where: { studentMembershipId: ids[`${pupil}M`] }, orderBy: { dueDate: "asc" }, select: { label: true, status: true } })).map((d) => `${d.label}:${d.status}`);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-RL Leaving ${STAMP}`, slug: `zz-ta-rl-leaving-${STAMP}`, code: `ZZRLL${STAMP}`, contactEmail: MAIL("office"), timezone: TZ, isTestFixture: true }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: `ZZ ${STAMP}`, startDate: new Date(`${addDaysToKey(TODAY, -100)}T00:00:00Z`), endDate: new Date(`${addDaysToKey(TODAY, 200)}T00:00:00Z`), isCurrent: true }, select: { id: true } })).id;
  await person("admin", "ADMIN");
  for (const p of ["undone", "settled", "kept", "told", "impossible"]) await person(p, "STUDENT");
  await instalments("undone");
  await instalments("settled", true);
  await guardianOf("told");
});

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-200: undoing a leaving brings back what the leaving cancelled", () => {
  it("TA-200: the instalments the leaving cancelled are OPEN again after the undo", async () => {
    const before = await statuses("undone");
    const left = await recordDeparture(ctx("admin", "ADMIN"), ids.undoneM!, { reason: "LEFT" });
    expect(left.ok).toBe(true);
    expect(await statuses("undone")).toEqual(["ZZ Term 1:OPEN", "ZZ Term 2:CANCELLED", "ZZ Term 3:CANCELLED"]);
    expect((await undoDeparture(ctx("admin", "ADMIN"), ids.undoneM!)).ok).toBe(true);
    expect(await statuses("undone")).toEqual(before);
  });

  it("TA-200: a settlement made in between is taken back, its waived lines restored, and a later real leaving can be settled", async () => {
    const admin = ctx("admin", "ADMIN");
    expect((await recordDeparture(admin, ids.settledM!, { reason: "LEFT" })).ok).toBe(true);
    const view = await leavingSettlementFor(admin, ids.settledM!);
    await settleOnLeaving(admin, ids.settledM!, { lines: view.owed.map((l) => ({ demandId: l.demandId, choice: "CANCEL" as const })) });
    expect(await statuses("settled")).toEqual(["ZZ Term 1:WAIVED", "ZZ Term 2:WAIVED", "ZZ Term 3:CANCELLED"]);

    expect((await undoDeparture(admin, ids.settledM!)).ok).toBe(true);
    expect(await statuses("settled")).toEqual(["ZZ Term 1:OPEN", "ZZ Term 2:PART", "ZZ Term 3:OPEN"]);
    expect(await db.leavingSettlement.count({ where: { studentMembershipId: ids.settledM } })).toBe(0);
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "student.leave.undo", targetId: ids.settledM }, select: { meta: true } });
    expect(JSON.parse(audit?.meta ?? "{}")).toMatchObject({ reopenedDemands: 1, restoredLines: 2, settlementRemoved: true });

    // The real leaving, later, settles like any other.
    expect((await recordDeparture(admin, ids.settledM!, { reason: "LEFT" })).ok).toBe(true);
    const again = await leavingSettlementFor(admin, ids.settledM!);
    expect(again.canSettle).toBe(true);
    const settled = await settleOnLeaving(admin, ids.settledM!, { lines: again.owed.map((l) => ({ demandId: l.demandId, choice: "KEEP" as const })) });
    expect(settled.settled).not.toBeNull();
  });
});

describe("TA-203: a kept leaving whose execution throws is kept for the next night", () => {
  it("TA-203: the row survives a throw, is counted failed and not stale, and the next run records the departure", async () => {
    await db.scheduledDeparture.create({ data: { schoolId: ids.school!, membershipId: ids.keptM!, leaveOnKey: addDaysToKey(TODAY, -1), reason: "TRANSFERRED", scheduledByMembershipId: ids.adminM! } });
    // Once only; every later call goes to the client's own method (restoring the spy would take it off the client).
    const original = appDb.$tenantTransaction;
    vi.spyOn(appDb, "$tenantTransaction")
      .mockImplementation(((work: (tx: unknown) => Promise<unknown>, opts?: { timeout?: number; maxWait?: number }) => original.call(appDb, work, opts)) as typeof original)
      .mockRejectedValueOnce(new Error("ZZ the connection dropped"));
    const first = await runDueDepartures(new Date(), { schoolIds: [ids.school!] });
    expect(await db.scheduledDeparture.count({ where: { membershipId: ids.keptM } })).toBe(1);
    expect({ executed: first.executed, skippedStale: first.skippedStale }).toEqual({ executed: 0, skippedStale: 0 });
    expect((first as { failed?: number }).failed).toBe(1);
    expect((await db.membership.findUniqueOrThrow({ where: { id: ids.keptM }, select: { leftAt: true } })).leftAt).toBeNull();

    const second = await runDueDepartures(new Date(), { schoolIds: [ids.school!] });
    expect(second.executed).toBe(1);
    expect(await db.scheduledDeparture.count({ where: { membershipId: ids.keptM } })).toBe(0);
    expect((await db.membership.findUniqueOrThrow({ where: { id: ids.keptM }, select: { leftAt: true } })).leftAt).not.toBeNull();
  });
});

describe("TA-411: undoing a leaving tells the guardians, as the leaving did", () => {
  it("TA-411: one notice per guardian after the undo", async () => {
    const admin = ctx("admin", "ADMIN");
    expect((await recordDeparture(admin, ids.toldM!, { reason: "LEFT" })).ok).toBe(true);
    const told = () => db.notification.count({ where: { userId: ids.toldParent, titleKey: "notifTitle.childLeavingUndone" } });
    expect(await told()).toBe(0);
    expect((await undoDeparture(admin, ids.toldM!)).ok).toBe(true);
    expect(await told()).toBe(1);
  });
});

describe("TA-601: a last day that does not exist is refused, not kept", () => {
  it("TA-601: the door's body refuses 2026-13-01, 2026-11-31 and 2027-02-30 naming leftOn", () => {
    for (const leftOn of ["2026-13-01", "2026-11-31", "2027-02-30"]) {
      const parsed = leavingBodySchema.safeParse({ reason: "TRANSFERRED", leftOn });
      expect(parsed.success, leftOn).toBe(false);
      if (!parsed.success) expect(parsed.error.issues[0]?.path).toEqual(["leftOn"]);
    }
  });

  it("TA-601: the library refuses them too, from either door, and keeps nothing", async () => {
    const admin = ctx("admin", "ADMIN");
    for (const leftOn of ["2099-13-01", "2099-11-31", "2099-02-30"]) {
      expect(await recordOrScheduleLeaving(admin, ids.impossibleM!, { reason: "TRANSFERRED", leftOn }), leftOn).toEqual({ ok: false, errorKey: "refusal.leaveDateInvalid" });
      expect(await scheduleDeparture(admin, ids.impossibleM!, { reason: "TRANSFERRED", leaveOnKey: leftOn }), leftOn).toEqual({ ok: false, errorKey: "refusal.leaveDateInvalid" });
    }
    expect(await recordOrScheduleLeaving(admin, ids.impossibleM!, { reason: "TRANSFERRED", leftOn: "2026-11-31" })).toEqual({ ok: false, errorKey: "refusal.leaveDateInvalid" });
    expect(await db.scheduledDeparture.count({ where: { membershipId: ids.impossibleM } })).toBe(0);
    expect((await db.membership.findUniqueOrThrow({ where: { id: ids.impossibleM }, select: { leftAt: true } })).leftAt).toBeNull();
  });
});
