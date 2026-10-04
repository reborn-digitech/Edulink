import { z } from "zod";

/**
 * college-exams: the college's exam cell (module EXAMS, role EXAM_CONTROLLER;
 * the owner's plan of 4 October 2026). Sessions with a form window, forms
 * checked against attendance eligibility and no-dues, hall tickets, seating,
 * invigilation, malpractice, remuneration; external marks by double entry or
 * the university's result file; grace with the principal's approval; result
 * runs under the scheme's grading table and passing rules; revaluation,
 * backlogs, grade cards, transcripts, credits for the Academic Bank; and, for
 * an autonomous college alone, question papers in a sealed store, printing
 * lists, central assessment and the convocation.
 *
 * MARKS ARE THOUSANDTHS (`…Milli`, 45.5 → 45500) as everywhere in this
 * codebase; money is paise; credits are tenths on the wire as plain numbers
 * (`credits: 3.5`), SGPA and CGPA plain numbers with two places.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const paise = z.number().int().min(0).max(10_000_000);
const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const EXAM_SESSION_KINDS = ["REGULAR", "SUPPLEMENTARY"] as const;
export const examSessionKindSchema = z.enum(EXAM_SESSION_KINDS);
/** DRAFT → FORMS (the window) → CONDUCT (forms locked, the sittings) → ASSESSMENT (marks) → PUBLISHED (a run published) → CLOSED. */
export const EXAM_SESSION_STATUSES = ["DRAFT", "FORMS", "CONDUCT", "ASSESSMENT", "PUBLISHED", "CLOSED"] as const;
export const examSessionStatusSchema = z.enum(EXAM_SESSION_STATUSES);
export type ExamSessionStatus = z.infer<typeof examSessionStatusSchema>;
export const EXAM_FORM_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REFUSED"] as const;
export const examFormStatusSchema = z.enum(EXAM_FORM_STATUSES);
export const EXAM_COURSE_KINDS = ["REGULAR", "BACKLOG"] as const;
export const examCourseKindSchema = z.enum(EXAM_COURSE_KINDS);
export const INVIGILATION_STATUSES = ["ASSIGNED", "SWAPPED", "DONE"] as const;
export const invigilationStatusSchema = z.enum(INVIGILATION_STATUSES);
/** What the unfair-means committee may decide. */
export const MALPRACTICE_DECISIONS = ["NO_ACTION", "WARNING", "CANCEL_PAPER", "CANCEL_SESSION", "DEBAR_NEXT"] as const;
export const malpracticeDecisionSchema = z.enum(MALPRACTICE_DECISIONS);
export const REMUNERATION_KINDS = ["SETTER", "MODERATOR", "INVIGILATOR", "ASSESSOR"] as const;
export const remunerationKindSchema = z.enum(REMUNERATION_KINDS);
/** Where a row of external marks came from. Every row after the first is a new version, never an edit. */
export const EXAM_MARK_SOURCES = ["IMPORT", "DOUBLE_ENTRY", "GRACE", "REVALUATION", "CORRECTION"] as const;
export const examMarkSourceSchema = z.enum(EXAM_MARK_SOURCES);
export const GRACE_STATUSES = ["PROPOSED", "APPROVED", "REFUSED"] as const;
export const graceStatusSchema = z.enum(GRACE_STATUSES);
/** The ordinance a grace proposal stands on: to pass a course, or to reach the next class. */
export const GRACE_RULES = ["TO_PASS", "TO_CLASS"] as const;
export const graceRuleSchema = z.enum(GRACE_RULES);
export const RESULT_RUN_STATUSES = ["DRAFT", "PUBLISHED", "SUPERSEDED"] as const;
export const resultRunStatusSchema = z.enum(RESULT_RUN_STATUSES);
/** A course's outcome: ATKT is a failed course the student may carry ("allowed to keep terms") within the scheme's limit. */
export const COURSE_RESULT_STATUSES = ["PASS", "FAIL", "ATKT", "ABSENT"] as const;
export const courseResultStatusSchema = z.enum(COURSE_RESULT_STATUSES);
export const TERM_RESULT_STATUSES = ["PASS", "ATKT", "FAIL"] as const;
export const termResultStatusSchema = z.enum(TERM_RESULT_STATUSES);
export const RESULT_CLASSES = ["DISTINCTION", "FIRST", "HIGHER_SECOND", "SECOND", "PASS"] as const;
export const resultClassSchema = z.enum(RESULT_CLASSES);
export const REVALUATION_KINDS = ["PHOTOCOPY", "REVAL"] as const;
export const revaluationKindSchema = z.enum(REVALUATION_KINDS);
export const REVALUATION_STATUSES = ["ASKED", "DECIDED", "WITHDRAWN"] as const;
export const revaluationStatusSchema = z.enum(REVALUATION_STATUSES);
/** PROVIDED is a photocopy's; UNCHANGED and CHANGED a revaluation's. */
export const REVALUATION_OUTCOMES = ["PROVIDED", "UNCHANGED", "CHANGED"] as const;
export const revaluationOutcomeSchema = z.enum(REVALUATION_OUTCOMES);
export const BACKLOG_STATUSES = ["OPEN", "CLEARED", "LAPSED"] as const;
export const backlogStatusSchema = z.enum(BACKLOG_STATUSES);
export const CREDIT_PUSH_STATUSES = ["PENDING", "SENT", "FAILED"] as const;
export const creditPushStatusSchema = z.enum(CREDIT_PUSH_STATUSES);
export const QUESTION_PAPER_STATUSES = ["ASSIGNED", "SUBMITTED", "MODERATED"] as const;
export const questionPaperStatusSchema = z.enum(QUESTION_PAPER_STATUSES);
export const ALLOCATION_STATUSES = ["ALLOTTED", "RETURNED"] as const;
export const allocationStatusSchema = z.enum(ALLOCATION_STATUSES);
/** The papers the exam cell issues with a serial and a public check; DEGREE is an autonomous college's alone. */
export const EXAM_DOCUMENT_KINDS = ["GRADE_CARD", "TRANSCRIPT", "DEGREE"] as const;
export const examDocumentKindSchema = z.enum(EXAM_DOCUMENT_KINDS);
export const CONVOCATION_STATUSES = ["DRAFT", "FINAL"] as const;
export const convocationStatusSchema = z.enum(CONVOCATION_STATUSES);

/**
 * THE BACKLOG LIMIT: a course failed may be carried and sat again for seven
 * years from the first failure, and is refused after (the owner's plan: "the
 * 7-year limit tracked"; most affiliating universities in Maharashtra allow a
 * degree within twice its length or N + 3 years — the owner confirms which).
 */
export const BACKLOG_LIMIT_YEARS = 7;
/** Days after a result is published within which a photocopy or revaluation may be asked. */
export const REVALUATION_WINDOW_DAYS = 15;

/**
 * THE FALLBACK GRADING TABLE, used only for a scheme that carries none: the
 * UGC's ten-point letter grades (Guidelines on adoption of CBCS, 2015), each
 * from its minimum percentage of the course's total.
 */
export const DEFAULT_GRADING_TABLE: readonly { grade: string; points: number; minPercent: number }[] = [
  { grade: "O", points: 10, minPercent: 90 },
  { grade: "A+", points: 9, minPercent: 80 },
  { grade: "A", points: 8, minPercent: 70 },
  { grade: "B+", points: 7, minPercent: 60 },
  { grade: "B", points: 6, minPercent: 55 },
  { grade: "C", points: 5, minPercent: 50 },
  { grade: "P", points: 4, minPercent: 40 },
  { grade: "F", points: 0, minPercent: 0 },
];

/**
 * THE FALLBACK PASSING RULES for a scheme that names none: 30 internal and 70
 * external on a hundred, 40 % in each head and overall, three failed courses
 * carried (ATKT), grace of at most 5 marks a course and 10 a session, and the
 * class bands by SGPA after the SPPU 2019 credit pattern (the scheme's own
 * `classBands` win). The owner confirms them against the university's
 * ordinance; nothing here is the university's text.
 */
export const DEFAULT_PASSING_RULES = {
  internalMax: 30,
  externalMax: 70,
  minInternalPercent: 40,
  minExternalPercent: 40,
  minTotalPercent: 40,
  atktLimit: 3,
  graceMaxPerCourse: 5,
  graceMaxPerSession: 10,
  classBands: [
    { cls: "DISTINCTION", minSgpa: 7.75 },
    { cls: "FIRST", minSgpa: 6.75 },
    { cls: "HIGHER_SECOND", minSgpa: 6.25 },
    { cls: "SECOND", minSgpa: 5.5 },
    { cls: "PASS", minSgpa: 4 },
  ] as { cls: (typeof RESULT_CLASSES)[number]; minSgpa: number }[],
} as const;

/** A late fee from a day on: the last slab whose day has come applies. */
export const examLateFeeSlabSchema = z.object({ fromDateKey: dateKey, paise });
export type ExamLateFeeSlab = z.infer<typeof examLateFeeSlabSchema>;

/* -------------------------------------------------------------------------- */
/* The controller's home and sessions                                          */
/* -------------------------------------------------------------------------- */

export const examSessionRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: examSessionKindSchema,
  termId: z.string(),
  termName: z.string(),
  status: examSessionStatusSchema,
  formOpensAt: iso.nullable(),
  formClosesAt: iso.nullable(),
  forms: z.number().int(),
  submitted: z.number().int(),
  approved: z.number().int(),
  publishedAt: iso.nullable(),
});
export type ExamSessionRow = z.infer<typeof examSessionRowSchema>;

/** GET /api/v1/exam-cell — the exam cell's home. */
export const examCellHomeSchema = z.object({
  autonomous: z.boolean(),
  canWrite: z.boolean(),
  canApproveGrace: z.boolean(),
  signatureSet: z.boolean(),
  terms: z.array(z.object({ id: z.string(), name: z.string() })),
  feeHeads: z.array(z.object({ id: z.string(), name: z.string() })),
  sessions: z.array(examSessionRowSchema),
  graceWaiting: z.array(z.object({ id: z.string(), sessionName: z.string(), courseCode: z.string(), studentName: z.string(), marks: z.number(), reason: z.string(), rule: graceRuleSchema })),
});
export type ExamCellHome = z.infer<typeof examCellHomeSchema>;

/** POST /api/v1/exam-cell/sessions — a new session; POST /api/v1/exam-cell/sessions/{sessionId} rewrites one (DRAFT or FORMS). */
export const examSessionSaveSchema = z.object({
  name: text(2, 120),
  kind: examSessionKindSchema.default("REGULAR"),
  termId: cuid,
  formOpensAt: iso.nullable().optional(),
  formClosesAt: iso.nullable().optional(),
  feePerCoursePaise: paise.default(0),
  feePerBacklogPaise: paise.default(0),
  photocopyFeePaise: paise.default(0),
  revalFeePaise: paise.default(0),
  lateFeeSlabs: z.array(examLateFeeSlabSchema).max(10).default([]),
  feeHeadId: cuid.nullable().optional(),
});
export type ExamSessionSave = z.infer<typeof examSessionSaveSchema>;

/** POST /api/v1/exam-cell/sessions/{sessionId}/status — forward through the session's steps. */
export const examSessionStatusSetSchema = z.object({ status: z.enum(["FORMS", "CONDUCT", "ASSESSMENT", "CLOSED"]) });

export const examFormCourseSchema = z.object({ courseId: z.string(), code: z.string(), name: z.string(), kind: examCourseKindSchema });
export const examFormRowSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  status: examFormStatusSchema,
  eligible: z.boolean(),
  noDues: z.boolean(),
  courses: z.array(examFormCourseSchema),
  feePaise: z.number().int(),
  lateFeePaise: z.number().int(),
  feeDemandId: z.string().nullable(),
  /** The demand's own status (OPEN | PART | PAID | WAIVED …), read from the ledger. */
  demandStatus: z.string().nullable(),
  submittedAt: iso.nullable(),
  lockedAt: iso.nullable(),
  refusalReason: z.string().nullable(),
  waiverReason: z.string().nullable(),
  hallTicket: z.object({ id: z.string(), number: z.string() }).nullable(),
});
export type ExamFormRow = z.infer<typeof examFormRowSchema>;

export const examRoomViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number().int(),
  seated: z.number().int(),
  invigilators: z.array(z.object({ id: z.string(), membershipId: z.string(), name: z.string(), status: invigilationStatusSchema })),
});
export const examScheduleViewSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  code: z.string(),
  name: z.string(),
  at: iso,
  durationMin: z.number().int(),
  expected: z.number().int(),
  rooms: z.array(examRoomViewSchema),
});
export type ExamScheduleView = z.infer<typeof examScheduleViewSchema>;

export const examRunViewSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  status: resultRunStatusSchema,
  computedAt: iso,
  publishedAt: iso.nullable(),
  reason: z.string().nullable(),
  students: z.number().int(),
  passed: z.number().int(),
  atkt: z.number().int(),
  failed: z.number().int(),
  passRatePercent: z.number(),
});

/** GET /api/v1/exam-cell/sessions/{sessionId} — one session, every part the cell works on. */
export const examSessionViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: examSessionKindSchema,
  termId: z.string(),
  termName: z.string(),
  status: examSessionStatusSchema,
  formOpensAt: iso.nullable(),
  formClosesAt: iso.nullable(),
  feePerCoursePaise: z.number().int(),
  feePerBacklogPaise: z.number().int(),
  photocopyFeePaise: z.number().int(),
  revalFeePaise: z.number().int(),
  lateFeeSlabs: z.array(examLateFeeSlabSchema),
  feeHeadId: z.string().nullable(),
  autonomous: z.boolean(),
  canWrite: z.boolean(),
  published: z.boolean(),
  courses: z.array(z.object({ courseId: z.string(), code: z.string(), name: z.string(), credits: z.number(), registered: z.number().int() })),
  forms: z.array(examFormRowSchema),
  schedule: z.array(examScheduleViewSchema),
  malpractice: z.array(z.object({ id: z.string(), scheduleId: z.string(), courseCode: z.string(), studentMembershipId: z.string(), studentName: z.string(), note: z.string(), decision: malpracticeDecisionSchema.nullable(), decisionNote: z.string().nullable(), decidedAt: iso.nullable() })),
  remuneration: z.array(z.object({ id: z.string(), staffMembershipId: z.string(), name: z.string(), kind: remunerationKindSchema, count: z.number().int(), ratePaise: z.number().int(), amountPaise: z.number().int(), duties: z.number().int() })),
  staff: z.array(z.object({ membershipId: z.string(), name: z.string(), role: z.string() })),
  runs: z.array(examRunViewSchema),
  graces: z.array(z.object({ id: z.string(), courseId: z.string(), courseCode: z.string(), studentMembershipId: z.string(), studentName: z.string(), marks: z.number(), rule: graceRuleSchema, reason: z.string(), status: graceStatusSchema, decisionNote: z.string().nullable(), decidedAt: iso.nullable() })),
  notes: z.array(z.object({ id: z.string(), courseCode: z.string().nullable(), note: z.string(), at: iso, by: z.string() })),
  marks: z.array(z.object({ courseId: z.string(), code: z.string(), expected: z.number().int(), matched: z.number().int(), mismatched: z.number().int(), pending: z.number().int() })),
});
export type ExamSessionView = z.infer<typeof examSessionViewSchema>;

/** What most of the cell's writes answer: done, and the row they made or touched. */
export const examActionResultSchema = z.object({ ok: z.literal(true), id: z.string().nullable(), count: z.number().int().nullable() });
export type ExamActionResult = z.infer<typeof examActionResultSchema>;

/* -------------------------------------------------------------------------- */
/* Forms                                                                        */
/* -------------------------------------------------------------------------- */

/** POST /api/v1/exam-cell/forms/{formId}/decide — approve (the fee waived with a reason, if so) or refuse with one. */
export const examFormDecideSchema = z
  .object({ approve: z.boolean(), waiveFee: z.boolean().default(false), reason: z.string().trim().max(300).optional() })
  .refine((v) => (v.approve && !v.waiveFee) || (v.reason ?? "").length >= 3, { message: "reason", path: ["reason"] });

/* -------------------------------------------------------------------------- */
/* Logistics                                                                    */
/* -------------------------------------------------------------------------- */

export const examScheduleSaveSchema = z.object({ courseId: cuid, at: iso, durationMin: z.number().int().min(30).max(360).default(180) });
export const examRoomSaveSchema = z.object({ scheduleId: cuid, name: text(1, 60), capacity: z.number().int().min(2).max(500), roomId: cuid.nullable().optional() });
export const examSeatingBuildSchema = z.object({ scheduleId: cuid.optional() });
/** GET /api/v1/exam-cell/schedules/{scheduleId}/seating — who sits where. */
export const examSeatingSchema = z.object({
  scheduleId: z.string(),
  code: z.string(),
  name: z.string(),
  at: iso,
  rooms: z.array(z.object({ id: z.string(), name: z.string(), capacity: z.number().int(), seats: z.array(z.object({ seatNo: z.number().int(), studentMembershipId: z.string(), name: z.string(), ticket: z.string().nullable() })) })),
  unseated: z.array(z.object({ studentMembershipId: z.string(), name: z.string() })),
});
export type ExamSeating = z.infer<typeof examSeatingSchema>;
export const invigilationAssignSchema = z.object({ examRoomId: cuid, staffMembershipId: cuid });
export const invigilationSwapSchema = z.object({ staffMembershipId: cuid, note: text(3, 300) });
export const malpracticeReportSchema = z.object({ scheduleId: cuid, studentMembershipId: cuid, note: text(5, 1000) });
export const malpracticeDecideSchema = z.object({ decision: malpracticeDecisionSchema, note: text(3, 1000) });
export const remunerationSaveSchema = z.object({ staffMembershipId: cuid, kind: remunerationKindSchema, count: z.number().int().min(0).max(1000), ratePaise: paise });

/* -------------------------------------------------------------------------- */
/* Marks                                                                        */
/* -------------------------------------------------------------------------- */

const entrySchema = z.object({ milli: z.number().int().nullable(), absent: z.boolean(), by: z.string() }).nullable();
/** GET /api/v1/exam-cell/sessions/{sessionId}/marks?courseId= — one course's sheet. */
export const examMarksSheetSchema = z.object({
  courseId: z.string(),
  code: z.string(),
  name: z.string(),
  externalMaxMilli: z.number().int(),
  internalMaxMilli: z.number().int(),
  published: z.boolean(),
  canEnter: z.boolean(),
  rows: z.array(
    z.object({
      studentMembershipId: z.string(),
      name: z.string(),
      code: z.string().nullable(),
      ticket: z.string().nullable(),
      internalMilli: z.number().int().nullable(),
      internalLocked: z.boolean(),
      entry1: entrySchema,
      entry2: entrySchema,
      externalMilli: z.number().int().nullable(),
      absent: z.boolean(),
      matched: z.boolean(),
      graceMilli: z.number().int(),
      version: z.number().int(),
      source: examMarkSourceSchema.nullable(),
    }),
  ),
  mismatches: z.number().int(),
});
export type ExamMarksSheet = z.infer<typeof examMarksSheetSchema>;
export const examMarksQuerySchema = z.object({ courseId: cuid });

/** POST /api/v1/exam-cell/sessions/{sessionId}/marks — one person's entry of a course's external marks. The first person's is entry one, a second person's entry two; they must agree. */
export const examMarksEntrySchema = z.object({
  courseId: cuid,
  entries: z.array(z.object({ studentMembershipId: cuid, marks: z.number().min(0).max(1000).nullable(), absent: z.boolean().default(false) })).min(1).max(500),
});
export const examMarksEntryResultSchema = z.object({ matched: z.number().int(), mismatched: z.number().int(), pending: z.number().int() });
/** POST /api/v1/exam-cell/sessions/{sessionId}/marks/import — the university's result file, pasted. */
export const examMarksImportSchema = z.object({ text: z.string().min(10).max(500_000) });
export const examMarksImportResultSchema = z.object({
  created: z.number().int(),
  updated: z.number().int(),
  unchanged: z.number().int(),
  unmatched: z.array(z.object({ line: z.number().int(), key: z.string(), reason: z.string() })),
});
/** POST /api/v1/exam-cell/sessions/{sessionId}/marks/correct — after publication, a new row with a reason, never an edit. */
export const examMarkCorrectSchema = z.object({ courseId: cuid, studentMembershipId: cuid, marks: z.number().min(0).max(1000).nullable(), absent: z.boolean().default(false), reason: text(5, 300) });
export const graceProposeSchema = z.object({ courseId: cuid, studentMembershipId: cuid, marks: z.number().min(0.5).max(20), rule: graceRuleSchema, reason: text(5, 300) });
export const graceDecideSchema = z.object({ approve: z.boolean(), note: z.string().trim().max(300).optional() });
export const moderationNoteSchema = z.object({ courseId: cuid.nullable().optional(), note: text(5, 2000) });

/* -------------------------------------------------------------------------- */
/* Results                                                                      */
/* -------------------------------------------------------------------------- */

export const examResultRunSchema = z.object({ reason: z.string().trim().max(300).optional() });
export const examResultPublishSchema = z.object({ runId: cuid });
export const courseResultViewSchema = z.object({
  courseId: z.string(),
  code: z.string(),
  name: z.string(),
  credits: z.number(),
  internalMilli: z.number().int().nullable(),
  externalMilli: z.number().int().nullable(),
  graceMilli: z.number().int(),
  totalMilli: z.number().int(),
  maxMilli: z.number().int(),
  grade: z.string(),
  points: z.number(),
  status: courseResultStatusSchema,
});
export type CourseResultView = z.infer<typeof courseResultViewSchema>;
export const termResultViewSchema = z.object({
  studentMembershipId: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  sgpa: z.number().nullable(),
  creditsAttempted: z.number(),
  creditsEarned: z.number(),
  status: termResultStatusSchema,
  cls: resultClassSchema.nullable(),
  courses: z.array(courseResultViewSchema),
});
export type TermResultView = z.infer<typeof termResultViewSchema>;
/** GET /api/v1/exam-cell/sessions/{sessionId}/results?runId= — a run's results (the latest when no run is named). */
export const examResultsSchema = z.object({ run: examRunViewSchema.nullable(), rows: z.array(termResultViewSchema) });
export type ExamResults = z.infer<typeof examResultsSchema>;
export const examResultsQuerySchema = z.object({ runId: cuid.optional() });

/* -------------------------------------------------------------------------- */
/* After results                                                                */
/* -------------------------------------------------------------------------- */

export const revaluationRowSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  courseId: z.string(),
  courseCode: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  kind: revaluationKindSchema,
  feePaise: z.number().int(),
  demandStatus: z.string().nullable(),
  status: revaluationStatusSchema,
  outcome: revaluationOutcomeSchema.nullable(),
  oldExternalMilli: z.number().int().nullable(),
  newExternalMilli: z.number().int().nullable(),
  askedAt: iso,
  decidedAt: iso.nullable(),
});
export type RevaluationRow = z.infer<typeof revaluationRowSchema>;
export const backlogRowSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  courseId: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  status: backlogStatusSchema,
  attempts: z.number().int(),
  firstFailedAt: iso,
  /** The last day it may still be sat (BACKLOG_LIMIT_YEARS from the first failure). */
  lastDay: dateKey,
  clearedAt: iso.nullable(),
});
export type BacklogRow = z.infer<typeof backlogRowSchema>;
export const examDocumentRowSchema = z.object({
  id: z.string(),
  kind: examDocumentKindSchema,
  serial: z.string(),
  code: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  issuedAt: iso,
  revokedAt: iso.nullable(),
});
export type ExamDocumentRow = z.infer<typeof examDocumentRowSchema>;
export const creditPushRowSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  termId: z.string(),
  termName: z.string(),
  credits: z.number(),
  apaarId: z.string().nullable(),
  abcRef: z.string().nullable(),
  status: creditPushStatusSchema,
  pushedAt: iso.nullable(),
});
export type CreditPushRow = z.infer<typeof creditPushRowSchema>;
/** GET /api/v1/exam-cell/after — revaluations, backlogs, the papers issued, credits for the Academic Bank, the convocation. */
export const examAfterSchema = z.object({
  autonomous: z.boolean(),
  canWrite: z.boolean(),
  revaluations: z.array(revaluationRowSchema),
  backlogs: z.array(backlogRowSchema),
  documents: z.array(examDocumentRowSchema),
  credits: z.array(creditPushRowSchema),
  /** Whether a send to the Academic Bank is wired at all (ABC_STUB_SEND); real ABC is not. */
  abcConnected: z.boolean(),
  students: z.array(z.object({ membershipId: z.string(), name: z.string(), code: z.string().nullable() })),
  convocations: z.array(z.object({ year: z.number().int(), status: convocationStatusSchema, graduates: z.number().int(), finalizedAt: iso.nullable() })),
});
export type ExamAfter = z.infer<typeof examAfterSchema>;
export const revaluationDecideSchema = z.object({ outcome: revaluationOutcomeSchema, marks: z.number().min(0).max(1000).nullable().optional(), note: z.string().trim().max(300).optional() });
export const examDocumentIssueSchema = z.object({ kind: examDocumentKindSchema, studentMembershipId: cuid });
export const creditPushSendSchema = z.object({ termId: cuid.optional() });
export const convocationBuildSchema = z.object({ year: z.number().int().min(2000).max(2100), finalize: z.boolean().default(false) });

/** GET /api/v1/public/exam-documents/{code} — is the paper real; nothing about the student. */
export const examDocumentCheckSchema = z.object({
  valid: z.boolean(),
  kind: z.enum([...EXAM_DOCUMENT_KINDS, "HALL_TICKET"]).nullable(),
  serial: z.string().nullable(),
  schoolName: z.string().nullable(),
  issuedAt: iso.nullable(),
  revokedAt: iso.nullable(),
});
export type ExamDocumentCheck = z.infer<typeof examDocumentCheckSchema>;

/* -------------------------------------------------------------------------- */
/* Autonomous conduct                                                           */
/* -------------------------------------------------------------------------- */

export const coMapEntrySchema = z.object({ question: text(1, 20), co: text(1, 20), marks: z.number().min(0).max(200) });
/** GET /api/v1/exam-cell/sessions/{sessionId}/conduct — papers, printing lists, assessment bundles (autonomous only). */
export const examConductSchema = z.object({
  papers: z.array(z.object({ id: z.string(), scheduleId: z.string(), courseCode: z.string(), setterMembershipId: z.string(), setterName: z.string(), status: questionPaperStatusSchema, coMap: z.array(coMapEntrySchema), fileName: z.string().nullable(), sizeBytes: z.number().int().nullable(), submittedAt: iso.nullable(), moderatedAt: iso.nullable(), moderationNote: z.string().nullable(), opens: z.number().int() })),
  printing: z.array(z.object({ id: z.string(), scheduleId: z.string(), courseCode: z.string(), roomName: z.string(), seated: z.number().int(), spare: z.number().int(), count: z.number().int() })),
  allocations: z.array(z.object({ id: z.string(), scheduleId: z.string(), courseCode: z.string(), assessorMembershipId: z.string(), assessorName: z.string(), bundle: z.string(), count: z.number().int(), status: allocationStatusSchema })),
});
export type ExamConduct = z.infer<typeof examConductSchema>;
export const paperAssignSchema = z.object({ scheduleId: cuid, setterMembershipId: cuid });
/** POST /api/v1/exam-cell/papers/{paperId}/submit — the setter's paper (a PDF, base64, at most 2 MB) and its outcome map. */
export const paperSubmitSchema = z.object({ fileName: text(1, 120), mime: z.literal("application/pdf"), dataBase64: z.string().min(8).max(2_800_000), coMap: z.array(coMapEntrySchema).min(1).max(60) });
export const paperModerateSchema = z.object({ note: text(3, 1000) });
export const printingBuildSchema = z.object({ spare: z.number().int().min(0).max(50).default(2) });
export const allocationSaveSchema = z.object({ scheduleId: cuid, assessorMembershipId: cuid, bundle: text(1, 40), count: z.number().int().min(1).max(500) });

/* -------------------------------------------------------------------------- */
/* Faculty duties, the student's own, analytics                                 */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/exam-cell/duties — a faculty member's exam duties: invigilation, papers to set, bundles to assess, remuneration. */
export const examDutiesSchema = z.object({
  invigilation: z.array(z.object({ id: z.string(), sessionName: z.string(), courseCode: z.string(), at: iso, roomName: z.string(), status: invigilationStatusSchema })),
  papers: z.array(z.object({ id: z.string(), sessionName: z.string(), courseCode: z.string(), at: iso, status: questionPaperStatusSchema })),
  bundles: z.array(z.object({ id: z.string(), sessionName: z.string(), courseCode: z.string(), bundle: z.string(), count: z.number().int(), status: allocationStatusSchema })),
  remuneration: z.array(z.object({ sessionName: z.string(), kind: remunerationKindSchema, count: z.number().int(), amountPaise: z.number().int() })),
});
export type ExamDuties = z.infer<typeof examDutiesSchema>;

export const myExamFormSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  status: examFormStatusSchema,
  courses: z.array(examFormCourseSchema),
  eligible: z.boolean(),
  eligibilityNote: z.string().nullable(),
  noDues: z.boolean(),
  noDuesLines: z.array(z.object({ desk: z.string(), cleared: z.boolean(), owedPaise: z.number().int(), itemsOut: z.number().int() })),
  feePaise: z.number().int(),
  lateFeePaise: z.number().int(),
  demandStatus: z.string().nullable(),
  opensAt: iso.nullable(),
  closesAt: iso.nullable(),
  windowOpen: z.boolean(),
  refusalReason: z.string().nullable(),
  /** Open backlogs not yet on this form that may still be sat. */
  backlogsToAdd: z.array(z.object({ courseId: z.string(), code: z.string(), name: z.string() })),
});
export type MyExamForm = z.infer<typeof myExamFormSchema>;

/** GET /api/v1/exam-cell/mine — a student's own exams, or (with childId) a guardian's child's under the RESULTS grant. */
export const myExamsSchema = z.object({
  name: z.string(),
  canAct: z.boolean(),
  forms: z.array(myExamFormSchema),
  tickets: z.array(z.object({ id: z.string(), number: z.string(), sessionName: z.string() })),
  seating: z.array(z.object({ courseCode: z.string(), courseName: z.string(), at: iso, roomName: z.string(), seatNo: z.number().int() })),
  results: z.array(z.object({ sessionId: z.string(), sessionName: z.string(), publishedAt: iso.nullable(), revaluationOpenUntil: dateKey.nullable(), result: termResultViewSchema })),
  cgpa: z.number().nullable(),
  creditsEarned: z.number(),
  documents: z.array(examDocumentRowSchema),
  revaluations: z.array(revaluationRowSchema),
  backlogs: z.array(backlogRowSchema),
  credits: z.array(creditPushRowSchema),
});
export type MyExams = z.infer<typeof myExamsSchema>;
export const myExamsQuerySchema = z.object({ childId: cuid.optional() });
export const myRevaluationAskSchema = z.object({ sessionId: cuid, courseId: cuid, kind: revaluationKindSchema });
export const myBacklogAddSchema = z.object({ sessionId: cuid, courseId: cuid });
export const examSignatureSaveSchema = z.object({ image: z.string().min(30).max(400_000) });

export const passRateRowSchema = z.object({ key: z.string(), label: z.string(), appeared: z.number().int(), passed: z.number().int(), passRatePercent: z.number() });
export type PassRateRow = z.infer<typeof passRateRowSchema>;
/** GET /api/v1/exam-cell/analytics — pass rates from published runs: by course, faculty and division, the trend, and the first-year figures NBA asks for. */
export const examAnalyticsSchema = z.object({
  termId: z.string().nullable(),
  terms: z.array(z.object({ id: z.string(), name: z.string() })),
  byCourse: z.array(passRateRowSchema),
  byFaculty: z.array(passRateRowSchema),
  byDivision: z.array(passRateRowSchema),
  trend: z.array(z.object({ sessionId: z.string(), sessionName: z.string(), publishedAt: iso.nullable(), passRatePercent: z.number(), appeared: z.number().int() })),
  /** NBA's first-year academic performance index: mean first-year CGPA × the share who passed; and the success rate (passed without a backlog). */
  firstYear: z.object({ appeared: z.number().int(), meanSgpa: z.number().nullable(), api: z.number().nullable(), successRatePercent: z.number().nullable() }),
});
export type ExamAnalytics = z.infer<typeof examAnalyticsSchema>;
export const examAnalyticsQuerySchema = z.object({ termId: cuid.optional() });
