import { z } from "zod";
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

/** The free months a new school may be given, covering both parts. */
export const FREE_MONTHS = [0, 1, 3, 6, 12] as const;
export type FreeMonths = (typeof FREE_MONTHS)[number];

/** The chips the price forms offer, in paise a student a year: ₹50 to ₹200 for the subscription, ₹25 to ₹100 more for premium. */
export const SUBSCRIPTION_PRICE_CHIPS_PAISE = [5_000, 10_000, 15_000, 20_000] as const;
export const PREMIUM_PRICE_CHIPS_PAISE = [2_500, 5_000, 7_500, 10_000] as const;
/** A school's own discount chips, in basis points (10, 20, 25 and 50 %). */
export const OWN_DISCOUNT_CHIPS_BPS = [1_000, 2_000, 2_500, 5_000] as const;

/** A price is ₹1 to ₹10,000 a student a year, in whole rupees; a discount 0 to 100 %, in basis points. */
export const PRICE_MIN_PAISE = 100;
export const PRICE_MAX_PAISE = 1_000_000;
export const DISCOUNT_MAX_BPS = 10_000;

/**
 * Our offer before the operator first saves one (no SchoolOffer row): the owner's starting values of 21 November 2026,
 * "Rs 100 + Rs 50 premium": ₹100 a student a year, ₹50 more for premium, no discounts, six months free; the onboarding
 * form ticks premium for students and not for teachers.
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
 * college with no tier). Premium is billed only while one of its switches is on (`premiumOn`: students or teachers); a
 * part free by agreement is no line.
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

/** A month of the subscription, the figure a partner's share is taken of: round(pays × pupils ÷ 12); no figure or no count, none. Premium is never shared. */
export function subscriptionMonthPaise(terms: PartTerms | null, pupils: number | null): number | null {
  if (!terms || pupils === null) return null;
  return Math.round((terms.paysPaise * Math.max(0, Math.trunc(pupils))) / 12);
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
 * Where the renewal moves when a payment is recorded: twelve months on from the renewal on record, whether paid early
 * (an invoice sent before the renewal) or late, in the free period or paid up; with no record, or no renewal on record,
 * the year starts on the day it was paid. Refused while SUSPENDED or ENDED: recording is resumed first.
 */
export function nextRenewalOnPayment(input: { status: SubscriptionStatus | null; dueDay: string | null; paidOnDay: string }): { ok: true; renewalDay: string } | { ok: false; errorKey: "subscription.paymentStatusFirst" } {
  if (input.status === "SUSPENDED" || input.status === "ENDED") return { ok: false, errorKey: "subscription.paymentStatusFirst" };
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

/** A price a student a year: whole rupees from ₹1 to ₹10,000, in paise. parseRupees takes two decimals, so the whole rupee is refused here. */
export const wholeRupeesPaise = z
  .number()
  .int()
  .min(PRICE_MIN_PAISE)
  .max(PRICE_MAX_PAISE)
  .refine((paise) => paise % 100 === 0, "offer.wholeRupees");
/** A discount, 0 to 100 % in basis points. */
export const discountBpsSchema = z.number().int().min(0).max(DISCOUNT_MAX_BPS);
/** The free months, from the list. */
export const freeMonthsSchema = z
  .number()
  .int()
  .refine((months) => (FREE_MONTHS as readonly number[]).includes(months), "offer.freeMonths");

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

/** A school's own terms for one part, one chip at a time: ours, an own discount on ours, or an own price. */
export const partTermsSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("OURS") }).strict(),
  z.object({ mode: z.literal("OWN_DISCOUNT"), discountBps: discountBpsSchema }).strict(),
  z.object({ mode: z.literal("OWN_PRICE"), pricePaise: wholeRupeesPaise }).strict(),
]);
export type PartTermsBody = z.infer<typeof partTermsSchema>;

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
    if ((body.action === "pause" || body.action === "end") && !body.confirmName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmName"], message: "standing.nameMismatch" });
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
