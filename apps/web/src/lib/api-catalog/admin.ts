import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * admin: the office's navigation pages, in the nav's order. One GET per page
 * (what it shows), one POST per primary action, each thin over the same lib
 * function or server action the page uses. Access mirrors the page's
 * requireRole exactly; the leave queue, the staff roster, the calendar, the
 * reviews and the vacancies desk are the head's too.
 *
 * Writes that would create rows on every sweep carry no sampleBody, so the
 * sweep proves their 422 and leaves the ZZ fixture as it found it.
 */
export const ADMIN: Endpoint[] = [
  // ---- /admin ---------------------------------------------------------------
  { method: "GET", path: "/api/v1/admin/overview", summary: "The school overview: year, setup checklist, today's counts, staffing gap", access: ["ADMIN"], response: c.adminOverviewSchema },
  // ---- /admin/people, /admin/invites, /admin/intake ------------------------
  { method: "GET", path: "/api/v1/admin/people", summary: "The directory, one page, with role, status, class and search filters", access: ["ADMIN"], request: c.adminPeopleQuerySchema, response: c.adminPeopleSchema },
  { method: "GET", path: "/api/v1/admin/people/invites", summary: "Invitations by status, with per-tab counts", access: ["ADMIN"], request: c.adminInvitesQuerySchema, response: c.adminInvitesSchema },
  { method: "POST", path: "/api/v1/admin/people/invites", summary: "Invite a pasted list, reporting every row's fate", access: ["ADMIN"], request: c.inviteCreateBodySchema, response: c.inviteCreatedSchema, emptyBodyStatus: 422 },
  // Sampled with the fixture's invitation that is already revoked (scripts/sweep-doors.ts): the office's call is refused as not pending (422), so the pending one stays pending.
  { method: "POST", path: "/api/v1/admin/people/invites/{inviteId}/revoke", summary: "Withdraw a pending invitation", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.revokedInviteId ? `/api/v1/admin/people/invites/${f.revokedInviteId}/revoke` : null) },
  // The staff record and a pupil's leaving, for the phone: the rules are the web's own (lib/staff-records.ts, lib/leaving.ts).
  { method: "GET", path: "/api/v1/admin/people/{membershipId}/staff-record", summary: "A member of staff's record as it stands; the head reads, the office edits", access: ["ADMIN", "PRINCIPAL"], response: c.staffRecordViewSchema, sample: (f) => (f.teacherMembershipId ? `/api/v1/admin/people/${f.teacherMembershipId}/staff-record` : null) },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/staff-record", summary: "The office writes the whole staff record, every key present; a null clears a field", access: ["ADMIN"], request: c.staffRecordSaveSchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.teacherMembershipId ? `/api/v1/admin/people/${f.teacherMembershipId}/staff-record` : null), probe: { body: () => ({ staffNumber: null, designation: null, qualification: null, joinedOnKey: null, birthdateKey: null, serviceJoinedOnKey: null, leaveDaysPerYear: null, gender: null, socialCategory: null, academicQualification: null, professionalQualification: null, appointmentType: null, appointedSubject: null }) } },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/leaving", summary: "Record that a pupil has left and issue the leaving certificate, or keep a later last day until it comes", access: ["ADMIN"], request: c.leavingBodySchema, response: c.leavingResultSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/leaving` : null), probe: { body: () => ({ reason: "LEFT" }) } },
  // Neither takes a body, so the call is the act. Sampled with pupil 01, who is on the roll with no last day kept (the sweep's /leaving sends no valid body): undo is refused as not left and cancel as nothing kept (422 each). Were either ever true, the act puts the pupil back as the fixture has them.
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/leaving/undo", summary: "Undo a leaving recorded by mistake: back on the roll, the certificate withdrawn", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/leaving/undo` : null), probe: { path: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/leaving/undo` : null) } },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/leaving/cancel", summary: "Give up a last day kept for later, before it comes", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/leaving/cancel` : null), probe: { path: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/leaving/cancel` : null) } },
  // ---- the directory's row menu, from the phone -----------------------------
  // Each valid body is the act itself (a name corrected, a day set, access paused), so none carries a sampleBody: the sweep asserts the empty-body 422 alone, and the cross probes send a body with another school's id, where a refusal is the right answer.
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/legal-name", summary: "The office corrects a legal name for a coded reason (spelling, the admission record, a legal change); the person and a pupil's guardians are told; papers already issued keep theirs", access: ["ADMIN"], request: c.legalNameBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/legal-name` : null), probe: { body: () => ({ name: "ZZ Probe Name", reason: "SPELLING" }) } },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/birthdate", summary: "The office sets a member's date of birth, or clears it with null; a day in the future or before 1900 is refused", access: ["ADMIN"], request: c.birthdateBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/birthdate` : null), probe: { body: () => ({ dateKey: "2015-06-01" }) } },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/subjects", summary: "A teacher's subjects replaced as a set: trimmed, de-duplicated, at most twenty", access: ["ADMIN"], request: c.subjectsBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.teacherMembershipId ? `/api/v1/admin/people/${f.teacherMembershipId}/subjects` : null), probe: { path: (f) => (f.teacherMembershipId ? `/api/v1/admin/people/${f.teacherMembershipId}/subjects` : null), body: () => ({ subjects: ["ZZ Probe"] }) } },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/pause", summary: "Pause somebody's access to this school with a reason the audit log keeps; not the office's own, and a blank reason is refused", access: ["ADMIN"], request: c.pauseBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/pause` : null), probe: { body: () => ({ reason: "ZZ probe" }) } },
  // Neither takes a body, so the call is the act; each is sampled where the rule refuses it. Restore: pupil 01, whom the sweep never pauses (its /pause sends no valid body), is "not paused" (422). Remove: the grade-3 lead, a teacher, is refused before anything is counted, since only a pupil is ever removed (422) — a pupil with no history would really go.
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/restore", summary: "Restore paused access; somebody not paused is a 422", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/restore` : null), probe: { path: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/restore` : null) } },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/remove", summary: "Remove a pupil who was never really here; refused, with what stood in the way as issues, the moment a register mark, a grade, a hand-in or a report card exists, and for anybody but a pupil", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.teacherMembershipId ? `/api/v1/admin/people/${f.teacherMembershipId}/remove` : null), probe: { path: (f) => (f.studentMembershipId ? `/api/v1/admin/people/${f.studentMembershipId}/remove` : null) } },
  { method: "POST", path: "/api/v1/admin/people/intake", summary: "Admit pupils from a pasted CSV", access: ["ADMIN"], request: c.intakeBodySchema, response: c.intakeResultSchema, emptyBodyStatus: 422 },
  // ---- /admin/classes, /admin/promotion ------------------------------------
  { method: "GET", path: "/api/v1/admin/classes", summary: "The class list, running or archived, with leads and sizes", access: ["ADMIN"], request: c.adminClassesQuerySchema, response: c.adminClassesSchema },
  { method: "POST", path: "/api/v1/admin/classes", summary: "Create a class", access: ["ADMIN"], request: c.classCreateBodySchema, response: c.classCreatedSchema, emptyBodyStatus: 422 },
  {
    method: "POST",
    path: "/api/v1/admin/classes/{classId}/archive",
    summary: "Archive a class (archived: true) or restore it (false)",
    access: ["ADMIN"],
    request: c.classArchiveBodySchema,
    response: c.okSchema,
    emptyBodyStatus: 422,
    sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/archive` : null),
    // Restoring a running class is a no-op, so the sweep can prove the 200 without changing the fixture.
    sampleBody: () => ({ archived: false }),
  },
  {
    method: "POST",
    path: "/api/v1/admin/classes/{classId}/teacher",
    summary: "Put a teacher in charge of a class, or take them off it",
    access: ["ADMIN"],
    request: c.classTeacherBodySchema,
    response: c.okSchema,
    emptyBodyStatus: 422,
    sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/teacher` : null),
  },
  { method: "GET", path: "/api/v1/admin/classes/promotion", summary: "The year-end promotion plan", access: ["ADMIN"], response: c.promotionPlanSchema },
  // ---- /admin/timetable ----------------------------------------------------
  { method: "GET", path: "/api/v1/admin/timetable", summary: "The school day, the classes, and one class's week", access: ["ADMIN"], request: c.adminTimetableQuerySchema, response: c.adminTimetableSchema },
  { method: "POST", path: "/api/v1/admin/timetable/periods", summary: "Add a period to the school day", access: ["ADMIN"], request: c.periodCreateBodySchema, response: c.savedIdSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/timetable/slots", summary: "Put a lesson in a cell of a class's week", access: ["ADMIN"], request: c.slotSaveBodySchema, response: c.savedIdSchema, emptyBodyStatus: 422 },
  // ---- /admin/exams --------------------------------------------------------
  { method: "GET", path: "/api/v1/admin/exams", summary: "Every live exam series with its papers", access: ["ADMIN"], request: c.adminExamsQuerySchema, response: c.adminExamsSchema },
  { method: "POST", path: "/api/v1/admin/exams", summary: "Schedule an exam series", access: ["ADMIN"], request: c.examSeriesCreateBodySchema, response: c.examSeriesCreatedSchema, emptyBodyStatus: 422 },
  {
    method: "POST",
    path: "/api/v1/admin/exams/{seriesId}/slots",
    summary: "Add a paper to a series",
    access: ["ADMIN"],
    request: c.examSlotCreateBodySchema,
    response: c.okSchema,
    emptyBodyStatus: 422,
    sample: (f) => (f.examSeriesId ? `/api/v1/admin/exams/${f.examSeriesId}/slots` : null),
  },
  // No body: the call is the act. Sampled with a series already out, where publishing twice is a no-op (200); the fixture's unpublished series is never named.
  { method: "POST", path: "/api/v1/admin/exams/{seriesId}/publish", summary: "Put a date sheet out", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.publishedExamSeriesId ? `/api/v1/admin/exams/${f.publishedExamSeriesId}/publish` : null) },
  // ---- /admin/attendance, /attendance/history ------------------------------
  { method: "GET", path: "/api/v1/admin/attendance", summary: "The school's attendance trend and the children slipping", access: ["ADMIN"], request: c.adminAttendanceQuerySchema, response: c.adminAttendanceSchema },
  {
    method: "GET",
    path: "/api/v1/admin/attendance/history",
    summary: "The registers already taken: one class, one month",
    access: ["ADMIN", "PRINCIPAL"],
    request: c.attendanceHistoryQuerySchema,
    response: c.attendanceHistorySchema,
    sample: (f) => (f.classId ? `/api/v1/admin/attendance/history?classId=${f.classId}` : "/api/v1/admin/attendance/history"),
  },
  // ---- /admin/calendar -----------------------------------------------------
  { method: "GET", path: "/api/v1/admin/calendar", summary: "The years, terms, closures, staff leave and birthdays", access: ["ADMIN", "PRINCIPAL"], request: c.adminCalendarQuerySchema, response: c.adminCalendarSchema },
  { method: "POST", path: "/api/v1/admin/calendar/closures", summary: "Add a closure, exam window or event to the calendar", access: ["ADMIN"], request: c.closureCreateBodySchema, response: c.createdIdSchema, emptyBodyStatus: 422 },
  // ---- /admin/reviews ------------------------------------------------------
  { method: "GET", path: "/api/v1/admin/reviews", summary: "The ratings dashboard and the review rounds", access: ["ADMIN", "PRINCIPAL"], request: c.adminReviewsQuerySchema, response: c.adminReviewsSchema },
  { method: "POST", path: "/api/v1/admin/reviews", summary: "Open a review round", access: ["ADMIN", "PRINCIPAL"], request: c.reviewRoundOpenBodySchema, response: c.reviewRoundOpenedSchema, emptyBodyStatus: 422 },
  // ---- /admin/safety -------------------------------------------------------
  { method: "GET", path: "/api/v1/admin/safety", summary: "The safety centre: operator visits, reports, the audit trail", access: ["ADMIN"], request: c.adminSafetyQuerySchema, response: c.adminSafetySchema },
  // ---- /admin/settings -----------------------------------------------------
  { method: "GET", path: "/api/v1/admin/settings", summary: "The school's details, directory profile and housekeeping thresholds", access: ["ADMIN"], response: c.adminSettingsSchema },
  { method: "POST", path: "/api/v1/admin/settings", summary: "Save the school's details", access: ["ADMIN"], request: c.schoolDetailsBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- /admin/vacancies ----------------------------------------------------
  { method: "GET", path: "/api/v1/admin/vacancies", feature: "JOB_BOARD", summary: "The school's own vacancies, with enquiry counts", access: ["ADMIN", "PRINCIPAL"], request: c.adminVacanciesQuerySchema, response: c.adminVacanciesSchema },
  { method: "POST", path: "/api/v1/admin/vacancies", feature: "JOB_BOARD", summary: "Post a vacancy", access: ["ADMIN"], request: c.vacancyCreateBodySchema, response: c.vacancyCreatedSchema, emptyBodyStatus: 422 },
  // No body: the call is the act. Sampled with the fixture's vacancy that is already filled and closed (scripts/sweep-doors.ts), which closing again refuses (422).
  { method: "POST", path: "/api/v1/admin/vacancies/{postingId}/close", feature: "JOB_BOARD", summary: "Take a vacancy off the board", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.vacancyId ? `/api/v1/admin/vacancies/${f.vacancyId}/close` : null) },
  // ---- /principal/leave, /principal/staff ----------------------------------
  { method: "GET", path: "/api/v1/admin/leave", summary: "The leave queue with balances, duty counts and cover suggestions", access: ["ADMIN", "PRINCIPAL"], response: c.adminLeaveSchema },
  // Deciding the fixture's request is a one-way door, so no sampleBody: the sweep's empty body is refused (422) before the request is looked at, and the suite covers the decision.
  { method: "POST", path: "/api/v1/admin/leave/{leaveId}/decide", summary: "Approve or decline a leave request, arranging cover", access: ["ADMIN", "PRINCIPAL"], request: c.leaveDecideBodySchema, response: c.leaveDecidedSchema, emptyBodyStatus: 422, sample: (f) => `/api/v1/admin/leave/${f.leaveRequestId ?? "zz-sweep-no-such-leave"}/decide`, probe: { path: (f) => (f.leaveRequestId ? `/api/v1/admin/leave/${f.leaveRequestId}/decide` : null), body: () => ({ decision: "DECLINED", note: "ZZ probe" }) } }, // R-30: zz:fixtures makes no leave request, so the sweep proves the empty body's 422 on an id no school holds; the cross probe declines another school's request where one exists
  { method: "GET", path: "/api/v1/admin/staff", summary: "The staff roster with records and leave balances", access: ["ADMIN", "PRINCIPAL"], request: c.adminStaffQuerySchema, response: c.adminStaffSchema },
  // ---- /admin/settings/modules (3 Oct 2026) ---------------------------------
  { method: "GET", path: "/api/v1/admin/modules", summary: "Every optional module the school switches and whether this school has it on (the assistant is not listed: the platform's operator switches it)", access: ["ADMIN", "PRINCIPAL"], response: c.schoolModulesSchema },
  // Switching ALUMNI on where it is on already: a no-op, so the sweep's valid body changes nothing at Northgate (zz-fixtures switches every module on).
  { method: "POST", path: "/api/v1/admin/modules", summary: "Switch one module on or off; the answer is every module as it now stands; ASSISTANT is refused (403), the platform's operator switches it", access: ["ADMIN"], request: c.schoolModuleSwitchSchema, response: c.schoolModulesSchema, emptyBodyStatus: 422, sampleBody: () => ({ module: "ALUMNI", on: true }) },
];
