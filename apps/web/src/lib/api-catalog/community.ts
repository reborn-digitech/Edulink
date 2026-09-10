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
 * Writes carry no sampleBody and the thread/enquiry ones no sample: pairing,
 * asking, deciding, agreeing and closing are one-way doors on the ZZ fixture,
 * so the sweep proves the reads and the 422s and the suite
 * (tests/api-v1-community.test.ts) proves the rest with rows of its own.
 */
const EVERY_ROLE: c.RoleCode[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT"];

export const COMMUNITY: Endpoint[] = [
  // ---- /mentoring: set-up, asking, pairing, deciding, agreeing, ending -----
  { method: "GET", path: "/api/v1/community/mentoring/options", summary: "What mentoring set-up offers me: pairing lists (staff), the mentors I may ask (a pupil)", access: "signed-in", response: c.communityMentoringOptionsSchema },
  { method: "POST", path: "/api/v1/community/mentoring/pair", summary: "Pair a pupil with a published expert; the guardians are asked next", access: ["ADMIN", "TEACHER"], request: c.communityMentorPairSchema, response: c.communityMentorThreadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/community/mentoring/ask", summary: "A pupil asks their school for a mentor", access: ["STUDENT"], request: c.communityMentorAskSchema, response: c.communityMentorThreadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/community/mentoring/{threadId}/decide", summary: "The office agrees to a pupil's request (asking the family) or declines with a reason", access: ["ADMIN", "PRINCIPAL"], request: c.communityMentorDecideSchema, response: c.okSchema, emptyBodyStatus: 422, sample: () => null },
  { method: "POST", path: "/api/v1/community/mentoring/{threadId}/consent", summary: "A guardian agrees to the mentoring going ahead", access: ["PARENT"], response: c.okSchema, sample: () => null },
  { method: "POST", path: "/api/v1/community/mentoring/{threadId}/close", summary: "The school or a guardian ends a mentorship", access: ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT"], response: c.okSchema, sample: () => null },
  // ---- /enquiries -----------------------------------------------------------
  // Closing the fixture's enquiry is a one-way door; the suite covers it.
  { method: "POST", path: "/api/v1/community/enquiries/{enquiryId}/close", summary: "The school's side closes an enquiry; nobody can reply after", access: ["ADMIN", "PRINCIPAL", "TEACHER"], response: c.okSchema },
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
  { method: "GET", path: "/api/v1/community/link-child", summary: "The children this account is already linked to", access: "signed-in", response: c.communityLinkChildPageSchema },
  { method: "POST", path: "/api/v1/community/link-child", summary: "Link to a child by student code and date of birth (rate-limited per caller and per code)", access: "signed-in", request: c.communityLinkChildSchema, response: c.communityChildLinkedSchema, emptyBodyStatus: 422 },
];
