import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * teaching: endpoints added for the phone's remaining teaching screens
 * (September 2026) — one assignment's gradebook and its marks, handouts on a
 * new assignment, the report-card builder, and writing to a family about a
 * pupil. Access is each web page's own door; where a page answers 404 to
 * somebody its lib refuses (the gradebook, the report-card builder) the
 * handler does too, so the sweep's non-LEAD teacher sees [200, 404].
 */
const classPath = (tail: string) => (f: { classId: string | null }) => (f.classId ? `/api/v1/teaching/classes/${f.classId}/report-cards${tail}` : null);

export const TEACHING: Endpoint[] = [
  // ---- /teacher/assignments/new, with handouts ------------------------------
  { method: "POST", path: "/api/v1/teaching/assignments", summary: "Set a new piece of work, with handouts uploaded through /api/v1/uploads", access: ["TEACHER", "ADMIN"], request: c.teachingNewAssignmentSchema, response: c.teachingAssignmentCreatedSchema, emptyBodyStatus: 422 },
  // ---- /teacher/assignments/[assignmentId] ----------------------------------
  { method: "GET", path: "/api/v1/teaching/assignments/{assignmentId}", summary: "One assignment's gradebook: the roll, marks, comments and the work handed in", access: ["TEACHER", "ADMIN"], response: c.teachingGradebookSchema, sample: (f) => (f.assignmentId ? `/api/v1/teaching/assignments/${f.assignmentId}` : null) },
  { method: "POST", path: "/api/v1/teaching/assignments/{assignmentId}/grades", summary: "Save marks and comments for one assignment (replay-safe)", access: ["TEACHER", "ADMIN"], request: c.teachingGradesBodySchema, response: c.teachingGradesSavedSchema, emptyBodyStatus: 422, sample: (f) => (f.assignmentId ? `/api/v1/teaching/assignments/${f.assignmentId}/grades` : null) },
  // ---- /teacher/classes/[classId]/report-cards ------------------------------
  { method: "GET", path: "/api/v1/teaching/classes/{classId}/report-cards", summary: "The report-card builder: papers, terms, titles and the cards under one", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.teachingReportCardsQuerySchema, response: c.teachingReportCardsSchema, sample: classPath("") },
  { method: "POST", path: "/api/v1/teaching/classes/{classId}/report-cards/generate", summary: "Generate (or refresh) the class's draft cards from chosen papers", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.teachingGenerateCardsSchema, response: c.teachingCardsGeneratedSchema, emptyBodyStatus: 422, sample: classPath("/generate") },
  { method: "POST", path: "/api/v1/teaching/classes/{classId}/report-cards/remark", summary: "Save the class teacher's remark on one draft card", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.teachingCardRemarkSchema, response: c.okSchema, emptyBodyStatus: 422, sample: classPath("/remark") },
  { method: "POST", path: "/api/v1/teaching/classes/{classId}/report-cards/publish", summary: "Publish every draft card under one title", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.teachingCardsTitleSchema, response: c.teachingCardsPublishedSchema, emptyBodyStatus: 422, sample: classPath("/publish") },
  { method: "POST", path: "/api/v1/teaching/classes/{classId}/report-cards/withdraw", summary: "Take a published set of cards back to draft", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.teachingCardsTitleSchema, response: c.teachingCardsWithdrawnSchema, emptyBodyStatus: 422, sample: classPath("/withdraw") },
  // ---- /remarks/new ---------------------------------------------------------
  { method: "GET", path: "/api/v1/teaching/remarks", summary: "Who I may start a conversation about or with: pupils, or a pupil's teachers", access: ["TEACHER", "STUDENT", "PARENT"], response: c.teachingRemarkPeopleSchema },
  { method: "POST", path: "/api/v1/teaching/remarks", summary: "Start a conversation about a pupil with the family (the web's startThread)", access: ["TEACHER", "STUDENT", "PARENT"], request: c.teachingStartRemarkSchema, response: c.teachingRemarkStartedSchema, emptyBodyStatus: 422 },
  // ---- /teacher/exams and the gradebook: the class's marks as a file --------
  // A file, not JSON (text/csv, or the workbook with ?format=xlsx), for a teacher of the class, the head and the office; another grade's exam is 404 as the page's lib answers.
  { method: "GET", path: "/api/v1/teaching/classes/{classId}/marks/export", summary: "One exam's marks for the class as a file (?exam=&format=csv|xlsx): a row per pupil, a column per paper with its maximum, the total, the percentage and the grade band", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.marksExportQuerySchema, response: c.okSchema, sample: (f) => (f.classId && f.examSeriesId ? `/api/v1/teaching/classes/${f.classId}/marks/export?exam=${f.examSeriesId}` : null) },
  { method: "GET", path: "/api/v1/teaching/classes/{classId}/gradebook/export", summary: "The class's gradebook as a file (?format=csv|xlsx): a row per pupil, the marks and the hand-in status (submitted, late, missing) per assignment", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.gradebookExportQuerySchema, response: c.okSchema, sample: (f) => (f.classId ? `/api/v1/teaching/classes/${f.classId}/gradebook/export` : null) },
];
