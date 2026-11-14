import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * college (the foundation of 4 October 2026): the doors every college module
 * builds on — an adult student's grants to their guardians, a recruiter's own
 * account, a college's regulator references, and the global feed's kind
 * filter. The college modules' own doors (academics, exams, IQAC, placement,
 * admissions, scholarships) go in files of their own, each entry with its
 * `module:` so a college that has it off answers MODULE_OFF.
 *
 * No sampleBody on a door whose valid body is an act the sweep should not
 * repeat as every role: a recruiter's account, a student's grant. The feed's
 * kind filter is idempotent at the fixture's own value, so it carries one.
 */
const NONE = (what: string) => `zz-sweep-no-such-${what}`;

export const COLLEGE: Endpoint[] = [
  { method: "GET", path: "/api/v1/student/consent", summary: "What this student lets each of their guardians see, guardian by guardian and grant by grant, with the claims waiting on the student's own yes; `applies` is false for a minor or a pupil at a school, whose guardians see everything", access: ["STUDENT"], response: c.studentConsentSchema },
  { method: "POST", path: "/api/v1/student/consent", summary: "Grant or revoke one thing a guardian may see, to the guardian named (guardianshipId, 404 when not the student's own) or, with none named, to every family guardian linked now, never to one linked later (an adult at a college alone; idempotent; audited)", access: ["STUDENT"], request: c.studentConsentSetSchema, response: c.studentConsentSchema, emptyBodyStatus: 422 },
  // TA-555 (the owner's decision of 14 November 2026): an adult at a college decides who their guardian is. Sampled on ids no row holds, which answer 404 to every student.
  { method: "POST", path: "/api/v1/student/guardian-claims/{claimId}/decide", summary: "An adult student at a college accepts or declines somebody asking to be their guardian, with an optional sentence for them on a decline: the student's alone (the office and a guardian cannot), the accepted guardian sees nothing until the student shares it, the office told; a claim that is not this student's own to decide is 404 (audited)", access: ["STUDENT"], request: c.joinDecisionBodySchema, response: c.studentConsentSchema, emptyBodyStatus: 422, sample: `/api/v1/student/guardian-claims/${NONE("claim")}/decide`, probe: { body: () => ({ decision: "DECLINE" }) } },
  { method: "POST", path: "/api/v1/student/guardians/{guardianshipId}/end", summary: "An adult student at a college ends one of their own family guardians' links: the link's grants are revoked with it, the guardian and the office are told, the school stands in when no family guardian is left; a link that is not the student's own is 404, a minor or a school pupil is refused 403, a link already ended changes nothing (no body; audited)", access: ["STUDENT"], response: c.studentConsentSchema, emptyBodyStatus: 404, sample: `/api/v1/student/guardians/${NONE("guardianship")}/end` },
  { method: "POST", path: "/api/v1/auth/recruiter/register", summary: "A recruiter's own account (never invited): a form in order is 202 {sent: true} and no session, the same whether or not the address already has an account; the account and the company are made after the response with a confirmation link mailed (the holder of a taken address is told by email instead), and the recruiter signs in with the password; 422 with the field for the form, 429 at the sign-up limit", access: "anyone", request: c.recruiterRegisterSchema, response: c.signupSentSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/recruiter/me", summary: "The recruiter's own account: name, company, whether the address is confirmed", access: ["RECRUITER"], response: c.recruiterMeSchema },
  { method: "GET", path: "/api/v1/admin/college-profile", summary: "A college's regulator references: affiliating university, AISHE code, AICTE and UGC approvals, NAAC grade and expiry, NIRF category (empty at a school)", access: ["ADMIN", "PRINCIPAL"], response: c.collegeProfileSchema },
  { method: "POST", path: "/api/v1/admin/college-profile", summary: "The office writes the references; a key left out stays, null clears; refused at a school (audited)", access: ["ADMIN"], request: c.collegeProfileSetSchema, response: c.collegeProfileSchema },
  { method: "GET", path: "/api/v1/admin/feed-kinds", summary: "Whose global posts this institution's people read: SCHOOLS, COLLEGES or BOTH", access: ["ADMIN", "PRINCIPAL"], response: c.globalFeedKindsSchema },
  { method: "POST", path: "/api/v1/admin/feed-kinds", summary: "Choose schools, colleges or both for the global feed (the admin's; idempotent; audited)", access: ["ADMIN"], request: c.globalFeedKindsSchema, response: c.globalFeedKindsSchema, emptyBodyStatus: 422, sampleBody: () => ({ choice: "BOTH" }) },
  // The head's college for the phone (campaign 2026-10-04, G-4): the web's /principal/college cut to a card; ACADEMICS stands for "is a college", as on the web's nav.
  { method: "GET", path: "/api/v1/principal/college", summary: "The college at a glance (faculty present, fees, scholarships, hostel, grievances, incidents, the predictor, today's lectures by department) and the approvals waiting with the page each is decided on; at a school the module gate answers 403 MODULE_OFF", access: ["PRINCIPAL", "ADMIN"], module: "ACADEMICS", response: c.principalCollegeSchema },
];
