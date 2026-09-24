import { z } from "zod";

/**
 * fees: the school's ledger of what it asked its families for and what
 * arrived — the office's setup (heads, structures, plans, concessions,
 * settings), the counter (payments, receipts, reversals, refunds), the UPI
 * claims queue, the family's page and its two ways to pay, and the reports.
 *
 * EVERY AMOUNT IS INTEGER PAISE. The field name says so (`…Paise`), and a
 * screen turns it into rupees only at the edge (@edulink/i18n formatPaise).
 * Days are YYYY-MM-DD keys; instants are ISO strings.
 */

const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const paise = z.number().int().min(0);
const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const ok = z.object({ ok: z.literal(true) });

export const feeHeadKindSchema = z.enum(["TUITION", "TRANSPORT", "EXAM", "ACTIVITY", "OTHER"]);
export const feeMethodSchema = z.enum(["ONLINE", "UPI", "CASH", "CHEQUE", "BANK"]);
export const feeCounterMethodSchema = z.enum(["CASH", "CHEQUE", "BANK", "UPI"]);
export const feeDemandStatusSchema = z.enum(["OPEN", "PART", "PAID", "WAIVED", "CANCELLED", "CARRIED"]);
export const feePaymentStatusSchema = z.enum(["INITIATED", "CLAIMED", "PAID", "FAILED", "REVERSED", "REFUNDED"]);
export const feeConcessionKindSchema = z.enum(["PERCENT", "AMOUNT"]);

/* ---------------------------------------------------------------------- */
/* Pieces                                                                  */
/* ---------------------------------------------------------------------- */

export const feeDemandLineSchema = z.object({ headId: z.string(), code: z.string(), name: z.string(), grossPaise: paise, concessionPaise: paise });

export const feeDemandRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  dueDateKey: dateKey,
  grossPaise: paise,
  concessionPaise: paise,
  netPaise: paise,
  paidPaise: paise,
  outstandingPaise: paise,
  status: z.string(),
  overdue: z.boolean(),
  lines: z.array(feeDemandLineSchema),
});
export type FeeDemandRow = z.infer<typeof feeDemandRowSchema>;

const yearRef = z.object({ id: z.string(), name: z.string() }).nullable();

/* ---------------------------------------------------------------------- */
/* Settings                                                                */
/* ---------------------------------------------------------------------- */

export const feeSettingsSchema = z.object({
  upiId: z.string().nullable(),
  upiPayee: z.string().nullable(),
  receiptPrefix: z.string(),
  bankNote: z.string().nullable(),
  gateway: z.object({ provider: z.string(), keyId: z.string(), mode: z.enum(["TEST", "LIVE"]), updatedAt: iso }).nullable(),
  sealingAvailable: z.boolean(),
  transport: z.enum(["devbox", "razorpay", "off"]),
  /** Where the school points its gateway's webhook. */
  webhookUrl: z.string(),
});
export type FeeSettings = z.infer<typeof feeSettingsSchema>;

export const feeSettingsSaveSchema = z.object({
  upiId: z.string().trim().max(256).nullable().optional(),
  upiPayee: z.string().trim().max(80).nullable().optional(),
  receiptPrefix: z.string().trim().max(12).optional(),
  bankNote: z.string().trim().max(600).nullable().optional(),
});

export const feeGatewaySaveSchema = z.object({
  keyId: trimmed(8, 60),
  secret: trimmed(8, 200),
  webhookSecret: trimmed(8, 200),
  mode: z.enum(["TEST", "LIVE"]).default("TEST"),
});

/* ---------------------------------------------------------------------- */
/* Heads                                                                   */
/* ---------------------------------------------------------------------- */

export const feeHeadSchema = z.object({ id: z.string(), name: z.string(), code: z.string(), kind: feeHeadKindSchema, sortOrder: z.number().int(), retiredAt: isoOrNull, inUse: z.boolean() });
export const feeHeadsSchema = z.object({ heads: z.array(feeHeadSchema) });
export const feeHeadSaveSchema = z.object({ id: id.optional(), name: trimmed(2, 60), code: trimmed(2, 8), kind: feeHeadKindSchema.default("OTHER"), sortOrder: z.number().int().min(0).max(999).optional() });
export const feeHeadSavedSchema = z.object({ id: z.string() });
export const feeHeadRetireSchema = z.object({ restore: z.boolean().optional() });

/* ---------------------------------------------------------------------- */
/* Structures                                                              */
/* ---------------------------------------------------------------------- */

export const feeStructureSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  gradeLevel: z.string().nullable(),
  academicYearId: z.string(),
  yearName: z.string(),
  instalments: z.number().int(),
  totalPaise: paise,
  pupils: z.number().int(),
  publishedAt: isoOrNull,
  archivedAt: isoOrNull,
});
export const feeStructuresQuerySchema = z.object({ academicYearId: id.optional(), includeArchived: z.coerce.boolean().optional() });
export const feeStructuresSchema = z.object({ structures: z.array(feeStructureSummarySchema), year: yearRef, heads: z.number().int() });

export const feeStructureLineBodySchema = z.object({ headId: id, amountPaise: paise.max(10_000_000_000) });
export const feeStructureInstalmentBodySchema = z.object({ label: trimmed(1, 40), dueDateKey: dateKey, lines: z.array(feeStructureLineBodySchema).min(1).max(30) });
export const feeStructureBodySchema = z.object({
  name: trimmed(2, 80),
  gradeLevel: z.string().trim().max(12).nullable().optional(),
  academicYearId: id.optional(),
  instalments: z.array(feeStructureInstalmentBodySchema).min(1).max(12),
});
export const feeStructureCreatedSchema = z.object({ id: z.string() });

export const feeStructureDetailSchema = feeStructureSummarySchema.extend({
  instalmentRows: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      sortOrder: z.number().int(),
      dueDateKey: dateKey,
      totalPaise: paise,
      lines: z.array(z.object({ id: z.string(), headId: z.string(), headName: z.string(), headCode: z.string(), amountPaise: paise })),
    }),
  ),
  paidDemands: z.number().int(),
  classes: z.array(z.object({ id: z.string(), name: z.string(), gradeLevel: z.string().nullable() })),
});
export type FeeStructureDetail = z.infer<typeof feeStructureDetailSchema>;

/* ---------------------------------------------------------------------- */
/* Plans and concessions                                                   */
/* ---------------------------------------------------------------------- */

export const feeAssignBodySchema = z
  .object({ structureId: id, classId: id.optional(), studentMembershipIds: z.array(id).max(2000).optional() })
  .refine((v) => Boolean(v.classId) || Boolean(v.studentMembershipIds?.length), { message: "classId or studentMembershipIds", path: ["classId"] });
export const feeAssignResultSchema = z.object({
  assigned: z.number().int(),
  moved: z.number().int(),
  unchanged: z.number().int(),
  refused: z.array(z.object({ studentMembershipId: z.string(), name: z.string() })),
});
export const feeUnassignBodySchema = z.object({ studentMembershipId: id, academicYearId: id });

export const feeClassRosterQuerySchema = z.object({ classId: id });
export const feeClassRosterSchema = z.object({
  klass: z.object({ id: z.string(), name: z.string(), gradeLevel: z.string().nullable() }),
  year: yearRef,
  pupils: z.array(
    z.object({
      studentMembershipId: z.string(),
      name: z.string(),
      studentCode: z.string().nullable(),
      structureId: z.string().nullable(),
      structureName: z.string().nullable(),
      netPaise: paise,
      paidPaise: paise,
      outstandingPaise: paise,
      overduePaise: paise,
    }),
  ),
});

export const feeConcessionBodySchema = z.object({
  studentMembershipId: id,
  academicYearId: id.optional(),
  headId: id.nullable().optional(),
  kind: feeConcessionKindSchema,
  /** Basis points for PERCENT (1250 = 12.5 %), paise per instalment line for AMOUNT. */
  value: z.number().int().min(1),
  reason: trimmed(3, 200),
});
export const feeConcessionCreatedSchema = z.object({ id: z.string() });

/* ---------------------------------------------------------------------- */
/* One pupil                                                               */
/* ---------------------------------------------------------------------- */

export const feePupilQuerySchema = z.object({ academicYearId: id.optional() });
export const feePupilLedgerSchema = z.object({
  pupil: z.object({ studentMembershipId: z.string(), name: z.string(), studentCode: z.string().nullable(), gradeLevel: z.string().nullable(), className: z.string().nullable(), leftAt: isoOrNull }),
  year: yearRef,
  plan: z.object({ structureId: z.string(), structureName: z.string() }).nullable(),
  demands: z.array(feeDemandRowSchema),
  concessions: z.array(
    z.object({ id: z.string(), headId: z.string().nullable(), headName: z.string().nullable(), kind: z.string(), value: z.number().int(), reason: z.string(), grantedBy: z.string(), createdAt: iso, revokedAt: isoOrNull }),
  ),
  payments: z.array(
    z.object({
      id: z.string(),
      amountPaise: paise,
      method: z.string(),
      status: z.string(),
      reference: z.string().nullable(),
      note: z.string().nullable(),
      paidAt: isoOrNull,
      claimedAt: isoOrNull,
      createdAt: iso,
      collectedBy: z.string().nullable(),
      payer: z.string().nullable(),
      receipt: z.object({ id: z.string(), serial: z.string() }).nullable(),
      reversalReason: z.string().nullable(),
      refundedPaise: paise,
    }),
  ),
  totals: z.object({ netPaise: paise, paidPaise: paise, outstandingPaise: paise, overduePaise: paise }),
  heads: z.array(z.object({ id: z.string(), name: z.string() })),
  structures: z.array(z.object({ id: z.string(), name: z.string(), gradeLevel: z.string().nullable() })),
  todayKey: dateKey,
});
export type FeePupilLedger = z.infer<typeof feePupilLedgerSchema>;

/* ---------------------------------------------------------------------- */
/* The counter                                                             */
/* ---------------------------------------------------------------------- */

export const feeCounterPaymentBodySchema = z.object({
  studentMembershipId: id,
  amountPaise: z.number().int().min(100).max(100_000_000_00),
  method: feeCounterMethodSchema,
  reference: z.string().trim().max(60).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
  demandIds: z.array(id).max(24).optional(),
  clientId: z.string().trim().min(8).max(80).optional(),
  paidAtKey: dateKey.nullable().optional(),
});
export const feeReceiptIssuedSchema = z.object({ paymentId: z.string(), receiptId: z.string(), serial: z.string(), already: z.boolean() });
export const feeReasonBodySchema = z.object({ reason: trimmed(3, 300) });
export const feeRefundBodySchema = z.object({ amountPaise: z.number().int().min(100), reason: trimmed(3, 300) });
export const feeRefundResultSchema = z.object({ refundId: z.string(), status: z.string() });

/* ---------------------------------------------------------------------- */
/* UPI claims                                                              */
/* ---------------------------------------------------------------------- */

export const feeClaimsSchema = z.object({
  claims: z.array(
    z.object({
      paymentId: z.string(),
      studentMembershipId: z.string(),
      pupilName: z.string(),
      className: z.string().nullable(),
      amountPaise: paise,
      utr: z.string().nullable(),
      reference: z.string().nullable(),
      claimedAt: isoOrNull,
      createdAt: iso,
      payer: z.string().nullable(),
      stale: z.boolean(),
    }),
  ),
  waitingForUtr: z.number().int(),
  staleAfterDays: z.number().int(),
});
export const feeClaimConfirmedSchema = z.object({ receiptId: z.string(), serial: z.string() });
export const feeBankMatchBodySchema = z.object({ csv: z.string().min(1).max(200_000) });
export const feeBankMatchSchema = z.object({
  matches: z.array(
    z.object({
      row: z.number().int(),
      utr: z.string(),
      amountPaise: paise.nullable(),
      paymentId: z.string().nullable(),
      pupilName: z.string().nullable(),
      problem: z.enum(["no-utr", "no-amount", "no-claim", "amount-differs"]).nullable(),
    }),
  ),
});
export const feeBankApplyBodySchema = z.object({ paymentIds: z.array(id).min(1).max(500) });
export const feeBankApplyResultSchema = z.object({ confirmed: z.number().int(), failed: z.array(z.object({ paymentId: z.string(), error: z.string() })) });

/* ---------------------------------------------------------------------- */
/* Overview, dues, reminders, year end                                     */
/* ---------------------------------------------------------------------- */

export const feeOverviewSchema = z.object({
  year: yearRef,
  todayKey: dateKey,
  totals: z.object({ demandedPaise: paise, collectedPaise: paise, outstandingPaise: paise, overduePaise: paise }),
  pupils: z.object({ onPlan: z.number().int(), withoutPlan: z.number().int() }),
  byGrade: z.array(z.object({ gradeLevel: z.string(), pupils: z.number().int(), demandedPaise: paise, collectedPaise: paise, outstandingPaise: paise, overduePaise: paise })),
  ageing: z.object({ current: paise, d30: paise, d90: paise, d90plus: paise }),
  methodsThisMonth: z.array(z.object({ method: z.string(), count: z.number().int(), amountPaise: paise })),
  recent: z.array(z.object({ paymentId: z.string(), pupilName: z.string(), amountPaise: paise, method: z.string(), status: z.string(), when: iso, serial: z.string().nullable(), receiptId: z.string().nullable() })),
  claims: z.object({ waiting: z.number().int(), stale: z.number().int() }),
  initiatedOnline: z.number().int(),
  structures: z.number().int(),
  heads: z.number().int(),
  options: z.object({ online: z.boolean(), upi: z.boolean() }),
});
export type FeeOverview = z.infer<typeof feeOverviewSchema>;

export const feeDuesQuerySchema = z.object({
  status: z.enum(["all", "open", "overdue", "paid"]).default("all"),
  classId: id.optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(10).max(200).default(50),
});
export const feeDuesRowSchema = z.object({
  studentMembershipId: z.string(),
  name: z.string(),
  studentCode: z.string().nullable(),
  className: z.string().nullable(),
  gradeLevel: z.string().nullable(),
  netPaise: paise,
  paidPaise: paise,
  outstandingPaise: paise,
  overduePaise: paise,
  nextDueKey: dateKey.nullable(),
  hasPlan: z.boolean(),
  /** Off the roll (left, or no longer ACTIVE) but still owing this year: kept on the list so the office can chase it. */
  /** The pupil has left the roll; their balance stays on the list, flagged. */
  left: z.boolean().default(false),
});
export const feeDuesSchema = z.object({
  rows: z.array(feeDuesRowSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  year: yearRef,
  todayKey: dateKey,
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
});
export type FeeDues = z.infer<typeof feeDuesSchema>;

export const feeRemindBodySchema = z.object({ studentMembershipIds: z.array(id).max(2000).optional() });
export const feeRemindResultSchema = z.object({ families: z.number().int(), demands: z.number().int() });

export const feeCarryForwardBodySchema = z.object({ fromYearId: id, toYearId: id });
export const feeCarryForwardResultSchema = z.object({ pupils: z.number().int(), carriedPaise: paise });

export const feeExportQuerySchema = z.object({ fromKey: dateKey, toKey: dateKey });

/* ---------------------------------------------------------------------- */
/* A receipt                                                               */
/* ---------------------------------------------------------------------- */

export const feeReceiptSchema = z.object({
  id: z.string(),
  serial: z.string(),
  issuedAt: iso,
  reversed: z.boolean(),
  reversalReason: z.string().nullable(),
  refundedPaise: paise,
  snapshot: z.object({
    school: z.object({ name: z.string(), addressLine: z.string().nullable(), city: z.string().nullable(), contactPhone: z.string().nullable(), bankNote: z.string().nullable() }),
    pupil: z.object({ name: z.string(), studentCode: z.string().nullable(), className: z.string().nullable(), gradeLevel: z.string().nullable() }),
    payment: z.object({ amountPaise: paise, method: z.string(), reference: z.string().nullable(), gatewayMethod: z.string().nullable(), paidAt: iso, collectedBy: z.string().nullable(), note: z.string().nullable() }),
    year: z.string(),
    lines: z.array(z.object({ demandLabel: z.string(), head: z.string(), code: z.string(), amountPaise: paise })),
    allocations: z.array(z.object({ demandLabel: z.string(), amountPaise: paise })),
  }),
});
export type FeeReceipt = z.infer<typeof feeReceiptSchema>;

/* ---------------------------------------------------------------------- */
/* The family                                                              */
/* ---------------------------------------------------------------------- */

export const familyFeesQuerySchema = z.object({ childId: id.optional() });
export const familyFeesSchema = z.object({
  children: z.array(z.object({ studentMembershipId: z.string(), name: z.string(), schoolId: z.string(), schoolName: z.string() })),
  child: z
    .object({
      studentMembershipId: z.string(),
      name: z.string(),
      schoolId: z.string(),
      schoolName: z.string(),
      year: yearRef,
      options: z.object({ online: z.boolean(), upi: z.object({ vpa: z.string(), payee: z.string() }).nullable(), bankNote: z.string().nullable() }),
      demands: z.array(feeDemandRowSchema),
      totals: z.object({ outstandingPaise: paise, overduePaise: paise, paidPaise: paise }),
      payments: z.array(
        z.object({
          id: z.string(),
          amountPaise: paise,
          method: z.string(),
          status: z.string(),
          reference: z.string().nullable(),
          paidAt: isoOrNull,
          createdAt: iso,
          receiptId: z.string().nullable(),
          serial: z.string().nullable(),
          failedReason: z.string().nullable(),
        }),
      ),
    })
    .nullable(),
});
export type FamilyFees = z.infer<typeof familyFeesSchema>;

export const familyPayBodySchema = z.object({ studentMembershipId: id, demandIds: z.array(id).min(1).max(24) });
/** What a checkout page needs to open the SCHOOL'S gateway on one order. */
const checkoutShape = {
  paymentId: z.string(),
  orderId: z.string(),
  keyId: z.string(),
  amountPaise: paise,
  currency: z.literal("INR"),
  schoolName: z.string(),
  pupilName: z.string(),
  payerName: z.string(),
  payerEmail: z.string().nullable(),
  transport: z.enum(["devbox", "razorpay", "off"]),
};
export const familyCheckoutSchema = z.object(checkoutShape);
export const familyCheckoutConfirmBodySchema = z.object({ paymentId: id, gatewayPaymentId: trimmed(4, 80), signature: trimmed(16, 200) });
export const familyCheckoutConfirmSchema = z.object({ outcome: z.enum(["settled", "already", "unknown-order", "amount-mismatch", "not-settleable"]), receiptId: z.string().nullable() });
export const familyUpiStartSchema = z.object({
  paymentId: z.string(),
  link: z.string(),
  amountPaise: paise,
  payeeVpa: z.string(),
  payeeName: z.string(),
  reference: z.string(),
  schoolName: z.string(),
  pupilName: z.string(),
});
export const familyUpiClaimBodySchema = z.object({ paymentId: id, utr: trimmed(12, 22) });
export const familyPaymentStatusSchema = z.object({
  paymentId: z.string(),
  status: z.string(),
  method: z.string(),
  amountPaise: paise,
  receiptId: z.string().nullable(),
  serial: z.string().nullable(),
  failedReason: z.string().nullable(),
  /** For an INITIATED online order: enough to open the gateway's checkout on it again — a payment started on the phone finishes on the web. */
  checkout: z.object(checkoutShape).nullable(),
});

export const feeOkSchema = ok;
