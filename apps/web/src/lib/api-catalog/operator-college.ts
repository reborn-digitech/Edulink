import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * operator-college: the operator's college console (4 October 2026) — the
 * colleges with their health, the regulators' calendar across them, the
 * modules switched for an institution on its behalf, and the recruiter
 * accounts shut out of every college at once. Access "operator", like the
 * rest of /root: every sweep role expects 403 and signed out is 401; the
 * suite (tests/operator-college.test.ts) proves the 2xx with a ZZ operator.
 * The writes' samples name rows where the act would change nothing (the
 * sweep's empty body is refused first) — a recruiter id that names nobody.
 */
export const OPERATOR_COLLEGE: Endpoint[] = [
  { method: "GET", path: "/api/v1/operator/colleges", summary: "Every college with its kind, affiliating university, regulators, programmes and intake, students enrolled, modules, subscription and tier, and its health — lectures marked this week, exam forms open, results published this term, the NAAC predictor's grade, the placement season, scholarships pending and grievances past due — read from each college's rows (each read noted in its log); ?test=1 adds the ZZ fixtures", access: "operator", request: c.operatorCollegesQuerySchema, response: c.operatorCollegesSchema },
  { method: "GET", path: "/api/v1/operator/colleges/calendar", summary: "The regulators' calendar for the next 120 days across the colleges: each window (AQAR, AISHE, NIRF, the AICTE extension, the affiliation return, the university's exam seasons, the CET Cell's rounds) with the colleges it applies to; ?test=1 adds the ZZ fixtures", access: "operator", request: c.operatorCollegesQuerySchema, response: c.operatorCollegeCalendarSchema },
  { method: "GET", path: "/api/v1/operator/schools/{schoolId}/modules", summary: "The modules an institution is offered, on or off, since when, and whether the platform switched it on", access: "operator", response: c.operatorSchoolModulesSchema, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/modules` },
  { method: "POST", path: "/api/v1/operator/schools/{schoolId}/modules", summary: "Switch one module on or off on the institution's behalf, through the admin's own path and refusals; audited in the school's log and the operator's, the school's admins told", access: "operator", request: c.operatorModuleSwitchBodySchema, response: c.operatorSchoolModulesSchema, emptyBodyStatus: 422, sample: (f) => `/api/v1/operator/schools/${f.schoolId}/modules` },
  { method: "GET", path: "/api/v1/operator/recruiters", summary: "Every recruiter account, disabled first, with its company and live sessions", access: "operator", response: c.operatorRecruitersSchema },
  { method: "POST", path: "/api/v1/operator/companies/invite-recruiter", summary: "Invite a company's first recruiter: the company by its GSTIN or CIN, with no accepted recruiter, and the address of a recruiter account, bound once they accept (TA-090); the same answer for any address; audited", access: "operator", request: c.operatorCompanyRecruiterInviteBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/operator/recruiters/{userId}/standing", summary: "Disable a recruiter across every college — every recruiter door refuses them and every session ends — or enable them again; audited with the reason", access: "operator", request: c.operatorRecruiterStandingBodySchema, response: c.operatorRecruiterStandingSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/recruiters/zz-sweep-no-such-recruiter/standing" },
];
