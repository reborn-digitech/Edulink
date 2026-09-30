import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * gigs: work done for the platform itself (decision 0004). A teacher writes
 * questions for the shared practice bank in three languages; the content team
 * adds them to it, returns them or rejects them; the operator holds the rate,
 * the limits and the budget, and records what the company paid. Every handler
 * is thin over src/lib/gig-questions.ts. The suite is tests/gig-questions.test.ts.
 *
 * The second gig is sessions and workshops (src/lib/gig-sessions.ts, tests/gig-sessions.test.ts):
 * a provider offers a time, a pupil or a guardian takes a seat within the pupil's free allowance,
 * the provider says how it went, and the pupil's school reads and may cancel.
 *
 * Sweep notes: a body-taking write answers 422 to the sweep's empty body, so
 * sampling it changes nothing; "not held" is sampled on a seat the family has already said was not held. The withdraw is sampled on a question its
 * author has already taken back, where a second taking-back is a 200 no-op.
 * The content team's and the operator's endpoints refuse every school role.
 */
const mine = (f: { gigContributionId: string | null }, tail = "") => (f.gigContributionId ? `/api/v1/gigs/questions/${f.gigContributionId}${tail}` : null);
const seat = (f: { gigBookingId: string | null }, tail: string) => (f.gigBookingId ? `/api/v1/gigs/sessions/${f.gigBookingId}${tail}` : null);
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
  // ---- sessions and workshops: a pupil and a guardian ---------------------------------------
  { method: "GET", path: "/api/v1/gigs/sessions", summary: "For a pupil, or each of a guardian's children: the free allowance of the school year, their seats (the meeting link only while one is confirmed), and the times open to book", access: ["STUDENT", "PARENT"], response: c.gigFamilySessionsSchema, sample: "/api/v1/gigs/sessions" },
  { method: "POST", path: "/api/v1/gigs/sessions/book", summary: "A pupil asks for a seat, which waits for a guardian, or a guardian takes one for their child; refused past the free allowance or when the last seat has gone", access: ["STUDENT", "PARENT"], request: c.gigBookBodySchema, response: c.gigBookedSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/sessions/book" },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/consent", summary: "A guardian agrees to their child's ask, or declines it and the seat is given back", access: ["PARENT"], request: c.gigConsentBodySchema, response: c.gigBookingStatusSetSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/consent"), probe: { body: () => ({ approve: true }) } },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/cancel", summary: "A seat is given up by the pupil or a guardian, or cancelled with a reason by the provider or the pupil's school; given up late by the family it still counts against the allowance", access: ["STUDENT", "PARENT", "ADMIN", "PRINCIPAL", "TEACHER", "EXPERT"], request: c.gigCancelBodySchema, response: c.gigCancelledSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/cancel"), probe: { body: () => ({ reason: "ZZ probe: not theirs to cancel" }) } },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/unheld", summary: "After it should have ended, the family says the provider did not hold it; it stops counting against the pupil", access: ["STUDENT", "PARENT"], response: c.gigBookingStatusSetSchema, sample: (f) => (f.gigUnheldBookingId ? `/api/v1/gigs/sessions/${f.gigUnheldBookingId}/unheld` : null) },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/rate", summary: "The family rates a session out of five, once, after it was held", access: ["STUDENT", "PARENT"], request: c.gigRateBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/rate"), probe: { body: () => ({ rating: 5 }) } },
  // ---- sessions and workshops: a provider -----------------------------------------------------
  { method: "GET", path: "/api/v1/gigs/slots", summary: "A provider's offered times, who has a seat in each, and what they have given free against what is asked; a teacher whose school has not switched guidance on is told so", access: ["EXPERT", "TEACHER"], response: c.gigProviderSchema, sample: "/api/v1/gigs/slots" },
  { method: "POST", path: "/api/v1/gigs/slots", summary: "Offer a time: a one-to-one of thirty minutes, or (an expert) a workshop with its length and seats, on the provider's own https meeting link", access: ["EXPERT", "TEACHER"], request: c.gigSlotBodySchema, response: c.gigSlotMadeSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/slots" },
  { method: "POST", path: "/api/v1/gigs/slots/{slotId}/cancel", summary: "The provider takes a time back with a reason; every seat in it is cancelled, none counted against a pupil, and each family is told", access: ["EXPERT", "TEACHER"], request: c.gigSlotCancelBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.gigSlotId ? `/api/v1/gigs/slots/${f.gigSlotId}/cancel` : null), probe: { body: () => ({ reason: "ZZ probe: not theirs to cancel" }) } },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/close", summary: "After it has begun, the provider says how a seat went: held, or the pupil did not come", access: ["EXPERT", "TEACHER"], request: c.gigCloseBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/close"), probe: { body: () => ({ outcome: "DELIVERED" }) } },
  // ---- sessions and workshops: the pupil's school ---------------------------------------------
  { method: "GET", path: "/api/v1/gigs/school", summary: "The office reads every session of its pupils, without the meeting link, and whether its teachers may offer guidance", access: ["ADMIN", "PRINCIPAL"], response: c.gigSchoolSessionsSchema, sample: "/api/v1/gigs/school" },
  { method: "POST", path: "/api/v1/gigs/school/guidance", summary: "The school lets its teachers offer free one-to-one guidance to its own pupils, or stops; stopping cancels nothing already booked", access: ["ADMIN"], request: c.gigGuidanceBodySchema, response: c.gigGuidanceSetSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/school/guidance" },
  // ---- the content team ------------------------------------------------------------------
  { method: "GET", path: "/api/v1/appadmin/contributions", summary: "Teachers' questions waiting to be read, or those decided, by status", access: "app-admin", response: c.gigQueueSchema, sample: "/api/v1/appadmin/contributions" },
  { method: "GET", path: "/api/v1/appadmin/contributions/{contributionId}", summary: "One teacher's question in three languages, and what adding it today would earn its author", access: "app-admin", response: c.gigReviewSchema, sample: (f) => review(f) },
  { method: "POST", path: "/api/v1/appadmin/contributions/{contributionId}/decide", summary: "Add the question to the bank (the only act that earns), return it with a note, or reject it with a reason; adding is refused when the teacher's month or the budget is used up", access: "app-admin", request: c.gigDecideBodySchema, response: c.gigDecidedSchema, emptyBodyStatus: 422, sample: (f) => review(f, "/decide") },
  // ---- the operator -----------------------------------------------------------------------
  { method: "GET", path: "/api/v1/operator/gigs", summary: "The rate, the limits and the budget; this month's spend; who is owed for the months that have ended; what was paid", access: "operator", response: c.gigOverviewSchema, sample: "/api/v1/operator/gigs" },
  { method: "POST", path: "/api/v1/operator/gigs/settings", summary: "Set the rate for a question, the unpaid first ones, a teacher's monthly limit, the monthly budget and the sending limits", access: "operator", request: c.gigSettingsSchema, response: c.gigSettingsSavedSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/settings" },
  { method: "POST", path: "/api/v1/operator/gigs/payments", summary: "Record the reference of a UPI transfer already made to a contributor; it settles what they are owed for the months that have ended", access: "operator", request: c.gigPaymentBodySchema, response: c.gigPaymentSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/payments" },
];
