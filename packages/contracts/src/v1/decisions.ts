import { z } from "zod";

/**
 * The head's decision log: the audit rows of the decisions a principal makes
 * (leave, PEN changes, record changes, certificates, joins, admissions),
 * each resolved on the server into one sentence in the reader's language.
 * Read-only; the rows are written by the decisions themselves.
 */

/**
 * The college's four (4 Oct 2026, the integration builder): the exam controller's grace
 * proposals, condonations an HOD forwarded, concessions above the office's limit and late
 * registrations — each decided by the principal and written as its module's audit row.
 */
/** And (5 Oct 2026) the two the college office left: a refund outside the slab, a hostel expulsion (lib/head-approvals.ts). */
export const DECISION_KINDS = ["leave", "pen", "record", "certificate", "join", "admission", "grace", "condonation", "concession", "lateRegistration", "refundException", "expulsion"] as const;
export const decisionKindSchema = z.enum(DECISION_KINDS);
export type DecisionKind = z.infer<typeof decisionKindSchema>;

/** GET /api/v1/principal/decisions?from=&to=&kind=&cursor=&limit= — dates are YYYY-MM-DD, inclusive, in the school's day. */
export const decisionsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date").optional(),
  kind: decisionKindSchema.optional(),
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type DecisionsQuery = z.infer<typeof decisionsQuerySchema>;

export const decisionEntrySchema = z.object({
  id: z.string(),
  at: z.string().datetime(),
  kind: decisionKindSchema,
  /** The audit action the row was written under, e.g. "leave.approve". */
  action: z.string(),
  /** Approved, applied, issued, signed, offered, admitted: true; declined: false. */
  approved: z.boolean(),
  sentence: z.string(),
});
export type DecisionEntry = z.infer<typeof decisionEntrySchema>;

export const decisionsSchema = z.object({
  items: z.array(decisionEntrySchema),
  nextCursor: z.string().nullable(),
  /** Every row the filter matches, so a screen can say "30 of 112". */
  total: z.number().int().nonnegative(),
  /** Whose decisions these are: the caller's own (a head) or the head's, read by the office. */
  own: z.boolean(),
});
export type Decisions = z.infer<typeof decisionsSchema>;
