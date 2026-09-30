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
  payments: z.array(z.object({ id, userId: id, name: z.string(), amountPaise: z.number().int(), upiId: z.string(), utr: z.string(), note: z.string().nullable(), paidAt: z.string(), questions: z.number().int() })),
});
export type GigOverview = z.infer<typeof gigOverviewSchema>;

/** POST /api/v1/operator/gigs/settings — the six dials, whole numbers. */
export const gigSettingsSavedSchema = z.object({ settings: gigSettingsSchema });

/** POST /api/v1/operator/gigs/payments — the reference of a transfer already made to a contributor; the amount is the server's sum of what they are owed. */
export const gigPaymentBodySchema = z.object({ userId: id, utr: z.string().max(40), note: z.string().max(300).optional() });
export const gigPaymentSchema = z.object({ payment: z.object({ id, amountPaise: z.number().int(), questions: z.number().int() }) });
