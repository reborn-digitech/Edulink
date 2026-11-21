import { describe, expect, it } from "vitest";
import {
  BULK_SCHOOLS_MAX,
  END_KEEP_DAYS,
  FREE_MONTHS,
  OFFER_START,
  OPEN_GROUPS,
  OWN_DISCOUNT_CHIPS_BPS,
  PAUSE_WARNING_DAYS,
  PREMIUM_PRICE_CHIPS_PAISE,
  PRICE_MAX_PAISE,
  PRICE_MIN_PAISE,
  SCHOOL_TERMS_STATES,
  STANDING_ACTIONS,
  SUBSCRIPTION_PRICE_CHIPS_PAISE,
  billFor,
  earliestPauseDay,
  freeMonthsImplied,
  mayPauseOn,
  nextRenewalOnPayment,
  offerBodySchema,
  partTermsSchema,
  paymentBodySchema,
  paysPaise,
  premiumTerms,
  renewalFrom,
  renewalOverAYear,
  renewalReached,
  standingBodySchema,
  statusByRenewal,
  subscriptionMonthPaise,
  subscriptionTerms,
  subscriptionsQuerySchema,
  termsState,
  tierMonthPaise,
  wholeRupeesPaise,
} from "./index";

/**
 * The school's Shalaghar subscription and the premium add-on (decision 0010 parts 1 to 3, the brief's version 3 of 21
 * November 2026): two parts, each a price a student a year in whole rupees before GST, one figure for all schools with a
 * school's own discount or own price; the sums, the renewal dates and the state badge are pure and worked out on read.
 * The owner's starting values (21 November 2026, "Rs 100 + Rs 50 premium"): ₹100, ₹50 more, no discounts, six months free.
 */
const OURS = { pricePaise: OFFER_START.subscriptionPricePaise, discountBps: OFFER_START.subscriptionDiscountBps };
const OURS_20 = { pricePaise: 10_000, discountBps: 2_000 };
const PREMIUM_OURS = { pricePaise: OFFER_START.premiumPricePaise, discountBps: OFFER_START.premiumDiscountBps };
const school = (own: { pricePaise?: number | null; discountBps?: number | null } = {}, kind = "SCHOOL", planCode: string | null = null) => ({ kind, planCode, own });

describe("the starting offer and the coded lists", () => {
  it("OFFER_START is the owner's: ₹100, ₹50 more, no discounts, six months free, students ticked at onboarding", () => {
    expect(OFFER_START).toEqual({ subscriptionPricePaise: 10_000, subscriptionDiscountBps: 0, premiumPricePaise: 5_000, premiumDiscountBps: 0, freeMonths: 6, studentsByDefault: true, teachersByDefault: false });
  });
  it("the lists the forms offer, and the bounds: ₹1 to ₹10,000 in whole rupees, 0 to 100 %", () => {
    expect(FREE_MONTHS).toEqual([0, 1, 3, 6, 12]);
    expect(SUBSCRIPTION_PRICE_CHIPS_PAISE).toEqual([5_000, 10_000, 15_000, 20_000]);
    expect(PREMIUM_PRICE_CHIPS_PAISE).toEqual([2_500, 5_000, 7_500, 10_000]);
    expect(OWN_DISCOUNT_CHIPS_BPS).toEqual([1_000, 2_000, 2_500, 5_000]);
    expect([PRICE_MIN_PAISE, PRICE_MAX_PAISE]).toEqual([100, 1_000_000]);
    expect([PAUSE_WARNING_DAYS, END_KEEP_DAYS, BULK_SCHOOLS_MAX]).toEqual([7, 90, 100]);
    expect(STANDING_ACTIONS).toEqual(["warn", "pause", "resume", "end", "restore"]);
    expect(OPEN_GROUPS).toEqual(["OWN_ACCOUNT", "CONSENT", "HARM", "WHEREABOUTS", "HEALTH_CARD", "LEAVING", "CUTTING_ACCESS", "MONEY_IN_MOTION", "ONE_NOTICE", "READS_ONLY"]);
    expect(SCHOOL_TERMS_STATES).toEqual(["FREE", "FREE_ENDED", "PAID", "RENEWAL_PASSED", "INVOICED_UNPAID", "DUE_SINCE", "RECORDING_PAUSED", "ENDED", "SUSPENDED_OPEN", "NO_RECORD"]);
  });
});

describe("what a part pays: floor((base × (10000 − discount) + 500000) / 1000000) × 100, whole rupees, half up", () => {
  it("₹199 at 50 % is ₹100; ₹100 at 0.51 % is ₹99; 100 % is ₹0; no discount is the price", () => {
    expect(paysPaise(19_900, 5_000)).toBe(10_000);
    expect(paysPaise(10_000, 51)).toBe(9_900);
    expect(paysPaise(10_000, 10_000)).toBe(0);
    expect(paysPaise(10_000, 0)).toBe(10_000);
    expect(paysPaise(19_900, 1_000)).toBe(17_900);
  });
});

describe("the subscription at a school", () => {
  it("follows ours: our price, our discount", () => {
    expect(subscriptionTerms(school(), OURS)).toEqual({ basePaise: 10_000, discountBps: 0, paysPaise: 10_000, source: "OURS", tierCode: null });
    expect(subscriptionTerms(school(), OURS_20)).toMatchObject({ discountBps: 2_000, paysPaise: 8_000, source: "OURS" });
  });
  it("an own price ignores our discount", () => {
    expect(subscriptionTerms(school({ pricePaise: 12_000 }), OURS_20)).toEqual({ basePaise: 12_000, discountBps: 0, paysPaise: 12_000, source: "OWN_PRICE", tierCode: null });
  });
  it("an own 0 % beats our 20 %", () => {
    expect(subscriptionTerms(school({ discountBps: 0 }), OURS_20)).toMatchObject({ discountBps: 0, paysPaise: 10_000, source: "OWN_DISCOUNT" });
  });
  it("an own discount moves with our price: 20 % off ₹100 is ₹80, off ₹120 is ₹96", () => {
    expect(subscriptionTerms(school({ discountBps: 2_000 }), OURS)?.paysPaise).toBe(8_000);
    expect(subscriptionTerms(school({ discountBps: 2_000 }), { pricePaise: 12_000, discountBps: 0 })?.paysPaise).toBe(9_600);
  });
  it("a junior college is priced as a school, whatever plan it is on", () => {
    expect(subscriptionTerms(school({}, "JUNIOR_COLLEGE", "college-affiliated"), OURS_20)).toMatchObject({ basePaise: 10_000, paysPaise: 8_000, source: "OURS", tierCode: null });
  });
  it("never an own price and an own discount both", () => {
    expect(() => subscriptionTerms(school({ pricePaise: 12_000, discountBps: 1_000 }), OURS)).toThrow(RangeError);
    expect(() => premiumTerms({ pricePaise: 6_000, discountBps: 1_000 }, PREMIUM_OURS)).toThrow(RangeError);
  });
});

describe("the subscription at a college: its tier", () => {
  it("a tier takes our discount, or its own instead, never an own price", () => {
    expect(subscriptionTerms(school({}, "COLLEGE", "college-affiliated"), OURS)).toEqual({ basePaise: 19_900, discountBps: 0, paysPaise: 19_900, source: "OURS", tierCode: "college-affiliated" });
    expect(subscriptionTerms(school({}, "AUTONOMOUS_COLLEGE", "college-autonomous"), { pricePaise: 10_000, discountBps: 1_000 })).toMatchObject({ basePaise: 29_900, discountBps: 1_000, paysPaise: 26_900 });
    expect(subscriptionTerms(school({ discountBps: 5_000 }, "COLLEGE", "college-affiliated"), OURS_20)).toMatchObject({ discountBps: 5_000, paysPaise: 10_000, source: "OWN_DISCOUNT", tierCode: "college-affiliated" });
    expect(subscriptionTerms(school({ pricePaise: 15_000 }, "COLLEGE", "college-affiliated"), OURS)).toMatchObject({ basePaise: 19_900, paysPaise: 19_900, source: "OURS" });
  });
  it("no tier, no price", () => {
    expect(subscriptionTerms(school({}, "COLLEGE", null), OURS)).toBeNull();
    expect(subscriptionTerms(school({ discountBps: 1_000 }, "AUTONOMOUS_COLLEGE", "basic"), OURS)).toBeNull();
  });
});

describe("the premium add-on, at every kind as a school's subscription", () => {
  it("follows ours, own discount, own price", () => {
    expect(premiumTerms({}, PREMIUM_OURS)).toEqual({ basePaise: 5_000, discountBps: 0, paysPaise: 5_000, source: "OURS", tierCode: null });
    expect(premiumTerms({ discountBps: 5_000 }, PREMIUM_OURS)).toMatchObject({ paysPaise: 2_500, source: "OWN_DISCOUNT" });
    expect(premiumTerms({ pricePaise: 7_500 }, { pricePaise: 5_000, discountBps: 2_000 })).toMatchObject({ discountBps: 0, paysPaise: 7_500, source: "OWN_PRICE" });
  });
});

describe("the bill, on read at today's prices: the newest count of pupils × each part's figure", () => {
  const sub = subscriptionTerms(school({ discountBps: 2_000 }), OURS);
  const premium = premiumTerms({}, PREMIUM_OURS);
  it("412 × (₹80 + ₹50) = ₹53,560, a line a part", () => {
    expect(billFor({ pupils: 412, termsSet: true, renewalDay: "2027-05-21", subscription: sub, premium, premiumOn: true })).toEqual({
      pupils: 412,
      lines: [
        { part: "SUBSCRIPTION", perStudentPaise: 8_000, totalPaise: 3_296_000 },
        { part: "PREMIUM", perStudentPaise: 5_000, totalPaise: 2_060_000 },
      ],
      totalPaise: 5_356_000,
    });
  });
  it("premium off (neither switch on) is no premium line; a part free by agreement is no line", () => {
    expect(billFor({ pupils: 412, termsSet: true, renewalDay: "2027-05-21", subscription: sub, premium, premiumOn: false })?.totalPaise).toBe(3_296_000);
    expect(billFor({ pupils: 412, termsSet: true, renewalDay: "2027-05-21", subscription: sub, premium: null, premiumOn: true })?.totalPaise).toBe(3_296_000);
    const free = premiumTerms({ discountBps: 10_000 }, PREMIUM_OURS);
    expect(billFor({ pupils: 412, termsSet: true, renewalDay: "2027-05-21", subscription: sub, premium: free, premiumOn: true })?.lines.map((l) => l.part)).toEqual(["SUBSCRIPTION"]);
  });
  it("no bill without terms, a renewal, a count, or a subscription figure (a college with no tier)", () => {
    expect(billFor({ pupils: 412, termsSet: false, renewalDay: "2027-05-21", subscription: sub, premium, premiumOn: true })).toBeNull();
    expect(billFor({ pupils: 412, termsSet: true, renewalDay: null, subscription: sub, premium, premiumOn: true })).toBeNull();
    expect(billFor({ pupils: null, termsSet: true, renewalDay: "2027-05-21", subscription: sub, premium, premiumOn: true })).toBeNull();
    expect(billFor({ pupils: 412, termsSet: true, renewalDay: "2027-05-21", subscription: null, premium, premiumOn: true })).toBeNull();
  });
});

describe("the subscription month, a partner's base: round(pays × pupils ÷ 12)", () => {
  it("₹100 × 120 pupils is ₹1,000 a month; a tier at no discount is tierMonthPaise", () => {
    expect(subscriptionMonthPaise(subscriptionTerms(school(), OURS), 120)).toBe(100_000);
    expect(subscriptionMonthPaise(subscriptionTerms(school({}, "COLLEGE", "college-affiliated"), OURS), 37)).toBe(tierMonthPaise("college-affiliated", 37));
    expect(subscriptionMonthPaise(null, 120)).toBeNull();
    expect(subscriptionMonthPaise(subscriptionTerms(school(), OURS), null)).toBeNull();
  });
});

describe("the renewal from the free months: calendar months, the day held to the month's end", () => {
  it("21 Nov 2026 + 6 is 21 May 2027; 31 Aug + 6 is 28 Feb, 29 Feb in a leap year; 0 is the start day; 12 a year", () => {
    expect(renewalFrom("2026-11-21", 6)).toBe("2027-05-21");
    expect(renewalFrom("2026-08-31", 6)).toBe("2027-02-28");
    expect(renewalFrom("2027-08-31", 6)).toBe("2028-02-29");
    expect(renewalFrom("2026-11-21", 0)).toBe("2026-11-21");
    expect(renewalFrom("2026-11-21", 12)).toBe("2027-11-21");
    expect(renewalFrom("2028-02-29", 12)).toBe("2029-02-28");
  });
  it("a typed renewal implies its whole months: 21 Jul 2027 is 8; a day short of a month is one fewer; before the start, none", () => {
    expect(freeMonthsImplied("2026-11-21", "2027-07-21")).toBe(8);
    expect(freeMonthsImplied("2026-11-21", "2027-07-20")).toBe(7);
    expect(freeMonthsImplied("2026-11-21", "2026-11-21")).toBe(0);
    expect(freeMonthsImplied("2026-08-31", "2027-02-28")).toBe(6);
    expect(freeMonthsImplied("2026-11-21", "2026-11-20")).toBeNull();
  });
  it("a renewal more than a year on asks the tick, told by the day and not by the whole months: 10 Dec 2027 from 21 Nov 2026 is over, 21 Nov 2027 is not", () => {
    expect(freeMonthsImplied("2026-11-21", "2027-12-10")).toBe(12);
    expect(renewalOverAYear("2026-11-21", "2027-12-10")).toBe(true);
    expect(renewalOverAYear("2026-11-21", "2027-11-21")).toBe(false);
    expect(renewalOverAYear("2026-11-21", "2027-11-22")).toBe(true);
  });
  it("a renewal day is reached on the day itself, never with no renewal on record", () => {
    expect(renewalReached("2027-05-21", "2027-05-20")).toBe(false);
    expect(renewalReached("2027-05-21", "2027-05-21")).toBe(true);
    expect(renewalReached(null, "2027-05-21")).toBe(false);
  });
  it("an unpaid school's renewal calls for DUE on the start day or on or before today, TRIAL after today (rule 5, the coordinator's C1)", () => {
    expect(statusByRenewal("2026-11-21", "2027-05-21", "2026-11-21")).toBe("TRIAL");
    expect(statusByRenewal("2026-10-01", "2026-11-21", "2026-11-21")).toBe("DUE");
    expect(statusByRenewal("2026-10-01", "2026-11-20", "2026-11-21")).toBe("DUE");
    expect(statusByRenewal("2026-10-01", "2026-11-22", "2026-11-21")).toBe("TRIAL");
    // No free months: a start ahead renews, due, on its first day, as onboarding makes it.
    expect(statusByRenewal("2026-12-01", "2026-12-01", "2026-11-21")).toBe("DUE");
    // No start on record: today alone decides.
    expect(statusByRenewal(null, "2026-12-01", "2026-11-21")).toBe("TRIAL");
    expect(statusByRenewal(null, "2026-11-21", "2026-11-21")).toBe("DUE");
  });
});

describe("a payment moves the renewal twelve months, once, never at a paused or ended school", () => {
  it("an early invoice: paid to 21 May 2027, moved to DUE on 20 Apr, paid on 1 May, renews on 21 May 2028", () => {
    expect(nextRenewalOnPayment({ status: "DUE", dueDay: "2027-05-21", paidOnDay: "2027-05-01" })).toEqual({ ok: true, renewalDay: "2028-05-21" });
  });
  it("late, in the free period, or paid up: twelve months from the renewal, whatever the day it was paid", () => {
    expect(nextRenewalOnPayment({ status: "DUE", dueDay: "2027-05-21", paidOnDay: "2027-06-10" })).toEqual({ ok: true, renewalDay: "2028-05-21" });
    expect(nextRenewalOnPayment({ status: "TRIAL", dueDay: "2027-05-21", paidOnDay: "2027-05-02" })).toEqual({ ok: true, renewalDay: "2028-05-21" });
    expect(nextRenewalOnPayment({ status: "ACTIVE", dueDay: "2028-02-29", paidOnDay: "2028-02-01" })).toEqual({ ok: true, renewalDay: "2029-02-28" });
  });
  it("no record, or no renewal on record: the year starts on the day it was paid", () => {
    expect(nextRenewalOnPayment({ status: null, dueDay: null, paidOnDay: "2026-11-21" })).toEqual({ ok: true, renewalDay: "2027-11-21" });
    expect(nextRenewalOnPayment({ status: "ACTIVE", dueDay: null, paidOnDay: "2026-11-21" })).toEqual({ ok: true, renewalDay: "2027-11-21" });
  });
  it("refused while SUSPENDED or ENDED: resume first", () => {
    expect(nextRenewalOnPayment({ status: "SUSPENDED", dueDay: "2027-05-21", paidOnDay: "2027-05-01" })).toEqual({ ok: false, errorKey: "root.paymentStatusFirst" });
    expect(nextRenewalOnPayment({ status: "ENDED", dueDay: "2027-05-21", paidOnDay: "2027-05-01" })).toEqual({ ok: false, errorKey: "root.paymentStatusFirst" });
  });
});

describe("the state badge, worked out on read", () => {
  const base = { dueDay: "2027-05-21", todayDay: "2026-11-21", termsSet: true, recordingClosedDay: null, kind: "SCHOOL", planCode: null };
  const state = (over: Partial<Parameters<typeof termsState>[0]>) => termsState({ ...base, status: "TRIAL", ...over });
  it("each status before and from its renewal day", () => {
    expect(state({ status: "TRIAL" })).toEqual({ state: "FREE", day: "2027-05-21", termsNotSet: false, noTierChosen: false });
    expect(state({ status: "TRIAL", todayDay: "2027-05-21" })).toMatchObject({ state: "FREE_ENDED", day: "2027-05-21" });
    expect(state({ status: "ACTIVE" })).toMatchObject({ state: "PAID", day: "2027-05-21" });
    expect(state({ status: "ACTIVE", todayDay: "2027-06-01" })).toMatchObject({ state: "RENEWAL_PASSED", day: "2027-05-21" });
    expect(state({ status: "DUE", todayDay: "2027-04-20" })).toMatchObject({ state: "INVOICED_UNPAID", day: "2027-05-21" });
    expect(state({ status: "DUE", todayDay: "2027-05-21" })).toMatchObject({ state: "DUE_SINCE", day: "2027-05-21" });
  });
  it("paused since the day recording closed; suspended from before with recording open; ended; no record", () => {
    expect(state({ status: "SUSPENDED", recordingClosedDay: "2026-12-02" })).toMatchObject({ state: "RECORDING_PAUSED", day: "2026-12-02" });
    expect(state({ status: "SUSPENDED", recordingClosedDay: null })).toMatchObject({ state: "SUSPENDED_OPEN", day: null });
    expect(state({ status: "ENDED", recordingClosedDay: "2027-01-10" })).toMatchObject({ state: "ENDED", day: "2027-01-10" });
    expect(state({ status: null, dueDay: null })).toMatchObject({ state: "NO_RECORD", day: null });
  });
  it("a status with no renewal day reads as the day not yet come", () => {
    expect(state({ status: "ACTIVE", dueDay: null })).toMatchObject({ state: "PAID", day: null });
    expect(state({ status: "DUE", dueDay: null })).toMatchObject({ state: "INVOICED_UNPAID", day: null });
  });
  it("terms not set, and a college with terms set but no tier, are badges of their own beside the state", () => {
    expect(state({ termsSet: false })).toMatchObject({ state: "FREE", termsNotSet: true, noTierChosen: false });
    expect(state({ kind: "COLLEGE", planCode: null })).toMatchObject({ noTierChosen: true });
    expect(state({ kind: "COLLEGE", planCode: null, termsSet: false })).toMatchObject({ termsNotSet: true, noTierChosen: false });
    expect(state({ kind: "COLLEGE", planCode: "college-affiliated" })).toMatchObject({ noTierChosen: false });
    expect(state({ kind: "JUNIOR_COLLEGE", planCode: null })).toMatchObject({ noTierChosen: false });
  });
});

describe("a pause opens seven days after the office was warned (the owner's 'Required, 7 days')", () => {
  it("warned on 2 Dec 2026: pause on or after 9 Dec; six days refused, seven pass; never warned, never", () => {
    expect(earliestPauseDay("2026-12-02")).toBe("2026-12-09");
    expect(earliestPauseDay("2027-02-25")).toBe("2027-03-04");
    expect(earliestPauseDay(null)).toBeNull();
    expect(mayPauseOn("2026-12-02", "2026-12-08")).toBe(false);
    expect(mayPauseOn("2026-12-02", "2026-12-09")).toBe(true);
    expect(mayPauseOn(null, "2026-12-09")).toBe(false);
  });
});

describe("the bodies the doors take", () => {
  it("a price is whole rupees from ₹1 to ₹10,000; a discount 0 to 100 %", () => {
    expect(wholeRupeesPaise.safeParse(10_000).success).toBe(true);
    expect(wholeRupeesPaise.safeParse(10_050).success).toBe(false);
    expect(wholeRupeesPaise.safeParse(0).success).toBe(false);
    expect(wholeRupeesPaise.safeParse(1_000_100).success).toBe(false);
  });
  it("a school's own terms for a part: ours, an own discount, or an own price, one at a time, nothing else", () => {
    expect(partTermsSchema.safeParse({ mode: "OURS" }).success).toBe(true);
    expect(partTermsSchema.safeParse({ mode: "OWN_DISCOUNT", discountBps: 2_000 }).success).toBe(true);
    expect(partTermsSchema.safeParse({ mode: "OWN_PRICE", pricePaise: 12_000 }).success).toBe(true);
    expect(partTermsSchema.safeParse({ mode: "OWN_PRICE", pricePaise: 12_000, discountBps: 1_000 }).success).toBe(false);
    expect(partTermsSchema.safeParse({ mode: "OWN_DISCOUNT", discountBps: 10_001 }).success).toBe(false);
  });
  it("our offer: both parts, the free months from the list, a reason, the offer as read", () => {
    const body = { subscription: { pricePaise: 12_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, reason: "New year's prices", expect: { updatedAt: null } };
    expect(offerBodySchema.safeParse(body).success).toBe(true);
    expect(offerBodySchema.safeParse({ ...body, preview: true }).success).toBe(true);
    expect(offerBodySchema.safeParse({ ...body, freeMonths: 2 }).success).toBe(false);
    expect(offerBodySchema.safeParse({ ...body, reason: " " }).success).toBe(false);
    expect(offerBodySchema.safeParse({ ...body, subscription: { pricePaise: 12_050, discountBps: 0 } }).success).toBe(false);
    expect(offerBodySchema.safeParse({ ...body, extra: 1 }).success).toBe(false);
  });
  it("a standing act: pause and end need the school's name typed, every act a reason and the standing as read; a warning names no day and a resume no status", () => {
    const expectRead = { status: "ACTIVE", recordingClosedAt: null };
    expect(standingBodySchema.safeParse({ action: "pause", reason: "Unpaid since May", confirmName: "ZZ Lantern School", expect: expectRead }).success).toBe(true);
    expect(standingBodySchema.safeParse({ action: "pause", reason: "Unpaid since May", expect: expectRead }).success).toBe(false);
    expect(standingBodySchema.safeParse({ action: "end", reason: "Left", expect: expectRead }).success).toBe(false);
    expect(standingBodySchema.safeParse({ action: "warn", reason: "Invoice unpaid", expect: expectRead }).success).toBe(true);
    expect(standingBodySchema.safeParse({ action: "warn", reason: "Invoice unpaid", pauseFrom: "2026-12-20", expect: expectRead }).success).toBe(false);
    expect(standingBodySchema.safeParse({ action: "resume", reason: "Paid", to: "TRIAL", expect: expectRead }).success).toBe(false);
    expect(standingBodySchema.safeParse({ action: "resume", reason: "Paid", expect: { status: "SUSPENDED", recordingClosedAt: "2026-12-09T05:00:00.000Z" } }).success).toBe(true);
    expect(standingBodySchema.safeParse({ action: "resume", reason: "", expect: expectRead }).success).toBe(false);
    expect(standingBodySchema.safeParse({ action: "suspend", reason: "x", expect: expectRead }).success).toBe(false);
  });
  it("a payment: the standing as read, the day paid, the amount; a reference and the tick optional", () => {
    const body = { fromStatus: "DUE", fromDueAt: "2027-05-21", paidOn: "2027-05-01", amountPaise: 5_356_000 };
    expect(paymentBodySchema.safeParse(body).success).toBe(true);
    expect(paymentBodySchema.safeParse({ ...body, ref: "NEFT 1234", acceptDifference: true, preview: true }).success).toBe(true);
    expect(paymentBodySchema.safeParse({ ...body, fromStatus: null, fromDueAt: null }).success).toBe(true);
    expect(paymentBodySchema.safeParse({ ...body, paidOn: "2027-02-30" }).success).toBe(false);
    expect(paymentBodySchema.safeParse({ ...body, amountPaise: -1 }).success).toBe(false);
  });
  it("the Schools tab's filters, each from its list", () => {
    expect(subscriptionsQuerySchema.safeParse({}).success).toBe(true);
    expect(subscriptionsQuerySchema.safeParse({ q: "banyan", premium: "on", terms: "own", renewal: "30", recording: "paused" }).success).toBe(true);
    expect(subscriptionsQuerySchema.safeParse({ terms: "notset" }).success).toBe(true);
    expect(subscriptionsQuerySchema.safeParse({ premium: "maybe" }).success).toBe(false);
  });
});
