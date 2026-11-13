import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { EXAMS_FIXTURE as F } from "./exams-fixture";
import { ACADEMICS_FIXTURE } from "./academics-fixture";

/**
 * exams: the college's exam cell (module EXAMS, role EXAM_CONTROLLER; 4 Oct
 * 2026). The controller writes; the office and the principal read; the
 * principal alone decides grace; a student acts on their own form,
 * revaluations and backlogs; a guardian reads a child's under the RESULTS
 * grant; faculty read their duties and (autonomous) submit papers. Every
 * door but the public check answers MODULE_OFF while the college has EXAMS
 * off, and the role is checked before the body is read.
 *
 * SAMPLES name the ZZ exam cell's fixed ids (exams-fixture.ts) at ZZ Vidya
 * College. The doors of an autonomous college's conduct name Shastri's (the
 * session in CONDUCT, its paper and bundle): the sweep's controller is
 * Vidya's, an affiliated college, where they rightly answer 403 before the id
 * is read — so `emptyBodyStatus: 403` (on the GETs too: the sweep reads it as
 * the permitted role's answer to the sample), and a body they validate first
 * is still a 422. No door here is sampled into an act (SWEEPS-1, 4 Oct 2026):
 * submitting the approved form is refused 409, a run of the published session
 * without a reason 422, and the sealed paper is never named — `open` names a
 * paper the fixture never made, so nothing is opened or logged even by an
 * autonomous college's controller (404 there).
 */
const R: c.RoleCode[] = ["EXAM_CONTROLLER", "ADMIN", "PRINCIPAL"];
const W: c.RoleCode[] = ["EXAM_CONTROLLER"];
const M = { module: "EXAMS" } as const;
const S = (id: string) => `/api/v1/exam-cell/sessions/${id}`;
/** An id in the fixture's shape that no fixture row has: a decision there is refused for its empty body (422) or not found, never made. */
const NONE = (prefix: string) => `c${prefix}${"99".padStart(20 - prefix.length, "0")}`;

export const EXAMS: Endpoint[] = [
  { ...M, method: "GET", path: "/api/v1/exam-cell", summary: "The exam cell's home: sessions, terms, fee heads, grace proposals waiting.", access: R, response: c.examCellHomeSchema },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions", summary: "A new exam session for a term.", access: W, request: c.examSessionSaveSchema, response: c.examActionResultSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/exam-cell/sessions/{sessionId}", summary: "One session: forms, date sheet, halls, invigilation, malpractice, remuneration, runs, grace, notes, marks status.", access: R, response: c.examSessionViewSchema, sample: S(F.pastSession) },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}", summary: "Rewrite a session while it is a draft or taking forms.", access: W, request: c.examSessionSaveSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/status", summary: "Move a session forward; CONDUCT locks the approved forms.", access: W, request: c.examSessionStatusSetSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/status" },
  // Generating again brings the drafts up to date and makes no second form: the act is its own no-op.
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/forms", summary: "Generate every student's draft form from registrations and open backlogs; idempotent.", access: W, response: c.examActionResultSchema, sample: S(F.formsSession) + "/forms" },
  { ...M, method: "GET", path: "/api/v1/exam-cell/sessions/{sessionId}/forms/export", summary: "The submitted and approved forms as the university takes them (CSV text).", access: R, response: c.officeCsvExportSchema, sample: S(F.formsSession) + "/forms/export" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/forms/{formId}/submit", summary: "Submit a form: refused without attendance eligibility or no-dues; the fee becomes a demand.", access: ["STUDENT", "EXAM_CONTROLLER"], reach: "ownChild", response: c.examActionResultSchema, emptyBodyStatus: 409, sample: `/api/v1/exam-cell/forms/${F.form(5)}/submit` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/forms/{formId}/decide", summary: "Approve a submitted form (the fee waived with a reason) or refuse it.", access: W, request: c.examFormDecideSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/forms/${F.form(5)}/decide` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/schedule", summary: "Put a course's paper on the date sheet, or move it.", access: W, request: c.examScheduleSaveSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/schedule" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/rooms", summary: "A hall for a paper, with its capacity.", access: W, request: c.examRoomSaveSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/rooms" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/seating", summary: "Seat a paper (or all) on alternate seats; answers how many did not fit.", access: W, request: c.examSeatingBuildSchema, response: c.examActionResultSchema, sample: S(F.formsSession) + "/seating", sampleBody: () => ({ scheduleId: F.schedule(3) }) },
  { ...M, method: "GET", path: "/api/v1/exam-cell/schedules/{scheduleId}/seating", summary: "Who sits where for one paper.", access: R, response: c.examSeatingSchema, sample: `/api/v1/exam-cell/schedules/${F.schedule(3)}/seating` },
  // Every approved form already has its ticket: issuing again issues nothing.
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/hall-tickets", summary: "Hall tickets for every approved form that has none.", access: W, response: c.examActionResultSchema, sample: S(F.formsSession) + "/hall-tickets" },
  { ...M, method: "GET", path: "/api/v1/exam-cell/hall-tickets/{ticketId}/pdf", summary: "A hall ticket as a PDF (application/pdf) with the photo and a QR to the public check.", access: ["STUDENT", "PARENT", "EXAM_CONTROLLER", "ADMIN", "PRINCIPAL"], reach: "ownChild", response: c.okSchema, sample: `/api/v1/exam-cell/hall-tickets/${F.ticket(5)}/pdf` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/invigilation", summary: "Put a member of staff on duty in a hall.", access: W, request: c.invigilationAssignSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/invigilation" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/invigilation/{invigilationId}/swap", summary: "Swap a duty to another member of staff, with the reason.", access: W, request: c.invigilationSwapSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/invigilation/${F.invigilation(2)}/swap` },
  // The past session's duty, already done: marking it again is the same.
  { ...M, method: "POST", path: "/api/v1/exam-cell/invigilation/{invigilationId}/done", summary: "Mark a duty done.", access: W, response: c.examActionResultSchema, sample: `/api/v1/exam-cell/invigilation/${F.invigilation(1)}/done` },
  { ...M, method: "GET", path: "/api/v1/exam-cell/rooms/{examRoomId}/sheet", summary: "A hall's attendance sheet for its paper as a PDF (application/pdf).", access: R, response: c.okSchema, sample: `/api/v1/exam-cell/rooms/${F.room(3)}/sheet` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/malpractice", summary: "Record a case of unfair means at a paper.", access: W, request: c.malpracticeReportSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/malpractice" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/malpractice/{malpracticeId}/decide", summary: "The unfair-means committee's decision, recorded once.", access: W, request: c.malpracticeDecideSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/malpractice/${NONE("zzexmalp")}/decide` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/remuneration", summary: "What a setter, moderator, invigilator or assessor is owed for the session (a record, never a payment).", access: W, request: c.remunerationSaveSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/remuneration" },
  { ...M, method: "GET", path: "/api/v1/exam-cell/sessions/{sessionId}/marks", summary: "One course's marks sheet: internal (locked), both entries, the standing mark, grace.", access: R, request: c.examMarksQuerySchema, response: c.examMarksSheetSchema, sample: `${S(F.pastSession)}/marks?courseId=${ACADEMICS_FIXTURE.course(5)}` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/marks", summary: "One person's entry of a course's external marks; two people must agree.", access: ["EXAM_CONTROLLER", "ADMIN"], request: c.examMarksEntrySchema, reach: "ownSchool", response: c.examMarksEntryResultSchema, emptyBodyStatus: 422, sample: S(F.formsSession) + "/marks" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/marks/import", summary: "The university's result file, reconciled student by student.", access: W, request: c.examMarksImportSchema, response: c.examMarksImportResultSchema, emptyBodyStatus: 422, sample: S(F.pastSession) + "/marks/import" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/marks/correct", summary: "A mark changed after publication: a new version with its reason.", access: W, request: c.examMarkCorrectSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.pastSession) + "/marks/correct" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/grace", summary: "Propose grace marks under the scheme's rule; the principal decides.", access: W, request: c.graceProposeSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.pastSession) + "/grace" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/grace/{graceId}/decide", summary: "The principal approves or refuses a grace proposal.", access: ["PRINCIPAL"], request: c.graceDecideSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/grace/${NONE("zzexgrace")}/decide` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/moderation", summary: "The moderation committee's note.", access: W, request: c.moderationNoteSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.pastSession) + "/moderation" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/results/run", summary: "Compute the results under the schemes (a new run; a reason after publication).", access: W, request: c.examResultRunSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.pastSession) + "/results/run" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/results/publish", summary: "Publish a run: the one before is superseded and kept; backlogs and credits follow. A run that changes a published result is the principal's to publish.", access: [...W, "PRINCIPAL"], request: c.examResultPublishSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.pastSession) + "/results/publish", sampleBody: () => ({ runId: F.run }) },
  { ...M, method: "GET", path: "/api/v1/exam-cell/sessions/{sessionId}/results", summary: "A run's results (the latest when none is named).", access: R, request: c.examResultsQuerySchema, response: c.examResultsSchema, sample: S(F.pastSession) + "/results" },
  { ...M, method: "GET", path: "/api/v1/exam-cell/sessions/{sessionId}/results/export", summary: "The results as the university takes them (CSV text).", access: R, request: c.examResultsQuerySchema, response: c.officeCsvExportSchema, sample: S(F.pastSession) + "/results/export" },
  { ...M, method: "GET", path: "/api/v1/exam-cell/after", summary: "After results: revaluations, backlogs, papers issued, credits, the convocation.", access: R, response: c.examAfterSchema },
  // The fixture's revaluation, decided unchanged: deciding it so again is the same.
  { ...M, method: "POST", path: "/api/v1/exam-cell/revaluations/{revaluationId}/decide", summary: "Decide a photocopy or revaluation; a changed mark is a new version.", access: W, request: c.revaluationDecideSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/revaluations/${F.revaluation}/decide`, sampleBody: () => ({ outcome: "UNCHANGED" }) },
  { ...M, method: "POST", path: "/api/v1/exam-cell/documents", summary: "Issue a grade card, transcript or (autonomous) degree certificate, numbered with a public check.", access: W, request: c.examDocumentIssueSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422 },
  // Sampled with no body only (422): the sweep never withdraws the fixture's paper (TA-068).
  { ...M, method: "POST", path: "/api/v1/exam-cell/documents/{documentId}/revoke", summary: "Withdraw a grade card, transcript or degree certificate with a reason; its public check then answers revoked.", access: W, request: c.examDocumentRevokeSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/documents/${F.document}/revoke` },
  { ...M, method: "GET", path: "/api/v1/exam-cell/documents/{documentId}/pdf", summary: "A grade card, transcript or degree certificate as a PDF (application/pdf).", access: ["STUDENT", "PARENT", "EXAM_CONTROLLER", "ADMIN", "PRINCIPAL"], reach: "ownChild", response: c.okSchema, sample: `/api/v1/exam-cell/documents/${F.document}/pdf` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/credits/push", summary: "Send the credits waiting for the Academic Bank (a stub transport; real ABC untested).", access: W, request: c.creditPushSendSchema, response: c.examActionResultSchema, emptyBodyStatus: [200, 409] },
  { ...M, method: "POST", path: "/api/v1/exam-cell/convocation", summary: "Draw (or finalise) an autonomous college's convocation list for a year.", access: W, request: c.convocationBuildSchema, response: c.examActionResultSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/exam-cell/sessions/{sessionId}/conduct", summary: "An autonomous college's conduct: question papers, printing lists, assessment bundles.", access: R, response: c.examConductSchema, emptyBodyStatus: 403, sample: S(F.conductSession) + "/conduct" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/papers", summary: "Appoint a faculty member to set a paper (autonomous).", access: W, request: c.paperAssignSchema, reach: "ownSchool", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.conductSession) + "/papers" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/papers/{paperId}/submit", summary: "The setter's paper and outcome map, sealed at once (autonomous).", access: ["FACULTY", "HOD"], request: c.paperSubmitSchema, reach: "self", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/papers/${F.paper}/submit` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/papers/{paperId}/moderate", summary: "Mark a paper moderated, with the note (autonomous).", access: W, request: c.paperModerateSchema, response: c.examActionResultSchema, emptyBodyStatus: 422, sample: `/api/v1/exam-cell/papers/${F.paper}/moderate` },
  { ...M, method: "GET", path: "/api/v1/exam-cell/papers/{paperId}/open", summary: "Open a sealed paper (application/pdf); every opening is logged and audited (autonomous).", access: W, response: c.okSchema, emptyBodyStatus: 403, sample: `/api/v1/exam-cell/papers/${NONE("zzexpaper")}/open` },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/printing", summary: "Printing lists per hall: seated and spare (autonomous).", access: W, request: c.printingBuildSchema, response: c.examActionResultSchema, emptyBodyStatus: 403, sample: S(F.conductSession) + "/printing" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/sessions/{sessionId}/assessment", summary: "Allot a bundle of answer books to an assessor (autonomous).", access: W, request: c.allocationSaveSchema, reach: "ownSchool", reachRefusal: "unprocessable", response: c.examActionResultSchema, emptyBodyStatus: 422, sample: S(F.conductSession) + "/assessment" },
  { ...M, method: "POST", path: "/api/v1/exam-cell/assessment/{allocationId}/return", summary: "A bundle back from its assessor (autonomous).", access: W, response: c.examActionResultSchema, emptyBodyStatus: 403, sample: `/api/v1/exam-cell/assessment/${F.allocation}/return` },
  { ...M, method: "GET", path: "/api/v1/exam-cell/duties", summary: "A faculty member's exam duties: invigilation, papers to set, bundles, remuneration.", access: ["FACULTY", "HOD"], reach: "self", reachRefusal: "filters", response: c.examDutiesSchema },
  { ...M, method: "GET", path: "/api/v1/exam-cell/mine", summary: "A student's own exams, or a guardian's child's under the RESULTS grant.", access: ["STUDENT", "PARENT"], request: c.myExamsQuerySchema, reach: "ownChild", reachRefusal: { STUDENT: "filters" }, response: c.myExamsSchema },
  { ...M, method: "POST", path: "/api/v1/exam-cell/mine/revaluations", summary: "Ask for a photocopy or a revaluation within the window; the fee becomes a demand.", access: ["STUDENT"], request: c.myRevaluationAskSchema, reach: "ownChild", response: c.examActionResultSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/exam-cell/mine/backlogs", summary: "Put an open backlog on one's form; refused after the seven-year limit.", access: ["STUDENT"], request: c.myBacklogAddSchema, reach: "ownChild", response: c.examActionResultSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/exam-cell/analytics", summary: "Pass rates by course, faculty and division, the trend, the first-year figures.", access: R, request: c.examAnalyticsQuerySchema, response: c.examAnalyticsSchema },
  { ...M, method: "POST", path: "/api/v1/exam-cell/signature", summary: "The controller's own signature for the papers they issue (a PNG data URL).", access: W, request: c.examSignatureSaveSchema, response: c.examActionResultSchema, emptyBodyStatus: 422 },
  // Signed out: the paper is real or not, nothing about the student. The printed address carries the college's id.
  { method: "GET", path: "/api/v1/public/exam-documents/{code}", summary: "Is a grade card, transcript, degree certificate or hall ticket real; nothing about the student. A grade card, transcript or degree is found by its code alone; a hall ticket needs ?school= (the college's id printed beside the code).", access: "anyone", response: c.examDocumentCheckSchema, sample: "/api/v1/public/exam-documents/ZZNOSUCHCODE" },
];
