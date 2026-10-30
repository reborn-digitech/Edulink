import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * office: endpoints added for the phone's remaining school-office screens
 * (September 2026) — each thin over the lib function the web's page or
 * server action uses, and the office's alone, as those pages are.
 *
 * The previews write nothing, so the sweep proves their 200. Every other
 * write carries no sampleBody: it would email the fixture's invitee, publish
 * or deface ZZ Northgate, close its reports or tell its families, so the
 * sweep proves the 422 and leaves the fixture as it found it.
 */
export const OFFICE: Endpoint[] = [
  // ---- invitations and intake -----------------------------------------------
  { method: "POST", path: "/api/v1/office/invites/preview", summary: "What a pasted list would invite, before anything is sent", access: ["ADMIN"], request: c.officeCsvBodySchema, response: c.officeInvitePreviewSchema, emptyBodyStatus: 422, sampleBody: () => ({ csv: "zz-sweep-preview@test.invalid" }) },
  // Resending the pending invitation would email the invitee and kill their link, so the sample is the fixture's invitation already revoked (scripts/sweep-doors.ts), which cannot be resent (422) and emails nobody; the suite covers the send.
  { method: "POST", path: "/api/v1/office/invites/{inviteId}/resend", summary: "Send a pending invitation again with a fresh link", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.revokedInviteId ? `/api/v1/office/invites/${f.revokedInviteId}/resend` : null) },
  { method: "POST", path: "/api/v1/office/intake/preview", summary: "What an admission list would admit, before anybody is", access: ["ADMIN"], request: c.officeCsvBodySchema, response: c.officeIntakePreviewSchema, emptyBodyStatus: 422, sampleBody: () => ({ csv: "name\nZZ Sweep Preview" }) },
  // ---- the directory profile and the logo ----------------------------------
  { method: "POST", path: "/api/v1/office/directory", summary: "Save the school's directory profile: its words and the admissions contact", access: ["ADMIN"], request: c.officeDirectoryProfileSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/office/directory/publish", summary: "Put the school in the public directory, or take it out", access: ["ADMIN"], request: c.officeDirectoryPublishBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/office/logo", summary: "Make an uploaded image the school's logo, or take the logo off", access: ["ADMIN"], request: c.officeLogoBodySchema, response: c.officeLogoSchema, emptyBodyStatus: 422 },
  // ---- safety ----------------------------------------------------------------
  { method: "POST", path: "/api/v1/office/safety/take-down", summary: "Take reported content down, telling the author why", access: ["ADMIN", "PRINCIPAL"], duties: ["HEAD_PAGES"], request: c.officeTakeDownBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/office/safety/dismiss", summary: "Close the reports against something: nothing wrong", access: ["ADMIN", "PRINCIPAL"], duties: ["HEAD_PAGES"], request: c.officeDismissBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- attendance -------------------------------------------------------------
  { method: "POST", path: "/api/v1/office/attendance/alert", summary: "Tell one child's family they have been missing school", access: ["ADMIN"], request: c.officeAbsenceAlertBodySchema, response: c.officeAbsenceAlertSchema, emptyBodyStatus: 422 },
  {
    method: "GET",
    path: "/api/v1/office/attendance/export/register",
    summary: "One class's month of attendance as CSV text",
    access: ["ADMIN"],
    request: c.officeRegisterExportQuerySchema,
    response: c.officeCsvExportSchema,
    sample: (f) => (f.classId ? `/api/v1/office/attendance/export/register?classId=${f.classId}&month=${f.todayKey.slice(0, 7)}` : null),
  },
  { method: "GET", path: "/api/v1/office/attendance/export/enrolment", summary: "The enrolment summary an annual return asks for, as CSV text", access: ["ADMIN"], response: c.officeCsvExportSchema },
  // ---- the timetable ------------------------------------------------------------
  // The first period of the day, sent back with its own name, times and kind: rewriting it unchanged is the 200, and the day re-sorts to the order it had.
  { method: "POST", path: "/api/v1/office/timetable/periods/{periodId}", summary: "Change a period's name, times or kind", access: ["ADMIN"], request: c.officePeriodBodySchema, response: c.savedIdSchema, emptyBodyStatus: 422, sample: (f) => (f.periodId ? `/api/v1/office/timetable/periods/${f.periodId}` : null), sampleBody: (f) => f.period },
  // No sampleBody: retiring a running period takes its column off ZZ Northgate's grid, and bringing one back that was never retired is refused (422), which the valid-body leg would count as a failure. The empty body's 422 is what the sweep proves.
  { method: "POST", path: "/api/v1/office/timetable/periods/{periodId}/retire", summary: "Retire a period (its lessons are kept) or bring it back", access: ["ADMIN"], request: c.officePeriodRetireBodySchema, response: c.savedIdSchema, emptyBodyStatus: 422, sample: (f) => (f.periodId ? `/api/v1/office/timetable/periods/${f.periodId}/retire` : null) },
  { method: "POST", path: "/api/v1/office/timetable/slots/clear", summary: "Take the lesson out of one cell of a class's week", access: ["ADMIN"], request: c.officeSlotClearBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- exams ----------------------------------------------------------------------
  // Archiving a live series would take it off every page, so the sample is the fixture's series already archived (scripts/sweep-doors.ts): there is no live series by that id to archive (404), and the suite covers the archive.
  { method: "POST", path: "/api/v1/office/exams/{seriesId}/archive", summary: "Send an exam series to the archive", access: ["ADMIN"], response: c.okSchema, sample: (f) => (f.archivedExamSeriesId ? `/api/v1/office/exams/${f.archivedExamSeriesId}/archive` : null) },
  // ---- notification housekeeping --------------------------------------------------
  { method: "POST", path: "/api/v1/office/notifications/housekeeping", summary: "How long this school's notices live", access: ["ADMIN"], request: c.officeHousekeepingBodySchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- the timetable in bulk (October 2026) ------------------------------------------
  // The preview writes nothing, so the sweep proves its 200 with a sheet naming nothing the fixture has; the commit and the copy would rewrite ZZ Northgate's grid, so they carry no sampleBody and prove their 422.
  { method: "POST", path: "/api/v1/office/timetable/import/preview", summary: "What a pasted timetable sheet (day, period, class, subject, teacher, room) would write, and every cell it cannot resolve", access: ["ADMIN"], request: c.timetableImportBodySchema, response: c.timetableImportPreviewSchema, emptyBodyStatus: 422, sampleBody: () => ({ csv: "day,period,class,subject,teacher,room\nMonday,1,ZZ Sweep No Class,Maths,,\n" }) },
  { method: "POST", path: "/api/v1/office/timetable/import", summary: "Write the sheet: each cell upserted on (class, day, period) in one transaction; a teacher that cannot be honoured is left blank", access: ["ADMIN"], request: c.timetableImportBodySchema, response: c.timetableImportResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/office/timetable/copy", summary: "Copy one section's week onto its sister sections, teachers left blank for the office to fill (overwrites theirs)", access: ["ADMIN"], request: c.timetableCopyBodySchema, response: c.timetableCopyResultSchema, emptyBodyStatus: 422 },
  // ---- usage against the plan (2026-10-01) ------------------------------------------
  { method: "GET", path: "/api/v1/office/usage", summary: "This school's running month — pupils, texts, storage, people active — against its plan's caps, and the months before it; the office's own", access: ["ADMIN", "PRINCIPAL"], response: c.officeUsageSchema },
];
