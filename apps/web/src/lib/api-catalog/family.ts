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
  { method: "GET", path: "/api/v1/family/student/overview", summary: "The pupil's Today page: attendance, the day's lessons, what is due, the latest exam marks", access: ["STUDENT"], response: c.familyStudentOverviewSchema },
  { method: "GET", path: "/api/v1/family/student/assignments", summary: "The pupil's work: to do, handed in, marked", access: ["STUDENT"], response: c.familyStudentAssignmentsSchema },
  { method: "POST", path: "/api/v1/family/student/submissions", summary: "Hand a piece of work in (replaces the body until it is marked)", access: ["STUDENT"], request: c.familyStudentSubmissionSchema, response: c.familyStudentSubmittedSchema, emptyBodyStatus: 422 },
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
];
