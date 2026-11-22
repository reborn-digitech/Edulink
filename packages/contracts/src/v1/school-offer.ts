import { z } from "zod";
import { DISCOUNT_MAX_BPS, discountBpsSchema, freeMonthsSchema, partTermsSchema, wholeRupeesPaise } from "./school-offer-parts";
import { realDateKey } from "./calendar-keys";
import { isCollegeKind } from "./modules";
import { collegeTierOf, type CollegeTierCode } from "./operator-college";
import { subscriptionStatusSchema, type SubscriptionStatus } from "./operator-dashboard";

/**
 * school-offer: the school's Shalaghar subscription and the premium add-on (decision 0010 parts 1 to 3; the brief of 21
 * November 2026, version 3). Two separately priced things, as the owner said that day: "There are two aspects to it:
 * 1. School subscription: Schools operational features are enabled. 2. Add on premium subscription for teachers/students.
 * Both are different". Each is a price A STUDENT A YEAR, in whole rupees, before GST, with one figure for all schools (our
 * offer) and, per school, its own discount on ours or its own price, never both. A college's subscription is its tier
 * (operator-college.ts), with our discount or its own; premium is priced alike at every kind. One price whatever optional
 * parts a school uses (the owner, 21 November 2026, "One price for everything"): no module enters either sum.
 *
 * Everything here is pure and worked out on read; nothing derived is stored. The money is RECORDED, never collected
 * (decision 0003): the company invoices by hand and the operator records the payment. Days are YYYY-MM-DD keys; the
 * renewal (School.subscriptionDueAt) is the day the next unpaid year starts.
 */

/* ---------------------------------------------------------------------- */
/* The coded lists and the bounds                                          */
/* ---------------------------------------------------------------------- */

/** The pieces the onboarding body shares (school-offer-parts.ts, a leaf, so operator-dashboard.ts can import them). */
export { FREE_MONTHS, PRICE_MIN_PAISE, PRICE_MAX_PAISE, DISCOUNT_MAX_BPS, wholeRupeesPaise, discountBpsSchema, freeMonthsSchema, partTermsSchema } from "./school-offer-parts";
export type { FreeMonths, PartTermsBody } from "./school-offer-parts";


/** The chips the price forms offer, in paise a student a year: ₹50 to ₹200 for the subscription, ₹25 to ₹100 more for premium. */
export const SUBSCRIPTION_PRICE_CHIPS_PAISE = [5_000, 10_000, 15_000, 20_000] as const;
export const PREMIUM_PRICE_CHIPS_PAISE = [2_500, 5_000, 7_500, 10_000] as const;
/** A school's own discount chips, in basis points (10, 20, 25 and 50 %). */
export const OWN_DISCOUNT_CHIPS_BPS = [1_000, 2_000, 2_500, 5_000] as const;


/**
 * Our offer before the operator first saves one (no SchoolOffer row): the owner's starting values of 21 November 2026,
 * "Rs 100 + Rs 50 premium": ₹100 a student a year, ₹50 more for premium, no discounts, six months free; our defaults tick
 * premium for students and not for teachers, and the onboarding form starts a box ticked only once that role's plan is
 * asked for (onboardingTicks; C3).
 */
export const OFFER_START = {
  subscriptionPricePaise: 10_000,
  subscriptionDiscountBps: 0,
  premiumPricePaise: 5_000,
  premiumDiscountBps: 0,
  freeMonths: 6,
  studentsByDefault: true,
  teachersByDefault: false,
} as const;

/** How a part's figure was reached: our offer, the school's own discount on it, or the school's own fixed price. */
export const TERMS_SOURCES = ["OURS", "OWN_DISCOUNT", "OWN_PRICE"] as const;
export type TermsSource = (typeof TERMS_SOURCES)[number];

/**
 * The state badge on the operator's list, worked out by termsState: each status before and from its renewal day (Free or
 * Free period ended, Paid or Renewal passed, Invoiced unpaid or Due since), recording paused, ended, suspended from
 * before this with recording open, and no record. "Terms not set" and "No tier chosen" are badges beside it.
 */
export const SCHOOL_TERMS_STATES = ["FREE", "FREE_ENDED", "PAID", "RENEWAL_PASSED", "INVOICED_UNPAID", "DUE_SINCE", "RECORDING_PAUSED", "ENDED", "SUSPENDED_OPEN", "NO_RECORD"] as const;
export type SchoolTermsState = (typeof SCHOOL_TERMS_STATES)[number];

/** The operator's standing acts on one school (one door, decision 0010 part 4): warn the office, pause and resume recording, end, restore. */
export const STANDING_ACTIONS = ["warn", "pause", "resume", "end", "restore"] as const;
export type StandingAction = (typeof STANDING_ACTIONS)[number];

/**
 * What stays open while a school's recording is paused, by group (the owner's "The safety list", 21 November 2026; the
 * brief's rule 27): own accounts, consent given or withdrawn, reports of harm, where a child is, the health card, a pupil
 * leaving with correct papers, cutting someone's access, money and sessions already moving, one notice a day to families;
 * and a POST that only reads (the brief's rule 26: the file link, the read-only server actions). Each open door names its
 * group in the API catalog (phase 12).
 */
export const OPEN_GROUPS = ["OWN_ACCOUNT", "CONSENT", "HARM", "WHEREABOUTS", "HEALTH_CARD", "LEAVING", "CUTTING_ACCESS", "MONEY_IN_MOTION", "ONE_NOTICE", "READS_ONLY"] as const;
export type OpenGroup = (typeof OPEN_GROUPS)[number];

/** A pause opens this many days after the office and the head were warned (the owner's "Required, 7 days"). */
export const PAUSE_WARNING_DAYS = 7;
/** An ended school cannot be removed or deleted for this many days (the owner's "Same lock, kept 90 days"). */
export const END_KEEP_DAYS = 90;
/** The most schools one bulk change may name. */
export const BULK_SCHOOLS_MAX = 100;

/* ---------------------------------------------------------------------- */
/* The sums                                                                */
/* ---------------------------------------------------------------------- */

/** One part of our offer: the price a student a year and the discount for all schools. */
export type OfferPart = { pricePaise: number; discountBps: number };
/** A school's own terms for one part: an own price or an own discount, never both; neither = it follows ours. */
export type OwnPart = { pricePaise?: number | null; discountBps?: number | null };
/** A part's figure at one school: the base it is taken of, the discount, what a student's year comes to, and how. */
export type PartTerms = { basePaise: number; discountBps: number; paysPaise: number; source: TermsSource; tierCode: CollegeTierCode | null };

/** What a part pays a student a year: the base less the discount, rounded half up to the whole rupee, in paise. */
export function paysPaise(basePaise: number, discountBps: number): number {
  return Math.floor((basePaise * (DISCOUNT_MAX_BPS - discountBps) + 500_000) / 1_000_000) * 100;
}

function ownOf(own: OwnPart | null | undefined): { price: number | null; discount: number | null } {
  const price = own?.pricePaise ?? null;
  const discount = own?.discountBps ?? null;
  if (price !== null && discount !== null) throw new RangeError("school-offer: an own price and an own discount both");
  return { price, discount };
}

function partTerms(own: OwnPart | null | undefined, offer: OfferPart): PartTerms {
  const { price, discount } = ownOf(own);
  if (price !== null) return { basePaise: price, discountBps: 0, paysPaise: paysPaise(price, 0), source: "OWN_PRICE", tierCode: null };
  if (discount !== null) return { basePaise: offer.pricePaise, discountBps: discount, paysPaise: paysPaise(offer.pricePaise, discount), source: "OWN_DISCOUNT", tierCode: null };
  return { basePaise: offer.pricePaise, discountBps: offer.discountBps, paysPaise: paysPaise(offer.pricePaise, offer.discountBps), source: "OURS", tierCode: null };
}

/**
 * The school's subscription in force. At a school (and a junior college): the own price, else ours, less the own
 * discount, else ours (none with an own price). At a college: its tier, less the own discount, else ours; no tier, no
 * price (null). A college has no own price: the writer refuses one, and this sum never reads one.
 */
export function subscriptionTerms(school: { kind?: string | null; planCode?: string | null; own?: OwnPart | null }, offer: OfferPart): PartTerms | null {
  if (!isCollegeKind(school.kind)) return partTerms(school.own, offer);
  const { discount } = ownOf(school.own);
  const tier = collegeTierOf(school.planCode);
  if (!tier) return null;
  const discountBps = discount ?? offer.discountBps;
  return { basePaise: tier.perStudentYearPaise, discountBps, paysPaise: paysPaise(tier.perStudentYearPaise, discountBps), source: discount === null ? "OURS" : "OWN_DISCOUNT", tierCode: tier.code };
}

/** The premium add-on in force, priced alike at every kind: the own price, else ours, less the own discount, else ours. */
export function premiumTerms(own: OwnPart | null | undefined, offer: OfferPart): PartTerms {
  return partTerms(own, offer);
}

/** The year's bill, on read at today's prices: one line a part that costs something, each a student's figure × the newest count of pupils. */
export type Bill = { pupils: number; lines: { part: "SUBSCRIPTION" | "PREMIUM"; perStudentPaise: number; totalPaise: number }[]; totalPaise: number };

/**
 * The bill for a school: no bill without terms set, a renewal day, a count of pupils, or a subscription figure (a
 * college with no tier). Premium is a line only while `premiumOn`, which its caller works out with premiumBilling: billed
 * only while its plan is asked for (C3); a part free by agreement is no line.
 */
export function billFor(input: { pupils: number | null; termsSet: boolean; renewalDay: string | null; subscription: PartTerms | null; premium: PartTerms | null; premiumOn: boolean }): Bill | null {
  if (!input.termsSet || !input.renewalDay || input.pupils === null || !input.subscription) return null;
  const pupils = Math.max(0, Math.trunc(input.pupils));
  const lines: Bill["lines"] = [];
  const parts: [Bill["lines"][number]["part"], PartTerms | null][] = [
    ["SUBSCRIPTION", input.subscription],
    ["PREMIUM", input.premiumOn ? input.premium : null],
  ];
  for (const [part, terms] of parts) if (terms && terms.paysPaise > 0) lines.push({ part, perStudentPaise: terms.paysPaise, totalPaise: terms.paysPaise * pupils });
  return { pupils, lines, totalPaise: lines.reduce((sum, line) => sum + line.totalPaise, 0) };
}

/** The plan each premium switch opens (person-plans.ts): the Student plan for Students, the Teacher plan for Teachers. The Expert plan is no part of premium. */
export const PREMIUM_PLAN_OF = { students: "STUDENT", teachers: "TEACHER" } as const;
export const PREMIUM_PLANS = [PREMIUM_PLAN_OF.students, PREMIUM_PLAN_OF.teachers] as const;
export type PremiumPlan = (typeof PREMIUM_PLANS)[number];

/**
 * The statuses that stop premium's cover (decision 0010 decision 9). That SUSPENDED and ENDED stop it is carried over from
 * version 1 by the author: no option the owner chose says it. It lives here alone, so the owner's word can change it in
 * one place.
 */
export const COVER_STOPS_WHILE = ["SUSPENDED", "ENDED"] as const;

/**
 * The plans a school's premium covers now: live cover (decision 0010 decision 9; the brief's rule 4) is the school's switch
 * for the role on, its status not one that stops cover, and the school not removed, whether or not its terms are set,
 * worked out on read. Students premium covers its pupils for the STUDENT plan's whole list, Teachers premium its teachers
 * for the TEACHER plan's (decision 8); a college's teachers never, Teachers premium being hidden at a college.
 */
export function liveCover(school: { kind?: string | null; premiumStudents: boolean; premiumTeachers: boolean; status: string | null; removed: boolean }): PremiumPlan[] {
  if (school.removed || (COVER_STOPS_WHILE as readonly string[]).includes(school.status ?? "")) return [];
  const out: PremiumPlan[] = [];
  if (school.premiumStudents) out.push(PREMIUM_PLAN_OF.students);
  if (school.premiumTeachers && !isCollegeKind(school.kind)) out.push(PREMIUM_PLAN_OF.teachers);
  return out;
}

/** Why a school with premium on is not billed for it, in the order they are told (C3a): its terms not set, then the plan. */
export const PREMIUM_NOT_BILLED = ["TERMS_NOT_SET", "PLAN_NOT_ASKED"] as const;
export type PremiumNotBilled = (typeof PREMIUM_NOT_BILLED)[number];

/**
 * Whether a school's premium is billed: the owner's "Not billed until then" (21 November 2026, 17:36 IST; the
 * coordinator's C3 and C3a). Premium is billed only while its plan is asked for: for at least one role, the school's
 * switch on and that role's plan asked for (the plans the operator has made active), at a school whose terms are set. The
 * rule reads the plan alone, not the platform's feature switches and not the school's status (a SUSPENDED school's bill
 * keeps the line; its payment is refused anyway). With premium on and not billed, `notBilled` says why, the terms first
 * (there is no bill at all while they are not set, C2's "terms not set"), then the plan, with `waitsFor` naming the plans
 * of the switches that are on, none of them asked for. Premium off: neither.
 */
export function premiumBilling(school: { termsSet: boolean; students: boolean; teachers: boolean }, asked: ReadonlySet<string>): { billed: boolean; notBilled: PremiumNotBilled | null; waitsFor: PremiumPlan[] } {
  const on = (["students", "teachers"] as const).filter((role) => school[role]).map((role) => PREMIUM_PLAN_OF[role]);
  if (on.length === 0) return { billed: false, notBilled: null, waitsFor: [] };
  if (!school.termsSet) return { billed: false, notBilled: "TERMS_NOT_SET", waitsFor: [] };
  if (on.some((plan) => asked.has(plan))) return { billed: true, notBilled: null, waitsFor: [] };
  return { billed: false, notBilled: "PLAN_NOT_ASKED", waitsFor: on };
}

/**
 * Onboarding's premium boxes as they start (C3): ticked only where our offer's default is on AND that role's plan is asked
 * for; the operator may still tick either. A college has no teachers' premium (onboarding refuses it, §2.5 hides the box),
 * so its Teachers box never starts ticked.
 */
export function onboardingTicks(offer: { studentsByDefault: boolean; teachersByDefault: boolean }, asked: ReadonlySet<string>, kind: string | null | undefined): { students: boolean; teachers: boolean } {
  return {
    students: offer.studentsByDefault && asked.has(PREMIUM_PLAN_OF.students),
    teachers: !isCollegeKind(kind) && offer.teachersByDefault && asked.has(PREMIUM_PLAN_OF.teachers),
  };
}

/** A month of the subscription, the figure a partner's share is taken of: round(pays × pupils ÷ 12); no figure or no count, none. Premium is never shared. */
export function subscriptionMonthPaise(terms: PartTerms | null, pupils: number | null): number | null {
  if (!terms || pupils === null) return null;
  return Math.round((terms.paysPaise * Math.max(0, Math.trunc(pupils))) / 12);
}

/**
 * A school's month for its partner's share, and where it stands on the partners card (decision 0010 decision 6; the owner's
 * Q5 of 21 November 2026, "Paid-up subscription only": "Their percent of the subscription (price x pupils / 12 a month),
 * only while the school is Active and not past its renewal date. Premium is not shared. A paused school earns nothing.";
 * the coordinating session's C4 point 2, C4c point 2, C4d and C4e). Only an ACTIVE school counts at all: TRIAL, DUE,
 * SUSPENDED, ENDED or no status earns nothing and is in no list.
 *
 * Terms set: the subscription month (subscriptionMonthPaise: what the school pays a student a year after any discount, × its
 * newest count, ÷ 12), every kind, premium never; it earns while its renewal day has not come on its own day (renewalReached:
 * on the day itself nothing is owed; with none on record it never comes). A subscription at ₹0 (free by agreement: 100 %
 * off, or a discount that rounds to nothing) earns nothing and is in neither list, its entry reading "Free by agreement";
 * otherwise, with no figure (no count, or a college with no tier) it is unpriced, and with its renewal day come it is
 * renewal-reached, in both lists where both hold.
 *
 * Terms not set: today's reading, exactly: the month the caller read (the plan's old monthly price, or a college tier's
 * twelfth of this month's count, none without a roll), earning while ACTIVE whatever the renewal; with no month, or a month
 * of ₹0, unpriced, as today's `!priceMonthlyPaise` counts it (C4d point 3); never renewal-reached (C4 point 2).
 */
export function partnerMonth(input: {
  termsSet: boolean;
  status: string | null;
  renewalDay: string | null;
  todayDay: string;
  subscription: PartTerms | null;
  pupils: number | null;
  oldMonthPaise: number | null;
}): { monthPaise: number | null; earns: boolean; renewalReached: boolean; unpriced: boolean; freeByAgreement: boolean } {
  const active = input.status === "ACTIVE";
  if (!input.termsSet) {
    const priced = Boolean(input.oldMonthPaise);
    return { monthPaise: input.oldMonthPaise, earns: active && priced, renewalReached: false, unpriced: active && !priced, freeByAgreement: false };
  }
  const free = input.subscription !== null && input.subscription.paysPaise === 0;
  const monthPaise = free ? 0 : subscriptionMonthPaise(input.subscription, input.pupils);
  const reached = renewalReached(input.renewalDay, input.todayDay);
  return {
    monthPaise,
    earns: active && !free && !reached && monthPaise !== null && monthPaise > 0,
    renewalReached: active && !free && reached,
    unpriced: active && !free && monthPaise === null,
    freeByAgreement: free,
  };
}

/* ---------------------------------------------------------------------- */
/* The days                                                                */
/* ---------------------------------------------------------------------- */

function keyParts(key: string): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return [y, m, d];
}
function keyOf(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function addDays(key: string, days: number): string {
  const [y, m, d] = keyParts(key);
  const at = new Date(Date.UTC(y, m - 1, d + days));
  return keyOf(at.getUTCFullYear(), at.getUTCMonth() + 1, at.getUTCDate());
}

/** A day so many calendar months on, the day held to the month's end: 31 August + 6 is 28 February, 29 in a leap year. */
export function renewalFrom(startDay: string, months: number): string {
  const [y, m, d] = keyParts(startDay);
  const index = y * 12 + (m - 1) + Math.trunc(months);
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return keyOf(year, month, Math.min(d, last));
}

/**
 * The whole free months a typed renewal day implies from the start (21 November to 21 July is 8; a day short, 7); before
 * the start, none. Whole months only: a renewal more than a year on is told by renewalOverAYear, never by this reaching 12.
 */
export function freeMonthsImplied(startDay: string, renewalDay: string): number | null {
  if (renewalDay < startDay) return null;
  const [sy, sm] = keyParts(startDay);
  const [ry, rm] = keyParts(renewalDay);
  let months = ry * 12 + rm - (sy * 12 + sm);
  while (months > 0 && renewalFrom(startDay, months) > renewalDay) months -= 1;
  return months;
}

/** Whether a renewal day is more than a year from the start, which onboarding asks a tick for: 10 December 2027 from 21 November 2026 is. */
export function renewalOverAYear(startDay: string, renewalDay: string): boolean {
  return renewalDay > renewalFrom(startDay, 12);
}

/**
 * Whether a renewal day has been reached: on the day itself it has, since it is the day the next unpaid year starts.
 * Days are the school's own (todayKey in its zone); with no renewal on record, never. The badge, the "passed" filter and
 * a partner's paid-up reading all ask this.
 */
export function renewalReached(dueDay: string | null, todayDay: string): boolean {
  return dueDay !== null && todayDay >= dueDay;
}

/**
 * The status a renewal calls for while nothing is recorded as paid (rule 5; the coordinator's C1 of 21 November 2026): DUE
 * when the renewal is the start day (no free months) or on or before today, TRIAL when it is later; with no start on
 * record, today alone decides. Onboarding's new path sets it, and an unpaid school's TRIAL may become DUE, or its DUE
 * TRIAL, only when its renewal as it will stand calls for that status.
 */
export function statusByRenewal(startDay: string | null, renewalDay: string, todayDay: string): "TRIAL" | "DUE" {
  return renewalDay === startDay || renewalDay <= todayDay ? "DUE" : "TRIAL";
}

/**
 * Where the renewal moves when a payment is recorded: twelve months on from the renewal on record, whether paid early
 * (an invoice sent before the renewal) or late, in the free period or paid up; with no record, or no renewal on record,
 * the year starts on the day it was paid. Refused while SUSPENDED or ENDED: recording is resumed first.
 */
export function nextRenewalOnPayment(input: { status: SubscriptionStatus | null; dueDay: string | null; paidOnDay: string }): { ok: true; renewalDay: string } | { ok: false; errorKey: "root.paymentStatusFirst" } {
  if (input.status === "SUSPENDED" || input.status === "ENDED") return { ok: false, errorKey: "root.paymentStatusFirst" };
  if (input.status === null || input.dueDay === null) return { ok: true, renewalDay: renewalFrom(input.paidOnDay, 12) };
  return { ok: true, renewalDay: renewalFrom(input.dueDay, 12) };
}

/**
 * The state badge for one school on a day. A renewal day reached is passed (renewalReached); with no renewal on record
 * a status reads as not yet reached. SUSPENDED reads as paused only while recording is closed (School.recordingClosedAt);
 * one suspended before the pause existed reads as suspended with recording open, as the brief's Q4 recommends (the
 * owner's answer to Q4 is awaited). ENDED carries the day recording closed; an ENDED school with none ended before the
 * lock existed and records as before (the brief's rule 41).
 */
export function termsState(input: {
  status: SubscriptionStatus | null;
  dueDay: string | null;
  todayDay: string;
  termsSet: boolean;
  recordingClosedDay: string | null;
  kind?: string | null;
  planCode?: string | null;
}): { state: SchoolTermsState; day: string | null; termsNotSet: boolean; noTierChosen: boolean } {
  const termsNotSet = !input.termsSet;
  const noTierChosen = input.termsSet && isCollegeKind(input.kind) && collegeTierOf(input.planCode) === null;
  const reached = renewalReached(input.dueDay, input.todayDay);
  const of = (state: SchoolTermsState, day: string | null) => ({ state, day, termsNotSet, noTierChosen });
  switch (input.status) {
    case null:
      return of("NO_RECORD", null);
    case "TRIAL":
      return of(reached ? "FREE_ENDED" : "FREE", input.dueDay);
    case "ACTIVE":
      return of(reached ? "RENEWAL_PASSED" : "PAID", input.dueDay);
    case "DUE":
      return of(reached ? "DUE_SINCE" : "INVOICED_UNPAID", input.dueDay);
    case "SUSPENDED":
      return input.recordingClosedDay ? of("RECORDING_PAUSED", input.recordingClosedDay) : of("SUSPENDED_OPEN", null);
    case "ENDED":
      return of("ENDED", input.recordingClosedDay);
  }
}

/** The first day a pause may take effect: seven days after the warning's day; never warned, none. */
export function earliestPauseDay(warnedDay: string | null): string | null {
  return warnedDay ? addDays(warnedDay, PAUSE_WARNING_DAYS) : null;
}

/** Whether a pause may take effect today, by the warning's day. */
export function mayPauseOn(warnedDay: string | null, todayDay: string): boolean {
  const earliest = earliestPauseDay(warnedDay);
  return earliest !== null && todayDay >= earliest;
}

/* ---------------------------------------------------------------------- */
/* The bodies the doors take (the doors and their answers: phase 2)        */
/* ---------------------------------------------------------------------- */

const iso = z.string().datetime();
const reasonSchema = z.string().trim().min(1).max(500);


/** One part of our offer as saved. */
export const offerPartSchema = z.object({ pricePaise: wholeRupeesPaise, discountBps: discountBpsSchema }).strict();

/** PUT /api/v1/operator/offer: both parts, the free months, the onboarding ticks, a reason, and the offer as read (null before the first save). */
export const offerBodySchema = z
  .object({
    subscription: offerPartSchema,
    premium: offerPartSchema,
    freeMonths: freeMonthsSchema,
    studentsByDefault: z.boolean(),
    teachersByDefault: z.boolean(),
    reason: reasonSchema,
    expect: z.object({ updatedAt: iso.nullable() }).strict(),
    preview: z.boolean().optional(),
  })
  .strict();
export type OfferBody = z.infer<typeof offerBodySchema>;


/**
 * POST /api/v1/operator/schools/{schoolId}/standing: one act, its reason, and the standing as read (compare-and-set).
 * Pause and end need the school's name typed. A warning names no day of its own: the approved columns keep only when it
 * was given (School.recordingWarnedAt), and the owner's answer is that a pause opens seven days later (earliestPauseDay).
 * Where a resume or a restore leads (Active, or Trial within the free period) is the server's to work out, not the body's.
 */
export const standingBodySchema = z
  .object({
    action: z.enum(STANDING_ACTIONS),
    reason: reasonSchema,
    confirmName: z.string().trim().min(1).max(200).optional(),
    expect: z.object({ status: subscriptionStatusSchema.nullable(), recordingClosedAt: iso.nullable() }).strict(),
    preview: z.boolean().optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    if ((body.action === "pause" || body.action === "end") && !body.confirmName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmName"], message: "root.standingNameNeeded" });
  });
export type StandingBody = z.infer<typeof standingBodySchema>;

/** POST /api/v1/operator/schools/{schoolId}/payment: the standing as read, the day paid, the amount; an amount unlike the bill needs the tick. */
export const paymentBodySchema = z
  .object({
    fromStatus: subscriptionStatusSchema.nullable(),
    fromDueAt: realDateKey.nullable(),
    paidOn: realDateKey,
    ref: z.string().trim().max(120).nullable().optional(),
    amountPaise: z.number().int().min(0).max(10_000_000_000),
    acceptDifference: z.boolean().optional(),
    preview: z.boolean().optional(),
  })
  .strict();
export type PaymentBody = z.infer<typeof paymentBodySchema>;

/** GET /api/v1/operator/subscriptions: the Schools tab's filters, as the URL carries them. */
export const subscriptionsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  premium: z.enum(["all", "on", "off"]).optional(),
  terms: z.enum(["all", "ours", "own", "notset"]).optional(),
  renewal: z.enum(["any", "30", "passed"]).optional(),
  recording: z.enum(["all", "open", "paused"]).optional(),
});
export type SubscriptionsQuery = z.infer<typeof subscriptionsQuerySchema>;

/* ---------------------------------------------------------------------- */
/* The terms door's and the bulk door's bodies (phase 2)                   */
/* ---------------------------------------------------------------------- */

const doorId = z.string().min(1).max(64);

/**
 * A school's terms as the form read them: compare-and-set, so a change made meanwhile is refused (terms.changedMeanwhile).
 * The operator's note is among them (the coordinator's decision on the review's B-3, 21 November 2026): its text is in no
 * log, so a note written over by a stale form could not be recovered.
 */
export const schoolTermsExpectSchema = z
  .object({
    termsSetAt: iso.nullable(),
    premiumStudents: z.boolean(),
    premiumTeachers: z.boolean(),
    subscription: partTermsSchema,
    premium: partTermsSchema,
    note: z.string().max(500).nullable(),
  })
  .strict();

/**
 * PUT /api/v1/operator/schools/{schoolId}/terms: any of the subscription's terms, premium's switches and terms, and the
 * school's note, with the terms as read. A save of either part's terms sets the school's terms (termsSetAt); a switch
 * alone does not. A reason is asked of a change of terms by the form; the door keeps it in the audit row when given.
 */
export const termsBodySchema = z
  .object({
    subscription: partTermsSchema.optional(),
    premium: z.object({ students: z.boolean().optional(), teachers: z.boolean().optional(), terms: partTermsSchema.optional() }).strict().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    reason: z.string().trim().max(500).optional(),
    expect: schoolTermsExpectSchema,
    preview: z.boolean().optional(),
  })
  .strict();
export type TermsBody = z.infer<typeof termsBodySchema>;

/** What one bulk change does to every school it names: a premium switch on or off, or our prices for both parts. Never a pause. */
export const BULK_ACTIONS = ["STUDENTS_ON", "STUDENTS_OFF", "TEACHERS_ON", "TEACHERS_OFF", "OUR_PRICES"] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];

/** POST /api/v1/operator/subscriptions/bulk: one action over 1 to 100 schools. */
export const bulkBodySchema = z
  .object({
    schoolIds: z.array(doorId).min(1).max(BULK_SCHOOLS_MAX),
    action: z.enum(BULK_ACTIONS),
    reason: z.string().trim().max(500).optional(),
    preview: z.boolean().optional(),
  })
  .strict();
export type BulkBody = z.infer<typeof bulkBodySchema>;

/* ---------------------------------------------------------------------- */
/* The doors' answers (phase 2)                                            */
/* ---------------------------------------------------------------------- */

const paise = z.number().int().min(0);
const count = z.number().int().min(0);
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "day");

/** A part's figure at one school, as worked out on read. */
export const partFigureSchema = z.object({ basePaise: paise, discountBps: z.number().int().min(0).max(10_000), paysPaise: paise, source: z.enum(TERMS_SOURCES), tierCode: z.string().nullable() });
export type PartFigure = z.infer<typeof partFigureSchema>;

/** The year's bill at today's prices, last count. */
export const billSchema = z.object({ pupils: count, lines: z.array(z.object({ part: z.enum(["SUBSCRIPTION", "PREMIUM"]), perStudentPaise: paise, totalPaise: paise })), totalPaise: paise });

/** Our offer as it stands: the saved row, or the owner's starting values (`starting`) before the first save. */
export const offerReadSchema = z.object({
  subscription: z.object({ pricePaise: paise, discountBps: z.number().int() }),
  premium: z.object({ pricePaise: paise, discountBps: z.number().int() }),
  freeMonths: z.number().int(),
  studentsByDefault: z.boolean(),
  teachersByDefault: z.boolean(),
  updatedAt: iso.nullable(),
  starting: z.boolean(),
});

/** How the live schools stand against our offer: following it, on an own discount or price, colleges on a tier, terms not set; and how many have premium. */
export const offerGroupsSchema = z.object({ follow: count, ownDiscount: count, ownPrice: count, colleges: count, notSet: count, premiumOn: count });

/** The year billed across the live schools at today's prices, and the schools it leaves out and why. */
export const offerTotalsSchema = z.object({
  billedYearPaise: paise,
  countedSchools: count,
  /**
   * Why each live school is left out of the year billed: terms not set, not running (not Trial, Active or Due, or recording
   * closed), no tier, no count, no renewal on record (the review of phase 5, A9), or a test school, which money leaves out
   * though every count of schools includes it (C5 point 5). An older server says nothing of the last two.
   */
  notCounted: z.object({ notSet: count, noTier: count, noCount: count, notRunning: count, noRenewal: count.default(0), test: count.default(0) }),
});

/** GET /api/v1/operator/offer. */
/** One change of our offer, from the operator's own log: when, the reason given, and the offer before and after it. */
export const offerChangeEntrySchema = z.object({ at: iso, reason: z.string(), before: offerReadSchema, after: offerReadSchema });
export type OfferChangeEntry = z.infer<typeof offerChangeEntrySchema>;

/** GET /api/v1/operator/offer: our offer, how the schools stand against it, the year billed, and the last ten changes (§5). */
export const schoolOfferAnswerSchema = z.object({ offer: offerReadSchema, groups: offerGroupsSchema, totals: offerTotalsSchema, recent: z.array(offerChangeEntrySchema) });
export type SchoolOfferAnswer = z.infer<typeof schoolOfferAnswerSchema>;

/** One school's figure moved by a change: its part, before and after, and why it moves. */
export const termsMoveSchema = z.object({ schoolId: doorId, name: z.string(), part: z.enum(["SUBSCRIPTION", "PREMIUM"]), beforePaise: paise, afterPaise: paise, source: z.enum(TERMS_SOURCES) });

/** PUT /api/v1/operator/offer: the schools whose figure moves, those that do not and why, the year's difference at last count, and how many schools are told. */
export const offerChangeSchema = z.object({
  preview: z.boolean(),
  offer: offerReadSchema,
  moves: z.array(termsMoveSchema),
  unchanged: z.object({ ownPrice: count, notSet: count }),
  /** Schools whose premium price moves with ours where premium is not billed: no move is listed for them, but their price is the new one (the review of phase 5, A1). */
  premiumNotBilled: count.default(0),
  yearDeltaPaise: z.number().int(),
  told: count,
});
export type OfferChange = z.infer<typeof offerChangeSchema>;

/** A school's terms and standing, as the operator reads them (GET and the answer of PUT …/terms). */
export const schoolTermsSchema = z.object({
  schoolId: doorId,
  name: z.string(),
  kind: z.string().nullable(),
  planCode: z.string().nullable(),
  termsSet: z.boolean(),
  termsSetAt: iso.nullable(),
  subscription: partTermsSchema,
  subscriptionFigure: partFigureSchema.nullable(),
  premiumStudents: z.boolean(),
  premiumTeachers: z.boolean(),
  premium: partTermsSchema,
  premiumFigure: partFigureSchema,
  /**
   * Whether premium is billed (C3: only while its plan is asked for, at a school whose terms are set; the rule reads the
   * plan alone). The bill itself may still be null for its own reasons (a college with no tier, no count, no renewal),
   * and a part free by agreement is no line. With premium on and not billed, why (C3a: the terms first, then the plan)
   * and the plans not asked for.
   */
  premiumBilled: z.boolean(),
  premiumNotBilled: z.enum(PREMIUM_NOT_BILLED).nullable(),
  premiumWaitsFor: z.array(z.enum(PREMIUM_PLANS)),
  note: z.string().nullable(),
  status: subscriptionStatusSchema.nullable(),
  startsOn: dayKey.nullable(),
  renewsOn: dayKey.nullable(),
  paidOn: dayKey.nullable(),
  state: z.enum(SCHOOL_TERMS_STATES),
  stateDay: dayKey.nullable(),
  noTierChosen: z.boolean(),
  pupils: count.nullable(),
  bill: billSchema.nullable(),
});
export type SchoolTerms = z.infer<typeof schoolTermsSchema>;

/** PUT /api/v1/operator/schools/{schoolId}/terms: the terms as they stand (or would, on a preview), and how many people are told. */
export const termsChangeSchema = z.object({ preview: z.boolean(), terms: schoolTermsSchema, changed: z.boolean(), told: count });
export type TermsChange = z.infer<typeof termsChangeSchema>;

/** One school's row on the Schools tab. */
export const subscriptionRowSchema = schoolTermsSchema.omit({ note: true, bill: true }).extend({ billedYearPaise: paise.nullable() });
/** GET /api/v1/operator/subscriptions. */
export const subscriptionsAnswerSchema = z.object({ rows: z.array(subscriptionRowSchema), totals: offerTotalsSchema });
export type SubscriptionsAnswer = z.infer<typeof subscriptionsAnswerSchema>;

/** POST /api/v1/operator/subscriptions/bulk: the schools changed (or that would be), those already so, and how many schools are told. */
export const bulkAnswerSchema = z.object({ preview: z.boolean(), changed: z.array(z.object({ schoolId: doorId, name: z.string() })), unchanged: count, told: count });
export type BulkAnswer = z.infer<typeof bulkAnswerSchema>;

/** POST /api/v1/operator/schools/{schoolId}/payment: where the renewal moves, the bill it was taken against, and the difference. */
export const paymentAnswerSchema = z.object({
  preview: z.boolean(),
  renewalBefore: dayKey.nullable(),
  renewalAfter: dayKey,
  statusAfter: subscriptionStatusSchema,
  billPaise: paise.nullable(),
  differencePaise: z.number().int().nullable(),
});
export type PaymentAnswer = z.infer<typeof paymentAnswerSchema>;

/** GET /api/v1/office/subscription: the school's own read-only card. Nothing is paid in the app. */
export const officeSubscriptionSchema = z.object({
  termsSet: z.boolean(),
  subscriptionFigure: partFigureSchema.nullable(),
  /**
   * The figure, premium's price a student a year, only while premium is on and billed (C2b; the review's C-1): none while
   * both switches are off, while the school's terms are not set ("not recorded yet", §2.6), or while premium is on and its
   * plan is not asked for (C3: "Premium add-on: on. No charge for it yet.", none of the operator's words). `billed` and
   * `notBilled` read as the operator's answer does, the terms first (C3a).
   */
  premium: z.object({ students: z.boolean(), teachers: z.boolean(), figure: partFigureSchema.nullable(), billed: z.boolean(), notBilled: z.enum(PREMIUM_NOT_BILLED).nullable() }),
  freeUntil: dayKey.nullable(),
  renewsOn: dayKey.nullable(),
  state: z.enum(SCHOOL_TERMS_STATES),
  recording: z.object({ paused: z.boolean(), since: iso.nullable() }),
});
export type OfficeSubscription = z.infer<typeof officeSubscriptionSchema>;
