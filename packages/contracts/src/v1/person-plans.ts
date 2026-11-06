import { z } from "zod";
import { platformFeatureSchema, type FeatureCode } from "./platform-features";

/**
 * PLANS SOLD PER PERSON (the owner's decisions of 15–16 October 2026; docs/decisions/0006-plans-and-paid-seats.md).
 * Not the plans a SCHOOL is put on (caps and a recorded price, the `Plan` table and apps/web src/lib/plans.ts):
 * these three are bought by one person for themselves, or by a guardian for a pupil under eighteen.
 *
 *   STUDENT  the question bank's practice, the assistant and, since decision 0007 (6 Nov 2026), the platform's
 *            competition marketplace (a school's own competitions, which are calendar events, are free)
 *   TEACHER  the teachers' question gig, offering teaching sessions, the job board as a reader, the assistant
 *   EXPERT   offering time as an expert (sessions and mentoring)
 *
 * Sessions are sold per seat for everyone and are in no plan; a school posting a vacancy needs none. The
 * platform's feature switches (v1/platform-features.ts) stay above the plans: a feature the operator has off
 * is off for everyone, plan or not. What each word says to a person is a dictionary key (`plans.<CODE>.name`).
 */
export const PERSON_PLANS = ["STUDENT", "TEACHER", "EXPERT"] as const;
export const personPlanSchema = z.enum(PERSON_PLANS);
export type PlanCode = z.infer<typeof personPlanSchema>;

/** The features each plan opens, in the contracts' feature order. The plan rows start from this list. */
export const PLAN_FEATURES: Record<PlanCode, readonly FeatureCode[]> = {
  STUDENT: ["ASSISTANT", "QUESTION_BANK", "COMPETITIONS"],
  TEACHER: ["ASSISTANT", "QUESTION_GIG", "TEACHER_SESSIONS", "JOB_BOARD"],
  EXPERT: ["EXPERT_SESSIONS"],
};

/**
 * Where an entitlement came from: ORDER (a paid pass, the second half's Razorpay order), GRANT (the operator's
 * or the office's grant, this half), SEAT (one paid session seat, the second half).
 */
export const ENTITLEMENT_SOURCES = ["ORDER", "GRANT", "SEAT"] as const;
export const entitlementSourceSchema = z.enum(ENTITLEMENT_SOURCES);
export type EntitlementSource = z.infer<typeof entitlementSourceSchema>;

/** The periods the operator's grant offers, in months. */
export const GRANT_MONTHS = [1, 3, 6, 12] as const;

/** The most a plan may cost, in paise (₹1,00,000): a typing slip guard, not a policy. */
export const PLAN_PRICE_MAX_PAISE = 10_000_000;

const iso = z.string().datetime();
const count = z.number().int().nonnegative();
const paise = z.number().int().min(0).max(PLAN_PRICE_MAX_PAISE);

/** GET /api/v1/operator/plans: each plan with its prices, whether it is active, and how many hold it. */
export const operatorPersonPlanSchema = z.object({
  code: personPlanSchema,
  pricePaise: paise,
  yearlyPricePaise: paise,
  features: z.array(platformFeatureSchema),
  /** Active: the plan is asked for. An inactive plan asks nothing; its features follow the platform switch alone. */
  active: z.boolean(),
  updatedAt: iso.nullable(),
  updatedByName: z.string().nullable(),
  /** People holding an entitlement from this plan that covers now. */
  entitledNow: count,
  /** …of whom this many end within seven days. */
  expiringSoon: count,
});
export const operatorPersonPlansSchema = z.object({ plans: z.array(operatorPersonPlanSchema) });
export type OperatorPersonPlan = z.infer<typeof operatorPersonPlanSchema>;

/** PUT /api/v1/operator/plans: one plan's prices and its active switch; a field left out stays as it is. Audited. */
export const operatorPersonPlanBodySchema = z
  .object({
    code: personPlanSchema,
    pricePaise: paise.optional(),
    yearlyPricePaise: paise.optional(),
    active: z.boolean().optional(),
  })
  .strict();
export const operatorPersonPlanSetSchema = z.object({ plan: operatorPersonPlanSchema, changed: z.boolean() });

/** GET /api/v1/operator/entitlements?email=: one person's entitlements, newest first. */
export const operatorEntitlementsQuerySchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });
export const entitlementSchema = z.object({
  id: z.string(),
  feature: platformFeatureSchema,
  source: entitlementSourceSchema,
  planCode: personPlanSchema.nullable(),
  validFrom: iso,
  validTo: iso,
  grantedByName: z.string().nullable(),
  note: z.string().nullable(),
  revokedAt: iso.nullable(),
  createdAt: iso,
  /** Unrevoked and covering now. */
  live: z.boolean(),
});
export const operatorEntitlementsSchema = z.object({
  /** Null when no account has the address. */
  person: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
  entitlements: z.array(entitlementSchema),
});
export type Entitlement = z.infer<typeof entitlementSchema>;
export type OperatorEntitlements = z.infer<typeof operatorEntitlementsSchema>;

/** POST /api/v1/operator/entitlements: grant a plan to a person by email for 1, 3, 6 or 12 months, with a note. Audited. */
export const operatorGrantBodySchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    plan: personPlanSchema,
    months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
    note: z.string().trim().max(300).optional(),
  })
  .strict();
export const operatorGrantSchema = z.object({
  userId: z.string(),
  plan: personPlanSchema,
  validFrom: iso,
  validTo: iso,
  /** One entitlement row per feature of the plan. */
  created: count,
});

/** POST /api/v1/operator/entitlements/{id}/revoke: ends one entitlement now. Revoking a revoked row changes nothing. Audited. */
export const operatorRevokeSchema = z.object({ id: z.string(), revokedAt: iso, changed: z.boolean() });
