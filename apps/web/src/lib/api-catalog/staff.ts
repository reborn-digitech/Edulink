import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * staff: the teacher's and the principal's pages, one GET per page and one
 * POST per primary action, in the order of the nav. Access is the page's own
 * check — a teacher page that admits the office admits it here too, because
 * the sweep asserts 403 for every role not listed.
 */
export const STAFF: Endpoint[] = [
  // ---- /teacher -------------------------------------------------------------
  { method: "GET", path: "/api/v1/staff/today", summary: "The teacher's Today page", access: ["TEACHER", "ADMIN"], response: c.staffTodaySchema },
  // ---- /teacher/attendance --------------------------------------------------
  { method: "GET", path: "/api/v1/staff/attendance/classes", summary: "Classes I am down to mark on a day", access: ["TEACHER", "ADMIN"], request: c.attendanceClassesQuerySchema, response: c.attendanceClassesSchema },
  { method: "GET", path: "/api/v1/staff/attendance/register", summary: "One class's register for a day (marking is POST /api/attendance)", access: ["TEACHER", "ADMIN"], request: c.registerQuerySchema, response: c.registerSchema, sample: (f) => (f.classId ? `/api/v1/staff/attendance/register?classId=${f.classId}` : null) },
  // ---- /teacher/classes -----------------------------------------------------
  { method: "GET", path: "/api/v1/staff/classes", summary: "My classes", access: ["TEACHER", "ADMIN"], response: c.staffClassesSchema },
  { method: "GET", path: "/api/v1/staff/classes/{classId}", summary: "One class: roster, attendance, recent work, grade weights", access: ["TEACHER", "ADMIN"], response: c.staffClassDetailSchema, sample: (f) => (f.classId ? `/api/v1/staff/classes/${f.classId}` : null) },
  { method: "POST", path: "/api/v1/staff/classes/{classId}/weights", summary: "Save a class's grade weights", access: ["TEACHER", "ADMIN"], request: c.classWeightsSchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/staff/classes/${f.classId}/weights` : null) },
  // ---- /teacher/assignments -------------------------------------------------
  { method: "GET", path: "/api/v1/staff/assignments", summary: "The assignments list", access: ["TEACHER", "ADMIN"], request: c.assignmentsQuerySchema, response: c.staffAssignmentsSchema },
  { method: "POST", path: "/api/v1/staff/assignments", summary: "Set a new piece of work", access: ["TEACHER", "ADMIN"], request: c.newAssignmentSchema, response: c.assignmentCreatedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/staff/assignments/publish", summary: "Publish a draft assignment", access: ["TEACHER", "ADMIN"], request: c.publishAssignmentSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- /teacher/exams and /exams --------------------------------------------
  { method: "GET", path: "/api/v1/staff/exams", summary: "Classes and papers I may enter marks for", access: ["TEACHER", "ADMIN"], response: c.staffExamsSchema },
  { method: "GET", path: "/api/v1/staff/exams/grid", summary: "The marks grid for one class and paper (saving is POST /api/v1/marks)", access: ["TEACHER", "ADMIN"], request: c.marksGridQuerySchema, response: c.marksGridSchema, sample: (f) => (f.classId ? `/api/v1/staff/exams/grid?classId=${f.classId}` : null) },
  { method: "GET", path: "/api/v1/staff/exams/sheets", summary: "Every date sheet, and the classes whose report cards I may build", access: ["TEACHER", "PRINCIPAL", "ADMIN"], response: c.staffExamSheetsSchema },
  // ---- /timetable -----------------------------------------------------------
  { method: "GET", path: "/api/v1/staff/timetable", summary: "The teacher's own week", access: ["TEACHER"], request: c.weekQuerySchema, response: c.staffTimetableSchema },
  // ---- /teacher/practice ----------------------------------------------------
  { method: "GET", path: "/api/v1/staff/practice", summary: "One class's practice picture", access: ["TEACHER"], request: c.practiceQuerySchema, response: c.staffPracticeSchema },
  { method: "POST", path: "/api/v1/staff/practice", summary: "Set a chapter and a rung for a class", access: ["TEACHER"], request: c.setPracticeSchema, response: c.practiceCreatedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/staff/practice/archive", summary: "Take a set chapter down", access: ["TEACHER"], request: c.archivePracticeSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- /teacher/meetings ----------------------------------------------------
  { method: "GET", path: "/api/v1/staff/meetings", summary: "My upcoming meeting slots", access: ["TEACHER"], response: c.staffMeetingsSchema },
  { method: "POST", path: "/api/v1/staff/meetings", summary: "Offer a run of meeting slots", access: ["TEACHER"], request: c.publishSlotsSchema, response: c.slotsPublishedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/staff/meetings/cancel", summary: "Withdraw one of my slots", access: ["TEACHER"], request: c.cancelSlotSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- /teacher/leave -------------------------------------------------------
  { method: "GET", path: "/api/v1/staff/leave", summary: "My leave balance and requests", access: ["TEACHER", "PRINCIPAL"], response: c.staffLeaveSchema },
  { method: "POST", path: "/api/v1/staff/leave", summary: "Apply for leave", access: ["TEACHER", "PRINCIPAL"], request: c.applyLeaveSchema, response: c.leaveAppliedSchema, emptyBodyStatus: 422 },
  // ---- /teacher/profile -----------------------------------------------------
  { method: "GET", path: "/api/v1/staff/profile", summary: "The teacher's own profile", access: ["TEACHER"], response: c.staffProfileSchema },
  { method: "POST", path: "/api/v1/staff/profile", summary: "Save my preferred name, bio, avatar and date of birth", access: ["TEACHER"], request: c.saveProfileSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- /experts -------------------------------------------------------------
  { method: "GET", path: "/api/v1/staff/experts", summary: "The expert marketplace and this school's bookings", access: ["ADMIN", "TEACHER"], request: c.expertsQuerySchema, response: c.staffExpertsSchema },
  { method: "POST", path: "/api/v1/staff/experts/book", summary: "Book an expert's open slot", access: ["ADMIN", "TEACHER"], request: c.bookExpertSchema, response: c.expertBookedSchema, emptyBodyStatus: 422 },
  // ---- /principal -----------------------------------------------------------
  { method: "GET", path: "/api/v1/staff/principal/overview", summary: "The head's dashboard over a window", access: ["PRINCIPAL", "ADMIN"], request: c.spanQuerySchema, response: c.principalOverviewSchema },
  { method: "GET", path: "/api/v1/staff/principal/classes", summary: "Class insights over a window", access: ["PRINCIPAL", "ADMIN"], request: c.principalClassesQuerySchema, response: c.principalClassesSchema },
  { method: "GET", path: "/api/v1/staff/principal/timetable", summary: "One class's week, with gaps counted", access: ["PRINCIPAL", "ADMIN"], request: c.principalTimetableQuerySchema, response: c.principalTimetableSchema },
  // ---- /principal/decisions -------------------------------------------------
  { method: "GET", path: "/api/v1/principal/decisions", summary: "The head's decision log, newest first: leave, PEN and record changes, certificates, joins, admissions (the office reads the head's)", access: ["PRINCIPAL", "ADMIN"], request: c.decisionsQuerySchema, response: c.decisionsSchema },
  // ---- the head's notes on staff, and the school across years (2026-10-01) ----
  // The head writes and reads; the office reads; the member of staff reads their own entries once marked visible. The sweep's POST writes an observation on the fixture teacher as the ZZ head; the PUT rewrites the fixture's own observation with exactly what it says (scripts/sweep-doors.ts SWEEP_APPRAISAL), and the DELETE removes a throwaway entry the sweep puts back before each run — the head 200, the rest 403.
  { method: "GET", path: "/api/v1/principal/staff/{membershipId}/appraisals", summary: "One member of staff's observations, targets and appraisals, newest first; the head's and the office's read", access: ["PRINCIPAL", "ADMIN"], response: c.appraisalsSchema, sample: (f) => (f.teacherMembershipId ? `/api/v1/principal/staff/${f.teacherMembershipId}/appraisals` : null) },
  { method: "POST", path: "/api/v1/principal/staff/{membershipId}/appraisals", summary: "The head writes an observation, a target or an appraisal for a member of staff (never themselves)", access: ["PRINCIPAL"], request: c.appraisalSaveSchema, response: c.appraisalSavedSchema, emptyBodyStatus: 422, sample: (f) => (f.teacherMembershipId ? `/api/v1/principal/staff/${f.teacherMembershipId}/appraisals` : null), sampleBody: (f) => ({ kind: "OBSERVATION", dateKey: f.todayKey, summary: "ZZ sweep: a lesson observed." }) },
  { method: "PUT", path: "/api/v1/principal/appraisals/{id}", summary: "The head rewrites an entry, whole", access: ["PRINCIPAL"], request: c.appraisalSaveSchema, response: c.appraisalSavedSchema, emptyBodyStatus: 422, sample: (f) => (f.appraisalId ? `/api/v1/principal/appraisals/${f.appraisalId}` : null), sampleBody: (f) => f.appraisal },
  { method: "DELETE", path: "/api/v1/principal/appraisals/{id}", summary: "The head removes an entry; nothing there is a no-op", access: ["PRINCIPAL"], response: c.substitutionAssignedSchema, sample: (f) => (f.goneAppraisalId ? `/api/v1/principal/appraisals/${f.goneAppraisalId}` : null) },
  { method: "GET", path: "/api/v1/staff/me/appraisals", summary: "The entries the head has marked visible to me, newest first", access: ["TEACHER", "ADMIN", "PRINCIPAL"], response: c.myAppraisalsSchema },
  { method: "GET", path: "/api/v1/principal/trends", summary: "The school per term across the last years (?years=1..3): attendance, exam average by subject and by teacher, pass rate, fee collection, incidents, and this year's grades against last year's; computed on read", access: ["PRINCIPAL", "ADMIN"], request: c.trendsQuerySchema, response: c.trendsSchema },
];
