import { expertEarningsSchema, expertPayoutSchema, gigMyContributionsSchema, gigPayoutsSchema } from "@edulink/contracts";

/** What GET /api/v1/gigs/questions answers a teacher, for the two screens that read it. Only ZZ data. */
const TEXT = { stem: "ZZ How many sides has a triangle?", choices: ["Two", "Three"], solution: "ZZ Three sides." };
const question = (over: Record<string, unknown>) => ({ id: "q1", topic: { id: "t1", name: "ZZ Shapes", subject: "MATHS", classLevel: 3, chapter: "ZZ Chapter 5" }, difficulty: 1, answerIndex: 1, en: TEXT, hi: TEXT, mr: TEXT, status: "SUBMITTED", reviewNote: null, reviewedAt: null, submittedAt: "2026-09-30T10:00:00.000Z", questionId: null, earning: null, open: true, ...over });
const SETTINGS = { questionRatePaise: 1000, questionFreeCount: 20, questionMonthlyCap: 200, questionMonthlyBudgetPaise: 500000, questionDailyLimit: 20, questionPendingLimit: 50, pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, expertStartOneToOnes: 10, expertStartWorkshops: 2, expertMonthlyOneToOnes: 2, expertQuarterlyWorkshops: 1, teacherMonthlyGuidance: 2, freeCancelHours: 12, workshopMaxSeats: 30 };
export const MINE = (over: Record<string, unknown> = {}) =>
  gigMyContributionsSchema.parse({
    settings: SETTINGS,
    standing: { accepted: 21, freeLeft: 0, paidThisMonth: 1, paidLeftThisMonth: 199, duePaise: 1000, paidPaise: 0, sentToday: 2, waiting: 1 },
    payee: { upiId: "zz.teacher@zzbank", payeeName: "ZZ Teacher" },
    draftOn: false,
    contributions: [
      question({}),
      question({ id: "q2", en: { ...TEXT, stem: "ZZ An unpaid one" }, status: "ACCEPTED", open: false, questionId: "bank1", earning: { amountPaise: 0, basis: "FREE_BLOCK", month: "2026-09", paid: false } }),
      question({ id: "q3", en: { ...TEXT, stem: "ZZ A paid one" }, status: "ACCEPTED", open: false, questionId: "bank2", earning: { amountPaise: 1000, basis: "PAID", month: "2026-09", paid: false } }),
    ],
    ...over,
  });

/* ---- paid seats through Razorpay Route (decision 0004, third amendment) ---- */

/** The paid gate as the server reads it: every condition met but the mentoring offer. */
export const GATE = { paymentsOn: true, kycVerified: true, payoutActive: true, mentoringOffer: false, dutyDone: true, oneToOnesOwed: 0, canCharge: false, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 15 };
/** A linked account that does not exist yet. */
export const ROUTE_NONE = { status: "NONE", requirements: [], linked: false, needsResend: false, readyToLink: false, locked: false, checkedAt: null, error: null };
const PAYEE_NONE = { status: "NONE", payeeName: null, upiId: null, bankLast4: null, ifsc: null, panLast4: null, addressLine: null, city: null, postalCode: null, phone: null, gstStateCode: null, gstin: null, note: null, kycVerified: true, transport: "devbox", route: ROUTE_NONE };
/** GET /api/v1/expert/payout: nothing saved, or the payee and route over it. */
export const PAYOUT = (payee: Record<string, unknown> = {}, route: Record<string, unknown> = {}, gate: Record<string, unknown> = {}) => expertPayoutSchema.parse({ payout: { ...PAYEE_NONE, ...payee, route: { ...ROUTE_NONE, ...route } }, gate: { ...GATE, ...gate } });
/** The payee saved by an expert ready to link: bank, PAN and address as their last four and lines. */
export const SAVED_PAYEE = { payeeName: "ZZ Meenakshi Rao", bankLast4: "3456", ifsc: "HDFC0001234", panLast4: "234F", addressLine: "ZZ 12 Lake Road", city: "ZZ Pune", postalCode: "411001", phone: "9800000001", gstStateCode: "27" };
const EARNING_ROW = { paymentId: "sp1", bookingId: "b2", title: "ZZ Build a paper bridge", startsAt: "2030-10-10T10:00:00.000Z", schoolName: "ZZ School", amountPaise: 10000, commissionPaise: 1500, gstPaise: 270, netPaise: 8230, status: "HELD", holdUntil: "2030-10-12T11:00:00.000Z", dueAt: null, releasedAt: null, paidOutAt: null, refundedAt: null, payoutId: null, reason: null };
/** GET /api/v1/expert/earnings: one seat on hold by default. */
export const EARNINGS = (over: Record<string, unknown> = {}, row: Record<string, unknown> = {}) => expertEarningsSchema.parse({ heldPaise: 8230, releasedPaise: 0, duePaise: 0, paidOutPaise: 0, refundedPaise: 0, commissionPercent: 15, gstPercent: 18, rows: [{ ...EARNING_ROW, ...row }], payouts: [], invoices: [], ...over });

/** GET /api/v1/operator/gigs/payouts: Route ready, one released payout, one legacy hand payout open, one refund waiting. */
export const ROUTE_READY = { gatewaySet: true, webhookSet: true, companySet: true, activated: 1, inReview: 1, needsAttention: 1, readyToLink: 2, ready: true };
export const OPERATOR_PAYOUTS = (over: Record<string, unknown> = {}) =>
  gigPayoutsSchema.parse({
    paymentsEnabled: true,
    transport: "devbox",
    route: ROUTE_READY,
    routeAccounts: [
      { expertUserId: "u-rao", expertName: "ZZ Dr Rao", status: "ACTIVATED", linked: true, needsResend: false, readyToLink: true, kycVerified: true, suspended: false, requirements: [], error: null, checkedAt: "2026-10-02T09:00:00.000Z" },
      { expertUserId: "u-iyer", expertName: "ZZ Dr Iyer", status: "NEEDS_CLARIFICATION", linked: true, needsResend: true, readyToLink: true, kycVerified: true, suspended: false, requirements: [{ field: "settlements.ifsc_code", reason: "invalid" }], error: "ZZ IFSC not recognised", checkedAt: "2026-10-02T09:00:00.000Z" },
      { expertUserId: "u-shah", expertName: "ZZ Ms Shah", status: "NONE", linked: false, needsResend: false, readyToLink: false, kycVerified: false, suspended: true, requirements: [], error: null, checkedAt: null },
    ],
    releasedThisMonthPaise: 16460,
    month: "2026-10",
    commissionThisMonthPaise: 4500,
    gstThisMonthPaise: 810,
    heldPaise: 8230,
    duePaise: 8230,
    paidOutThisMonthPaise: 0,
    refundedThisMonthPaise: 10000,
    company: { legalName: "ZZ Shalaghar Private Limited", gstin: "27AAACZ1234A1Z5", address: null, stateCode: "27", sacCode: "998599", invoicePrefix: "SG", gstPercent: 18, missing: [] },
    failures: [{ paymentId: "sp7", expertName: "ZZ Dr Rao", amountPaise: 10000, action: "REFUND", lastError: "ZZ gateway unreachable", attempts: 2, since: "2026-10-01T10:00:00.000Z" }],
    toPay: [{ id: "po2", expertUserId: "u-rao", expertName: "ZZ Dr Rao", payee: { payeeName: "Meenakshi Rao", upiId: null, bankLast4: "3456", ifsc: "HDFC0001234", gstStateCode: "27", gstin: null, status: "ACTIVE" }, netPaise: 8230, paymentsCount: 1, createdAt: "2026-09-28T09:00:00.000Z" }],
    paid: [
      { id: "po3", expertUserId: "u-rao", expertName: "ZZ Dr Rao", status: "RELEASED", netPaise: 16460, paymentsCount: 2, reference: null, paidAt: "2026-10-02T06:00:00.000Z", invoiceId: "inv3", invoiceNumber: "SG/2026-27/0003", note: null },
      { id: "po1", expertUserId: "u-rao", expertName: "ZZ Dr Rao", status: "PAID", netPaise: 8230, paymentsCount: 1, reference: "UTR123456789012", paidAt: "2026-09-20T09:00:00.000Z", invoiceId: "inv1", invoiceNumber: "SG/2026-27/0001", note: null },
    ],
    ...over,
  });
