import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { gigSettings } from "@/lib/gig-questions";
import { freeDutyRemaining, offerSlot, quarterKey } from "@/lib/gig-sessions";
import type { ActiveContext } from "@/lib/session";

/**
 * Free duty before a price (decision 0004): the first ten one-to-ones and
 * two workshops free, then two free one-to-ones a month and one free
 * workshop a quarter. `freeDutyRemaining` is the one rule, counted from
 * DELIVERED sessions (a workshop once however many seats it held), and
 * `offerSlot` refuses a price while anything is owed — and, paid sessions
 * not being built, refuses it after too, without ever storing it.
 */
const db = new PrismaClient();
const STAMP = Date.now();
let saved: Awaited<ReturnType<typeof gigSettings>>;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const slotIds: string[] = [];

const ctx = (key: string, role: ActiveContext["role"], school: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: key, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;

/** A slot of `expertKey` held at `at`, with one DELIVERED seat per pupil named. */
async function held(expertKey: string, kind: "ONE_TO_ONE" | "WORKSHOP", at: Date, pupils: string[]) {
  const slot = await db.gigSlot.create({ data: { providerUserId: id[expertKey]!, providerKind: "EXPERT", kind, title: `ZZ duty ${STAMP} ${slotIds.length}`, startsAt: at, endsAt: new Date(at.getTime() + 1_800_000), meetingUrl: "https://meet.example.test/zz", seats: Math.max(1, pupils.length), seatsTaken: pupils.length }, select: { id: true } });
  slotIds.push(slot.id);
  for (const p of pupils) await db.gigBooking.create({ data: { schoolId, slotId: slot.id, studentMembershipId: member[p]!, providerUserId: id[expertKey]!, kind, bookedByUserId: id[p]!, purpose: "ZZ a delivered session for the duty test", status: "DELIVERED", closedAt: at } });
}
const OCT_15 = new Date("2026-10-15T06:00:00Z");
const NOV_1 = new Date("2026-11-01T06:00:00Z");
const JAN_15 = new Date("2027-01-15T06:00:00Z");

beforeAll(async () => {
  saved = await gigSettings();
  await db.gigSettings.update({ where: { id: "gigs" }, data: { expertStartOneToOnes: 10, expertStartWorkshops: 2, expertMonthlyOneToOnes: 2, expertQuarterlyWorkshops: 1, teacherMonthlyGuidance: 2 } });
  const s = await db.school.create({ data: { name: `ZZ Duty School ${STAMP}`, slug: `zz-duty-${STAMP}`, code: `ZZD${String(STAMP).slice(-7)}`, contactEmail: `zz-duty-${STAMP}@test.invalid`, isTestFixture: true, teacherGuidanceOn: true }, select: { id: true } });
  schoolId = s.id;
  const person = async (key: string, role: string | null) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-duty-${key}-${STAMP}@test.invalid` }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("seasoned", null);
  await person("starter", null);
  await person("teacher", "TEACHER");
  for (const p of ["p1", "p2", "p3"]) await person(p, "STUDENT");
  await db.expertProfile.create({ data: { userId: id.seasoned!, headline: "ZZ Seasoned", offering: "BOTH", publishedAt: new Date() } });
  await db.expertProfile.create({ data: { userId: id.starter!, headline: "ZZ Starter", offering: "BOTH", publishedAt: new Date() } });
  // The seasoned expert: ten one-to-ones in September (the start duty), one in October; two workshops in the third quarter (one of them with three seats), none yet in the fourth.
  for (let i = 0; i < 10; i += 1) await held("seasoned", "ONE_TO_ONE", new Date(`2026-09-${String(i + 2).padStart(2, "0")}T06:00:00Z`), ["p1"]);
  await held("seasoned", "ONE_TO_ONE", new Date("2026-10-03T06:00:00Z"), ["p2"]);
  await held("seasoned", "WORKSHOP", new Date("2026-07-10T06:00:00Z"), ["p1", "p2", "p3"]);
  await held("seasoned", "WORKSHOP", new Date("2026-08-10T06:00:00Z"), ["p1"]);
  // The starter: three one-to-ones and nothing else.
  for (let i = 0; i < 3; i += 1) await held("starter", "ONE_TO_ONE", new Date(`2026-10-${String(i + 2).padStart(2, "0")}T06:00:00Z`), ["p1"]);
});

afterAll(async () => {
  await db.gigSlot.deleteMany({ where: { id: { in: slotIds } } });
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: Object.values(id) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: Object.values(id) } } }).catch(() => {});
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: Object.values(id) } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("free duty (decision 0004)", () => {
  it("quarters follow the month key", () => {
    expect(quarterKey("2026-10")).toBe("2026-Q4");
    expect(quarterKey("2026-01")).toBe("2026-Q1");
    expect(quarterKey("2027-03")).toBe("2027-Q1");
  });

  it("the starter still owes the first ten: seven one-to-ones and both workshops, whatever the month", async () => {
    const duty = await freeDutyRemaining(id.starter!, OCT_15);
    expect(duty).toMatchObject({ oneToOnes: 7, workshops: 2, period: { month: "2026-10", quarter: "2026-Q4" }, stage: { oneToOnes: "START", workshops: "START" }, dutyDone: false });
    expect((await freeDutyRemaining(id.starter!, NOV_1)).oneToOnes).toBe(7);
  });

  it("past the start duty the month and the quarter count: one of two one-to-ones left in October, one workshop left in Q4; a workshop with three seats counted once", async () => {
    const duty = await freeDutyRemaining(id.seasoned!, OCT_15);
    expect(duty).toMatchObject({ oneToOnes: 1, workshops: 1, stage: { oneToOnes: "ONGOING", workshops: "ONGOING" }, dutyDone: false });
  });

  it("across the month boundary October's session no longer counts: two owed again in November; the quarter is unchanged until January", async () => {
    expect((await freeDutyRemaining(id.seasoned!, NOV_1))).toMatchObject({ oneToOnes: 2, workshops: 1, period: { month: "2026-11", quarter: "2026-Q4" } });
    await held("seasoned", "WORKSHOP", new Date("2026-11-20T06:00:00Z"), ["p1", "p2"]);
    expect((await freeDutyRemaining(id.seasoned!, NOV_1)).workshops).toBe(0);
    expect((await freeDutyRemaining(id.seasoned!, JAN_15))).toMatchObject({ workshops: 1, period: { quarter: "2027-Q1" } });
  });

  it("a one-to-one is never priced; a workshop price is refused while free one-to-ones are owed, with how many, and stored once the duty is given (decision 0004 as amended)", async () => {
    const slot = (over: Record<string, unknown>) => ({ kind: "ONE_TO_ONE" as const, title: `ZZ priced ${STAMP}`, startsAt: new Date(OCT_15.getTime() + 48 * 3_600_000).toISOString(), meetingUrl: "https://meet.example.test/zz-priced", ...over });
    // Mentoring is the condition of charging, not the thing charged for: no one-to-one carries a price, whoever offers it.
    expect(await offerSlot(ctx("starter", "EXPERT", null), slot({ pricePaise: 50_000 }), OCT_15)).toEqual({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    expect(await offerSlot(ctx("seasoned", "EXPERT", null), slot({ pricePaise: 50_000 }), OCT_15)).toEqual({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    expect(await offerSlot(ctx("teacher", "TEACHER", schoolId), slot({ pricePaise: 50_000 }), OCT_15)).toEqual({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    // The gate's other three conditions met, so that the free duty is the one read here.
    const switched = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true } });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true } });
    try {
      for (const key of ["starter", "seasoned"] as const) {
        await db.expertProfile.update({ where: { userId: id[key]! }, data: { kycStatus: "VERIFIED", verifiedAt: OCT_15 } });
        await db.expertPayoutAccount.upsert({ where: { expertUserId: id[key]! }, create: { expertUserId: id[key]!, payeeName: `ZZ ${key}`, upiId: `zz.${key}${STAMP}@upi`, gstStateCode: "27", status: "ACTIVE" }, update: { payeeName: `ZZ ${key}`, upiId: `zz.${key}${STAMP}@upi`, gstStateCode: "27", status: "ACTIVE" } });
        const offer = await offerSlot(ctx(key, "EXPERT", null), slot({ title: `ZZ free one-to-one ${key} ${STAMP}` }), OCT_15);
        expect(offer.ok).toBe(true);
      }
      const workshop = (over: Record<string, unknown>) => slot({ kind: "WORKSHOP", title: `ZZ priced workshop ${STAMP}`, startsAt: new Date(OCT_15.getTime() + 72 * 3_600_000).toISOString(), ...over });
      expect(await offerSlot(ctx("starter", "EXPERT", null), workshop({ pricePaise: 10_000 }), OCT_15)).toEqual({ ok: false, errorKey: "gigs.freeDutyFirst", vars: { count: 7 } });
      expect(await offerSlot(ctx("seasoned", "EXPERT", null), workshop({ pricePaise: 10_000 }), OCT_15)).toEqual({ ok: false, errorKey: "gigs.freeDutyFirst", vars: { count: 1 } });
      // October's second one-to-one given: the month's duty is done, and a price within the band is stored.
      await held("seasoned", "ONE_TO_ONE", new Date("2026-10-09T06:00:00Z"), ["p3"]);
      expect((await freeDutyRemaining(id.seasoned!, OCT_15)).oneToOnes).toBe(0);
      const priced = await offerSlot(ctx("seasoned", "EXPERT", null), workshop({ pricePaise: 10_000 }), OCT_15);
      expect(priced.ok).toBe(true);
      expect((await db.gigSlot.findUniqueOrThrow({ where: { id: priced.ok ? priced.slotId : "" } })).pricePaise).toBe(10_000);
      // A free time is still offered, and the row's price stays zero.
      const free = await offerSlot(ctx("seasoned", "EXPERT", null), slot({ pricePaise: 0, startsAt: new Date(OCT_15.getTime() + 96 * 3_600_000).toISOString() }), OCT_15);
      expect(free.ok).toBe(true);
      expect((await db.gigSlot.findUniqueOrThrow({ where: { id: free.ok ? free.slotId : "" } })).pricePaise).toBe(0);
    } finally {
      await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: switched.paymentsEnabled } });
    }
  });
});
