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
export const gigBookingStatusSchema = z.enum(["PENDING_CONSENT", "CONFIRMED", "CANCELLED", "DELIVERED", "MISSED", "UNHELD"]);
export const gigProviderKindSchema = z.enum(["EXPERT", "TEACHER"]);
const gigAllowanceRowSchema = z.object({ allowed: z.number().int(), used: z.number().int(), left: z.number().int() });

/** GET /api/v1/gigs/sessions — for a pupil, or for each of a guardian's children: the free allowance, their seats, and what is open to book. */
export const gigFamilySessionsSchema = z.object({
  /** A confirmed seat given up inside this many hours of the start still counts against the allowance. */
  freeCancelHours: z.number().int(),
  children: z.array(
    z.object({
      id,
      name: z.string(),
      schoolName: z.string(),
      timeZone: z.string(),
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
          /** The provider's own room: present only while the seat is confirmed. */
          meetingUrl: z.string().nullable(),
          lateCancel: z.boolean(),
          rating: z.number().int().nullable(),
          canConsent: z.boolean(),
          canCancel: z.boolean(),
          canRate: z.boolean(),
          canReportUnheld: z.boolean(),
        }),
      ),
      open: z.array(z.object({ id, kind: gigSessionKindSchema, title: z.string(), startsAt: z.string(), endsAt: z.string(), seatsLeft: z.number().int(), providerName: z.string(), providerKind: gigProviderKindSchema, providerHeadline: z.string().nullable() })),
    }),
  ),
});
export type GigFamilySessions = z.infer<typeof gigFamilySessionsSchema>;

/** POST /api/v1/gigs/sessions/book — a pupil asks for a seat (it waits for a guardian), or a guardian takes one for their child. */
export const gigBookBodySchema = z.object({ slotId: id, studentMembershipId: id.nullable().optional(), purpose: z.string().max(500) });
export const gigBookedSchema = z.object({ bookingId: id, status: gigBookingStatusSchema });

/** POST /api/v1/gigs/sessions/{bookingId}/consent — a guardian's yes or no to their child's ask. */
export const gigConsentBodySchema = z.object({ approve: z.boolean() });
export const gigBookingStatusSetSchema = z.object({ status: gigBookingStatusSchema });

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
      cancelled: z.boolean(),
      started: z.boolean(),
      bookings: z.array(z.object({ id, pupilName: z.string(), schoolName: z.string(), purpose: z.string(), status: gigBookingStatusSchema, rating: z.number().int().nullable(), feedback: z.string().nullable() })),
    }),
  ),
});
export type GigProvider = z.infer<typeof gigProviderSchema>;

/** POST /api/v1/gigs/slots — offer a time: a one-to-one of thirty minutes, or a workshop with its length and seats. */
export const gigSlotBodySchema = z.object({ kind: gigSessionKindSchema, title: z.string().max(200), startsAt: z.string().max(40), minutes: z.number().int().optional(), meetingUrl: z.string().max(600), seats: z.number().int().optional() });
export const gigSlotMadeSchema = z.object({ slotId: id });

/** POST /api/v1/gigs/slots/{slotId}/cancel — the provider takes a time back, with a reason every family is told. */
export const gigSlotCancelBodySchema = z.object({ reason: z.string().max(300) });

/** GET /api/v1/gigs/school — the office's view: every session of the school's pupils, and whether its teachers may offer guidance. */
export const gigSchoolSessionsSchema = z.object({
  guidanceOn: z.boolean(),
  canSwitch: z.boolean(),
  timeZone: z.string(),
  bookings: z.array(z.object({ id, pupilName: z.string(), kind: gigSessionKindSchema, title: z.string(), startsAt: z.string(), providerName: z.string(), providerKind: gigProviderKindSchema, status: gigBookingStatusSchema, purpose: z.string(), canCancel: z.boolean() })),
});

/** POST /api/v1/gigs/school/guidance — the school lets its teachers offer free guidance to its own pupils, or stops. */
export const gigGuidanceBodySchema = z.object({ on: z.boolean() });
export const gigGuidanceSetSchema = z.object({ guidanceOn: z.boolean() });
