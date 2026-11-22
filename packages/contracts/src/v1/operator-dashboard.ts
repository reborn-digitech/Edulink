import { z } from "zod";
import { institutionKindSchema } from "./modules";
import { streamListSchema } from "./streams";
import { schoolBoardSchema } from "./filings";
import { collegeTierCodeSchema, freeMonthsSchema, partTermsSchema } from "./school-offer-parts";

/**
 * operator-dashboard: the operator's one page for running fifty schools —
 * each school's subscription (its start and due dates, where it stands),
 * who to call there, which partner brought it in and for what percentage,
 * and the guided onboarding that makes a school, puts it on a plan, records
 * all of that and invites its first administrator in one call. Everything
 * here is RECORDED: the platform says what a school owes and when, and
 * what a partner is owed; it collects nothing and pays nothing (decision
 * 0003). Dates are ISO strings; a day is YYYY-MM-DD.
 */

const iso = z.string().datetime();
const id = z.string().min(1).max(64);
const count = z.number().int().min(0);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "day");
const dayOrNull = day.nullable();
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/* ---------------------------------------------------------------------- */
/* The coded lists                                                         */
/* ---------------------------------------------------------------------- */

/**
 * Where a school's subscription stands. TRIAL: the free months before the
 * renewal. ACTIVE: paid up. DUE: owed, the renewal reached (on the day
 * itself) or no free months given, and nothing recorded as paid for the
 * year (decision 0010 rule 5). SUSPENDED: the operator has stopped the clock
 * (nothing in the product is switched off by it — it is a record). ENDED:
 * the school left; its rows stay.
 */
export const SUBSCRIPTION_STATUSES = ["TRIAL", "ACTIVE", "DUE", "SUSPENDED", "ENDED"] as const;
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** A partner's share: a whole percentage with one decimal, held as TENTHS of a percent (125 = 12.5 %), so it is an integer and 0–1000 is 0–100 %. */
export const percentTenths = z.number().int().min(0).max(1000);

/* ---------------------------------------------------------------------- */
/* Commission partners                                                     */
/* ---------------------------------------------------------------------- */

export const operatorPartnerSchema = z.object({
  id,
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  percentTenths,
  notes: z.string(),
  createdAt: iso,
  /**
   * The partner's schools, live ones only. `priceMonthlyPaise` is the month the share is taken of (decision 0010 decision 6,
   * contracts `partnerMonth`): terms set, the subscription month (what the school pays a student a year × its newest count
   * ÷ 12); terms not set, the plan's old monthly price or a college tier's month (today's reading); null, no figure. Only an
   * ACTIVE school earns or is in a list. `earns`: it adds to the partner's figure this month; `unpriced`: no price to take a
   * share of; `renewalReached`: terms set, its renewal day come with no payment recorded; `freeByAgreement`: terms set, its
   * subscription at ₹0, in neither list. The flags default so an older answer still parses.
   */
  schools: z.array(
    z.object({
      id,
      name: z.string(),
      subscriptionStatus: subscriptionStatusSchema.nullable(),
      planName: z.string().nullable(),
      priceMonthlyPaise: count.nullable(),
      termsSet: z.boolean().default(false),
      earns: z.boolean().default(false),
      unpriced: z.boolean().default(false),
      renewalReached: z.boolean().default(false),
      freeByAgreement: z.boolean().default(false),
    }),
  ),
  /** What the partner is owed this month: their percent of the month of each school that earns (decision 6; premium never shared). Recorded only; nothing is paid here. */
  owedThisMonthPaise: count,
  /**
   * The partner's ACTIVE schools with no price to take a share of (C4c point 2): terms not set, as today (no plan, a plan with no
   * price or at ₹0, a tier with no roll this month); terms set, no count or a college with no tier, never one at ₹0. Defaults to
   * 0 so an older answer still parses; `unpricedSchoolsNamed` names them.
   */
  unpricedSchools: count.default(0),
  unpricedSchoolsNamed: z.array(z.object({ id, name: z.string() })).default([]),
  /** The partner's ACTIVE schools with terms set whose renewal day has come with no payment recorded, on the school's own day (C4 point 2): they add nothing until paid. */
  renewalReachedSchools: z.array(z.object({ id, name: z.string(), dueDay: day })).default([]),
});
export type OperatorPartner = z.infer<typeof operatorPartnerSchema>;

export const operatorPartnersSchema = z.object({ items: z.array(operatorPartnerSchema) });
export type OperatorPartners = z.infer<typeof operatorPartnersSchema>;

export const operatorPartnerBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: optionalText(40),
  email: optionalText(320),
  percentTenths,
  notes: z.string().trim().max(2000).optional(),
});
export type OperatorPartnerBody = z.infer<typeof operatorPartnerBodySchema>;

export const operatorPartnerUpdateBodySchema = operatorPartnerBodySchema.partial();
export type OperatorPartnerUpdateBody = z.infer<typeof operatorPartnerUpdateBodySchema>;

export const operatorPartnerCreatedSchema = z.object({ ok: z.literal(true), partnerId: id });
export type OperatorPartnerCreated = z.infer<typeof operatorPartnerCreatedSchema>;

/* ---------------------------------------------------------------------- */
/* One school's subscription, contact and commission                       */
/* ---------------------------------------------------------------------- */

export const operatorSubscriptionSchema = z.object({
  status: subscriptionStatusSchema.nullable(),
  startsAt: dayOrNull,
  dueAt: dayOrNull,
  /** Days until the due date; negative once it has passed; null without a due date. */
  daysToDue: z.number().int().nullable(),
  invoicedAt: dayOrNull,
  invoiceRef: z.string().nullable(),
  paidAt: dayOrNull,
  paidRef: z.string().nullable(),
});
export type OperatorSubscription = z.infer<typeof operatorSubscriptionSchema>;

export const operatorContactSchema = z.object({
  name: z.string().nullable(),
  role: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
});
export type OperatorContact = z.infer<typeof operatorContactSchema>;

export const operatorCommissionSchema = z
  .object({
    partnerId: id,
    partnerName: z.string(),
    percentTenths,
  })
  .nullable();
export type OperatorCommission = z.infer<typeof operatorCommissionSchema>;

/**
 * A change to the subscription: only the fields sent change, every change
 * carries a reason for the log, and a status must be a move the list above
 * allows (the lib refuses the rest with its own sentence). The partner is
 * here too — it is part of the same commercial record.
 */
export const operatorSubscriptionBodySchema = z.object({
  status: subscriptionStatusSchema.optional(),
  startsAt: dayOrNull.optional(),
  dueAt: dayOrNull.optional(),
  invoicedAt: dayOrNull.optional(),
  invoiceRef: optionalText(120),
  paidAt: dayOrNull.optional(),
  paidRef: optionalText(120),
  commissionPartnerId: id.nullable().optional(),
  reason: z.string().trim().min(1).max(500),
});
export type OperatorSubscriptionBody = z.infer<typeof operatorSubscriptionBodySchema>;

export const operatorContactBodySchema = z.object({
  name: optionalText(120),
  role: optionalText(80),
  phone: optionalText(40),
  email: optionalText(320),
});
export type OperatorContactBody = z.infer<typeof operatorContactBodySchema>;

/* ---------------------------------------------------------------------- */
/* Onboarding: one call                                                    */
/* ---------------------------------------------------------------------- */

/**
 * The guided flow's one body. The school's details are the create
 * endpoint's; the slug is optional (derived from the name when blank, and
 * a taken one is refused rather than numbered — the operator typed it on
 * purpose); the subscription defaults to start today and fall due a year
 * on, or a thirty-day trial; the partner is an existing id or a new one
 * made inline; the first administrator is invited by email, as the invite
 * endpoint does.
 */
export const operatorOnboardBodySchema = z.object({
  name: z.string().max(200),
  slug: z.string().trim().toLowerCase().max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug").optional().or(z.literal("")),
  contactEmail: z.string().trim().max(320),
  timezone: z.string().trim().min(1).max(64),
  board: schoolBoardSchema.nullable().optional(),
  city: optionalText(120),
  region: optionalText(120),
  country: optionalText(120),
  gradeLow: optionalText(20),
  gradeHigh: optionalText(20),
  /** A school, a junior college, a college or an autonomous college (4 Oct 2026); a school when left out. */
  kind: institutionKindSchema.optional(),
  /** A college's affiliating university and AISHE code (the operator's college console, 4 Oct 2026); kept for a college only, the code as AISHE issues it (C-12345). */
  affiliatingUniversity: optionalText(200),
  aisheCode: z.string().trim().regex(/^[CSU]-\d{3,7}$/).nullable().optional().or(z.literal("")),
  /** A college's streams (5 Oct 2026), chosen beside affiliated or autonomous: at least one for a college, none for a school. */
  streams: streamListSchema.optional(),
  planId: id.nullable().optional(),
  trial: z.boolean().default(false),
  startsAt: day.optional(),
  dueAt: day.optional(),
  /**
   * The school's terms at onboarding (decision 0010, 21 November 2026): its Shalaghar subscription (ours, an own
   * discount or an own price), its premium switches and their terms, and the free months that set the renewal (or the
   * typed dueAt, which wins). Any of them makes this the new path: terms set, renewal = start + free months, DUE when
   * that is the start day or before today, TRIAL otherwise. All left out: today's rule, unchanged (a year, or a
   * thirty-day trial), terms not set, premium off. A renewal more than a year on needs `acceptOverAYear`; one before
   * today needs `acceptDueNow`.
   */
  subscription: partTermsSchema.optional(),
  premium: z.object({ students: z.boolean(), teachers: z.boolean(), terms: partTermsSchema.optional() }).strict().optional(),
  freeMonths: freeMonthsSchema.optional(),
  /**
   * A college's tier (§2.5; phase 6): its plan, found by the tier's code or made in the onboarding's own transaction when
   * there is none. A college only, one that suits its kind, and never beside planId.
   */
  tier: collegeTierCodeSchema.optional(),
  acceptOverAYear: z.boolean().optional(),
  acceptDueNow: z.boolean().optional(),
  contact: operatorContactBodySchema.optional(),
  commission: z
    .union([
      z.object({ partnerId: id }),
      z.object({ newPartner: operatorPartnerBodySchema }),
    ])
    .nullable()
    .optional(),
  adminEmail: z.string().trim().max(320),
  adminName: z.string().trim().max(120).optional(),
});
export type OperatorOnboardBody = z.infer<typeof operatorOnboardBodySchema>;

export const operatorOnboardedSchema = z.object({ ok: z.literal(true), schoolId: id, code: z.string(), slug: z.string(), partnerId: id.nullable() });
export type OperatorOnboarded = z.infer<typeof operatorOnboardedSchema>;

/* ---------------------------------------------------------------------- */
/* The dashboard                                                           */
/* ---------------------------------------------------------------------- */

export const operatorDashboardQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  /** live (default): not removed; trial, due (past), soon (due within 30 days), suspended, removed, all. */
  state: z.enum(["live", "trial", "due", "soon", "suspended", "removed", "all"]).default("live"),
  planId: id.optional(),
  partnerId: id.optional(),
});
export type OperatorDashboardQuery = z.infer<typeof operatorDashboardQuerySchema>;

export const operatorDashboardRowSchema = z.object({
  id,
  name: z.string(),
  city: z.string().nullable(),
  /** What kind of institution (4 Oct 2026); an older server says nothing, which reads as a school. */
  kind: institutionKindSchema.default("SCHOOL"),
  removedAt: iso.nullable(),
  verifiedAt: iso.nullable(),
  pendingAdminInvites: count,
  plan: z.object({ id, code: z.string(), name: z.string(), priceMonthlyPaise: count.nullable() }).nullable(),
  /** Pupils on the roll from this month's usage row; null until the nightly job has written it. */
  pupils: count.nullable(),
  subscription: operatorSubscriptionSchema,
  /** past: the due date has gone; soon: within thirty days; later; none. */
  dueTone: z.enum(["past", "soon", "later", "none"]),
  commission: operatorCommissionSchema,
  contact: operatorContactSchema,
  /** The newest audit row that names the school, or null. */
  lastActivityAt: iso.nullable(),
  /** Its premium add-on's switches (decision 0010; the brief's §2.6); an older server says nothing, which reads as off. */
  premium: z.object({ students: z.boolean(), teachers: z.boolean() }).default({ students: false, teachers: false }),
});
export type OperatorDashboardRow = z.infer<typeof operatorDashboardRowSchema>;

export const operatorDashboardSchema = z.object({
  /** YYYY-MM, UTC's month, the one the usage rows are read for. */
  month: z.string(),
  tiles: z.object({
    live: count,
    trial: count,
    dueSoon: count,
    pastDue: count,
    suspended: count,
    pupils: count,
    /** This month's texts and storage across live schools, and the sum of their caps (null when no school has a cap). */
    messages: count,
    messageCap: count.nullable(),
    storageMb: count,
    storageCapMb: count.nullable(),
    jobsOverdue: count,
    /** Recorded only. */
    owedThisMonthPaise: count,
    /** The year billed across the live schools at today's prices, last count (rule 8, as the Schools tab totals it); an estimate, recorded only; an older server says nothing. */
    billedYearPaise: count.default(0),
  }),
  /** The partners and what each is owed this month. */
  partners: z.array(z.object({ id, name: z.string(), percentTenths, schools: count, owedThisMonthPaise: count, unpricedSchools: count.default(0), renewalReachedSchools: count.default(0) })),
  plans: z.array(z.object({ id, code: z.string(), name: z.string() })),
  /** The schools the query matches, due-first. */
  rows: z.array(operatorDashboardRowSchema),
  /** Live schools due within seven days or past due, soonest first — the phone's list and the daily reminder's. */
  dueSoon: z.array(z.object({ id, name: z.string(), dueAt: day, daysToDue: z.number().int(), status: subscriptionStatusSchema.nullable() })),
});
export type OperatorDashboard = z.infer<typeof operatorDashboardSchema>;
