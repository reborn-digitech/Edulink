/**
 * A partner's commission once a school's terms are set (decision 0010 decision 6; the owner's Q5 of 21 November 2026,
 * "Paid-up subscription only": "Their percent of the subscription (price x pupils / 12 a month), only while the school is
 * Active and not past its renewal date. Premium is not shared. A paused school earns nothing."; the brief's rule 15, phase 3).
 *
 * The figure is the subscription month: what the school pays a student a year after any discount, × its newest count from
 * the nightly sample (sampleUsage, never members), ÷ 12, every kind; earned while ACTIVE and before the renewal day on the
 * school's own day (the day itself earns nothing); premium never; a school in its free months, with a year owed, paused or
 * ended earns nothing, and one past its renewal is named. A school whose terms are not set keeps today's reading (the
 * plan's old monthly price while ACTIVE, whatever the date; tests/subscriptions.test.ts holds that too). "Unpriced" is no
 * figure (no count, a college with no tier), never ₹0, which is free by agreement and earns nothing.
 *
 * As the database's owner (tests/setup.ts), on ZZ schools, people, a plan and a partner made here, every one removed after,
 * scoped to them. The suite's plans asked for are named (setActivePlansForTests) and dropped after each case.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { operatorPartnersSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { commissionOwedPaise, createPartner, dayToDate, listPartners, operatorDashboard } from "@/lib/subscriptions";
import { createPlan, sampleUsage } from "@/lib/plans";
import { listColleges } from "@/lib/operator-college";
import { setActivePlansForTests } from "@/lib/person-plans";
import { todayKey } from "@/lib/dates";
import { GET as partnersGet } from "@/app/api/v1/operator/partners/route";

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const NOW = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
const ZONE = "Asia/Kolkata";
const TODAY = todayKey(ZONE, NOW);
const day = (offset: number) => new Date(NOW.getTime() + offset * DAY).toISOString().slice(0, 10);
const PERCENT_TENTHS = 125; // 12.5 %
const PUPILS = 120;

let operatorUserId = "";
let partnerId = "";
let planId = "";
let zeroPlanId = "";
let tierPlanId = "";
const ids: Record<string, string> = {};
const pupilIds: string[] = [];

const operator = () => ({ user: { id: operatorUserId, isSuperuser: true, email: `zz-cv2-op-${STAMP}@test.invalid` } }) as unknown as Parameters<typeof listPartners>[0];

async function makeSchool(key: string, data: Record<string, unknown>, pupils: number | null) {
  const row = await db.school.create({
    data: {
      name: `ZZ Commission ${key} ${STAMP}`,
      slug: `zz-cv2-${key.toLowerCase()}-${STAMP}`,
      code: `ZC${String(Object.keys(ids).length).padStart(2, "0")}${String(STAMP).slice(-4)}`,
      contactEmail: `zz-cv2-${key.toLowerCase()}-${STAMP}@test.invalid`,
      timezone: ZONE,
      isTestFixture: true,
      commissionPartnerId: partnerId,
      ...data,
    },
    select: { id: true },
  });
  ids[key] = row.id;
  if (pupils !== null) await db.usageSample.create({ data: { schoolId: row.id, month: TODAY.slice(0, 7), pupils, messages: 0, storageMb: 0, activeUsers: 0 } });
  return row.id;
}

/** Terms set a while ago, an own price of ₹100 a student a year (independent of the platform's offer), paid up: the case that earns. */
const PAID = { termsSetAt: new Date(NOW.getTime() - 40 * DAY), subscriptionPricePaise: 10_000, subscriptionStatus: "ACTIVE", subscriptionStartsAt: dayToDate(day(-30)), subscriptionDueAt: dayToDate(day(300)) };

beforeAll(async () => {
  const op = await db.user.create({ data: { name: "ZZ Commission Operator", email: `zz-cv2-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } });
  operatorUserId = op.id;
  const partner = await createPartner(operator(), { name: `ZZ Commission Partner ${STAMP}`, percentTenths: PERCENT_TENTHS });
  if (!partner.ok) throw new Error(partner.errorKey);
  partnerId = partner.partnerId;
  const plan = await createPlan(operator(), { code: `zz-cv2-${STAMP}`, name: "ZZ Commission Plan" });
  if (!plan.ok) throw new Error(plan.errorKey);
  planId = plan.planId;
  // The old monthly price a school whose terms are not set is still read by (rule 16): ₹1,000, written as a fixture, since
  // no door or form writes one any more; and a plan whose old price is ₹0, which today's reading counts as unpriced (C4d).
  await db.plan.update({ where: { id: planId }, data: { priceMonthlyPaise: 100_000 } });
  const zero = await createPlan(operator(), { code: `zz-cv2-zero-${STAMP}`, name: "ZZ Commission Plan at nought" });
  if (!zero.ok) throw new Error(zero.errorKey);
  zeroPlanId = zero.planId;
  await db.plan.update({ where: { id: zeroPlanId }, data: { priceMonthlyPaise: 0 } });

  // Earns: ₹100 × 120 pupils from the nightly sample ÷ 12 = ₹1,000 a month; 12.5 % = ₹125.
  await makeSchool("Paid", PAID, null);
  const made = await Promise.all(
    Array.from({ length: PUPILS }, (_, i) => db.user.create({ data: { name: `ZZ Commission Pupil ${i}`, email: `zz-cv2-p${i}-${STAMP}@test.invalid` }, select: { id: true } })),
  );
  pupilIds.push(...made.map((u) => u.id));
  await db.membership.createMany({ data: pupilIds.map((userId) => ({ userId, schoolId: ids.Paid!, role: "STUDENT", status: "ACTIVE", joinedAt: new Date(NOW.getTime() - 20 * DAY) })) });
  await sampleUsage(NOW, { schoolIds: [ids.Paid!] });

  // Past its renewal, and on the renewal day itself: nothing, and named.
  await makeSchool("Lapsed", { ...PAID, subscriptionDueAt: dayToDate(day(-5)) }, 60);
  await makeSchool("Renews", { ...PAID, subscriptionDueAt: dayToDate(TODAY) }, 60);
  // A year owed past its renewal: nothing, and named.
  await makeSchool("Owed", { ...PAID, subscriptionStatus: "DUE", subscriptionDueAt: dayToDate(day(-3)) }, 60);
  // Terms not set: today's reading, the plan's old ₹1,000 a month while ACTIVE, the renewal passed or not; never named.
  await makeSchool("Old", { subscriptionStatus: "ACTIVE", planId, subscriptionStartsAt: dayToDate(day(-400)), subscriptionDueAt: dayToDate(day(-5)) }, 60);
  // Paused (SUSPENDED), and in its free months (TRIAL): nothing, not named.
  await makeSchool("Paused", { ...PAID, subscriptionStatus: "SUSPENDED", subscriptionDueAt: dayToDate(day(-5)) }, 60);
  await makeSchool("Free", { ...PAID, subscriptionStatus: "TRIAL", subscriptionDueAt: dayToDate(day(100)) }, 60);
  // Premium on with its plan asked for, and an own premium price: the share is the subscription's alone.
  await makeSchool("Premium", { ...PAID, premiumStudents: true, premiumPricePaise: 5_000 }, PUPILS);
  // A college with no tier, terms set: no figure, unpriced. A school at 100 % off: ₹0, free by agreement, not unpriced.
  await makeSchool("NoTier", { ...PAID, subscriptionPricePaise: null, kind: "COLLEGE" }, 60);
  await makeSchool("Gratis", { ...PAID, subscriptionPricePaise: null, subscriptionDiscountBps: 10_000 }, 60);
  // Terms set and paid up, but with no count yet: unpriced.
  await makeSchool("Uncounted", PAID, null);
  // Terms not set, ACTIVE, on a plan whose old price is ₹0: unpriced, exactly as today.
  await makeSchool("ZeroPlan", { subscriptionStatus: "ACTIVE", planId: zeroPlanId, subscriptionStartsAt: dayToDate(day(-400)), subscriptionDueAt: dayToDate(day(30)) }, 60);
});

afterEach(() => setActivePlansForTests([]));

afterAll(async () => {
  __resetCookies();
  const schools = Object.values(ids);
  const users = [operatorUserId, ...pupilIds];
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.operatorAccess.deleteMany({ where: { userId: operatorUserId } });
  await db.membership.deleteMany({ where: { schoolId: { in: schools } } });
  await db.usageSample.deleteMany({ where: { schoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: users } }, { targetId: { in: [...schools, partnerId, planId] } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.plan.deleteMany({ where: { id: { in: [planId, zeroPlanId].filter(Boolean) } } });
  // The tier plan only if this run made it, and only with no school on it: another suite may have found it meanwhile (point 6).
  if (tierPlanId) await db.plan.deleteMany({ where: { id: tierPlanId, schools: { none: {} } } });
  await db.commissionPartner.deleteMany({ where: { id: partnerId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

const SHARE = commissionOwedPaise(PERCENT_TENTHS, 100_000); // 12.5 % of ₹1,000 = ₹125

describe("a partner's month once terms are set (decision 6, the owner's Q5; C4, C4c, C4d, C4e)", () => {
  it("₹100 × 120 pupils from the nightly sample ÷ 12, at 12.5 %; only ACTIVE counts; the unpriced and the renewal-reached named; ₹0 in neither list; terms not set as today; premium never", async () => {
    setActivePlansForTests(["STUDENT"]);
    expect((await db.usageSample.findFirstOrThrow({ where: { schoolId: ids.Paid! }, select: { pupils: true } })).pupils).toBe(PUPILS);
    const partner = (await listPartners(operator(), NOW)).find((p) => p.id === partnerId)!;
    const school = (key: string) => partner.schools.find((s) => s.id === ids[key])!;
    const none = { earns: false, unpriced: false, renewalReached: false, freeByAgreement: false };
    // round(100 × 120 × 100 ÷ 12) = 100,000 paise a month.
    expect(school("Paid")).toMatchObject({ priceMonthlyPaise: 100_000, termsSet: true, ...none, earns: true });
    expect(school("Premium")).toMatchObject({ priceMonthlyPaise: 100_000, ...none, earns: true });
    // The renewal day come, and the day itself: nothing, named.
    expect(school("Lapsed")).toMatchObject({ priceMonthlyPaise: 50_000, ...none, renewalReached: true });
    expect(school("Renews")).toMatchObject({ priceMonthlyPaise: 50_000, ...none, renewalReached: true });
    // A year owed, paused, in its free months: nothing and no list (only ACTIVE counts); its status says why.
    for (const key of ["Owed", "Paused", "Free"]) expect(school(key), key).toMatchObject(none);
    // Terms not set: today's reading, the plan's ₹1,000 whatever the renewal; a plan at ₹0 unpriced, as today.
    expect(school("Old")).toMatchObject({ priceMonthlyPaise: 100_000, termsSet: false, ...none, earns: true });
    expect(school("ZeroPlan")).toMatchObject({ priceMonthlyPaise: 0, termsSet: false, ...none, unpriced: true });
    // Terms set with no figure: a college with no tier, a school with no count; unpriced. At ₹0: free by agreement, no list.
    expect(school("NoTier")).toMatchObject({ priceMonthlyPaise: null, ...none, unpriced: true });
    expect(school("Uncounted")).toMatchObject({ priceMonthlyPaise: null, ...none, unpriced: true });
    expect(school("Gratis")).toMatchObject({ priceMonthlyPaise: 0, ...none, freeByAgreement: true });
    // Paid, Premium (its subscription alone) and Old (today's reading): three shares of ₹125.
    expect(partner.owedThisMonthPaise).toBe(3 * SHARE);
    expect(partner.unpricedSchools).toBe(3);
    expect(partner.unpricedSchoolsNamed.map((s) => s.id).sort()).toEqual([ids.NoTier, ids.Uncounted, ids.ZeroPlan].sort());
    expect(partner.renewalReachedSchools.map((s) => [s.id, s.dueDay]).sort()).toEqual([[ids.Lapsed, day(-5)], [ids.Renews, TODAY]].sort());
  });

  it("the renewal day is the school's own: a renewal of today in Kolkata is reached at 20:30 UTC the evening before", async () => {
    // 20:30 UTC on the UTC day before TODAY is 02:00 on TODAY in Kolkata: the Renews school's renewal (TODAY) has come
    // there, though in UTC it is still the day before.
    const before = new Date(Date.parse(`${TODAY}T00:00:00Z`) - DAY).toISOString().slice(0, 10);
    const evening = new Date(`${before}T20:30:00Z`);
    expect(todayKey(ZONE, evening)).toBe(TODAY);
    expect(todayKey("UTC", evening)).toBe(before);
    const partner = (await listPartners(operator(), evening)).find((p) => p.id === partnerId)!;
    expect(partner.schools.find((s) => s.id === ids.Renews)).toMatchObject({ earns: false, renewalReached: true });
  });

  it("the dashboard's entry for the partner and the operator's door read the same figures and lists", async () => {
    setActivePlansForTests(["STUDENT"]);
    const d = await operatorDashboard(operator(), { schoolIds: Object.values(ids), now: NOW });
    expect(d.partners.find((p) => p.id === partnerId)).toMatchObject({ owedThisMonthPaise: 3 * SHARE, unpricedSchools: 3, renewalReachedSchools: 2 });
    __resetCookies();
    await createSession(operatorUserId);
    const res = await partnersGet();
    expect(res.status).toBe(200);
    const row = operatorPartnersSchema.parse(await res.json()).items.find((p) => p.id === partnerId)!;
    expect(row).toMatchObject({ owedThisMonthPaise: 3 * SHARE, unpricedSchools: 3 });
    expect(row.renewalReachedSchools.map((s) => s.name).sort()).toEqual([`ZZ Commission Lapsed ${STAMP}`, `ZZ Commission Renews ${STAMP}`]);
    expect(row.unpricedSchoolsNamed.map((s) => s.name).sort()).toEqual([`ZZ Commission NoTier ${STAMP}`, `ZZ Commission Uncounted ${STAMP}`, `ZZ Commission ZeroPlan ${STAMP}`]);
  });
});

describe("a college reads its subscription from the sums once its terms are set (rule 7)", () => {
  it("on its tier: the tier less its own discount, x its newest count; no tier chosen: no price; terms not set: the tier's year as before", async () => {
    // A tier is known by its code alone, so the case needs the plan that has it: found, or made and removed after, as
    // tests/operator-college.test.ts and tests/ta-decision-488-college-price-kind.test.ts do, exactly: this run removes only a
    // plan it made, and only with no school on it, and never another run's leftover, which another suite may have just found
    // and be about to put a school on (the coordinating session's check of the review fixes, point 6).
    const existing = await db.plan.findUnique({ where: { code: "college-affiliated" }, select: { id: true } });
    const tierId = existing?.id ?? (tierPlanId = (await db.plan.create({ data: { code: "college-affiliated", name: "ZZ tier" }, select: { id: true } })).id);
    await makeSchool("TierCollege", { ...PAID, kind: "COLLEGE", planId: tierId, subscriptionPricePaise: null, subscriptionDiscountBps: 1_000, commissionPartnerId: null }, 50);
    await makeSchool("BareCollege", { ...PAID, kind: "COLLEGE", subscriptionPricePaise: null, commissionPartnerId: null }, 50);
    await makeSchool("OldCollege", { kind: "COLLEGE", planId: tierId, subscriptionStatus: "ACTIVE", commissionPartnerId: null }, 50);
    // At 100 % off its tier: ₹0, which the page reads as "Free by agreement" (decision 14), never "₹0".
    await makeSchool("FreeCollege", { ...PAID, kind: "COLLEGE", planId: tierId, subscriptionPricePaise: null, subscriptionDiscountBps: 10_000, commissionPartnerId: null }, 50);
    const { items } = await listColleges(operator(), { schoolIds: [ids.TierCollege!, ids.BareCollege!, ids.OldCollege!, ids.FreeCollege!] });
    const row = (key: string) => items.find((c) => c.id === ids[key])!;
    // Rs 199 less 10 % is Rs 179.10, held to Rs 179 (whole rupees, half up); x 50 pupils = Rs 8,950 a year.
    // The count is the nightly sample's (50 here), never the members on the roll beside it (none made here).
    expect(row("TierCollege")).toMatchObject({ students: 0, tierYearPaise: null, terms: { set: true, perStudentPaise: 17_900, pupils: 50, yearPaise: 895_000 } });
    expect(row("BareCollege")).toMatchObject({ tierYearPaise: null, terms: { set: true, perStudentPaise: null, pupils: 50, yearPaise: null } });
    // Not set: exactly as before, the tier's year at today's roll (members on the roll: none made here).
    expect(row("OldCollege")).toMatchObject({ tierYearPaise: 0, terms: { set: false, perStudentPaise: null, pupils: null, yearPaise: null } });
    expect(row("FreeCollege")).toMatchObject({ terms: { set: true, perStudentPaise: 0, pupils: 50, yearPaise: 0 } });
  });
});
