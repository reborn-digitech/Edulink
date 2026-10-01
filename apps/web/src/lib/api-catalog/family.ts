import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * family: the pupil's and the guardian's pages, in the order of the nav.
 *
 * A guardian's endpoints take `childId` (the student membership id) as a
 * query parameter and re-check it against their own guardianships; omitted,
 * they open on the first child, as the pages do — so the sweep's PARENT,
 * who has at least one child, gets 200 without a sample. Writes that would
 * leave rows behind on every run (a submission, a booking, a review) carry no
 * sampleBody; the settings save does, because it writes the defaults.
 */
export const FAMILY: Endpoint[] = [
  // ---- STUDENT --------------------------------------------------------------
  { method: "GET", path: "/api/v1/family/student/overview", summary: "The pupil's Today page: attendance, the day's lessons, what is due, the latest exam marks, and the welcome with their login name while they are new", access: ["STUDENT"], response: c.familyStudentOverviewSchema },
  { method: "POST", path: "/api/v1/family/student/welcomed", summary: "The pupil put their welcome away; the overview stops offering it", access: ["STUDENT"], response: c.okSchema },
  { method: "GET", path: "/api/v1/family/student/assignments", summary: "The pupil's work: to do, handed in, marked", access: ["STUDENT"], response: c.familyStudentAssignmentsSchema },
  { method: "POST", path: "/api/v1/family/student/submissions", summary: "Hand a piece of work in: words and/or photographs of it (ids from POST /api/v1/uploads); replaces the body and the file list until it is marked", access: ["STUDENT"], request: c.familyStudentSubmissionSchema, response: c.familyStudentSubmittedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/family/student/profile", summary: "The pupil's profile, previous schools, practice, competitions and badges", access: ["STUDENT"], response: c.familyStudentProfileSchema },
  { method: "POST", path: "/api/v1/family/student/profile", summary: "Save preferred name, bio, avatar and — while allowed — date of birth", access: ["STUDENT"], request: c.familyStudentProfileSaveSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/family/student/practice", summary: "Every practice topic with the pupil's own progress, and the cards above the list", access: ["STUDENT"], response: c.familyStudentPracticeSchema },
  // ---- PARENT ---------------------------------------------------------------
  { method: "GET", path: "/api/v1/family/children", summary: "The guardian's children, as the child switcher lists them", access: ["PARENT"], response: c.familyChildrenSchema },
  { method: "GET", path: "/api/v1/family/overview", summary: "The guardian's dashboard for one child (?childId=; the first child when omitted)", access: ["PARENT"], request: c.familyChildQuerySchema, response: c.familyParentOverviewSchema },
  { method: "GET", path: "/api/v1/family/attendance", summary: "One month of a child's register (?childId=&month=YYYY-MM)", access: ["PARENT"], request: c.familyParentAttendanceQuerySchema, response: c.familyParentAttendanceSchema },
  { method: "GET", path: "/api/v1/family/assignments", summary: "A child's work — to do, handed in, marked — read-only (?childId=)", access: ["PARENT"], request: c.familyChildQuerySchema, response: c.familyParentAssignmentsSchema },
  { method: "GET", path: "/api/v1/family/practice", summary: "Every chapter a child has practised, the rung they stand on and their badges (?childId=)", access: ["PARENT"], request: c.familyChildQuerySchema, response: c.familyParentPracticeSchema },
  { method: "GET", path: "/api/v1/family/meetings", summary: "Open meeting windows of the children's teachers, and the family's own bookings", access: ["PARENT"], response: c.familyParentMeetingsSchema },
  { method: "POST", path: "/api/v1/family/meetings", summary: "Book a meeting slot for one child", access: ["PARENT"], request: c.familyBookMeetingSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/family/meetings/cancel", summary: "Cancel one of the family's bookings", access: ["PARENT"], request: c.familyCancelMeetingSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/family/settings", summary: "Notification channels, quiet hours and the linked children", access: ["PARENT"], response: c.familySettingsSchema },
  {
    method: "POST",
    path: "/api/v1/family/settings",
    summary: "Save notification channels and quiet hours",
    access: ["PARENT"],
    request: c.familySettingsSaveSchema,
    response: c.okSchema,
    emptyBodyStatus: 422,
    sampleBody: () => ({ channels: { push: true, email: true }, quietHours: null }),
  },
  // ---- shared by pupil and guardian ------------------------------------------
  { method: "GET", path: "/api/v1/family/timetable", summary: "The pupil's own dated week, or a guardian's child's (?childId=&week=YYYY-MM-DD)", access: ["STUDENT", "PARENT"], request: c.familyTimetableQuerySchema, response: c.familyTimetableSchema },
  { method: "GET", path: "/api/v1/family/exams", summary: "Exam marks as they come in, the sittings still ahead, and the report cards", access: ["STUDENT", "PARENT"], response: c.familyExamsSchema },
  { method: "GET", path: "/api/v1/family/report-cards", summary: "Published report cards — the pupil's own, or each child's", access: ["STUDENT", "PARENT"], response: c.familyReportCardsSchema },
  {
    method: "GET",
    path: "/api/v1/family/report-cards/{cardId}",
    summary: "One report card as it will be printed",
    access: ["STUDENT", "PARENT"],
    response: c.familyReportCardSchema,
    // The fixture carries no card id; the sweep skips and says so.
    sample: () => null,
  },
  { method: "GET", path: "/api/v1/family/reviews", summary: "Open teacher questionnaires waiting for this pupil or guardian", access: ["STUDENT", "PARENT"], response: c.familyReviewsSchema },
  { method: "POST", path: "/api/v1/family/reviews", summary: "Answer, or amend while open, one teacher's questionnaire", access: ["STUDENT", "PARENT"], request: c.familyReviewSubmitSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/family/explore", summary: "The directory of published schools (?q=&country=&region=)", access: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT"], request: c.familyExploreQuerySchema, response: c.familyExploreSchema },
  // ---- a person's own data (DPDP s.11) ---------------------------------------
  // A JSON attachment, not an envelope; five an hour per person, so the sweep's two passes fit and a third within the hour sees 429.
  { method: "GET", path: "/api/v1/family/export", summary: "A person's own data as one JSON document to keep (DPDP s.11): the pupil's own, or one child of a guardian's (?student=; the first child when omitted) — profile, record, attendance, marks, report cards, work, messages, consents, sessions, and for a guardian the health card, incidents and fees", access: ["STUDENT", "PARENT"], request: c.familyExportQuerySchema, response: c.okSchema },
  // ---- money and time -------------------------------------------------------
  // The family's fee plans and calendar take `student` (the child's membership id; the first child when omitted), re-checked against the guardianship.
  { method: "GET", path: "/api/v1/family/fees/plans", summary: "The fee structures the office has opened to families for this child's grade, with their instalments and dates (?student=)", access: ["PARENT"], request: c.familyChildFeesQuerySchema, response: c.familyFeePlansSchema },
  // Putting a child on a plan is the act itself and holds until the office moves them; no sampleBody, the sweep proves the 422.
  { method: "POST", path: "/api/v1/family/fees/plans/enrol", summary: "Put the child on an open structure, as the office's assign does; refused once a plan is assigned or anything is paid this year", access: ["PARENT"], request: c.familyFeeEnrolBodySchema, response: c.familyFeeEnrolledSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/family/fees/calendar", summary: "The year's payment calendar for one child: instalments, other dues and the reminders still to come, in date order (?student=)", access: ["PARENT"], request: c.familyChildFeesQuerySchema, response: c.familyFeeCalendarSchema },
  { method: "GET", path: "/api/v1/family/fees/mine", summary: "A pupil's own dues, paid and next due date — only while the school lets pupils of their age see fees; never a way to pay", access: ["STUDENT"], response: c.pupilFeesSchema },
  { method: "GET", path: "/api/v1/family/agenda", summary: "The next fortnight for the pupil, or a guardian's child: exams, work due, sessions, meetings, closures and fee dates in date order, each with a link (?student=&days=14)", access: ["STUDENT", "PARENT"], request: c.familyAgendaQuerySchema, response: c.familyAgendaSchema },
  // ---- the family acting on the child's record (family-care.ts) ------------
  // Ending the link is the act itself: no sample, the sweep proves the 422 and the 403s.
  { method: "DELETE", path: "/api/v1/family/children/{membershipId}/link", summary: "The guardian ends their own link to this child; refused when it would leave the child with no guardian and nobody at the school to stand in. The office is told", access: ["PARENT"], request: c.familyUnlinkSchema, response: c.familyUnlinkedSchema, emptyBodyStatus: 422, sample: () => null },
  { method: "GET", path: "/api/v1/family/students/{membershipId}/absence-notes", summary: "The coming days the family said the pupil would be away, soonest first — a guardian's child, or the pupil's own", access: ["STUDENT", "PARENT"], response: c.absenceNotesSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/family/students/${f.studentMembershipId}/absence-notes` : null) },
  // One note per day, a second replacing the first, so the sweep's note is the same note every run.
  { method: "POST", path: "/api/v1/family/students/{membershipId}/absence-notes", summary: "Tell the school the pupil will be away on a day (today or up to sixty days ahead), with a coded reason; the register shows it and no absence notice is sent for that day", access: ["STUDENT", "PARENT"], request: c.absenceNoteCreateSchema, response: c.absenceNotesSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/family/students/${f.studentMembershipId}/absence-notes` : null), sampleBody: (f) => ({ dateKey: f.todayKey, reason: "FAMILY", text: "ZZ Sweep: away for the day." }) },
  { method: "DELETE", path: "/api/v1/family/students/{membershipId}/absence-notes/{noteId}", summary: "Its author takes a note back, before the day's register has marked the pupil", access: ["STUDENT", "PARENT"], response: c.absenceNotesSchema, sample: () => null },
  { method: "GET", path: "/api/v1/family/students/{membershipId}/health/reads", summary: "Who at the school opened the child's health card in the last ninety days: name, role and time, newest first", access: ["PARENT"], response: c.healthCardReadsSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/family/students/${f.studentMembershipId}/health/reads` : null) },
];
