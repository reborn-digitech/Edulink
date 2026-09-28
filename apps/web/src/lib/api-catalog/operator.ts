import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * operator: the server operator's pages (/root) and the content team's
 * (/appadmin), for the phone. Neither person has a school role — the access
 * values "operator" and "app-admin" are the flags on User, read by
 * requireApiOperator / requireApiAppAdmin — so the sweep's role tokens all
 * expect 403 here, and the suites (tests/api-v1-operator.test.ts for the
 * reads, tests/api-v1-operator-writes.test.ts for the writes) prove the 2xx
 * with a ZZ operator of their own. The writes carry no sample or sampleBody:
 * the sweep holds no operator token, and a sampled path would aim a removal
 * at ZZ Northgate. Erasing a school entirely stays on the web on purpose.
 */
export const OPERATOR: Endpoint[] = [
  // ---- /root -----------------------------------------------------------------
  { method: "GET", path: "/api/v1/operator/overview", summary: "The server: its schools (narrowed by q and state), the counts, and the scheduled jobs' health", access: "operator", request: c.operatorOverviewQuerySchema, response: c.operatorOverviewSchema },
  { method: "GET", path: "/api/v1/operator/audit", summary: "The server log: everything done from outside any school, newest first — filtered by action, search, date range and live accounts, a page at a time", access: "operator", request: c.operatorAuditQuerySchema, response: c.operatorAuditSchema },
  { method: "GET", path: "/api/v1/operator/experts", summary: "The expert curation queue, unpublished first", access: "operator", response: c.operatorExpertsSchema },
  { method: "POST", path: "/api/v1/operator/experts/{profileId}/standing", summary: "List an expert, take one off the list, or mark their identity checked (published and verified together)", access: "operator", request: c.operatorExpertStandingBodySchema, response: c.okSchema },
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
  { method: "PATCH", path: "/api/v1/operator/schools/{schoolId}", summary: "Correct a school's details; only the fields sent change", access: "operator", request: c.operatorSchoolUpdateBodySchema, response: c.okSchema },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/remove", summary: "Remove a school from the server behind its exact name, typed; it can be restored", access: "operator", request: c.operatorSchoolRemoveBodySchema, response: c.okSchema },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/restore", summary: "Put a removed school back: exactly what removal ended", access: "operator", response: c.okSchema },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/verification", summary: "Mark a school checked, or withdraw the mark; a checked school may bring over a pupil who already has an account", access: "operator", request: c.operatorSchoolVerificationBodySchema, response: c.okSchema },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/invites", summary: "Invite an administrator or principal by email", access: "operator", request: c.operatorInviteAdminBodySchema, response: c.okSchema },
  { method: "POST", path: "/api/v1/operator/invites/{inviteId}/revoke", summary: "Withdraw a pending admin invitation", access: "operator", response: c.okSchema },
  { method: "GET", path: "/api/v1/operator/retention", summary: "The retention sweep: the day counts in force and how many rows of each kind are waiting for tonight", access: "operator", response: c.operatorRetentionSchema },
  { method: "GET", path: "/api/v1/operator/content-team", summary: "Everybody holding the content-team flag", access: "operator", response: c.operatorContentTeamSchema },
  { method: "POST", path: "/api/v1/operator/content-team", summary: "Appoint the account behind an email to the content team", access: "operator", request: c.operatorAppointBodySchema, response: c.okSchema },
  { method: "DELETE", path: "/api/v1/operator/content-team/{userId}", summary: "Take the content-team flag off an account; the account stays", access: "operator", response: c.okSchema },
  // ---- /appadmin -------------------------------------------------------------
  { method: "GET", path: "/api/v1/appadmin/competitions", summary: "The platform competitions, posted for every school at once", access: "app-admin", response: c.appAdminCompetitionsSchema },
];
