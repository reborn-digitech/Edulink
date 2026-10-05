import { z } from "zod";
import { streamSchema } from "./streams";

/**
 * THE COLLEGE'S ACADEMICS (module ACADEMICS, roles FACULTY and HOD; the
 * owner's plan of 4 October 2026). The office sets the college up —
 * departments, programmes, the university's scheme with its grading table
 * and passing rules, courses with outcomes, terms with a registration window,
 * divisions, rooms — and offers each course in a term to a division or as a
 * shared elective, with a faculty member and a weekly load. Students register
 * within the window and the scheme's credits; faculty mark each lecture, keep
 * the course file, and enter internal marks a colleague countersigns and the
 * HOD releases and locks. Attendance percentages and outcome attainment are
 * computed on read and never stored; the one stored derived value is the
 * internal total frozen at the lock (InternalLock, with a data:audit check).
 *
 * Coded lists here, never free text where a code is meant.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const code = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9][A-Za-z0-9\-/.]*$/, "code");

export const PROGRAMME_LEVELS = ["UG", "PG", "DIPLOMA"] as const;
export const programmeLevelSchema = z.enum(PROGRAMME_LEVELS);
/**
 * The regulator a programme answers to; its attendance rule follows (AICTE and UGC 75 %, PCI 80 %, BCI 70 %).
 * The streams (5 Oct 2026, ./streams.ts) added the Council of Architecture (COA), the National Medical
 * Commission (NMC), the Indian Council of Agricultural Research (ICAR), the Dental Council of India (DCI)
 * and the Indian Nursing Council (INC); a new programme defaults to its stream's first regulator.
 */
export const REGULATORS = ["AICTE", "UGC", "PCI", "BCI", "NCTE", "COA", "NMC", "ICAR", "DCI", "INC", "OTHER"] as const;
export const regulatorSchema = z.enum(REGULATORS);
export type Regulator = z.infer<typeof regulatorSchema>;
/**
 * The attendance threshold a new programme starts with, by regulator: pharmacy 80, nursing 80 (INC's
 * syllabus asks 80 % in theory and practical), law 70, everyone else 75 (UGC, AICTE, NCTE, COA, NMC,
 * ICAR, DCI). The office may change it per programme.
 */
export function defaultAttendanceThreshold(regulator: string): number {
  return regulator === "PCI" || regulator === "INC" ? 80 : regulator === "BCI" ? 70 : 75;
}
export const COURSE_KINDS = ["CORE", "ELECTIVE", "MINOR", "HONOURS", "OPEN"] as const;
export const courseKindSchema = z.enum(COURSE_KINDS);
export type CourseKind = z.infer<typeof courseKindSchema>;
export const LECTURE_KINDS = ["LECTURE", "LAB", "TUTORIAL"] as const;
export const lectureKindSchema = z.enum(LECTURE_KINDS);
export const LECTURE_MARKS = ["PRESENT", "ABSENT", "LATE"] as const;
export const lectureMarkSchema = z.enum(LECTURE_MARKS);
export type LectureMark = z.infer<typeof lectureMarkSchema>;
export const ROOM_KINDS = ["CLASSROOM", "LAB", "SEMINAR", "OTHER"] as const;
export const roomKindSchema = z.enum(ROOM_KINDS);
export const CONDONATION_GROUNDS = ["MEDICAL", "SPORTS", "NCC_NSS", "CULTURAL", "BEREAVEMENT", "OTHER"] as const;
export const condonationGroundSchema = z.enum(CONDONATION_GROUNDS);
/** ASKED → (HOD) HOD_APPROVED, FORWARDED or REFUSED; FORWARDED → (principal) PRINCIPAL_APPROVED or REFUSED. */
export const CONDONATION_STATUSES = ["ASKED", "HOD_APPROVED", "FORWARDED", "PRINCIPAL_APPROVED", "REFUSED"] as const;
export const condonationStatusSchema = z.enum(CONDONATION_STATUSES);
export const INTERNAL_KINDS = ["UNIT_TEST", "ASSIGNMENT", "PRACTICAL", "VIVA", "PROJECT"] as const;
export const internalKindSchema = z.enum(INTERNAL_KINDS);
export const MENTOR_FLAGS = ["NONE", "SLOW", "ADVANCED", "COUNSELLING"] as const;
export const mentorFlagSchema = z.enum(MENTOR_FLAGS);
export const COURSE_FILE_ITEM_KINDS = ["RESOURCE", "NOTES", "QUESTION_PAPER", "MODEL_ANSWER", "LINK"] as const;
export const courseFileItemKindSchema = z.enum(COURSE_FILE_ITEM_KINDS);
/** The awards of NEP's multiple exits (UGC curriculum and credit framework): a certificate after a year, a diploma after two, the degree after three, honours after four. */
export const EXIT_AWARDS = ["CERTIFICATE", "DIPLOMA", "DEGREE", "HONOURS_DEGREE"] as const;
export const exitAwardSchema = z.enum(EXIT_AWARDS);
/** The UGC's ten-point letter grades; a scheme's table maps each to its points and lowest percentage. */
export const GRADE_LETTERS = ["O", "A+", "A", "B+", "B", "C", "P", "F", "AB"] as const;
export const gradeLetterSchema = z.enum(GRADE_LETTERS);
export const SEAT_STATUSES = ["ACTIVE", "EXITED", "COMPLETED"] as const;
export const seatStatusSchema = z.enum(SEAT_STATUSES);

/* ------------------------------------------------------------- the scheme */

export const exitPointSchema = z.object({ afterYear: z.number().int().min(1).max(5), award: exitAwardSchema, credits: z.number().int().min(1).max(400) });
export type ExitPoint = z.infer<typeof exitPointSchema>;
export const gradeRowSchema = z.object({ grade: gradeLetterSchema, points: z.number().min(0).max(10), minPercent: z.number().int().min(0).max(100) });
export type GradeRow = z.infer<typeof gradeRowSchema>;
/** A scheme's passing rules: what the exams builder grades by, and what registration counts credits against. */
export const passingRulesSchema = z.object({
  /** The lowest percentage that passes a course. */
  minPercentPerCourse: z.number().int().min(0).max(100),
  /** How many courses a student may carry forward and still keep terms (ATKT). */
  atktLimit: z.number().int().min(0).max(20),
  /** The credits the whole programme needs (UGC: 40 a year — 120 for three, 160 for four). */
  totalCredits: z.number().int().min(1).max(400),
  /** The internal assessment's share of a course, in marks: the components' weights must add to this. */
  internalMax: z.number().int().min(1).max(200),
  /** The university's share, in marks. */
  externalMax: z.number().int().min(0).max(200),
  /** The credits a student registers for in one term, at least and at most. */
  minTermCredits: z.number().int().min(0).max(60),
  maxTermCredits: z.number().int().min(1).max(60),
});
export type PassingRules = z.infer<typeof passingRulesSchema>;
export const outcomeSchema = z.object({ code: z.string().trim().regex(/^[A-Z]{1,4}\d{1,2}$/, "code"), text: z.string().trim().min(2).max(400) });
export type Outcome = z.infer<typeof outcomeSchema>;

/* --------------------------------------------------------------- reads */

export const academicsSettingsSchema = z.object({
  loadMinHours: z.number().int().min(0).max(60),
  loadMaxHours: z.number().int().min(1).max(60),
  studentsPerFaculty: z.number().int().min(1).max(200),
  menteesPerMentor: z.number().int().min(1).max(200),
});
export type AcademicsSettings = z.infer<typeof academicsSettingsSchema>;

export const departmentSchema = z.object({ id: cuid, code: z.string(), name: z.string(), hodMembershipId: cuid.nullable(), hodName: z.string().nullable(), condoneFloorPercent: z.number().int(), faculty: z.number().int(), students: z.number().int() });
export const programmeSchema = z.object({ id: cuid, departmentId: cuid, code: z.string(), name: z.string(), level: programmeLevelSchema, durationYears: z.number().int(), intake: z.number().int(), regulator: regulatorSchema, attendanceThreshold: z.number().int(), exitPoints: z.array(exitPointSchema), /** The college stream the programme belongs to (5 Oct 2026); null until the registrar picks one. Optional so an older server's answer still parses. */ stream: streamSchema.nullable().default(null) });
export const schemeSchema = z.object({ id: cuid, programmeId: cuid, name: z.string(), effectiveYear: z.number().int(), gradingTable: z.array(gradeRowSchema), passingRules: passingRulesSchema });
export const courseSchema = z.object({ id: cuid, schemeId: cuid, code: z.string(), name: z.string(), semester: z.number().int(), creditsL: z.number().int(), creditsT: z.number().int(), creditsP: z.number().int(), credits: z.number().int(), kind: courseKindSchema, outcomes: z.array(outcomeSchema), mapping: z.array(z.object({ coCode: z.string(), poCode: z.string(), level: z.number().int().min(1).max(3) })) });
export const termSchema = z.object({ id: cuid, name: z.string(), academicYear: z.string(), startsOn: dateKey, endsOn: dateKey, registrationOpensOn: dateKey, registrationClosesOn: dateKey, registrationOpen: z.boolean() });
export const roomSchema = z.object({ id: cuid, name: z.string(), capacity: z.number().int(), kind: roomKindSchema });
export const divisionSchema = z.object({ id: cuid, classId: cuid, programmeId: cuid, name: z.string(), yearOfStudy: z.number().int(), academicYear: z.string(), students: z.number().int() });
export const periodSchema = z.object({ id: cuid, name: z.string(), startMinute: z.number().int(), endMinute: z.number().int() });
export const facultyRowSchema = z.object({ membershipId: cuid, name: z.string(), role: z.enum(["FACULTY", "HOD"]), departmentId: cuid.nullable() });

/** GET /api/v1/academics/structure — the college's academic structure in one read. */
export const academicsStructureSchema = z.object({
  settings: academicsSettingsSchema,
  departments: z.array(departmentSchema),
  programmes: z.array(programmeSchema),
  programmeOutcomes: z.array(z.object({ programmeId: cuid, code: z.string(), text: z.string() })),
  schemes: z.array(schemeSchema),
  courses: z.array(courseSchema),
  terms: z.array(termSchema),
  rooms: z.array(roomSchema),
  divisions: z.array(divisionSchema),
  periods: z.array(periodSchema),
  faculty: z.array(facultyRowSchema),
  canEdit: z.boolean(),
});
export type AcademicsStructure = z.infer<typeof academicsStructureSchema>;

/* -------------------------------------------------------------- writes */

export const academicsSettingsSaveSchema = academicsSettingsSchema.refine((s) => s.loadMinHours <= s.loadMaxHours, { message: "range", path: ["loadMinHours"] });
export const departmentSaveSchema = z.object({ id: cuid.optional(), code, name: z.string().trim().min(2).max(120), hodMembershipId: cuid.nullable(), condoneFloorPercent: z.number().int().min(0).max(100) });
export const facultyDepartmentSaveSchema = z.object({ membershipId: cuid, departmentId: cuid.nullable() });
export const programmeSaveSchema = z.object({
  id: cuid.optional(),
  departmentId: cuid,
  code,
  name: z.string().trim().min(2).max(160),
  level: programmeLevelSchema,
  durationYears: z.number().int().min(1).max(6),
  intake: z.number().int().min(0).max(5000),
  /** Left out: the stream's default regulator (defaultRegulatorFor in ./streams.ts); one of the two must be given. */
  regulator: regulatorSchema.optional(),
  /** The college stream (5 Oct 2026): one of the college's own; null clears it. */
  stream: streamSchema.nullable().optional(),
  /** Left out: the regulator's default (defaultAttendanceThreshold). */
  attendanceThreshold: z.number().int().min(1).max(100).optional(),
  exitPoints: z.array(exitPointSchema).max(6),
});
export const schemeSaveSchema = z.object({
  id: cuid.optional(),
  programmeId: cuid,
  name: z.string().trim().min(2).max(120),
  effectiveYear: z.number().int().min(2000).max(2100),
  gradingTable: z.array(gradeRowSchema).min(2).max(GRADE_LETTERS.length),
  passingRules: passingRulesSchema,
});
export const courseSaveSchema = z.object({
  id: cuid.optional(),
  schemeId: cuid,
  code,
  name: z.string().trim().min(2).max(160),
  semester: z.number().int().min(1).max(12),
  creditsL: z.number().int().min(0).max(12),
  creditsT: z.number().int().min(0).max(12),
  creditsP: z.number().int().min(0).max(12),
  kind: courseKindSchema,
  outcomes: z.array(outcomeSchema).max(12),
});
export const programmeOutcomesSaveSchema = z.object({ programmeId: cuid, outcomes: z.array(outcomeSchema).max(20) });
export const courseMappingSaveSchema = z.object({ rows: z.array(z.object({ coCode: z.string().trim().min(1).max(8), poCode: z.string().trim().min(1).max(8), level: z.number().int().min(1).max(3) })).max(240) });
export const termSaveSchema = z.object({ id: cuid.optional(), name: z.string().trim().min(2).max(80), academicYear: z.string().trim().regex(/^\d{4}[–-]\d{2}$/, "year"), startsOn: dateKey, endsOn: dateKey, registrationOpensOn: dateKey, registrationClosesOn: dateKey });
export const roomSaveSchema = z.object({ id: cuid.optional(), name: z.string().trim().min(1).max(60), capacity: z.number().int().min(1).max(2000), kind: roomKindSchema });
export const divisionSaveSchema = z.object({ programmeId: cuid, yearOfStudy: z.number().int().min(1).max(6), name: z.string().trim().min(1).max(60), academicYear: z.string().trim().regex(/^\d{4}[–-]\d{2}$/, "year") });

/** A student's seat in a programme, as the office records it. */
export const seatSaveSchema = z.object({
  studentMembershipId: cuid,
  programmeId: cuid,
  schemeId: cuid,
  entryYear: z.number().int().min(2000).max(2100),
  yearOfStudy: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
  divisionId: cuid.nullable(),
  rollNumber: z.number().int().min(1).max(9999).nullable(),
  /** The university's permanent registration number, as it issues it. */
  prn: z.string().trim().regex(/^[A-Za-z0-9]{4,20}$/, "prn").nullable(),
});
export const seatSchema = z.object({ studentMembershipId: cuid, name: z.string(), studentCode: z.string().nullable(), programmeId: cuid, programmeCode: z.string(), schemeId: cuid, entryYear: z.number().int(), yearOfStudy: z.number().int(), semester: z.number().int(), divisionId: cuid.nullable(), divisionName: z.string().nullable(), rollNumber: z.number().int().nullable(), prn: z.string().nullable(), status: seatStatusSchema });
export const seatsSchema = z.object({ seats: z.array(seatSchema), unseated: z.array(z.object({ studentMembershipId: cuid, name: z.string(), studentCode: z.string().nullable() })) });
export const seatsQuerySchema = z.object({ programmeId: cuid.optional() });

/* ------------------------------------------------------------- offerings */

export const offeringSchema = z.object({
  id: cuid,
  termId: cuid,
  courseId: cuid,
  courseCode: z.string(),
  courseName: z.string(),
  kind: courseKindSchema,
  credits: z.number().int(),
  semester: z.number().int(),
  departmentId: cuid,
  divisionId: cuid.nullable(),
  divisionName: z.string().nullable(),
  facultyMembershipId: cuid.nullable(),
  facultyName: z.string().nullable(),
  lectureHours: z.number().int(),
  tutorialHours: z.number().int(),
  practicalHours: z.number().int(),
  roomId: cuid.nullable(),
  capacity: z.number().int().nullable(),
  registered: z.number().int(),
});
export type Offering = z.infer<typeof offeringSchema>;
export const offeringsQuerySchema = z.object({ termId: cuid.optional(), departmentId: cuid.optional() });
export const offeringsSchema = z.object({
  termId: cuid.nullable(),
  offerings: z.array(offeringSchema),
  /** Each faculty member's weekly hours this term against the college's load limits. */
  load: z.array(z.object({ membershipId: cuid, name: z.string(), departmentId: cuid.nullable(), hours: z.number().int(), state: z.enum(["UNDER", "WITHIN", "OVER"]) })),
  /** Students per faculty member by department, against the AICTE ratio (shown, never enforced). */
  ratios: z.array(z.object({ departmentId: cuid, name: z.string(), students: z.number().int(), faculty: z.number().int(), perFaculty: z.number().nullable(), norm: z.number().int(), withinNorm: z.boolean() })),
  settings: academicsSettingsSchema,
});
export const offeringSaveSchema = z.object({
  id: cuid.optional(),
  termId: cuid,
  courseId: cuid,
  divisionId: cuid.nullable(),
  facultyMembershipId: cuid.nullable(),
  lectureHours: z.number().int().min(0).max(20),
  tutorialHours: z.number().int().min(0).max(20),
  practicalHours: z.number().int().min(0).max(20),
  roomId: cuid.nullable(),
  capacity: z.number().int().min(1).max(2000).nullable(),
});

/* ------------------------------------------------------------- timetable */

export const timetableQuerySchema = z.object({ termId: cuid.optional(), divisionId: cuid.optional(), facultyMembershipId: cuid.optional(), roomId: cuid.optional() });
export const timetableCellSchema = z.object({ slotId: cuid, offeringId: cuid, weekday: z.number().int().min(0).max(6), periodId: cuid, kind: lectureKindSchema, courseCode: z.string(), courseName: z.string(), divisionName: z.string().nullable(), facultyName: z.string().nullable(), roomName: z.string().nullable(), startMinute: z.number().int(), endMinute: z.number().int(), /** A LAB hour one batch does (stream records, 5 Oct 2026); absent from an older server. */ labBatchName: z.string().nullable().optional() });
export type TimetableCell = z.infer<typeof timetableCellSchema>;
export const academicsTimetableSchema = z.object({ termId: cuid.nullable(), termName: z.string().nullable(), weekdays: z.array(z.number().int()), periods: z.array(periodSchema), cells: z.array(timetableCellSchema) });
export const timetableSlotSaveSchema = z.object({ offeringId: cuid, weekday: z.number().int().min(0).max(6), periodId: cuid, kind: lectureKindSchema, roomId: cuid.nullable(), /** A LAB hour for one of the division's batches (stream records, 5 Oct 2026); null or absent is the whole division. */ labBatchId: cuid.nullable().optional() });

export const lectureSubstitutionsQuerySchema = z.object({ date: dateKey.optional() });
export const lectureSubstitutionsSchema = z.object({
  dateKey: dateKey,
  lectures: z.array(z.object({ lectureId: cuid, courseCode: z.string(), courseName: z.string(), divisionName: z.string().nullable(), startMinute: z.number().int(), endMinute: z.number().int(), facultyName: z.string().nullable(), reason: z.enum(["ON_LEAVE", "ABSENT"]), substituteMembershipId: cuid.nullable(), substituteName: z.string().nullable() })),
  candidates: z.array(z.object({ membershipId: cuid, name: z.string(), departmentId: cuid.nullable() })),
});
export const lectureSubstituteSaveSchema = z.object({ lectureId: cuid, substituteMembershipId: cuid.nullable() });

/* ----------------------------------------------------------- registration */

export const registrationQuerySchema = z.object({ termId: cuid.optional(), studentMembershipId: cuid.optional() });
export const registrationOfferingSchema = z.object({ offeringId: cuid, courseCode: z.string(), courseName: z.string(), kind: courseKindSchema, credits: z.number().int(), facultyName: z.string().nullable(), divisionName: z.string().nullable(), seatsLeft: z.number().int().nullable(), chosen: z.boolean(), required: z.boolean() });
export const registrationViewSchema = z.object({
  studentMembershipId: cuid,
  name: z.string(),
  /** Null when the office has not given the student a seat in a programme yet. */
  programme: z.object({ code: z.string(), name: z.string(), schemeName: z.string(), semester: z.number().int(), yearOfStudy: z.number().int(), divisionName: z.string().nullable(), rollNumber: z.number().int().nullable(), prn: z.string().nullable() }).nullable(),
  term: termSchema.nullable(),
  /** Open by the window, or by a late registration the principal approved. */
  open: z.boolean(),
  lateUntil: dateKey.nullable(),
  minCredits: z.number().int(),
  maxCredits: z.number().int(),
  chosenCredits: z.number().int(),
  offerings: z.array(registrationOfferingSchema),
  exitPoints: z.array(exitPointSchema),
  creditsEarned: z.number().int(),
});
export type RegistrationView = z.infer<typeof registrationViewSchema>;
export const registrationSaveSchema = z.object({ termId: cuid, offeringIds: z.array(cuid).max(40), studentMembershipId: cuid.optional() });
export const lateRegistrationAskSchema = z.object({ studentMembershipId: cuid, termId: cuid, reason: z.string().trim().min(4).max(400), openUntil: dateKey });
export const lateRegistrationDecideSchema = z.object({ approve: z.boolean() });
export const lateRegistrationSchema = z.object({ id: cuid, studentMembershipId: cuid, studentName: z.string(), termId: cuid, termName: z.string(), reason: z.string(), openUntil: dateKey, status: z.enum(["ASKED", "APPROVED", "REFUSED"]), askedAt: iso, decidedAt: iso.nullable() });
export const lateRegistrationsSchema = z.object({ items: z.array(lateRegistrationSchema), canDecide: z.boolean() });

/* --------------------------------------------------------------- lectures */

export const lecturesQuerySchema = z.object({ date: dateKey.optional() });
export const lectureRowSchema = z.object({ lectureId: cuid, offeringId: cuid, dateKey: dateKey, startMinute: z.number().int(), endMinute: z.number().int(), kind: lectureKindSchema, courseCode: z.string(), courseName: z.string(), divisionName: z.string().nullable(), roomName: z.string().nullable(), registered: z.number().int(), marked: z.number().int(), substitute: z.boolean(), /** The batch a LAB lecture is for (stream records, 5 Oct 2026); `registered` is then the batch's students. Absent from an older server. */ labBatchName: z.string().nullable().optional() });
export type LectureRow = z.infer<typeof lectureRowSchema>;
export const lecturesSchema = z.object({ dateKey: dateKey, closed: z.boolean(), lectures: z.array(lectureRowSchema) });
export const lectureSheetSchema = z.object({
  lecture: lectureRowSchema,
  threshold: z.number().int(),
  canMark: z.boolean(),
  entries: z.array(z.object({ studentMembershipId: cuid, name: z.string(), rollNumber: z.number().int().nullable(), status: lectureMarkSchema.nullable(), percent: z.number().nullable() })),
});
export type LectureSheet = z.infer<typeof lectureSheetSchema>;
/** A lecture's marks, replay-safe: the same clientId a second time writes nothing (the phone's outbox). */
export const lectureMarkSaveSchema = z.object({ clientId: z.string().trim().min(6).max(80), entries: z.array(z.object({ studentMembershipId: cuid, status: lectureMarkSchema })).min(1).max(400) });
export const lectureMarkResultSchema = z.object({ lectureId: cuid, present: z.number().int(), absent: z.number().int(), late: z.number().int(), replay: z.boolean(), noticesSent: z.number().int() });

/* ------------------------------------------------------------- attendance */

/** One student on one offering: lectures held for them, attended (late counts), the percentage, the rule, and how many more they may miss. */
export const courseAttendanceSchema = z.object({
  offeringId: cuid,
  courseCode: z.string(),
  courseName: z.string(),
  held: z.number().int(),
  attended: z.number().int(),
  /** One decimal; null before any lecture is marked. */
  percent: z.number().nullable(),
  threshold: z.number().int(),
  remaining: z.number().int(),
  /** Lectures still to come this term that may be missed with the percentage kept at the threshold; negative is how many short even with full attendance. */
  canMiss: z.number().int(),
  condoned: z.boolean(),
  eligible: z.boolean(),
});
export type CourseAttendance = z.infer<typeof courseAttendanceSchema>;
export const attendanceReportQuerySchema = z.object({ termId: cuid.optional(), offeringId: cuid.optional(), departmentId: cuid.optional(), defaultersOnly: z.enum(["0", "1"]).optional() });
export const attendanceReportSchema = z.object({
  termId: cuid.nullable(),
  rows: z.array(courseAttendanceSchema.extend({ studentMembershipId: cuid, name: z.string(), departmentId: cuid, lastNoticeAt: iso.nullable() })),
  noticesSent: z.number().int(),
});
export const eligibilityQuerySchema = z.object({ termId: cuid });
export const eligibilitySchema = z.object({ termId: cuid, rows: z.array(z.object({ studentMembershipId: cuid, name: z.string(), offeringId: cuid, courseCode: z.string(), percent: z.number().nullable(), threshold: z.number().int(), condoned: z.boolean(), eligible: z.boolean() })) });

export const condonationSchema = z.object({ id: cuid, studentMembershipId: cuid, studentName: z.string(), termId: cuid, termName: z.string(), offeringId: cuid.nullable(), courseCode: z.string().nullable(), ground: condonationGroundSchema, note: z.string(), hasDocument: z.boolean(), documentFileId: z.string().nullable(), status: condonationStatusSchema, percent: z.number().nullable(), floor: z.number().int(), createdAt: iso, decidedAt: iso.nullable(), decisionNote: z.string().nullable() });
export type Condonation = z.infer<typeof condonationSchema>;
export const condonationsQuerySchema = z.object({ status: z.enum(["OPEN", "ALL"]).optional() });
export const condonationsSchema = z.object({ items: z.array(condonationSchema), canDecide: z.boolean() });
export const condonationAskSchema = z.object({ termId: cuid, offeringId: cuid.nullable(), ground: condonationGroundSchema, note: z.string().trim().min(4).max(600), documentFileId: z.string().trim().min(8).max(80).nullable() });
export const condonationDecideSchema = z.object({ decision: z.enum(["APPROVE", "FORWARD", "REFUSE"]), note: z.string().trim().max(400) });

/* ---------------------------------------------------- internal assessment */

export const internalComponentSchema = z.object({ id: cuid, name: z.string(), kind: internalKindSchema, maxMarks: z.number().int(), weight: z.number().int(), coCodes: z.array(z.string()), enteredCount: z.number().int(), moderated: z.boolean(), moderatedByName: z.string().nullable(), released: z.boolean() });
export const internalSheetSchema = z.object({
  offeringId: cuid,
  courseCode: z.string(),
  courseName: z.string(),
  internalMax: z.number().int(),
  weightTotal: z.number().int(),
  components: z.array(internalComponentSchema),
  students: z.array(z.object({ studentMembershipId: cuid, name: z.string(), rollNumber: z.number().int().nullable(), marks: z.record(z.string(), z.number().nullable()), total: z.number().nullable() })),
  locked: z.object({ at: iso, byName: z.string().nullable() }).nullable(),
  canEnter: z.boolean(),
  canModerate: z.boolean(),
  canRelease: z.boolean(),
  canLock: z.boolean(),
});
export type InternalSheet = z.infer<typeof internalSheetSchema>;
export const internalComponentSaveSchema = z.object({ id: cuid.optional(), name: z.string().trim().min(2).max(80), kind: internalKindSchema, maxMarks: z.number().int().min(1).max(500), weight: z.number().int().min(1).max(200), coCodes: z.array(z.string().trim().min(1).max(8)).max(12) });
/** Marks for one component: a list, or a pasted sheet of "roll or code, marks" lines ("AB" for absent). */
export const internalMarksSaveSchema = z.object({
  componentId: cuid,
  entries: z.array(z.object({ studentMembershipId: cuid, marks: z.number().min(0).max(500).nullable() })).max(400).optional(),
  sheet: z.string().max(40_000).optional(),
});
export const internalMarksResultSchema = z.object({ saved: z.number().int(), skipped: z.array(z.object({ line: z.number().int(), reason: z.enum(["UNKNOWN_STUDENT", "BAD_MARKS", "OVER_MAX"]) })) });

/* ------------------------------------------------------------ course file */

export const coursePlanWeekSchema = z.object({ week: z.number().int().min(1).max(30), topic: z.string().trim().min(1).max(200), coCodes: z.array(z.string().trim().min(1).max(8)).max(12), taughtOn: dateKey.nullable() });
export const courseFileSaveSchema = z.object({ plan: z.array(coursePlanWeekSchema).max(30) });
export const courseFileItemSaveSchema = z.object({ kind: courseFileItemKindSchema, title: z.string().trim().min(2).max(160), url: z.string().trim().url().max(500).refine((u) => /^https?:\/\//i.test(u), "http").nullable(), fileId: z.string().trim().min(8).max(80).nullable(), coCodes: z.array(z.string().trim().min(1).max(8)).max(12) });
export const courseFileReviewSchema = z.object({ note: z.string().trim().max(400) });
/** Course-outcome attainment, computed on read: direct from internal marks, indirect from the exit survey (the IQAC module; null until it is filled). */
export const attainmentSchema = z.object({
  /** The share of a component's marks a student must reach to count as attaining (60 %). */
  targetPercent: z.number().int(),
  cos: z.array(z.object({ code: z.string(), text: z.string(), assessed: z.number().int(), reached: z.number().int(), direct: z.number().int().nullable(), indirect: z.number().nullable(), level: z.number().nullable() })),
  pos: z.array(z.object({ code: z.string(), attainment: z.number().nullable() })),
});
export type Attainment = z.infer<typeof attainmentSchema>;
export const courseFileSchema = z.object({
  offeringId: cuid,
  courseCode: z.string(),
  courseName: z.string(),
  facultyName: z.string().nullable(),
  outcomes: z.array(outcomeSchema),
  plan: z.array(coursePlanWeekSchema),
  taught: z.number().int(),
  expected: z.number().int(),
  behind: z.boolean(),
  termElapsedPercent: z.number().int(),
  items: z.array(z.object({ id: cuid, kind: courseFileItemKindSchema, title: z.string(), url: z.string().nullable(), fileId: z.string().nullable(), coCodes: z.array(z.string()), createdAt: iso })),
  review: z.object({ at: iso, byName: z.string().nullable(), note: z.string() }).nullable(),
  attainment: attainmentSchema,
  canEdit: z.boolean(),
  canReview: z.boolean(),
});
export type CourseFile = z.infer<typeof courseFileSchema>;

/* -------------------------------------------------------------- mentoring */

export const mentoringSchema = z.object({
  groups: z.array(z.object({
    id: cuid,
    name: z.string(),
    termId: cuid,
    facultyMembershipId: cuid,
    facultyName: z.string(),
    members: z.array(z.object({ studentMembershipId: cuid, name: z.string(), flag: mentorFlagSchema })),
    notes: z.array(z.object({ id: cuid, studentMembershipId: cuid, studentName: z.string(), note: z.string(), flag: mentorFlagSchema, at: iso })),
  })),
  canOrganise: z.boolean(),
});
export type Mentoring = z.infer<typeof mentoringSchema>;
export const mentoringGroupSaveSchema = z.object({ id: cuid.optional(), termId: cuid, facultyMembershipId: cuid, name: z.string().trim().min(2).max(80), studentMembershipIds: z.array(cuid).max(60) });
export const mentoringNoteSaveSchema = z.object({ groupId: cuid, studentMembershipId: cuid, note: z.string().trim().min(2).max(1000), flag: mentorFlagSchema });

/* ------------------------------------------------------------------ homes */

export const facultyOfferingSchema = z.object({ offeringId: cuid, courseCode: z.string(), courseName: z.string(), divisionName: z.string().nullable(), registered: z.number().int(), planned: z.number().int(), taught: z.number().int(), behind: z.boolean(), components: z.number().int(), moderated: z.number().int(), released: z.number().int(), locked: z.boolean(), defaulters: z.number().int() });
export const facultyHomeSchema = z.object({
  name: z.string(),
  departmentName: z.string().nullable(),
  term: termSchema.nullable(),
  today: lecturesSchema,
  offerings: z.array(facultyOfferingSchema),
  hours: z.number().int(),
  settings: academicsSettingsSchema,
  mentoringGroups: z.number().int(),
  /** The components of colleagues in the department waiting for a second signature. */
  toModerate: z.array(z.object({ componentId: cuid, offeringId: cuid, courseCode: z.string(), name: z.string(), facultyName: z.string().nullable() })),
});
export type FacultyHome = z.infer<typeof facultyHomeSchema>;
export const hodHomeSchema = z.object({
  department: z.object({ id: cuid, code: z.string(), name: z.string() }).nullable(),
  term: termSchema.nullable(),
  load: offeringsSchema.shape.load,
  ratio: offeringsSchema.shape.ratios,
  offerings: z.array(facultyOfferingSchema.extend({ facultyName: z.string().nullable() })),
  defaulters: z.number().int(),
  condonationsWaiting: z.number().int(),
  mentoringGroups: z.number().int(),
  mentees: z.number().int(),
  /** Results come from the exams module; until it publishes them nothing is read here. */
  resultsAvailable: z.boolean(),
  /** Students' projects and internships are the placement module's; listed when it has them. */
  projects: z.array(z.object({ title: z.string(), studentName: z.string() })),
  /**
   * The department's results for the latest term the exam cell published (the exams module's
   * `resultsForDepartment`, wired by the integration builder, 4 Oct 2026); null before any publication.
   */
  results: z
    .object({
      termName: z.string(),
      appeared: z.number().int(),
      passed: z.number().int(),
      passRatePercent: z.number(),
      byCourse: z.array(z.object({ key: z.string(), label: z.string(), appeared: z.number().int(), passed: z.number().int(), passRatePercent: z.number() })),
      toppers: z.array(z.object({ studentMembershipId: z.string(), name: z.string(), sgpa: z.number() })),
      openBacklogs: z.number().int(),
    })
    .nullable()
    .optional(),
});
export type HodHome = z.infer<typeof hodHomeSchema>;
export const studentAcademicsSchema = z.object({
  registration: registrationViewSchema,
  today: z.array(timetableCellSchema),
  week: academicsTimetableSchema,
  attendance: z.array(courseAttendanceSchema),
  condonations: z.array(condonationSchema),
  marks: z.array(z.object({ offeringId: cuid, courseCode: z.string(), courseName: z.string(), components: z.array(z.object({ name: z.string(), kind: internalKindSchema, maxMarks: z.number().int(), weight: z.number().int(), marks: z.number().nullable() })) })),
  mentor: z.object({ groupName: z.string(), facultyName: z.string() }).nullable(),
});
export type StudentAcademics = z.infer<typeof studentAcademicsSchema>;
export const familyAcademicsQuerySchema = z.object({ childId: cuid.optional() });
export const familyAcademicsSchema = z.object({
  children: z.array(z.object({ studentMembershipId: cuid, name: z.string() })),
  childId: cuid.nullable(),
  /** False when an adult student has not let their guardians see attendance (the consent record). */
  allowed: z.boolean(),
  attendance: z.array(courseAttendanceSchema),
});
export type FamilyAcademics = z.infer<typeof familyAcademicsSchema>;

/* -------------------------------------------------------- small answers */

export const academicsIdResultSchema = z.object({ id: cuid });
export const academicsChangedResultSchema = z.object({ changed: z.boolean() });
export const academicsCountResultSchema = z.object({ count: z.number().int() });
export const divisionMadeSchema = z.object({ id: cuid, classId: cuid });
export const coursePlanResultSchema = z.object({ weeks: z.number().int() });
