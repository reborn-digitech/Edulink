import { z } from "zod";

/**
 * operator-plans: the plans the operator offers, what each school uses
 * against its plan, the operator's support actions on a school's office,
 * and the server's own counters (requests, latency, errors) — the web's
 * /root/plans, /root/metrics and the school page's new cards, for the
 * phone. A price here is a number the operator records; no money moves
 * (decision 0003). Dates are ISO strings, months YYYY-MM.
 */

const iso = z.string().datetime();
const id = z.string().min(1).max(64);
const count = z.number().int().min(0);
const capOrNull = z.number().int().min(0).max(100_000_000).nullable();
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month");

/* ---------------------------------------------------------------------- */
/* /root/plans                                                             */
/* ---------------------------------------------------------------------- */

export const operatorPlanSchema = z.object({
  id,
  /** Short and unique, as the operator typed it: starter, standard, … */
  code: z.string(),
  name: z.string(),
  /** Null is "no cap". */
  pupilCap: capOrNull,
  messageCap: capOrNull,
  storageCapMb: capOrNull,
  /** Recorded, never collected. */
  priceMonthlyPaise: capOrNull,
  createdAt: iso,
  /** Live schools on the plan. */
  schools: count,
});
export type OperatorPlan = z.infer<typeof operatorPlanSchema>;

export const operatorPlansSchema = z.object({ items: z.array(operatorPlanSchema) });
export type OperatorPlans = z.infer<typeof operatorPlansSchema>;

/** A null cap means no cap; a cap left out of an update is unchanged. */
export const operatorPlanBodySchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "code"),
  name: z.string().trim().min(1).max(80),
  pupilCap: capOrNull.optional(),
  messageCap: capOrNull.optional(),
  storageCapMb: capOrNull.optional(),
  priceMonthlyPaise: capOrNull.optional(),
});
export type OperatorPlanBody = z.infer<typeof operatorPlanBodySchema>;

export const operatorPlanUpdateBodySchema = operatorPlanBodySchema.partial();
export type OperatorPlanUpdateBody = z.infer<typeof operatorPlanUpdateBodySchema>;

export const operatorPlanCreatedSchema = z.object({ ok: z.literal(true), planId: id });
export type OperatorPlanCreated = z.infer<typeof operatorPlanCreatedSchema>;

/** Put a school on a plan, or (null) take it off every plan. */
export const operatorAssignPlanBodySchema = z.object({ planId: id.nullable() });
export type OperatorAssignPlanBody = z.infer<typeof operatorAssignPlanBodySchema>;

/* ---------------------------------------------------------------------- */
/* Usage: one school's month against its plan                              */
/* ---------------------------------------------------------------------- */

const usageCountsSchema = z.object({
  pupils: count,
  messages: count,
  storageMb: count,
  activeUsers: count,
});

const usageCapsSchema = z.object({ pupils: capOrNull, messages: capOrNull, storageMb: capOrNull });
const usageOverSchema = z.object({ pupils: z.boolean(), messages: z.boolean(), storageMb: z.boolean() });

export const usagePlanRefSchema = z.object({ id, code: z.string(), name: z.string() }).nullable();

export const operatorUsageQuerySchema = z.object({ month: month.optional() });
export type OperatorUsageQuery = z.infer<typeof operatorUsageQuerySchema>;

export const operatorUsageRowSchema = z.object({
  schoolId: id,
  schoolName: z.string(),
  month,
  plan: usagePlanRefSchema,
  /** Null when the nightly job has not written this month for the school yet. */
  counts: usageCountsSchema.nullable(),
  caps: usageCapsSchema,
  over: usageOverSchema,
  overCap: z.boolean(),
  computedAt: iso.nullable(),
});
export type OperatorUsageRow = z.infer<typeof operatorUsageRowSchema>;

export const operatorUsageSchema = z.object({
  month,
  items: z.array(operatorUsageRowSchema),
  /** Schools with a row for the month, and schools over any cap of their plan. */
  sampled: count,
  overCap: count,
});
export type OperatorUsage = z.infer<typeof operatorUsageSchema>;

/** The office's own: this month against the plan, and the months before it. */
export const officeUsageSchema = z.object({
  month,
  plan: usagePlanRefSchema,
  counts: usageCountsSchema.nullable(),
  caps: usageCapsSchema,
  over: usageOverSchema,
  computedAt: iso.nullable(),
  history: z.array(usageCountsSchema.extend({ month })),
});
export type OfficeUsage = z.infer<typeof officeUsageSchema>;

/* ---------------------------------------------------------------------- */
/* Support: the school's office, as the operator may help it               */
/* ---------------------------------------------------------------------- */

export const operatorSchoolSupportSchema = z.object({
  /** The school's active administrators and head: who the three doors below may be aimed at. */
  admins: z.array(
    z.object({
      userId: id,
      name: z.string(),
      email: z.string().nullable(),
      /** ADMIN or PRINCIPAL. */
      role: z.string(),
      liveSessions: count,
      lastSeenAt: iso.nullable(),
    }),
  ),
  plan: usagePlanRefSchema,
  planSince: iso.nullable(),
  usage: officeUsageSchema.omit({ history: true }).nullable(),
});
export type OperatorSchoolSupport = z.infer<typeof operatorSchoolSupportSchema>;

/** The invitation to send again, by its id — one of the school's pending admin invitations. */
export const operatorResendInviteBodySchema = z.object({ inviteId: id });
export type OperatorResendInviteBody = z.infer<typeof operatorResendInviteBodySchema>;

/** The administrator to act on, by account id — one of the school's active admins or its head. */
export const operatorSupportUserBodySchema = z.object({ userId: id });
export type OperatorSupportUserBody = z.infer<typeof operatorSupportUserBodySchema>;

export const operatorSignOutEverywhereSchema = z.object({ ok: z.literal(true), sessionsEnded: count });
export type OperatorSignOutEverywhere = z.infer<typeof operatorSignOutEverywhereSchema>;

/* ---------------------------------------------------------------------- */
/* Monitoring: the process's own counters                                  */
/* ---------------------------------------------------------------------- */

export const operatorMetricsSchema = z.object({
  /** When this process started counting. */
  since: iso,
  /** The time the snapshot was taken. */
  at: iso,
  requests: z.array(
    z.object({
      /** The route group: me, staff, family, office, operator, … */
      group: z.string(),
      total: count,
      /** Status code → count. */
      byStatus: z.record(count),
      p50Ms: z.number().nullable(),
      p95Ms: z.number().nullable(),
    }),
  ),
  /** Errors by kind: unauthenticated, forbidden, not-found, too-large, unexpected, render. */
  errors: z.array(z.object({ kind: z.string(), count })),
  errorsLastHour: count,
  /** Across every group, over the ring buffers held. */
  p95Ms: z.number().nullable(),
  outboxReplays: count,
  jobsOverdue: count,
  /** Whether unexpected errors go to an error tracker (SENTRY_DSN set). */
  errorTracker: z.boolean(),
});
export type OperatorMetrics = z.infer<typeof operatorMetricsSchema>;
