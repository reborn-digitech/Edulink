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
  { method: "POST", path: "/api/v1/admin/people/invites/{inviteId}/revoke", summary: "Withdraw a pending invitation", access: ["ADMIN"], response: c.okSchema },
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
  // Publishing the fixture's series would change what its pupils see; the suite covers it, the sweep skips it.
  { method: "POST", path: "/api/v1/admin/exams/{seriesId}/publish", summary: "Put a date sheet out", access: ["ADMIN"], response: c.okSchema },
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
  { method: "GET", path: "/api/v1/admin/vacancies", summary: "The school's own vacancies, with enquiry counts", access: ["ADMIN", "PRINCIPAL"], request: c.adminVacanciesQuerySchema, response: c.adminVacanciesSchema },
  { method: "POST", path: "/api/v1/admin/vacancies", summary: "Post a vacancy", access: ["ADMIN"], request: c.vacancyCreateBodySchema, response: c.vacancyCreatedSchema, emptyBodyStatus: 422 },
  // Closing the fixture's vacancy is not something to do every run; the suite covers it.
  { method: "POST", path: "/api/v1/admin/vacancies/{postingId}/close", summary: "Take a vacancy off the board", access: ["ADMIN"], response: c.okSchema },
  // ---- /principal/leave, /principal/staff ----------------------------------
  { method: "GET", path: "/api/v1/admin/leave", summary: "The leave queue with balances, duty counts and cover suggestions", access: ["ADMIN", "PRINCIPAL"], response: c.adminLeaveSchema },
  // Deciding the fixture's request is a one-way door; the suite covers it.
  { method: "POST", path: "/api/v1/admin/leave/{leaveId}/decide", summary: "Approve or decline a leave request, arranging cover", access: ["ADMIN", "PRINCIPAL"], request: c.leaveDecideBodySchema, response: c.leaveDecidedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/staff", summary: "The staff roster with records and leave balances", access: ["ADMIN", "PRINCIPAL"], request: c.adminStaffQuerySchema, response: c.adminStaffSchema },
];
