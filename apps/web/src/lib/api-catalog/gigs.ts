import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * gigs: work done for the platform itself (decision 0004). A teacher writes
 * questions for the shared practice bank in three languages; the content team
 * adds them to it, returns them or rejects them; the operator holds the rate,
 * the limits and the budget, and records what the company paid. Every handler
 * is thin over src/lib/gig-questions.ts. The suite is tests/gig-questions.test.ts.
 *
 * Sweep notes: a body-taking write answers 422 to the sweep's empty body, so
 * sampling it changes nothing. The withdraw is sampled on a question its
 * author has already taken back, where a second taking-back is a 200 no-op.
 * The content team's and the operator's endpoints refuse every school role.
 */
const mine = (f: { gigContributionId: string | null }, tail = "") => (f.gigContributionId ? `/api/v1/gigs/questions/${f.gigContributionId}${tail}` : null);
const review = (f: { gigContributionId: string | null }, tail = "") => (f.gigContributionId ? `/api/v1/appadmin/contributions/${f.gigContributionId}${tail}` : null);

export const GIGS: Endpoint[] = [
  // ---- a teacher ---------------------------------------------------------------------
  { method: "GET", path: "/api/v1/gigs/questions", summary: "A teacher's own questions for the bank, what they stand to earn, and where they are paid", access: ["TEACHER"], response: c.gigMyContributionsSchema, sample: "/api/v1/gigs/questions" },
  { method: "POST", path: "/api/v1/gigs/questions", summary: "Send a question in English, Hindi and Marathi; refused past the day's or the waiting limit, or when the same words are already in the bank", access: ["TEACHER"], request: c.gigContributionSaveSchema, response: c.gigContributionSavedSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/questions" },
  { method: "GET", path: "/api/v1/gigs/questions/topics", summary: "The chapters a question can be written for", access: ["TEACHER"], response: c.gigTopicsSchema, sample: "/api/v1/gigs/questions/topics" },
  { method: "POST", path: "/api/v1/gigs/questions/draft", summary: "A machine draft of the Hindi and the Marathi from the English, for the teacher to correct; saved nowhere", access: ["TEACHER"], request: c.gigDraftBodySchema, response: c.gigDraftSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/questions/draft" },
  { method: "GET", path: "/api/v1/gigs/questions/{contributionId}", summary: "One of the teacher's own questions; somebody else's is not found", access: ["TEACHER"], response: c.gigContributionSchema, sample: (f) => mine(f) },
  { method: "POST", path: "/api/v1/gigs/questions/{contributionId}", summary: "Change a question that still waits or was returned; it goes back to the content team", access: ["TEACHER"], request: c.gigContributionSaveSchema, response: c.gigContributionSavedSchema, emptyBodyStatus: 422, sample: (f) => mine(f) },
  { method: "POST", path: "/api/v1/gigs/questions/{contributionId}/withdraw", summary: "Take back a question that is not settled; taken back twice is taken back", access: ["TEACHER"], response: c.gigContributionSavedSchema, sample: (f) => (f.gigWithdrawnContributionId ? `/api/v1/gigs/questions/${f.gigWithdrawnContributionId}/withdraw` : null) },
  { method: "POST", path: "/api/v1/gigs/payee", summary: "The contributor's own UPI id, where the company pays them", access: ["TEACHER"], request: c.gigPayeeBodySchema, response: c.gigPayeeSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/payee" },
  // ---- the content team ------------------------------------------------------------------
  { method: "GET", path: "/api/v1/appadmin/contributions", summary: "Teachers' questions waiting to be read, or those decided, by status", access: "app-admin", response: c.gigQueueSchema, sample: "/api/v1/appadmin/contributions" },
  { method: "GET", path: "/api/v1/appadmin/contributions/{contributionId}", summary: "One teacher's question in three languages, and what adding it today would earn its author", access: "app-admin", response: c.gigReviewSchema, sample: (f) => review(f) },
  { method: "POST", path: "/api/v1/appadmin/contributions/{contributionId}/decide", summary: "Add the question to the bank (the only act that earns), return it with a note, or reject it with a reason; adding is refused when the teacher's month or the budget is used up", access: "app-admin", request: c.gigDecideBodySchema, response: c.gigDecidedSchema, emptyBodyStatus: 422, sample: (f) => review(f, "/decide") },
  // ---- the operator -----------------------------------------------------------------------
  { method: "GET", path: "/api/v1/operator/gigs", summary: "The rate, the limits and the budget; this month's spend; who is owed for the months that have ended; what was paid", access: "operator", response: c.gigOverviewSchema, sample: "/api/v1/operator/gigs" },
  { method: "POST", path: "/api/v1/operator/gigs/settings", summary: "Set the rate for a question, the unpaid first ones, a teacher's monthly limit, the monthly budget and the sending limits", access: "operator", request: c.gigSettingsSchema, response: c.gigSettingsSavedSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/settings" },
  { method: "POST", path: "/api/v1/operator/gigs/payments", summary: "Record the reference of a UPI transfer already made to a contributor; it settles what they are owed for the months that have ended", access: "operator", request: c.gigPaymentBodySchema, response: c.gigPaymentSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/payments" },
];
