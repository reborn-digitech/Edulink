import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * operator: the server operator's pages (/root) and the content team's
 * (/appadmin), for the phone. Neither person has a school role — the access
 * values "operator" and "app-admin" are the flags on User, read by
 * requireApiOperator / requireApiAppAdmin — so the sweep's role tokens all
 * expect 403 here, and the suites (tests/api-v1-operator.test.ts for the
 * reads, tests/api-v1-operator-writes.test.ts for the writes) prove the 2xx
 * with a ZZ operator of their own. The writes carry a sample and no
 * sampleBody: the sweep holds no operator token, so every role it sends is
 * refused (403) before the id is read, and signed out is a 401 — the fence is
 * what the sweep proves here. Each sample is chosen so that a fence that
 * failed would still change nothing: the sweep's body is empty, which every
 * body-taking write refuses, and the doors with no body name a row where the
 * act is a refusal or a no-op (ZZ Northgate, which is not removed, for the
 * restore; an invitation already revoked; a ZZ account that is not on the
 * content team; a plan id that names no plan, there being none to spare).
 * Erasing a school entirely stays on the web on purpose.
 */
export const OPERATOR: Endpoint[] = [
  // ---- /root -----------------------------------------------------------------
  { method: "GET", path: "/api/v1/operator/overview", summary: "The server: its schools (narrowed by q and state), the counts, and the scheduled jobs' health", access: "operator", request: c.operatorOverviewQuerySchema, response: c.operatorOverviewSchema },
  { method: "GET", path: "/api/v1/operator/audit", summary: "The server log: everything done from outside any school, newest first — filtered by action, search, date range and live accounts, a page at a time", access: "operator", request: c.operatorAuditQuerySchema, response: c.operatorAuditSchema },
  { method: "GET", path: "/api/v1/operator/experts", summary: "The expert curation queue, unpublished first", access: "operator", response: c.operatorExpertsSchema },
  { method: "POST", path: "/api/v1/operator/experts/{profileId}/standing", summary: "List an expert, take one off the list, or mark their identity checked (published and verified together)", access: "operator", request: c.operatorExpertStandingBodySchema, response: c.okSchema, sample: (f) => (f.expertProfileId ? `/api/v1/operator/experts/${f.expertProfileId}/standing` : null) },
  { method: "POST", path: "/api/v1/operator/experts/{profileId}/kyc", summary: "Answer an expert's identity papers: verified (the marketplace badge) or rejected with a reason; the expert is told", access: "operator", request: c.operatorExpertKycBodySchema, response: c.okSchema, sample: (f) => (f.expertProfileId ? `/api/v1/operator/experts/${f.expertProfileId}/kyc` : null) },
  { method: "POST", path: "/api/v1/operator/schools", summary: "Add a school; 201 with its id and join code", access: "operator", request: c.operatorSchoolDetailsBodySchema, response: c.operatorSchoolCreatedSchema },
  {
    method: "GET",
    path: "/api/v1/operator/schools/{schoolId}",
    summary: "One school: its details, its admin invitations, and every time the operator opened it",
    access: "operator",
    response: c.operatorSchoolDetailSchema,
    // A read: every sweep role expects 403, and nothing changes if one did not.
    sample: (f) => `/api/v1/operator/schools/${f.schoolId}`,
  },
  { method: "PATCH", path: "/api/v1/operator/schools/{schoolId}", summary: "Correct a school's details; only the fields sent change", access: "operator", request: c.operatorSchoolUpdateBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/remove", summary: "Remove a school from the server behind its exact name, typed; it can be restored", access: "operator", request: c.operatorSchoolRemoveBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/remove` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/restore", summary: "Put a removed school back: exactly what removal ended", access: "operator", response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/restore` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/verification", summary: "Mark a school checked, or withdraw the mark; a checked school may bring over a pupil who already has an account", access: "operator", request: c.operatorSchoolVerificationBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/verification` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/invites", summary: "Invite an administrator or principal by email", access: "operator", request: c.operatorInviteAdminBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/invites` },
  { method: "POST", path: "/api/v1/operator/invites/{inviteId}/revoke", summary: "Withdraw a pending admin invitation", access: "operator", response: c.okSchema, sample: (f) => (f.revokedInviteId ? `/api/v1/operator/invites/${f.revokedInviteId}/revoke` : null) },
  { method: "GET", path: "/api/v1/operator/retention", summary: "The retention sweep: the day counts in force and how many rows of each kind are waiting for tonight", access: "operator", response: c.operatorRetentionSchema },
  { method: "GET", path: "/api/v1/operator/content-team", summary: "Everybody holding the content-team flag", access: "operator", response: c.operatorContentTeamSchema },
  { method: "POST", path: "/api/v1/operator/content-team", summary: "Appoint the account behind an email to the content team", access: "operator", request: c.operatorAppointBodySchema, response: c.okSchema },
  { method: "DELETE", path: "/api/v1/operator/content-team/{userId}", summary: "Take the content-team flag off an account; the account stays", access: "operator", response: c.okSchema, sample: (f) => (f.notContentTeamUserId ? `/api/v1/operator/content-team/${f.notContentTeamUserId}` : null) },
  // ---- /appadmin -------------------------------------------------------------
  { method: "GET", path: "/api/v1/appadmin/competitions", summary: "The platform competitions, posted for every school at once", access: "app-admin", response: c.appAdminCompetitionsSchema },
  // ---- /root/plans, usage, support and metrics (2026-10-01) --------------------
  // A sample and no sampleBody on the writes, as above: every sweep role is refused before the id is read; tests/plans.test.ts, tests/support-tools.test.ts and tests/metrics.test.ts prove the 2xx.
  { method: "GET", path: "/api/v1/operator/plans", summary: "Every plan the operator offers, with how many live schools are on each", access: "operator", response: c.operatorPlansSchema },
  { method: "POST", path: "/api/v1/operator/plans", summary: "Add a plan: a code, a name, caps on pupils, texts and storage, and a recorded monthly price; 201 with its id", access: "operator", request: c.operatorPlanBodySchema, response: c.operatorPlanCreatedSchema },
  { method: "PATCH", path: "/api/v1/operator/plans/{planId}", summary: "Correct a plan; only the fields sent change, a null cap is no cap", access: "operator", request: c.operatorPlanUpdateBodySchema, response: c.okSchema, sample: "/api/v1/operator/plans/zz-sweep-no-such-plan" },
  { method: "DELETE", path: "/api/v1/operator/plans/{planId}", summary: "Remove a plan no school is on", access: "operator", response: c.okSchema, sample: "/api/v1/operator/plans/zz-sweep-no-such-plan" },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/plan", summary: "Put a school on a plan, or take it off every plan; audited, and the school's office is told", access: "operator", request: c.operatorAssignPlanBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/plan` },
  { method: "GET", path: "/api/v1/operator/usage", summary: "Every live school's month (?month=YYYY-MM, this month by default) against its plan's caps, over-cap first, from the nightly usage:sample rows", access: "operator", request: c.operatorUsageQuerySchema, response: c.operatorUsageSchema },
  { method: "GET", path: "/api/v1/operator/schools/{schoolId}/support", summary: "A school's active admins and head with their live sessions, its plan, and this month's usage against it", access: "operator", response: c.operatorSchoolSupportSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/support` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/support/resend-invite", summary: "Send one of the school's pending admin invitations again with a fresh link; audited, the office told", access: "operator", request: c.operatorResendInviteBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/support/resend-invite` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/support/sign-in-link", summary: "Email one of the school's admins a one-time sign-in link — no password is set or seen; audited, the office told", access: "operator", request: c.operatorSupportUserBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/support/sign-in-link` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/support/sign-out", summary: "Sign one of the school's admins out of every device: sessions, unspent tokens, push registrations; audited, the office told", access: "operator", request: c.operatorSupportUserBodySchema, response: c.operatorSignOutEverywhereSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/support/sign-out` },
  { method: "GET", path: "/api/v1/operator/metrics", summary: "This process's counters: requests by route group and status, p50/p95 latency, errors by kind, outbox replays, overdue jobs, whether an error tracker is set", access: "operator", response: c.operatorMetricsSchema },
  // ---- /root's dashboard, subscriptions, partners and onboarding (2026-10-02) --
  // Writes carry a sample and no sampleBody, as above: every sweep role is refused before a body is read; tests/subscriptions.test.ts proves the 2xx. The partner PATCH names no partner, there being none to spare; the onboard door takes a body the sweep never sends.
  { method: "GET", path: "/api/v1/operator/dashboard", summary: "The operator's dashboard: schools live, on trial, due within thirty days, past due and suspended; pupils, this month's texts and storage against the caps, overdue jobs, what each partner is owed (recorded only); every school with its plan, subscription, partner, contact and last activity, narrowed by q, state, plan and partner; and the schools due within a week", access: "operator", request: c.operatorDashboardQuerySchema, response: c.operatorDashboardSchema },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/subscription", summary: "Change a school's subscription record with a reason: its status (a move the coded list allows), start and due dates, invoice sent and paid dates with references, and its commission partner — recorded, never collected; audited twice", access: "operator", request: c.operatorSubscriptionBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/subscription` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/contact", summary: "The school's point of contact for the operator: name, role, phone, email; only the fields sent change; audited", access: "operator", request: c.operatorContactBodySchema, response: c.okSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/contact` },
  { method: "GET", path: "/api/v1/operator/partners", summary: "Every commission partner with their live schools and what each is owed this month: their share of the plan's recorded price over the schools whose subscription is active, computed on read", access: "operator", response: c.operatorPartnersSchema },
  { method: "POST", path: "/api/v1/operator/partners", summary: "Add a commission partner: a name, a share in tenths of a percent, a phone, an email, notes; 201 with the id; audited", access: "operator", request: c.operatorPartnerBodySchema, response: c.operatorPartnerCreatedSchema },
  { method: "PATCH", path: "/api/v1/operator/partners/{partnerId}", summary: "Correct a partner; only the fields sent change; audited", access: "operator", request: c.operatorPartnerUpdateBodySchema, response: c.okSchema, sample: "/api/v1/operator/partners/zz-sweep-no-such-partner" },
  { method: "POST", path: "/api/v1/operator/onboard", summary: "Onboard a school in one call: its details and slug, its plan, a subscription starting today and due a year on (or a thirty-day trial), its point of contact, its commission partner (an existing one or one made inline) and its first administrator's invitation; everything is checked before the first write and the writes are one transaction, so a refused invitation leaves nothing behind and the invitation's mail goes after the commit; 201 with the id, join code and slug", access: "operator", request: c.operatorOnboardBodySchema, response: c.operatorOnboardedSchema },
  // ---- the content team's tooling (2026-10-01) ------------------------------
  { method: "GET", path: "/api/v1/appadmin/translations", summary: "Bank questions whose Hindi or Marathi (?language=) is a draft nobody has read, read, or missing (?status=), a page of thirty", access: "app-admin", request: c.translationsQuerySchema, response: c.translationsSchema },
  { method: "POST", path: "/api/v1/appadmin/translations/{questionId}/review", summary: "Save a corrected Hindi or Marathi text and stamp the language read by a native speaker, or take the stamp off; a content-quality flag, never a gate on practice", access: "app-admin", request: c.translationReviewBodySchema, response: c.translationReviewedSchema, emptyBodyStatus: 422, sample: (f) => (f.bankQuestionId ? `/api/v1/appadmin/translations/${f.bankQuestionId}/review` : null) },
  { method: "POST", path: "/api/v1/appadmin/bank/import", summary: "The bank as a sheet (the export's columns): preview what would be written, or commit it; idempotent by chapter and stem", access: "app-admin", request: c.bankImportBodySchema, response: c.bankImportResultSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/appadmin/bank/export", summary: "The bank, or one subject or class of it, as a CSV or Excel file in the columns the import reads (?subject=&grade=&format=)", access: "app-admin", request: c.bankExportQuerySchema, response: c.okSchema },
  { method: "GET", path: "/api/v1/appadmin/bank/duplicates", summary: "Pairs of questions with the same normalised stem, or a trigram similarity of 0.8 or more where pg_trgm is installed", access: "app-admin", response: c.bankDuplicatesSchema },
  { method: "GET", path: "/api/v1/appadmin/bank/stats", summary: "How one question is doing (?questionId=): times answered, correct rate and mean seconds, whole and by the pupils' grade, from the nightly bank:stats job", access: "app-admin", request: c.bankStatsQuerySchema, response: c.bankStatsSchema },
  { method: "GET", path: "/api/v1/appadmin/moderation", summary: "Every school's global posts newest first with the school named: live, taken down by the platform, or restored (?status=&page=)", access: "app-admin", request: c.moderationQuerySchema, response: c.moderationSchema },
  { method: "GET", path: "/api/v1/appadmin/moderation/{postId}", summary: "One live global post and its approved comments", access: "app-admin", response: c.moderationPostSchema, sample: (f) => (f.globalPostId ? `/api/v1/appadmin/moderation/${f.globalPostId}` : null) },
  { method: "POST", path: "/api/v1/appadmin/moderation/{postId}/takedown", summary: "Take a global post down for every school, with a reason the school and the author are told; audited in the school's log with the platform as actor", access: "app-admin", request: c.takedownBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.globalPostId ? `/api/v1/appadmin/moderation/${f.globalPostId}/takedown` : null) },
  { method: "POST", path: "/api/v1/appadmin/moderation/{postId}/restore", summary: "Put a taken-down global post back as it was", access: "app-admin", response: c.okSchema, sample: (f) => (f.globalPostId ? `/api/v1/appadmin/moderation/${f.globalPostId}/restore` : null) },
];
