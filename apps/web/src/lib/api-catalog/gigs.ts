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
 * Paid seats (decision 0004, third amendment of 2 October 2026): families pay through Razorpay
 * Route, the expert's share held by the gateway as a transfer on hold to the expert's linked
 * account and released 48 hours after the session; the company keeps its commission with a GST
 * tax invoice — src/lib/gig-payments.ts, tests/gig-payments.test.ts. Paid seats stay off until
 * Route is proven on the company's account.
 *
 * Sweep notes: a body-taking write answers 422 to the sweep's empty body, so
 * sampling it changes nothing; "not held" is sampled on a seat the family has already said was not held. The withdraw is sampled on a question its
 * author has already taken back, where a second taking-back is a 200 no-op.
 * The content team's and the operator's endpoints refuse every school role.
 */
const mine = (f: { gigContributionId: string | null }, tail = "") => (f.gigContributionId ? `/api/v1/gigs/questions/${f.gigContributionId}${tail}` : null);
const seat = (f: { gigBookingId: string | null }, tail: string) => (f.gigBookingId ? `/api/v1/gigs/sessions/${f.gigBookingId}${tail}` : null);
const review = (f: { gigContributionId: string | null }, tail = "") => (f.gigContributionId ? `/api/v1/appadmin/contributions/${f.gigContributionId}${tail}` : null);
// ---- feature-switches (15 Oct 2026): the platform's features ----
// The teachers' question gig is the QUESTION_GIG platform feature (it was the QUESTION_GIG_FOR_TEACHERS
// constant, review-queue of 10 Oct 2026): its doors carry `feature` and answer 404 FEATURE_OFF for every
// role while the operator has it off (role-gate.ts); the payee door decides in its handler. The sessions
// doors carry EXPERT_SESSIONS, TEACHER_SESSIONS or both ("any of": the family's and the provider's doors,
// whose library then hides or refuses the provider kind that is off, src/lib/gig-sessions.ts). The content
// team's and the operator's doors are tooling and carry none. Nothing is deleted.
// ---- end feature-switches ----

export const GIGS: Endpoint[] = [
  // ---- a teacher ---------------------------------------------------------------------
  { method: "GET", path: "/api/v1/gigs/questions", feature: "QUESTION_GIG", summary: "A teacher's own questions for the bank, what they stand to earn, and where they are paid", access: ["TEACHER"], reach: "self", reachRefusal: "filters", response: c.gigMyContributionsSchema, sample: "/api/v1/gigs/questions" },
  { method: "POST", path: "/api/v1/gigs/questions", feature: "QUESTION_GIG", summary: "Send a question in English, Hindi and Marathi; refused past the day's or the waiting limit, or when the same words are already in the bank", access: ["TEACHER"], request: c.gigContributionSaveSchema, response: c.gigContributionSavedSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/questions" },
  { method: "GET", path: "/api/v1/gigs/questions/topics", feature: "QUESTION_GIG", summary: "The chapters a question can be written for", access: ["TEACHER"], response: c.gigTopicsSchema, sample: "/api/v1/gigs/questions/topics" },
  { method: "POST", path: "/api/v1/gigs/questions/draft", feature: "QUESTION_GIG", summary: "A machine draft of the Hindi and the Marathi from the English, for the teacher to correct; saved nowhere", access: ["TEACHER"], request: c.gigDraftBodySchema, response: c.gigDraftSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/questions/draft" },
  { method: "GET", path: "/api/v1/gigs/questions/{contributionId}", feature: "QUESTION_GIG", summary: "One of the teacher's own questions; somebody else's is not found", access: ["TEACHER"], reach: "self", response: c.gigContributionSchema, sample: (f) => mine(f) },
  { method: "POST", path: "/api/v1/gigs/questions/{contributionId}", feature: "QUESTION_GIG", summary: "Change a question that still waits or was returned; it goes back to the content team", access: ["TEACHER"], request: c.gigContributionSaveSchema, reach: "self", response: c.gigContributionSavedSchema, emptyBodyStatus: 422, sample: (f) => mine(f) },
  { method: "POST", path: "/api/v1/gigs/questions/{contributionId}/withdraw", feature: "QUESTION_GIG", summary: "Take back a question that is not settled; taken back twice is taken back", access: ["TEACHER"], reach: "self", response: c.gigContributionSavedSchema, sample: (f) => (f.gigWithdrawnContributionId ? `/api/v1/gigs/questions/${f.gigWithdrawnContributionId}/withdraw` : null) },
  { method: "POST", path: "/api/v1/gigs/payee", feature: "QUESTION_GIG", featureInHandler: "open while the QUESTION_GIG feature is on, and while it is off to a teacher the company still owes for questions the bank took (src/lib/question-gig.ts payeeDoorOpen); 404 to any other teacher", summary: "The contributor's own UPI id, where the company pays them; while the gig is off, open only to a teacher still owed for earlier questions (quiz-board, 11 Oct 2026), 404 for any other", access: ["TEACHER"], request: c.gigPayeeBodySchema, reach: "self", response: c.gigPayeeSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/payee" },
  // ---- sessions and workshops: a pupil and a guardian ---------------------------------------
  { method: "GET", path: "/api/v1/gigs/sessions", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "For a pupil, or each of a guardian's children: the free allowance of the school year, their seats (the meeting link only while one is confirmed), and the times open to book", access: ["STUDENT", "PARENT"], reach: { STUDENT: "self", PARENT: "ownChild" }, reachRefusal: "filters", response: c.gigFamilySessionsSchema, sample: "/api/v1/gigs/sessions" },
  { method: "POST", path: "/api/v1/gigs/sessions/book", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "A pupil asks for a seat, which waits for a guardian, or a guardian takes one for their child; refused past the free allowance or when the last seat has gone", access: ["STUDENT", "PARENT"], request: c.gigBookBodySchema, reach: { STUDENT: "self", PARENT: "ownChild" }, reachRefusal: { STUDENT: "filters" }, response: c.gigBookedSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/sessions/book" },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/consent", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "A guardian agrees to their child's ask, or declines it and the seat is given back", access: ["PARENT"], request: c.gigConsentBodySchema, reach: "ownChild", response: c.gigBookingStatusSetSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/consent"), probe: { body: () => ({ approve: true }) } },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/cancel", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "A seat is given up by the pupil or a guardian, or cancelled with a reason by the provider or the pupil's school; given up late by the family it still counts against the allowance", access: ["STUDENT", "PARENT", "ADMIN", "PRINCIPAL", "TEACHER", "EXPERT"], request: c.gigCancelBodySchema, reach: { STUDENT: "self", PARENT: "ownChild", ADMIN: "ownSchool", PRINCIPAL: "ownSchool", TEACHER: "self", EXPERT: "self" }, response: c.gigCancelledSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/cancel"), probe: { body: () => ({ reason: "ZZ probe: not theirs to cancel" }) } },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/unheld", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "After it should have ended, the family says the provider did not hold it; it stops counting against the pupil", access: ["STUDENT", "PARENT"], reach: { STUDENT: "self", PARENT: "ownChild" }, response: c.gigBookingStatusSetSchema, sample: (f) => (f.gigUnheldBookingId ? `/api/v1/gigs/sessions/${f.gigUnheldBookingId}/unheld` : null) },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/rate", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "The family rates a session out of five, once, after it was held", access: ["STUDENT", "PARENT"], request: c.gigRateBodySchema, reach: { STUDENT: "self", PARENT: "ownChild" }, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/rate"), probe: { body: () => ({ rating: 5 }) } },
  // ---- paid seats (decision 0004, amended 2026-10-02): a guardian pays past the allowance ------------
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/checkout", feature: "EXPERT_SESSIONS", summary: "The order for a paid seat waiting for the guardian's payment — the same order while it stands, a fresh one after a failed attempt; a handful an hour per person", access: ["PARENT"], reach: { PARENT: "ownChild", STUDENT: "self" }, response: c.gigCheckoutMadeSchema, sample: (f) => seat(f, "/checkout") },
  { method: "GET", path: "/api/v1/gigs/payments/{paymentId}", summary: "The payer's own seat payment: where it stands, and the checkout while it waits; the panel polls it", access: ["STUDENT", "PARENT"], reach: "self", response: c.gigPaymentStatusSchema, sample: (f) => (f.gigPaymentId ? `/api/v1/gigs/payments/${f.gigPaymentId}` : null) },
  { method: "POST", path: "/api/v1/gigs/payments/{paymentId}/confirm", feature: "EXPERT_SESSIONS", summary: "The checkout's own confirmation, verified with the company's key secret (the webhook remains the record)", access: ["PARENT"], request: c.gigCheckoutConfirmBodySchema, reach: "self", response: c.gigCheckoutConfirmedSchema, emptyBodyStatus: 422, sample: (f) => (f.gigPaymentId ? `/api/v1/gigs/payments/${f.gigPaymentId}/confirm` : null) },
  { method: "GET", path: "/api/v1/gigs/payments/{paymentId}/receipt", summary: "The family's receipt for a paid seat as a PDF (application/pdf): the gross, who collected it on whose behalf, and the refund when there was one; a pupil reads the receipt for their own seat", access: ["STUDENT", "PARENT"], reach: "self", response: c.okSchema, sample: (f) => (f.gigPaymentId ? `/api/v1/gigs/payments/${f.gigPaymentId}/receipt` : null) },
  // ---- sessions and workshops: a provider -----------------------------------------------------
  { method: "GET", path: "/api/v1/gigs/slots", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "A provider's offered times, who has a seat in each, what they have given free against what is asked, and their meeting account with the free-account caps (decision 0008); a teacher whose school has not switched guidance on is told so", access: ["EXPERT", "TEACHER"], reach: { EXPERT: "approvedExpert", TEACHER: "self" }, reachRefusal: "filters", response: c.gigProviderSchema, sample: "/api/v1/gigs/slots" },
  { method: "POST", path: "/api/v1/gigs/slots", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "Offer a time: a one-to-one of thirty minutes, or (an expert) a workshop with its length and seats, on the provider's own https meeting link", access: ["EXPERT", "TEACHER"], request: c.gigSlotBodySchema, response: c.gigSlotMadeSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/slots" },
  // decision 0008 (7 Nov 2026): the provider's word that their meeting account is premium, which lifts the service's free-account length cap on what they offer.
  { method: "POST", path: "/api/v1/gigs/meeting-account", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "The provider says once whether their Google Meet, Zoom, Microsoft Teams or Jitsi account is premium; while it is not said, a session they offer is held to the service's free-account length (the operator's caps, Zoom 40, Meet 60, Teams 60 minutes to begin); nothing verifies it", access: ["EXPERT", "TEACHER"], request: c.gigMeetingAccountBodySchema, reach: "self", response: c.gigMeetingAccountSetSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/meeting-account", sampleBody: () => ({ premium: false }) },
  // decision 0008 (7 Nov 2026): sessions in series. A series is offered in one go and each session is a slot as before; a family books each seat (every remaining one in one order of individual seats). The offer carries no sampleBody (it would write a series on every sweep), and the book door no probe, as /gigs/sessions/book carries none: a pupil's own probe would book seats on every run, and the guardian fence it shares (gig-sessions.ts `child`) is held by tests/gig-series.test.ts.
  { method: "POST", path: "/api/v1/gigs/series", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "Offer a series of sessions in one go — a fixed list of dates, or a weekly pattern (days of the week at a time, from a day until a day) — each session a slot of its own with the series' title, length, seats, room and price, two to twenty-four of them, each checked as a single time is (the paid gate, the band, the room's service and its free-account cap, no overlap)", access: ["EXPERT", "TEACHER"], request: c.gigSeriesBodySchema, response: c.gigSeriesMadeSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/series" },
  { method: "POST", path: "/api/v1/gigs/series/{seriesId}/cancel", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "The provider takes a whole series back with a reason: every session not yet begun is cancelled as one time is, each seat given back or refunded and each family told; anybody else's series is not found", access: ["EXPERT", "TEACHER"], request: c.gigSeriesCancelBodySchema, reach: "self", response: c.gigSeriesCancelledSchema, emptyBodyStatus: 422, sample: (f) => (f.gigSeriesId ? `/api/v1/gigs/series/${f.gigSeriesId}/cancel` : null), probe: { body: () => ({ reason: "ZZ probe: not theirs to cancel" }) } },
  { method: "POST", path: "/api/v1/gigs/series/{seriesId}/book", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "One order of individual seats: every remaining session of the series, or the ones named, each booked as a single seat is (a guardian's booking confirmed or waiting for its payment, a pupil's ask waiting for a guardian), a session that cannot be booked set aside with its reason; no pass and no standing access", access: ["STUDENT", "PARENT"], request: c.gigSeriesBookBodySchema, reach: { STUDENT: "self", PARENT: "ownChild" }, /* the sample series is open to every pupil, so a classmate reaches it; a pupil books for themself whatever the body names */ reachRefusal: { STUDENT: "notAtSample" }, response: c.gigSeriesBookedSchema, emptyBodyStatus: 422, sample: (f) => (f.gigSeriesId ? `/api/v1/gigs/series/${f.gigSeriesId}/book` : null) },
  { method: "POST", path: "/api/v1/gigs/slots/{slotId}/cancel", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "The provider takes a time back with a reason; every seat in it is cancelled, none counted against a pupil, and each family is told", access: ["EXPERT", "TEACHER"], request: c.gigSlotCancelBodySchema, reach: "self", response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.gigSlotId ? `/api/v1/gigs/slots/${f.gigSlotId}/cancel` : null), probe: { body: () => ({ reason: "ZZ probe: not theirs to cancel" }) } },
  { method: "POST", path: "/api/v1/gigs/sessions/{bookingId}/close", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "After it has begun, the provider says how a seat went: held, or the pupil did not come", access: ["EXPERT", "TEACHER"], request: c.gigCloseBodySchema, reach: "self", response: c.okSchema, emptyBodyStatus: 422, sample: (f) => seat(f, "/close"), probe: { body: () => ({ outcome: "DELIVERED" }) } },
  // ---- paid seats: the expert (Razorpay Route: the share held by the gateway, released after the session) ----
  { method: "GET", path: "/api/v1/expert/payout", feature: "EXPERT_SESSIONS", planFree: "what an expert earned, and the details the money owed is paid to, stay theirs after their plan ends (plans, 16 Oct 2026)", summary: "The expert's payee details — the sealed bank account and PAN never returned (the last four of each only) — where their Razorpay Route linked account stands, and the four conditions before a workshop seat may be priced", access: ["EXPERT"], reach: "self", response: c.expertPayoutSchema, sample: "/api/v1/expert/payout" },
  { method: "POST", path: "/api/v1/expert/payout", feature: "EXPERT_SESSIONS", planFree: "what an expert earned, and the details the money owed is paid to, stay theirs after their plan ends (plans, 16 Oct 2026)", summary: "Save what the linked account is made from: the name on the PAN and bank, the bank account and IFSC and the PAN (both sealed at rest; blank keeps the saved one), an address, a mobile, the GST state and a GSTIN if any; once linked, the name, PAN and address are refused", access: ["EXPERT"], request: c.expertPayeeBodySchema, reach: "self", response: c.expertPayoutSchema, emptyBodyStatus: 422, sample: "/api/v1/expert/payout" },
  { method: "POST", path: "/api/v1/expert/payout/link", feature: "EXPERT_SESSIONS", planFree: "what an expert earned, and the details the money owed is paid to, stay theirs after their plan ends (plans, 16 Oct 2026)", summary: "Make, resume or bring up to date the expert's Razorpay Route linked account (account, stakeholder with the PAN, Route requested, bank details), or ask where Razorpay's review stands; refused by name until KYC is verified and every detail saved; a dozen an hour per expert", access: ["EXPERT"], reach: "self", response: c.expertRouteLinkedSchema, sample: "/api/v1/expert/payout/link" },
  { method: "GET", path: "/api/v1/expert/earnings", feature: "EXPERT_SESSIONS", planFree: "what an expert earned, and the details the money owed is paid to, stay theirs after their plan ends (plans, 16 Oct 2026)", summary: "What the expert has on hold, released to their bank by Razorpay (or, for seats from before Route, due and paid by the company) and refunded, seat by seat with the gross, the commission, the GST on it and the net; the payouts; the invoices", access: ["EXPERT"], reach: "self", reachRefusal: "filters", response: c.expertEarningsSchema, sample: "/api/v1/expert/earnings" },
  { method: "GET", path: "/api/v1/expert/invoices", feature: "EXPERT_SESSIONS", planFree: "what an expert earned, and the details the money owed is paid to, stay theirs after their plan ends (plans, 16 Oct 2026)", summary: "The company's GST tax invoices to this expert for its commission, newest first", access: ["EXPERT"], reach: "self", reachRefusal: "filters", response: c.expertInvoicesSchema, sample: "/api/v1/expert/invoices" },
  { method: "GET", path: "/api/v1/expert/invoices/{invoiceId}/pdf", feature: "EXPERT_SESSIONS", planFree: "what an expert earned, and the details the money owed is paid to, stay theirs after their plan ends (plans, 16 Oct 2026)", summary: "One of the expert's own invoices as a PDF (application/pdf) in the language it was issued in; anybody else's is not found", access: ["EXPERT"], reach: "self", response: c.okSchema, sample: (f) => (f.gigInvoiceId ? `/api/v1/expert/invoices/${f.gigInvoiceId}/pdf` : null) },
  // ---- sessions and workshops: the pupil's school ---------------------------------------------
  { method: "GET", path: "/api/v1/gigs/school", feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"], summary: "The office reads every session of its pupils, without the meeting link, and whether its teachers may offer guidance", access: ["ADMIN", "PRINCIPAL"], response: c.gigSchoolSessionsSchema, sample: "/api/v1/gigs/school" },
  { method: "POST", path: "/api/v1/gigs/school/guidance", feature: "TEACHER_SESSIONS", summary: "The school lets its teachers offer free one-to-one guidance to its own pupils, or stops; stopping cancels nothing already booked", access: ["ADMIN", "PRINCIPAL"], request: c.gigGuidanceBodySchema, response: c.gigGuidanceSetSchema, emptyBodyStatus: 422, sample: "/api/v1/gigs/school/guidance" },
  // ---- the content team ------------------------------------------------------------------
  { method: "GET", path: "/api/v1/appadmin/contributions", summary: "Teachers' questions waiting to be read, or those decided, by status", access: "app-admin", request: c.gigQueueQuerySchema, response: c.gigQueueSchema, sample: "/api/v1/appadmin/contributions" },
  { method: "GET", path: "/api/v1/appadmin/contributions/{contributionId}", summary: "One teacher's question in three languages, and what adding it today would earn its author", access: "app-admin", response: c.gigReviewSchema, sample: (f) => review(f) },
  { method: "POST", path: "/api/v1/appadmin/contributions/{contributionId}/decide", summary: "Add the question to the bank (the only act that earns), return it with a note, or reject it with a reason; adding is refused when the teacher's month or the budget is used up", access: "app-admin", request: c.gigDecideBodySchema, response: c.gigDecidedSchema, emptyBodyStatus: 422, sample: (f) => review(f, "/decide") },
  // ---- the operator -----------------------------------------------------------------------
  { method: "GET", path: "/api/v1/operator/gigs", summary: "The rate, the limits and the budget; this month's spend; who is owed for the months that have ended; what was paid", access: "operator", response: c.gigOverviewSchema, sample: "/api/v1/operator/gigs" },
  { method: "POST", path: "/api/v1/operator/gigs/settings", summary: "Set the rate for a question, the unpaid first ones, a teacher's monthly limit, the monthly budget and the sending limits", access: "operator", request: c.gigSettingsSchema, response: c.gigSettingsSavedSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/settings" },
  { method: "POST", path: "/api/v1/operator/gigs/payments", summary: "Record the reference of a UPI transfer already made to a contributor; it settles what they are owed for the months that have ended", access: "operator", request: c.gigPaymentBodySchema, response: c.gigPaymentSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/payments" },
  { method: "GET", path: "/api/v1/operator/gigs/payouts", summary: "Paid seats: the switch and whether Razorpay Route is ready for it, each expert's linked account, the company's details as the seller, the month's commission, GST and releases, what is held, what failed and waits to be tried again, any hand-recorded payout still to pay, and those settled", access: "operator", response: c.gigPayoutsSchema, sample: "/api/v1/operator/gigs/payouts" },
  { method: "POST", path: "/api/v1/operator/gigs/payouts/switch", summary: "The switch for paid seats: on is refused until Razorpay Route is ready (a gateway, the webhook's secret, the company's details, one linked account activated); off, every session is free, nothing is released, refunds still go through", access: "operator", request: c.gigPaymentsSwitchBodySchema, response: c.gigPaymentsSwitchedSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/payouts/switch" },
  { method: "POST", path: "/api/v1/operator/gigs/payouts/{payoutId}/pay", summary: "For a payout from before Route only: record the company's transfer to an expert (the UTR, when, a note): the payout is paid, every seat in it paid out, and the GST tax invoice for the commission issued in the same transaction; refused until the company's GSTIN, state and legal name are set", access: "operator", request: c.gigPayoutPayBodySchema, response: c.gigPayoutPaidSchema, emptyBodyStatus: 422, sample: (f) => (f.gigPaidPayoutId ? `/api/v1/operator/gigs/payouts/${f.gigPaidPayoutId}/pay` : null) },
  { method: "POST", path: "/api/v1/operator/gigs/route/link", summary: "Link every expert ready for Razorpay Route and not yet activated, and ask after every review still open", access: "operator", response: c.gigRouteLinkAllSchema, sample: "/api/v1/operator/gigs/route/link" },
  { method: "POST", path: "/api/v1/operator/gigs/payments/{paymentId}/retry", summary: "Try the waiting gateway call now, instead of at the job's next run: a refund, a release of the hold, or a failed transfer made again on hold (a captured row never held is held)", access: "operator", response: c.gigPayoutRetriedSchema, sample: (f) => (f.gigPaymentId ? `/api/v1/operator/gigs/payments/${f.gigPaymentId}/retry` : null) },
  { method: "POST", path: "/api/v1/operator/gigs/company", summary: "The company as the seller on its tax invoices: legal name, GSTIN, address, state code, the SAC, the series prefix (one or two capital letters, so every invoice number fits sixteen characters; a longer one is refused) and the GST rate on the commission", access: "operator", request: c.gigCompanyBodySchema, response: c.gigCompanySavedSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/gigs/company" },
  { method: "GET", path: "/api/v1/operator/gigs/invoices", summary: "Every GST tax invoice the company has issued to an expert, newest first", access: "operator", response: c.gigOperatorInvoicesSchema, sample: "/api/v1/operator/gigs/invoices" },
  { method: "POST", path: "/api/v1/operator/gigs/payees/{expertUserId}/suspend", summary: "Stop paying an expert, with a reason they can read, or lift the stop; a suspended payee cannot price a seat", access: "operator", request: c.gigPayeeSuspendBodySchema, response: c.gigPayeeSuspendedSchema, emptyBodyStatus: 422, sample: (f) => (f.gigExpertUserId ? `/api/v1/operator/gigs/payees/${f.gigExpertUserId}/suspend` : null) },
];
// seats (17 Oct 2026): pay per seat for every session, and decision 0004's rules as decision 0006 amends them
// (src/lib/gig-sessions.ts, tests/seats.test.ts). A one-to-one and a teacher's guidance may now be priced, so the paid
// doors open to both session features; a pupil of eighteen or more (a college student) pays for their own seat, so the
// checkout and its confirmation name STUDENT beside PARENT (a pupil under eighteen is refused, "Ask your parent"); and a
// new door gives the meeting link, gated as the family's list gates it. The existing entries are amended here rather
// than edited in place (the wave's shared-file fence); `amend` throws on a door that is not there, so a rename is caught.
{
  const amend = (method: Endpoint["method"], path: string, patch: Partial<Endpoint>) => {
    const e = GIGS.find((x) => x.method === method && x.path === path);
    if (!e) throw new Error(`api-catalog/gigs.ts (seats): no ${method} ${path} to amend`);
    Object.assign(e, patch);
  };
  const BOTH = ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] as const;
  amend("POST", "/api/v1/gigs/sessions/{bookingId}/checkout", {
    feature: BOTH,
    access: ["PARENT", "STUDENT"],
    summary: "The order for a paid seat — an expert's workshop or one-to-one, or a teacher's guidance — waiting for its payer's payment: a guardian, or a pupil of eighteen or more for themselves (a pupil under eighteen is refused, and asks a parent); the same order while it stands, a fresh one after a failed attempt; a handful an hour per person",
  });
  amend("POST", "/api/v1/gigs/payments/{paymentId}/confirm", {
    feature: BOTH,
    access: ["PARENT", "STUDENT"],
    summary: "The checkout's own confirmation by its payer (a guardian, or a pupil of eighteen or more who bought their own seat), verified with the company's key secret (the webhook remains the record)",
  });
  amend("POST", "/api/v1/gigs/slots", {
    summary: "Offer a time on the provider's own Meet, Zoom, Teams or Jitsi link (https, refused on any other host): a one-to-one of thirty minutes or (an expert) a workshop with its length and seats, held to the service's free-account length unless the provider has said their account is premium (decision 0008); a price within the operator's band on either kind, behind the provider's paid gate (an expert's four conditions; a teacher's payments on and a UPI id saved); 0 is a free time, which draws on a pupil's allowance",
  });
  amend("GET", "/api/v1/gigs/sessions", {
    summary: "For a pupil, or each of a guardian's children: the free allowance of the school year (spent on free times alone), their seats (the meeting link only once one is confirmed and, when priced, paid), who pays for a priced seat, the times open to book (never with a link), and the series with a session open to them, each session with whether it is already theirs (decision 0008)",
  });
  GIGS.push({
    method: "GET",
    path: "/api/v1/gigs/sessions/{bookingId}/join",
    feature: BOTH,
    planFree: "a provider whose plan has ended still holds the sessions already booked with them, and reads where to hold them (seats, 17 Oct 2026)",
    summary: "The meeting link of one booking: the provider's own always; the pupil's and their guardians' once the seat is confirmed and, when priced, paid (403 with the reason before then); anybody else's is not found, and the office never reads it",
    access: ["STUDENT", "PARENT", "EXPERT", "TEACHER"],
    reach: { STUDENT: "self", PARENT: "ownChild", EXPERT: "self", TEACHER: "self" }, response: c.gigJoinSchema,
    sample: (f) => seat(f, "/join"),
  });
}
// end seats
// plans-payments fixes (testing analysis of 13 November 2026): what three doors now do, said where the catalog is read.
// Amended here, not edited in place (the shared-file fence); it throws on a door that is not there.
{
  const say = (method: Endpoint["method"], path: string, summary: string) => {
    const e = GIGS.find((x) => x.method === method && x.path === path);
    if (!e) throw new Error(`api-catalog/gigs.ts (plans-payments): no ${method} ${path} to amend`);
    e.summary = summary;
  };
  // TA-188: a failed attempt is tried again on the same order, so a late capture of the first still finds its seat.
  say("POST", "/api/v1/gigs/sessions/{bookingId}/checkout", "The order for a paid seat — an expert's workshop or one-to-one, or a teacher's guidance — waiting for its payer's payment: a guardian, or a pupil of eighteen or more for themselves (a pupil under eighteen is refused, and asks a parent); the same order while it stands and again after a failed attempt; a handful an hour per person");
  // TA-184: money that arrives for a seat already given back is refunded, never confirmed (outcome "given-back").
  say("POST", "/api/v1/gigs/payments/{paymentId}/confirm", "The checkout's own confirmation by its payer (a guardian, or a pupil of eighteen or more who bought their own seat), verified with the company's key secret (the webhook remains the record); a payment for a seat already given back is refunded, not confirmed (outcome given-back)");
  // TA-187: a stop holds the expert's held seats too, not only new prices.
  say("POST", "/api/v1/operator/gigs/payees/{expertUserId}/suspend", "Stop paying an expert, with a reason they can read, or lift the stop; a suspended payee cannot price a seat, and their held seats are not released to them until the stop is lifted (refunds still go)");
}
// end plans-payments fixes
// decision-189 (TA-189, the owner's option 1 of 14 November 2026): a teacher's commission invoice is opened by the
// person it is addressed to, whatever their role, and by the operator. Two PDF doors, pushed here rather than edited
// in place (the shared-file fence).
GIGS.push(
  {
    method: "GET",
    path: "/api/v1/account/gig-invoices/{invoiceId}/pdf",
    feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"],
    planFree: "a commission invoice the company issued stays readable to the person it is addressed to after their plan ends, as an expert's earnings do (TA-189)",
    summary: "A commission tax invoice as a PDF (application/pdf) in the language it was issued in, to the person it is addressed to whatever role they are signed in as — a teacher paid for guidance seats as well as an expert (the operator's any); anybody else's is not found",
    access: "signed-in",
    limitedRoles: c.ALL_LIMITED_ROLES,
    reach: { ADMIN: "self", PRINCIPAL: "self", TEACHER: "self", STUDENT: "self", PARENT: "self", EXPERT: "self", DRIVER: "self", LIBRARIAN: "self", WARDEN: "self", ALUMNUS: "self", FACULTY: "self", HOD: "self", EXAM_CONTROLLER: "self", IQAC: "self", TPO: "self", ACCOUNTS: "self", RECRUITER: "self", SUPPORT: "self" },
    response: c.okSchema,
    emptyBodyStatus: 404,
    // An id no invoice holds, "not found" to every role (the pass invoice's way); the page sweep reads the fixture's
    // invoice as the ZZ expert it is addressed to, and as somebody else.
    sample: "/api/v1/account/gig-invoices/zz-sweep-no-such-gig-invoice/pdf",
  },
  {
    method: "GET",
    path: "/api/v1/operator/gigs/invoices/{invoiceId}/pdf",
    summary: "Any commission tax invoice the company has issued, as a PDF (application/pdf) in the language it was issued in; an id no invoice holds is not found",
    access: "operator",
    response: c.okSchema,
    sample: (f) => (f.gigInvoiceId ? `/api/v1/operator/gigs/invoices/${f.gigInvoiceId}/pdf` : null),
  },
);
// end decision-189
// decision-122 (TA-122, the owner's option 1 of 14 November 2026): the family may dispute a seat the provider marked,
// from its end until the hold runs out, and the operator decides. Two operator doors pushed and two summaries amended
// here rather than edited in place (the shared-file fence).
GIGS.push(
  { method: "GET", path: "/api/v1/operator/gigs/disputes", summary: "Every seat a family says was not held after its provider marked it held or the pupil absent, oldest first: the session, the provider, the school, the mark, when it was disputed and any money held; never the pupil's name", access: "operator", response: c.gigDisputesSchema, sample: "/api/v1/operator/gigs/disputes" },
  {
    method: "POST",
    path: "/api/v1/operator/gigs/disputes/{bookingId}/decide",
    summary: "Decide a family's dispute of a marked seat: REFUND, not held (the seat is not held, off the pupil's allowance and the provider's free duty, a paid seat refunded in full), or RELEASE, the provider's mark stands and the pay-out goes at the next hourly run; both sides are told, and a dispute already decided is not found",
    access: "operator",
    request: c.gigDisputeDecideBodySchema,
    response: c.gigDisputeDecidedSchema,
    emptyBodyStatus: 422,
    // The sweep's empty body is refused before anything is read; the fixture's not-held seat is no dispute.
    sample: (f) => (f.gigUnheldBookingId ? `/api/v1/operator/gigs/disputes/${f.gigUnheldBookingId}/decide` : null),
  },
);
{
  const say = (method: Endpoint["method"], path: string, summary: string) => {
    const e = GIGS.find((x) => x.method === method && x.path === path);
    if (!e) throw new Error(`api-catalog/gigs.ts (decision-122): no ${method} ${path} to amend`);
    e.summary = summary;
  };
  say("POST", "/api/v1/gigs/sessions/{bookingId}/unheld", "After it should have ended, the family says the provider did not hold it: a confirmed seat stops counting against the pupil at once (status UNHELD); a seat the provider marked held or the pupil absent may be disputed until the hold runs out, once, and waits for the operator (status DISPUTED, any pay-out held)");
  say("POST", "/api/v1/operator/gigs/payments/{paymentId}/retry", "Try the waiting gateway call now, instead of at the job's next run: a refund, a release of the hold, or a failed transfer made again on hold (a captured row never held is held); a seat its family disputes is left alone until the operator decides it, except a waiting refund");
}
// end decision-122
