/**
 * Onboarding with the school's terms (decision 0010, the brief of 21 November 2026, version 3, rule 5): any of the new
 * fields (subscription, premium, freeMonths) takes the new path, where the renewal is the start plus the free months
 * (calendar months, the day held to the month's end) or a typed day, the school is DUE when that is the start day or on
 * or before today and TRIAL otherwise, and its terms are set; a renewal more than a year on needs one tick and one before
 * today another. With none of them, today's rule exactly: a year, or a thirty-day trial, terms not set, premium off.
 *
 * This suite's own operator; every school it onboards is named with its stamp and removed afterwards with its rows.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { renewalFrom, type OperatorOnboardBody } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { onboardSchool } from "@/lib/subscriptions";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const PREFIX = `ZZ Premium Onboard ${STAMP}`;
const NOW = new Date();
// The new path reckons the school's own day (C1b), and these schools keep Asia/Kolkata's; the old path keeps the UTC day.
const today = todayKey("Asia/Kolkata", NOW);
const day = (offset: number) => addDaysToKey(today, offset);
const utcToday = NOW.toISOString().slice(0, 10);
let operatorUserId = "";
let n = 0;

async function operator(): Promise<ActiveContext> {
  __resetCookies();
  await createSession(operatorUserId);
  return (await getSession())!;
}
function body(extra: Partial<OperatorOnboardBody> = {}): OperatorOnboardBody {
  n += 1;
  return { name: `${PREFIX} ${n}`, contactEmail: `zz-premium-onb-${n}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", trial: false, adminEmail: `zz-premium-onb-admin-${n}-${STAMP}@test.invalid`, ...extra } as OperatorOnboardBody;
}
async function made(result: Awaited<ReturnType<typeof onboardSchool>>) {
  if (!("schoolId" in result)) throw new Error(`refused: ${JSON.stringify(result)}`);
  return db.school.findUniqueOrThrow({
    where: { id: result.schoolId },
    select: { subscriptionStatus: true, subscriptionStartsAt: true, subscriptionDueAt: true, termsSetAt: true, premiumStudents: true, premiumTeachers: true, subscriptionPricePaise: true, subscriptionDiscountBps: true, premiumPricePaise: true, premiumDiscountBps: true },
  });
}
const keyOf = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

beforeAll(async () => {
  operatorUserId = (await db.user.create({ data: { name: `${PREFIX} Operator`, email: `zz-premium-onb-operator-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const schools = (await db.school.findMany({ where: { name: { startsWith: PREFIX } }, select: { id: true } })).map((s) => s.id);
  await db.session.deleteMany({ where: { userId: operatorUserId } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: operatorUserId }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { OR: [{ id: operatorUserId }, { email: { contains: `-${STAMP}@test.invalid` } }] } });
  await db.$disconnect();
});

describe("onboarding with the school's terms", () => {
  it("six free months: Trial, renewing six calendar months on, terms set, premium for students as ticked", async () => {
    const row = await made(await onboardSchool(await operator(), body({ freeMonths: 6, premium: { students: true, teachers: false } }), NOW));
    expect({ status: row.subscriptionStatus, starts: keyOf(row.subscriptionStartsAt), due: keyOf(row.subscriptionDueAt), set: row.termsSetAt !== null, students: row.premiumStudents, teachers: row.premiumTeachers }).toEqual({
      status: "TRIAL",
      starts: today,
      due: renewalFrom(today, 6),
      set: true,
      students: true,
      teachers: false,
    });
    expect([row.subscriptionPricePaise, row.subscriptionDiscountBps, row.premiumPricePaise, row.premiumDiscountBps]).toEqual([null, null, null, null]);
  });
  it("no free months: Due, renewing on its first day", async () => {
    const row = await made(await onboardSchool(await operator(), body({ freeMonths: 0 }), NOW));
    expect({ status: row.subscriptionStatus, due: keyOf(row.subscriptionDueAt) }).toEqual({ status: "DUE", due: today });
  });
  it("a typed renewal more than a year on needs its tick; one before today needs its own, and starts Due", async () => {
    const ctx = await operator();
    expect(await onboardSchool(ctx, body({ freeMonths: 6, dueAt: day(400) }), NOW)).toEqual({ ok: false, errorKey: "root.renewalOverAYear" });
    const long = await made(await onboardSchool(ctx, body({ freeMonths: 6, dueAt: day(400), acceptOverAYear: true }), NOW));
    expect({ status: long.subscriptionStatus, due: keyOf(long.subscriptionDueAt) }).toEqual({ status: "TRIAL", due: day(400) });
    expect(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: day(-5) }), NOW)).toEqual({ ok: false, errorKey: "root.renewalBeforeToday" });
    const late = await made(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: day(-5), acceptDueNow: true }), NOW));
    expect({ status: late.subscriptionStatus, due: keyOf(late.subscriptionDueAt) }).toEqual({ status: "DUE", due: day(-5) });
    expect(await onboardSchool(ctx, body({ freeMonths: 6, startsAt: day(10), dueAt: day(5) }), NOW)).toEqual({ ok: false, errorKey: "root.subscriptionDatesOrder" });
  });
  it("an own discount at onboarding is kept as the school's own; a college has no own price and no teachers' premium", async () => {
    const ctx = await operator();
    const row = await made(await onboardSchool(ctx, body({ subscription: { mode: "OWN_DISCOUNT", discountBps: 2_000 } }), NOW));
    expect({ discount: row.subscriptionDiscountBps, price: row.subscriptionPricePaise, set: row.termsSetAt !== null, due: keyOf(row.subscriptionDueAt) }).toEqual({ discount: 2_000, price: null, set: true, due: renewalFrom(today, 6) });
    expect(await onboardSchool(ctx, body({ kind: "COLLEGE", subscription: { mode: "OWN_PRICE", pricePaise: 15_000 } }), NOW)).toEqual({ ok: false, errorKey: "root.termsOwnPriceAtCollege" });
    expect(await onboardSchool(ctx, body({ kind: "COLLEGE", premium: { students: true, teachers: true } }), NOW)).toEqual({ ok: false, errorKey: "root.termsTeachersAtCollege" });
  });
  it("without the new fields, today's rule exactly: a thirty-day trial, terms not set, premium off", async () => {
    const row = await made(await onboardSchool(await operator(), body({ trial: true }), NOW));
    expect({ status: row.subscriptionStatus, due: keyOf(row.subscriptionDueAt), set: row.termsSetAt, students: row.premiumStudents }).toEqual({ status: "TRIAL", due: addDaysToKey(utcToday, 30), set: null, students: false });
  });
  it("a renewal typed as today, with the start before it, needs the Due now tick too (§2.5: on or before today)", async () => {
    const ctx = await operator();
    expect(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: today }), NOW)).toEqual({ ok: false, errorKey: "root.renewalBeforeToday" });
    const row = await made(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: today, acceptDueNow: true }), NOW));
    expect({ status: row.subscriptionStatus, due: keyOf(row.subscriptionDueAt) }).toEqual({ status: "DUE", due: today });
    // Starting today with no free months: owed from the first day, and no tick is asked.
    expect((await made(await onboardSchool(ctx, body({ freeMonths: 0 }), NOW))).subscriptionStatus).toBe("DUE");
  });
  it("the new path reckons the school's own day (C1b): at 02:00 on 22 November in Kolkata, 20:30 UTC on the 21st, no free months start and fall due on the 22nd; the old path keeps the UTC day", async () => {
    const ctx = await operator();
    const pinned = new Date("2026-11-21T20:30:00.000Z");
    const row = await made(await onboardSchool(ctx, body({ freeMonths: 0 }), pinned));
    expect({ status: row.subscriptionStatus, starts: keyOf(row.subscriptionStartsAt), due: keyOf(row.subscriptionDueAt) }).toEqual({ status: "DUE", starts: "2026-11-22", due: "2026-11-22" });
    const old = await made(await onboardSchool(ctx, body({ trial: true }), pinned));
    expect({ starts: keyOf(old.subscriptionStartsAt), due: keyOf(old.subscriptionDueAt) }).toEqual({ starts: "2026-11-21", due: "2026-12-21" });
  });
});
