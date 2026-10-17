import { z } from "zod";

/**
 * gigs: work done for the platform itself. The first is a teacher writing
 * questions for the shared practice bank in English, Hindi and Marathi, the
 * content team adding them to it, and the operator recording what the company
 * paid for them (decision 0004).
 *
 * Bodies carry the SHAPE only. What a question must be (a real stem, every
 * option filled in each language, Devanagari where a sentence is written, the
 * author's word that it is their own) is refused on the server as a 422 with
 * the sentence in the reader's language. Money is integer paise.
 */

const id = z.string().min(1).max(64);

export const gigQuestionTextSchema = z.object({
  stem: z.string().max(2000),
  choices: z.array(z.string().max(500)).min(1).max(6),
  solution: z.string().max(4000),
});
export type GigQuestionText = z.infer<typeof gigQuestionTextSchema>;

export const gigContributionStatusSchema = z.enum(["SUBMITTED", "RETURNED", "ACCEPTED", "REJECTED", "WITHDRAWN"]);
export type GigContributionStatus = z.infer<typeof gigContributionStatusSchema>;

/** POST /api/v1/gigs/questions (send) and /{contributionId} (change one that is still open). */
export const gigContributionSaveSchema = z.object({
  topicId: id,
  difficulty: z.number().int().min(1).max(6),
  answerIndex: z.number().int().min(0).max(5),
  en: gigQuestionTextSchema,
  hi: gigQuestionTextSchema,
  mr: gigQuestionTextSchema,
  /** "This is my own work and the platform may use it." */
  terms: z.boolean(),
});
export type GigContributionSave = z.infer<typeof gigContributionSaveSchema>;

export const gigSettingsSchema = z.object({
  questionRatePaise: z.number().int(),
  questionFreeCount: z.number().int(),
  questionMonthlyCap: z.number().int(),
  questionMonthlyBudgetPaise: z.number().int(),
  questionDailyLimit: z.number().int(),
  questionPendingLimit: z.number().int(),
  pupilFreeOneToOnes: z.number().int(),
  pupilFreeWorkshops: z.number().int(),
  expertStartOneToOnes: z.number().int(),
  expertStartWorkshops: z.number().int(),
  expertMonthlyOneToOnes: z.number().int(),
  expertQuarterlyWorkshops: z.number().int(),
  teacherMonthlyGuidance: z.number().int(),
  freeCancelHours: z.number().int(),
  workshopMaxSeats: z.number().int(),
});
export type GigSettings = z.infer<typeof gigSettingsSchema>;

export const gigContributionSchema = z.object({
  id,
  topic: z.object({ id, name: z.string(), subject: z.string(), classLevel: z.number().int(), chapter: z.string() }),
  difficulty: z.number().int(),
  answerIndex: z.number().int(),
  en: gigQuestionTextSchema,
  hi: gigQuestionTextSchema,
  mr: gigQuestionTextSchema,
  status: gigContributionStatusSchema,
  reviewNote: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  submittedAt: z.string(),
  questionId: z.string().nullable(),
  earning: z.object({ amountPaise: z.number().int(), basis: z.enum(["PAID", "FREE_BLOCK"]), month: z.string(), paid: z.boolean() }).nullable(),
  open: z.boolean(),
});
export type GigContribution = z.infer<typeof gigContributionSchema>;

/** POST answers: the contribution as it now stands. */
export const gigContributionSavedSchema = z.object({ contribution: gigContributionSchema });

/** GET /api/v1/gigs/questions — a teacher's own questions, what they stand to earn, and where they are paid. */
export const gigMyContributionsSchema = z.object({
  settings: gigSettingsSchema,
  standing: z.object({
    accepted: z.number().int(),
    freeLeft: z.number().int(),
    paidThisMonth: z.number().int(),
    paidLeftThisMonth: z.number().int(),
    duePaise: z.number().int(),
    paidPaise: z.number().int(),
    sentToday: z.number().int(),
    waiting: z.number().int(),
  }),
  payee: z.object({ upiId: z.string(), payeeName: z.string() }).nullable(),
  draftOn: z.boolean(),
  contributions: z.array(gigContributionSchema),
});
export type GigMyContributions = z.infer<typeof gigMyContributionsSchema>;

/** GET /api/v1/gigs/questions/topics — the chapters a question can be written for. */
export const gigTopicsSchema = z.object({ topics: z.array(z.object({ id, name: z.string(), subject: z.string(), classLevel: z.number().int(), chapter: z.string() })) });

/** POST /api/v1/gigs/questions/draft — the English; answered with a Hindi and a Marathi draft to correct. */
export const gigDraftBodySchema = gigQuestionTextSchema;
export const gigDraftSchema = z.object({ hi: gigQuestionTextSchema, mr: gigQuestionTextSchema });

/** POST /api/v1/gigs/payee — the contributor's own UPI id and the name on it. */
export const gigPayeeBodySchema = z.object({ upiId: z.string().max(320), payeeName: z.string().max(80) });
export const gigPayeeSchema = z.object({ payee: z.object({ upiId: z.string(), payeeName: z.string() }) });

/* ---------------------------------------------------------------------- */
/* The content team                                                        */
/* ---------------------------------------------------------------------- */

/** GET /api/v1/appadmin/contributions?status= — the queue, the oldest waiting first. */
export const gigQueueQuerySchema = z.object({ status: gigContributionStatusSchema.optional() });
export const gigQueueSchema = z.object({
  status: gigContributionStatusSchema,
  counts: z.record(gigContributionStatusSchema, z.number().int()),
  rows: z.array(z.object({ id, status: gigContributionStatusSchema, stem: z.string(), topicName: z.string(), subject: z.string(), classLevel: z.number().int(), authorName: z.string(), authorSchoolName: z.string(), submittedAt: z.string() })),
});

const gigOutcomeSchema = z.union([
  z.object({ basis: z.enum(["FREE_BLOCK", "PAID"]), amountPaise: z.number().int() }),
  z.object({ refuse: z.enum(["gigs.refuseMonthlyCap", "gigs.refuseBudget"]) }),
]);

/** GET /api/v1/appadmin/contributions/{contributionId} — one question to read, and what adding it today would earn its author. */
export const gigReviewSchema = gigContributionSchema.extend({
  authorName: z.string(),
  authorSchoolName: z.string(),
  authorAccepted: z.number().int(),
  authorPaidThisMonth: z.number().int(),
  outcome: gigOutcomeSchema,
  spentThisMonthPaise: z.number().int(),
  budgetPaise: z.number().int(),
  freeCount: z.number().int(),
});
export type GigReview = z.infer<typeof gigReviewSchema>;

/** POST /api/v1/appadmin/contributions/{contributionId}/decide — add to the bank (with the reviewer's corrections, if any), return with a note, or reject with a reason. */
export const gigDecideBodySchema = z.object({
  decision: z.enum(["ACCEPT", "RETURN", "REJECT"]),
  note: z.string().max(1000).optional(),
  edit: gigContributionSaveSchema.omit({ terms: true }).optional(),
});
export const gigDecidedSchema = z.object({ contribution: gigReviewSchema });

/* ---------------------------------------------------------------------- */
/* The operator                                                            */
/* ---------------------------------------------------------------------- */

/** GET /api/v1/operator/gigs — the dials, this month's spend, who is owed and what was paid. */
export const gigOverviewSchema = z.object({
  settings: gigSettingsSchema,
  month: z.string(),
  spentThisMonthPaise: z.number().int(),
  addedThisMonth: z.number().int(),
  waiting: z.number().int(),
  due: z.array(z.object({ userId: id, name: z.string(), email: z.string().nullable(), schoolName: z.string(), upiId: z.string().nullable(), payeeName: z.string().nullable(), questions: z.number().int(), amountPaise: z.number().int(), throughMonth: z.string() })),
  accruingPaise: z.number().int(),
  /** What is on offer across every school: slots ahead and their seats. */
  sessions: z.object({ upcomingSlots: z.number().int(), upcomingSeats: z.number().int(), seatsTaken: z.number().int() }),
  payments: z.array(z.object({ id, userId: id, name: z.string(), amountPaise: z.number().int(), upiId: z.string(), utr: z.string(), note: z.string().nullable(), paidAt: z.string(), questions: z.number().int() })),
});
export type GigOverview = z.infer<typeof gigOverviewSchema>;

/** POST /api/v1/operator/gigs/settings — the six dials, whole numbers. */
export const gigSettingsSavedSchema = z.object({ settings: gigSettingsSchema });

/** POST /api/v1/operator/gigs/payments — the reference of a transfer already made to a contributor; the amount is the server's sum of what they are owed. */
export const gigPaymentBodySchema = z.object({ userId: id, utr: z.string().max(40), note: z.string().max(300).optional() });
export const gigPaymentSchema = z.object({ payment: z.object({ id, amountPaise: z.number().int(), questions: z.number().int() }) });

/* ---------------------------------------------------------------------- */
/* Sessions and workshops                                                  */
/* ---------------------------------------------------------------------- */

export const gigSessionKindSchema = z.enum(["ONE_TO_ONE", "WORKSHOP"]);
export const gigBookingStatusSchema = z.enum(["PENDING_CONSENT", "PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "DELIVERED", "MISSED", "UNHELD"]);
export type GigBookingStatus = z.infer<typeof gigBookingStatusSchema>;

/* ---- paid seats (decision 0004, third amendment 2026-10-02: Razorpay Route, the expert's share on hold) ---- */

export const gigGatewayTransportSchema = z.enum(["devbox", "razorpay", "off"]);
/** Where an expert is paid: ACTIVE once KYC is verified and Razorpay has activated their linked account with the bank details saved; NONE until then; SUSPENDED by the operator. */
export const gigPayoutStatusSchema = z.enum(["NONE", "ACTIVE", "SUSPENDED"]);
/** INITIATED → PAID → HELD (the gateway holds the expert's share) → RELEASED (the hold taken off; the gateway settles the expert); or REFUNDED; FAILED. DUE and PAID_OUT are the company-collects rows of the second amendment. */
export const gigSessionPaymentStatusSchema = z.enum(["INITIATED", "PAID", "HELD", "RELEASED", "DUE", "PAID_OUT", "REFUNDED", "FAILED"]);
/** The gateway's activation status of an expert's Route linked account. */
export const gigRouteStatusSchema = z.enum(["NONE", "REQUESTED", "NEEDS_CLARIFICATION", "UNDER_REVIEW", "ACTIVATED", "SUSPENDED"]);
export const gigRouteRequirementSchema = z.object({ field: z.string(), reason: z.string() });
/** Where an expert's linked account stands, as the gateway last said. */
export const gigRouteViewSchema = z.object({
  status: gigRouteStatusSchema,
  requirements: z.array(gigRouteRequirementSchema),
  linked: z.boolean(),
  /** The bank details saved differ from those the gateway holds: send them again before a seat can be sold. */
  needsResend: z.boolean(),
  readyToLink: z.boolean(),
  /** Name, PAN and address are with the gateway and are refused here. */
  locked: z.boolean(),
  checkedAt: z.string().nullable(),
  error: z.string().nullable(),
});

/** Whether an expert may price a workshop seat, condition by condition, and the band and share the operator set. */
export const gigPaidGateSchema = z.object({
  paymentsOn: z.boolean(),
  kycVerified: z.boolean(),
  payoutActive: z.boolean(),
  mentoringOffer: z.boolean(),
  dutyDone: z.boolean(),
  oneToOnesOwed: z.number().int(),
  canCharge: z.boolean(),
  seatPriceMinPaise: z.number().int(),
  seatPriceMaxPaise: z.number().int(),
  commissionPercent: z.number().int(),
});
export type GigPaidGate = z.infer<typeof gigPaidGateSchema>;

/** The order a guardian pays: the gateway's order and key, what it is for, and which transport the panel should use. */
export const gigCheckoutSchema = z.object({
  paymentId: id,
  bookingId: id,
  orderId: z.string(),
  keyId: z.string(),
  amountPaise: z.number().int(),
  currency: z.literal("INR"),
  transport: gigGatewayTransportSchema,
  title: z.string(),
  pupilName: z.string(),
  payerName: z.string(),
  payerEmail: z.string().nullable(),
});
export type GigCheckout = z.infer<typeof gigCheckoutSchema>;

/** GET /api/v1/gigs/payments/{paymentId} — the payer's own payment, with the checkout while it waits. */
export const gigPaymentStatusSchema = z.object({
  paymentId: id,
  bookingId: id,
  status: gigSessionPaymentStatusSchema,
  amountPaise: z.number().int(),
  /** The family's receipt number once paid (GET /gigs/payments/{paymentId}/receipt is the PDF). */
  receiptNumber: z.string().nullable(),
  bookingStatus: gigBookingStatusSchema,
  refundedAt: z.string().nullable(),
  reason: z.string().nullable(),
  checkout: gigCheckoutSchema.nullable(),
});
export type GigPaymentStatus = z.infer<typeof gigPaymentStatusSchema>;

/** POST /api/v1/gigs/sessions/{bookingId}/checkout — the order for a seat waiting for payment, the same one while it stands. */
export const gigCheckoutMadeSchema = z.object({ checkout: gigCheckoutSchema });

/** POST /api/v1/gigs/payments/{paymentId}/confirm — the checkout's handler signature, a fallback for a slow webhook. */
export const gigCheckoutConfirmBodySchema = z.object({ gatewayPaymentId: z.string().max(80), signature: z.string().max(200) });
export const gigCheckoutConfirmedSchema = z.object({ outcome: z.string(), bookingId: id.nullable() });

/** The expert's payee details as every read returns them: the sealed bank account and PAN NEVER, the last four of each only. */
export const gigPayeeViewSchema = z.object({
  status: gigPayoutStatusSchema,
  payeeName: z.string().nullable(),
  upiId: z.string().nullable(),
  bankLast4: z.string().nullable(),
  ifsc: z.string().nullable(),
  panLast4: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  phone: z.string().nullable(),
  /** Two-digit GST state code: the place of supply on the company's invoice. */
  gstStateCode: z.string().nullable(),
  gstin: z.string().nullable(),
  /** The operator's reason for a suspension. */
  note: z.string().nullable(),
  kycVerified: z.boolean(),
  transport: gigGatewayTransportSchema,
  route: gigRouteViewSchema,
});
export type GigPayeeView = z.infer<typeof gigPayeeViewSchema>;

/** GET /api/v1/expert/payout — where the expert is paid, and the four conditions. */
export const expertPayoutSchema = z.object({ payout: gigPayeeViewSchema, gate: gigPaidGateSchema });
export type ExpertPayout = z.infer<typeof expertPayoutSchema>;

/** POST /api/v1/expert/payout — what the linked account is made from: the name on the PAN and bank, the bank account and IFSC, the PAN (blank keeps the saved one), an address, a mobile, the GST state, a GSTIN if any. */
export const expertPayeeBodySchema = z.object({
  payeeName: z.string().max(80),
  bankAccount: z.string().max(30).nullable().optional(),
  ifsc: z.string().max(20).nullable().optional(),
  pan: z.string().max(12).nullable().optional(),
  addressLine: z.string().max(120),
  city: z.string().max(80),
  postalCode: z.string().max(8),
  phone: z.string().max(20),
  gstStateCode: z.string().max(2),
  gstin: z.string().max(20).nullable().optional(),
});
/** POST /api/v1/expert/payout/link — make, resume or bring up to date the expert's linked account at the gateway. */
export const expertRouteLinkedSchema = z.object({ outcome: z.enum(["activated", "pending", "needs-clarification", "refused"]), payout: gigPayeeViewSchema, gate: gigPaidGateSchema });

/** GET /api/v1/expert/earnings — seat by seat with the three figures, payout by payout, and the invoices. */
export const expertEarningsSchema = z.object({
  heldPaise: z.number().int(),
  /** Released to the gateway, which settles it to the expert's bank. */
  releasedPaise: z.number().int(),
  duePaise: z.number().int(),
  paidOutPaise: z.number().int(),
  refundedPaise: z.number().int(),
  commissionPercent: z.number().int(),
  gstPercent: z.number().int(),
  rows: z.array(
    z.object({
      paymentId: id,
      bookingId: id,
      title: z.string(),
      startsAt: z.string(),
      schoolName: z.string(),
      amountPaise: z.number().int(),
      commissionPaise: z.number().int(),
      gstPaise: z.number().int(),
      netPaise: z.number().int(),
      status: gigSessionPaymentStatusSchema,
      holdUntil: z.string().nullable(),
      dueAt: z.string().nullable(),
      releasedAt: z.string().nullable(),
      paidOutAt: z.string().nullable(),
      refundedAt: z.string().nullable(),
      payoutId: id.nullable(),
      reason: z.string().nullable(),
    }),
  ),
  payouts: z.array(z.object({ id, netPaise: z.number().int(), paymentsCount: z.number().int(), status: z.string(), reference: z.string().nullable(), paidAt: z.string().nullable(), createdAt: z.string(), invoiceId: id.nullable(), invoiceNumber: z.string().nullable() })),
  invoices: z.array(z.object({ id, number: z.string(), issuedAt: z.string(), taxableValuePaise: z.number().int(), cgstPaise: z.number().int(), sgstPaise: z.number().int(), igstPaise: z.number().int(), totalPaise: z.number().int(), payoutId: id })),
});
export type ExpertEarnings = z.infer<typeof expertEarningsSchema>;

/** A tax invoice as the row froze it: the parties, the figures, one line per seat. */
export const gigInvoicePartySchema = z.object({ name: z.string(), gstin: z.string().nullable(), address: z.string().nullable(), stateCode: z.string().nullable() });
export const gigInvoiceSchema = z.object({
  id,
  number: z.string(),
  payoutId: id,
  expertUserId: id,
  issuedAt: z.string(),
  locale: z.enum(["en", "hi", "mr"]),
  taxableValuePaise: z.number().int(),
  cgstPaise: z.number().int(),
  sgstPaise: z.number().int(),
  igstPaise: z.number().int(),
  totalPaise: z.number().int(),
  sacCode: z.string(),
  seller: gigInvoicePartySchema,
  buyer: gigInvoicePartySchema,
  lines: z.array(z.object({ paymentId: id, title: z.string(), date: z.string(), grossPaise: z.number().int(), commissionPaise: z.number().int(), gstPaise: z.number().int() })),
  payout: z.object({ netPaise: z.number().int(), paymentsCount: z.number().int(), reference: z.string().nullable(), paidAt: z.string().nullable() }),
});
export type GigInvoice = z.infer<typeof gigInvoiceSchema>;
/** GET /api/v1/expert/invoices — the expert's own. */
export const expertInvoicesSchema = z.object({ invoices: z.array(gigInvoiceSchema) });
/** GET /api/v1/operator/gigs/invoices — every one the company issued. */
export const gigOperatorInvoicesSchema = z.object({ invoices: z.array(gigInvoiceSchema.extend({ expertName: z.string() })) });

/** The company as the seller on its invoices, and what is still missing before a payout can be recorded. */
export const gigCompanySchema = z.object({ legalName: z.string().nullable(), gstin: z.string().nullable(), address: z.string().nullable(), stateCode: z.string().nullable(), sacCode: z.string(), invoicePrefix: z.string(), gstPercent: z.number().int(), missing: z.array(z.enum(["legalName", "gstin", "stateCode"])) });
export type GigCompany = z.infer<typeof gigCompanySchema>;
/** POST /api/v1/operator/gigs/company — the operator sets the seller. */
export const gigCompanyBodySchema = z.object({ legalName: z.string().max(160), gstin: z.string().max(20), address: z.string().max(400), stateCode: z.string().max(2), sacCode: z.string().max(8), invoicePrefix: z.string().max(8), gstPercent: z.number().int() });
export const gigCompanySavedSchema = z.object({ company: gigCompanySchema });

/** GET /api/v1/operator/gigs/payouts — the switch, the company, the month's commission and GST, what is held and due, what failed, what is to pay now and what was paid. */
export const gigPayoutPayeeSchema = z.object({ payeeName: z.string().nullable(), upiId: z.string().nullable(), bankLast4: z.string().nullable(), ifsc: z.string().nullable(), gstStateCode: z.string().nullable(), gstin: z.string().nullable(), status: gigPayoutStatusSchema });
/** Whether paid seats may be turned on: a gateway, the webhook's secret, the company's invoice details, one linked account activated. */
export const gigRouteReadinessSchema = z.object({ gatewaySet: z.boolean(), webhookSet: z.boolean(), companySet: z.boolean(), activated: z.number().int(), inReview: z.number().int(), needsAttention: z.number().int(), readyToLink: z.number().int(), ready: z.boolean() });
export const gigRouteAccountSchema = z.object({ expertUserId: id, expertName: z.string(), status: gigRouteStatusSchema, linked: z.boolean(), needsResend: z.boolean(), readyToLink: z.boolean(), kycVerified: z.boolean(), suspended: z.boolean(), requirements: z.array(gigRouteRequirementSchema), error: z.string().nullable(), checkedAt: z.string().nullable() });
export const gigPayoutsSchema = z.object({
  paymentsEnabled: z.boolean(),
  transport: gigGatewayTransportSchema,
  route: gigRouteReadinessSchema,
  routeAccounts: z.array(gigRouteAccountSchema),
  releasedThisMonthPaise: z.number().int(),
  month: z.string(),
  commissionThisMonthPaise: z.number().int(),
  gstThisMonthPaise: z.number().int(),
  heldPaise: z.number().int(),
  duePaise: z.number().int(),
  paidOutThisMonthPaise: z.number().int(),
  refundedThisMonthPaise: z.number().int(),
  company: gigCompanySchema,
  failures: z.array(z.object({ paymentId: id, expertName: z.string(), amountPaise: z.number().int(), action: z.enum(["REFUND", "HOLD", "RELEASE", "TRANSFER"]), lastError: z.string().nullable(), attempts: z.number().int(), since: z.string() })),
  toPay: z.array(z.object({ id, expertUserId: id, expertName: z.string(), payee: gigPayoutPayeeSchema, netPaise: z.number().int(), paymentsCount: z.number().int(), createdAt: z.string() })),
  paid: z.array(z.object({ id, expertUserId: id, expertName: z.string(), status: z.enum(["PAID", "RELEASED"]), netPaise: z.number().int(), paymentsCount: z.number().int(), reference: z.string().nullable(), paidAt: z.string().nullable(), invoiceId: id.nullable(), invoiceNumber: z.string().nullable(), note: z.string().nullable() })),
});
export type GigPayouts = z.infer<typeof gigPayoutsSchema>;

/** POST /api/v1/operator/gigs/payouts/switch — the kill switch. */
export const gigPaymentsSwitchBodySchema = z.object({ on: z.boolean() });
export const gigPaymentsSwitchedSchema = z.object({ paymentsEnabled: z.boolean() });

/** POST /api/v1/operator/gigs/payouts/{payoutId}/pay — the company's transfer recorded: the UTR, when, a note; the invoice is issued with it. */
export const gigPayoutPayBodySchema = z.object({ reference: z.string().max(40), paidAt: z.string().max(40).nullable().optional(), note: z.string().max(300).nullable().optional() });
export const gigPayoutPaidSchema = z.object({ payout: z.object({ id, netPaise: z.number().int(), paymentsCount: z.number().int(), reference: z.string() }), invoice: z.object({ id, number: z.string(), totalPaise: z.number().int() }) });

/** POST /api/v1/operator/gigs/route/link — every ready expert linked, every open review asked after. */
export const gigRouteLinkAllSchema = z.object({ run: z.object({ tried: z.number().int(), activated: z.number().int(), pending: z.number().int(), refused: z.number().int() }) });

/** POST /api/v1/operator/gigs/payees/{expertUserId}/suspend — the operator stops paying an expert with a reason, or lifts the stop. */
export const gigPayeeSuspendBodySchema = z.object({ suspended: z.boolean(), note: z.string().max(300).nullable().optional() });
export const gigPayeeSuspendedSchema = z.object({ payout: gigPayeeViewSchema });

/** POST /api/v1/operator/gigs/payments/{paymentId}/retry — a waiting refund tried now. */
export const gigPayoutRetriedSchema = z.object({ outcome: z.string() });
/** ALUMNUS (4 Oct 2026): a college's alumnus mentor, offering free one-to-ones to its students (src/lib/placement-alumni.ts). */
export const gigProviderKindSchema = z.enum(["EXPERT", "TEACHER", "ALUMNUS"]);
const gigAllowanceRowSchema = z.object({ allowed: z.number().int(), used: z.number().int(), left: z.number().int() });

/** GET /api/v1/gigs/sessions — for a pupil, or for each of a guardian's children: the free allowance, their seats, and what is open to book. */
export const gigFamilySessionsSchema = z.object({
  /** A confirmed seat given up inside this many hours of the start still counts against the allowance. */
  freeCancelHours: z.number().int(),
  /** The operator's switch: a priced seat past the allowance can be bought. */
  paymentsOn: z.boolean(),
  children: z.array(
    z.object({
      id,
      name: z.string(),
      schoolName: z.string(),
      timeZone: z.string(),
      /** Who reads this pays for a priced seat themselves — a guardian, or a pupil of eighteen or more; a pupil under eighteen asks a parent (seats, 17 Oct 2026). */
      selfPays: z.boolean().optional(),
      allowance: z.object({ ONE_TO_ONE: gigAllowanceRowSchema, WORKSHOP: gigAllowanceRowSchema }),
      bookings: z.array(
        z.object({
          id,
          kind: gigSessionKindSchema,
          title: z.string(),
          startsAt: z.string(),
          endsAt: z.string(),
          providerName: z.string(),
          providerKind: gigProviderKindSchema,
          purpose: z.string(),
          status: gigBookingStatusSchema,
          /** The provider's own room: present only once the seat is confirmed and, when priced, paid. */
          meetingUrl: z.string().nullable(),
          /** GET /gigs/sessions/{bookingId}/join answers with the link now (seats, 17 Oct 2026). */
          canJoin: z.boolean().optional(),
          lateCancel: z.boolean(),
          rating: z.number().int().nullable(),
          /** Bought past the allowance, and where its money stands. */
          paid: z.boolean(),
          pricePaise: z.number().int(),
          payment: z.object({ paymentId: id, status: gigSessionPaymentStatusSchema, amountPaise: z.number().int(), refundedAt: z.string().nullable() }).nullable(),
          canConsent: z.boolean(),
          canPay: z.boolean(),
          canCancel: z.boolean(),
          canRate: z.boolean(),
          canReportUnheld: z.boolean(),
        }),
      ),
      open: z.array(z.object({ id, kind: gigSessionKindSchema, title: z.string(), startsAt: z.string(), endsAt: z.string(), seatsLeft: z.number().int(), providerName: z.string(), providerKind: gigProviderKindSchema, providerHeadline: z.string().nullable(), pricePaise: z.number().int(), freeSeat: z.boolean() })),
    }),
  ),
});
export type GigFamilySessions = z.infer<typeof gigFamilySessionsSchema>;

/** POST /api/v1/gigs/sessions/book — a pupil asks for a seat (it waits for a guardian), or a guardian takes one for their child. */
export const gigBookBodySchema = z.object({ slotId: id, studentMembershipId: id.nullable().optional(), purpose: z.string().max(500) });
export const gigBookedSchema = z.object({ bookingId: id, status: gigBookingStatusSchema, /** A paid seat a guardian took: the order to pay now. */ checkout: gigCheckoutSchema.nullable() });

/** POST /api/v1/gigs/sessions/{bookingId}/consent — a guardian's yes or no to their child's ask. */
export const gigConsentBodySchema = z.object({ approve: z.boolean() });
export const gigBookingStatusSetSchema = z.object({ status: gigBookingStatusSchema, /** A paid seat agreed to: the order the guardian pays now. */ checkout: gigCheckoutSchema.nullable().optional() });

/** POST /api/v1/gigs/sessions/{bookingId}/cancel — a seat given up; the reason may be empty for the family and is needed from anybody else. */
export const gigCancelBodySchema = z.object({ reason: z.string().max(300) });
export const gigCancelledSchema = z.object({ status: gigBookingStatusSchema, lateCancel: z.boolean() });

/** POST /api/v1/gigs/sessions/{bookingId}/rate — out of five, once, after it was held. */
export const gigRateBodySchema = z.object({ rating: z.number().int(), feedback: z.string().max(500).optional() });

/** POST /api/v1/gigs/sessions/{bookingId}/close — the provider says how a seat went. */
export const gigCloseBodySchema = z.object({ outcome: z.enum(["DELIVERED", "MISSED"]) });

/** GET /api/v1/gigs/slots — a provider's offered times, who has a seat in each, and what they have given free. */
export const gigProviderSchema = z.object({
  enabled: z.boolean(),
  kind: gigProviderKindSchema,
  timeZone: z.string(),
  duty: z.object({ deliveredOneToOnes: z.number().int(), heldWorkshops: z.number().int(), oneToOnesThisMonth: z.number().int(), workshopsThisQuarter: z.number().int(), startOneToOnes: z.number().int(), startWorkshops: z.number().int(), monthlyOneToOnes: z.number().int(), quarterlyWorkshops: z.number().int() }).nullable(),
  /** An expert's standing to price a time (a workshop seat or a one-to-one); null for a teacher. */
  gate: gigPaidGateSchema.nullable(),
  /** A teacher's standing to price guidance: payments on, and a UPI id saved for the company to pay them (seats, 17 Oct 2026); null for an expert. */
  teacherGate: z.object({ paymentsOn: z.boolean(), payeeSaved: z.boolean(), canCharge: z.boolean(), seatPriceMinPaise: z.number().int(), seatPriceMaxPaise: z.number().int(), commissionPercent: z.number().int() }).nullable().optional(),
  /** The provider's sold seats by where their money stands: the net held, due and paid, and the gross refunded. */
  earnings: z.object({ heldPaise: z.number().int(), duePaise: z.number().int(), paidPaise: z.number().int(), refundedPaise: z.number().int(), seats: z.number().int() }).nullable().optional(),
  slots: z.array(
    z.object({
      id,
      kind: gigSessionKindSchema,
      title: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
      meetingUrl: z.string(),
      seats: z.number().int(),
      seatsTaken: z.number().int(),
      pricePaise: z.number().int(),
      cancelled: z.boolean(),
      started: z.boolean(),
      bookings: z.array(z.object({ id, pupilName: z.string(), schoolName: z.string(), purpose: z.string(), status: gigBookingStatusSchema, paid: z.boolean(), rating: z.number().int().nullable(), feedback: z.string().nullable() })),
    }),
  ),
});
export type GigProvider = z.infer<typeof gigProviderSchema>;

/** POST /api/v1/gigs/slots — offer a time: a one-to-one of thirty minutes, or a workshop with its length and seats, on a Meet, Zoom, Teams or Jitsi link. */
/** `pricePaise` prices a seat — a workshop's or, since decision 0006 (17 Oct 2026), a one-to-one's, an expert's or a teacher's — within the operator's band, behind the provider's paid gate. Omitted or 0 is a free time, which draws on a pupil's allowance. */
export const gigSlotBodySchema = z.object({ kind: gigSessionKindSchema, title: z.string().max(200), startsAt: z.string().max(40), minutes: z.number().int().optional(), meetingUrl: z.string().max(600), seats: z.number().int().optional(), pricePaise: z.number().int().min(0).max(10_000_000).optional() });
export const gigSlotMadeSchema = z.object({ slotId: id });

/** POST /api/v1/gigs/slots/{slotId}/cancel — the provider takes a time back, with a reason every family is told. */
export const gigSlotCancelBodySchema = z.object({ reason: z.string().max(300) });

/** GET /api/v1/gigs/school — the office's view: every session of the school's pupils, and whether its teachers may offer guidance. */
export const gigSchoolSessionsSchema = z.object({
  guidanceOn: z.boolean(),
  canSwitch: z.boolean(),
  timeZone: z.string(),
  bookings: z.array(z.object({ id, pupilName: z.string(), kind: gigSessionKindSchema, title: z.string(), startsAt: z.string(), providerName: z.string(), providerKind: gigProviderKindSchema, status: gigBookingStatusSchema, purpose: z.string(), paid: z.boolean(), canCancel: z.boolean() })),
});

/** POST /api/v1/gigs/school/guidance — the school lets its teachers offer free guidance to its own pupils, or stops. */
export const gigGuidanceBodySchema = z.object({ on: z.boolean() });
export const gigGuidanceSetSchema = z.object({ guidanceOn: z.boolean() });

/** GET /api/v1/gigs/sessions/{bookingId}/join — the meeting link: the provider's always, a seat holder's once the seat is confirmed and, when priced, paid (seats, 17 Oct 2026). */
export const gigJoinSchema = z.object({ bookingId: id, title: z.string(), startsAt: z.string(), endsAt: z.string(), meetingUrl: z.string(), as: z.enum(["PROVIDER", "SEAT"]) });
export type GigJoin = z.infer<typeof gigJoinSchema>;
