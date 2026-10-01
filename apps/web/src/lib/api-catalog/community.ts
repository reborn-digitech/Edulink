import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * community: endpoints added for the phone's remaining screens (September
 * 2026) — the flows it used to hand to the web. Each is thin over the same
 * src/lib function the web's server action or page calls: mentoring
 * (lib/mentoring.ts), enquiries (lib/enquiries.ts), the school profile
 * (lib/school-profile.ts), one vacancy (lib/vacancies.ts), and linking a
 * child (lib/claim-child.ts, moved out of app/join/actions.ts so both doors
 * share its rate limits). Asking a school about admission or a vacancy is
 * the existing POST /api/v1/shared/enquiries.
 *
 * Writes carry no sampleBody: pairing, asking, deciding, agreeing and closing
 * are one-way doors, so the sweep proves the reads and the 422s and the suite
 * (tests/api-v1-community.test.ts) proves the rest with rows of its own. The
 * thread and enquiry doors are sampled with rows in a state where the call
 * changes nothing (scripts/sweep-doors.ts): deciding is the empty body's 422;
 * agreeing names a mentorship already agreed to (a no-op, 200); closing an
 * enquiry names one already closed (422). Ending a mentorship stays skipped,
 * for the reason on its entry.
 */
const EVERY_ROLE: c.RoleCode[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT"];

export const COMMUNITY: Endpoint[] = [
  // ---- /mentoring: set-up, asking, pairing, deciding, agreeing, ending -----
  { method: "GET", path: "/api/v1/community/mentoring/options", summary: "What mentoring set-up offers me: pairing lists (staff), the mentors I may ask (a pupil)", access: "signed-in", response: c.communityMentoringOptionsSchema },
  { method: "POST", path: "/api/v1/community/mentoring/pair", summary: "Pair a pupil with a published expert; the guardians are asked next", access: ["ADMIN", "TEACHER"], request: c.communityMentorPairSchema, response: c.communityMentorThreadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/community/mentoring/ask", summary: "A pupil asks their school for a mentor", access: ["STUDENT"], request: c.communityMentorAskSchema, response: c.communityMentorThreadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/community/mentoring/{threadId}/decide", summary: "The office agrees to a pupil's request (asking the family) or declines with a reason", access: ["ADMIN", "PRINCIPAL"], request: c.communityMentorDecideSchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.mentorThreadId ? `/api/v1/community/mentoring/${f.mentorThreadId}/decide` : null) },
  { method: "POST", path: "/api/v1/community/mentoring/{threadId}/consent", summary: "A guardian agrees to the mentoring going ahead", access: ["PARENT"], response: c.okSchema, sample: (f) => (f.mentorThreadId ? `/api/v1/community/mentoring/${f.mentorThreadId}/consent` : null) },
  // LEFT SKIPPED ON PURPOSE. Only a mentorship already ended makes the call harmless (a no-op), and an ended
  // one is a 404 to its own expert by policy (the expert's reach ends with the engagement: EXPERT_READABLE in
  // scripts/gen-rls.ts), where the sweep expects 403 from a role outside `access`; a live one would be ended.
  // tests/api-v1-community.test.ts proves the door.
  { method: "POST", path: "/api/v1/community/mentoring/{threadId}/close", summary: "The school or a guardian ends a mentorship", access: ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT"], response: c.okSchema, sample: () => null },
  // ---- /enquiries -----------------------------------------------------------
  // Closing is a one-way door, so the sample is the fixture's enquiry already closed, about the vacancy whose hiring contact is the sweep's teacher: the school's side is refused as closed (422), and the suite covers the close.
  { method: "POST", path: "/api/v1/community/enquiries/{enquiryId}/close", summary: "The school's side closes an enquiry; nobody can reply after", access: ["ADMIN", "PRINCIPAL", "TEACHER"], response: c.okSchema, sample: (f) => (f.closedEnquiryId ? `/api/v1/community/enquiries/${f.closedEnquiryId}/close` : null) },
  // ---- /explore/[schoolId], /vacancies/[postingId] --------------------------
  {
    method: "GET",
    path: "/api/v1/community/schools/{schoolId}",
    summary: "One school's public profile, and (for a guardian) the admissions door",
    access: EVERY_ROLE,
    response: c.communitySchoolProfileSchema,
    // Northgate answers 200 once published or hiring, 404 otherwise; the sweep accepts both for a GET.
    sample: (f) => `/api/v1/community/schools/${f.schoolId}`,
  },
  {
    method: "GET",
    path: "/api/v1/community/vacancies/{postingId}",
    summary: "One vacancy: the post, the school, and the door to the hiring team or the enquiries it drew",
    access: ["TEACHER", "ADMIN", "PRINCIPAL"],
    response: c.communityVacancySchema,
    sample: (f) => (f.vacancyId ? `/api/v1/community/vacancies/${f.vacancyId}` : null),
  },
  // ---- /parent/link -----------------------------------------------------------
  { method: "GET", path: "/api/v1/community/link-child", summary: "The children this account is already linked to, and its claims still waiting or declined", access: "signed-in", response: c.communityLinkChildPageSchema },
  { method: "POST", path: "/api/v1/community/link-child", summary: "Ask to be linked to a child by student code and date of birth (rate-limited per caller and per code); the claim waits for the office or a guardian the child already has", access: "signed-in", request: c.communityLinkChildSchema, response: c.communityChildLinkedSchema, emptyBodyStatus: 422 },
];
