import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * The rest of the web-only writes a phone user needs (A3-inventory-7, R-3,
 * R-50; risks batch of 5 October 2026), after the ten of OFFICE_YEAR: reopen a
 * closed year, pin a post, close a review round, a class's teachers and who
 * marks its register, cancel a register cover, invite one parent or one
 * expert, take a paper off a date sheet, lay out the suggested school day.
 * Each door calls the library the web's server action calls, with the
 * action's roles, checked before the body. (The content team's bank-question
 * delete is in contest.ts beside the bank's other doors; a single teacher's
 * invitation is POST /admin/people/invites with a list of one, and a class is
 * made by POST /admin/classes, which already calls createClassIn.)
 *
 * Kept web-only on purpose (R-50, the owner's recommended option): merging two
 * accounts and deleting a school are irreversible acts across accounts or
 * tenants that need the web's confirmation screens; the operator's school
 * removal and moderation inside a school are the operator console's, not a
 * school phone's; a pupil's first-sign-in code is printed on paper at the
 * office.
 *
 * THE SWEEP CHANGES NOTHING HERE, as in office-year.ts. Every valid body is the
 * act (a teacher put on a class, a parent mailed, a year reopened), so no door
 * carries a sampleBody: the body-taking ones are proved by their empty body's
 * 422 (with a `probe` body for the cross-school probes), the body-less ones
 * by an id no school holds (404), and the suggested day by the fixture
 * school's own periods (422: it already has a day). The suite
 * (tests/api-v1-office-writes.test.ts) takes each happy path at a ZZ school.
 */
const NONE = (what: string) => `zz-sweep-no-such-${what}`;

export const OFFICE_WRITES: Endpoint[] = [
  // ---- the academic year (admin/calendar/actions.ts reopenYear) -------------
  { method: "POST", path: "/api/v1/admin/calendar/years/{yearId}/reopen", summary: "Reopen the latest closed year: it runs again and the exam series its close archived come back; an earlier closed year is refused", access: ["ADMIN", "PRINCIPAL"], response: c.academicYearReopenedSchema, emptyBodyStatus: 404, sample: `/api/v1/admin/calendar/years/${NONE("year")}/reopen` },
  // ---- the feed (bulletin/actions.ts pin) -----------------------------------
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/pin", summary: "Pin an approved post to the top of the school's feed ({ pinned: true }) or unpin it ({ pinned: false }); the state already asked for is a no-op; answers the post's state after the call", access: ["ADMIN"], request: c.postPinBodySchema, response: c.postPinnedSchema, emptyBodyStatus: 422, sample: `/api/v1/shared/bulletin/${NONE("post")}/pin`, probe: { body: () => ({ pinned: true }) } },
  // ---- review rounds (admin/reviews/actions.ts closeRound) ------------------
  { method: "POST", path: "/api/v1/admin/reviews/{roundId}/close", summary: "Close an open review round before its date; a round already closed is a no-op", access: ["ADMIN", "PRINCIPAL"], duties: ["HEAD_PAGES"], response: c.okSchema, emptyBodyStatus: 404, sample: `/api/v1/admin/reviews/${NONE("round")}/close` },
  // ---- a class's teachers and its register (admin/classes/[classId]/actions.ts) ----
  { method: "POST", path: "/api/v1/admin/classes/{classId}/teachers", summary: "Put a teacher on a class as its lead, a co-teacher or a subject teacher, or change which; a lead marks the register unless told otherwise, a co-teacher does not, a subject teacher never", access: ["ADMIN"], request: c.classTeacherAddBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/teachers` : null), probe: { body: (f) => (f.teacherMembershipId ? { teacherMembershipId: f.teacherMembershipId, role: "CO" } : null) } },
  { method: "POST", path: "/api/v1/admin/classes/{classId}/teachers/remove", summary: "Take one teacher off a class; the stand-in guardianships of its unclaimed pupils pass to whoever remains", access: ["ADMIN"], request: c.classTeacherRemoveBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/teachers/remove` : null), probe: { body: (f) => (f.teacherMembershipId ? { teacherMembershipId: f.teacherMembershipId } : null) } },
  { method: "POST", path: "/api/v1/admin/classes/{classId}/teachers/register", summary: "Give a teacher on the class the right to mark its register, or take it away", access: ["ADMIN"], request: c.attendanceRightBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/teachers/register` : null), probe: { body: (f) => (f.teacherMembershipId ? { teacherMembershipId: f.teacherMembershipId, canTake: true } : null) } },
  { method: "DELETE", path: "/api/v1/admin/classes/covers/{coverId}", summary: "Cancel a register cover; the colleague who was to mark the register is told", access: ["ADMIN", "PRINCIPAL"], response: c.okSchema, emptyBodyStatus: 404, sample: `/api/v1/admin/classes/covers/${NONE("cover")}` },
  // ---- one invitation (admin/people/actions.ts, experts/actions.ts) ---------
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/parents", summary: "Invite one parent or guardian to a pupil by email; a parent already linked or already invited is refused", access: ["ADMIN"], request: c.parentInviteBodySchema, response: c.parentInvitedSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/parents` : null), probe: { body: () => ({ email: "zz-sweep-probe-parent@test.invalid", relation: "PARENT" }) } },
  { method: "POST", path: "/api/v1/staff/experts/invite", feature: "EXPERT_SESSIONS", summary: "Invite an outside expert by email address; the invitation link is mailed to that address only, and the answer is the invitation id and whether the mail went (never the link)", access: ["ADMIN", "TEACHER"], request: c.expertInviteBodySchema, response: c.expertInvitedSchema, emptyBodyStatus: 422 },
  // ---- the date sheet and the school day (admin/exams, admin/timetable) -----
  { method: "DELETE", path: "/api/v1/admin/exams/slots/{slotId}", summary: "Take a paper off a date sheet; one with marks saved is refused with the count", access: ["ADMIN"], response: c.okSchema, emptyBodyStatus: 404, sample: `/api/v1/admin/exams/slots/${NONE("paper")}` },
  { method: "POST", path: "/api/v1/admin/timetable/periods/suggested", summary: "Lay out the suggested first school day for a school with no periods; refused once any period exists", access: ["ADMIN"], response: c.suggestedDayAppliedSchema, emptyBodyStatus: 422 },
];
