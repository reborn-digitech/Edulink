import { z } from "zod";

/**
 * An expert's standing beyond their words: the ratings families give their
 * sessions, the free duty decision 0004 asks of them before anything is
 * paid, their KYC papers and the operator's answer, and the iCalendar feed
 * of their times. The profile row belongs to no school; everything here is
 * the expert's own or the operator's.
 */

const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const count = z.number().int().nonnegative();

/* -------------------------------------------------------------------------- */
/* Ratings                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Families' ratings of an expert's sessions, computed on read and shown only
 * once three or more have been given; null reads as "New" on the card.
 */
export const expertRatingSchema = z
  .object({ average: z.number().min(1).max(5), count: count.min(3) })
  .nullable();
export type ExpertRating = z.infer<typeof expertRatingSchema>;
/** Ratings below this many are not an average anybody should read. */
export const EXPERT_RATING_MINIMUM = 3;

/* -------------------------------------------------------------------------- */
/* Free duty (decision 0004)                                                   */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/expert/free-duty — what is still owed free before a price may be asked. */
export const expertFreeDutySchema = z.object({
  /** Free one-to-ones still owed in this period (the start duty first, then the month's). */
  oneToOnes: count,
  /** Free workshops still owed in this period (the start duty first, then the quarter's). */
  workshops: count,
  period: z.object({
    /** YYYY-MM in the platform's clock. */
    month: z.string().regex(/^\d{4}-\d{2}$/),
    /** YYYY-Qn in the platform's clock. */
    quarter: z.string().regex(/^\d{4}-Q[1-4]$/),
  }),
  /** START while the first free sessions are still owed; ONGOING once the monthly and quarterly duty applies. */
  stage: z.object({ oneToOnes: z.enum(["START", "ONGOING"]), workshops: z.enum(["START", "ONGOING"]) }),
  /** The dials the numbers came from, for the sentence on the screen. */
  asked: z.object({ startOneToOnes: count, startWorkshops: count, monthlyOneToOnes: count, quarterlyWorkshops: count }),
  /** True once nothing free is owed for either kind: the gate a price would pass. */
  dutyDone: z.boolean(),
});
export type ExpertFreeDuty = z.infer<typeof expertFreeDutySchema>;

/* -------------------------------------------------------------------------- */
/* KYC                                                                         */
/* -------------------------------------------------------------------------- */

export const EXPERT_KYC_STATUSES = ["NONE", "SUBMITTED", "VERIFIED", "REJECTED"] as const;
export const expertKycStatusSchema = z.enum(EXPERT_KYC_STATUSES);
export type ExpertKycStatus = z.infer<typeof expertKycStatusSchema>;
export const EXPERT_KYC_MAX_DOCUMENTS = 5;

/** A stored id and what the upload pipeline sniffed of it. Never a URL: the phone asks for a link when it opens one. */
export const expertKycDocumentSchema = z.object({ fileId: z.string().min(1), mime: z.string(), size: count });

/** GET /api/v1/expert/kyc — where the papers stand. */
export const expertKycSchema = z.object({
  status: expertKycStatusSchema,
  /** The expert's own note while the papers wait; the operator's reason once decided. */
  note: z.string().nullable(),
  submittedAt: isoOrNull,
  decidedAt: isoOrNull,
  documents: z.array(expertKycDocumentSchema),
  /** The expert may send papers now: nothing sent yet, or the last set was rejected. A waiting set may be replaced. */
  canSubmit: z.boolean(),
});
export type ExpertKyc = z.infer<typeof expertKycSchema>;

/** POST /api/v1/expert/kyc — ids from POST /api/v1/uploads, one to five, with a note for the operator. */
export const expertKycSubmitBodySchema = z.object({
  documentIds: z.array(z.string().min(1).max(200)).min(1).max(EXPERT_KYC_MAX_DOCUMENTS),
  note: z.string().trim().max(1_000).default(""),
});
export type ExpertKycSubmitBody = z.infer<typeof expertKycSubmitBodySchema>;

/** POST /api/v1/operator/experts/{profileId}/kyc — the operator's answer; a rejection needs its reason. */
export const operatorExpertKycBodySchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().trim().max(1_000).default(""),
});
export type OperatorExpertKycBody = z.infer<typeof operatorExpertKycBodySchema>;

/* -------------------------------------------------------------------------- */
/* The calendar feed                                                           */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/expert/calendar/token and POST (rotate) — the feed URL, relative to the API, or none minted yet. */
export const expertCalendarTokenSchema = z.object({
  /** "/api/v1/expert/calendar.ics?token=…", or null until minted. */
  url: z.string().startsWith("/api/v1/expert/calendar.ics?token=").nullable(),
});
export type ExpertCalendarToken = z.infer<typeof expertCalendarTokenSchema>;

/** GET /api/v1/expert/calendar.ics?token=… — the body is text/calendar, not JSON; this names its shape for the document. */
export const expertCalendarFeedSchema = z.string().describe("An RFC 5545 iCalendar document (text/calendar).");
