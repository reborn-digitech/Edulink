import { z } from "zod";
import type { StreamCode } from "./streams";

/**
 * STREAM RECORDS AND THE DUTIES' DESKS (the owner's decision of 5 October
 * 2026: everything a stream's council asks for exists per stream). The
 * records a college keeps because of what it teaches, and the pages of the
 * duties the foundation (./duties.ts) named:
 *
 *   - LAB BATCHES (science, engineering, pharmacy, …): a division split into
 *     batches that do their practicals together; a LAB hour on the timetable
 *     and its lectures may name one, and the roster follows the batch.
 *   - THE PRACTICAL RECORD (the Pharmacy Council of India asks for it first;
 *     any offering with practicals may keep it): each experiment a student
 *     performed, its marks, and the signature of the offering's teacher or a
 *     lab in-charge.
 *   - MOOT COURTS and COURT, FIRM and LEGAL-AID INTERNSHIPS (law): the Bar
 *     Council of India's Rules of Legal Education, 2008, ask for both — the
 *     internship as at least twenty weeks over a five-year course and twelve
 *     over a three-year one (BCI_MIN_INTERNSHIP_WEEKS).
 *   - TEACHING PRACTICE (education): the schools a college sends its student
 *     teachers to, each posting and the lessons watched — the NCTE's B.Ed.
 *     norms (Regulations 2014, Appendix 4) ask for twenty weeks of school
 *     internship over the programme (NCTE_MIN_PRACTICE_WEEKS).
 *   - NSS AND NCC: the unit's enrolled students and its activities (IQAC
 *     Activity rows of kind NSS or NCC, with the hours each participant
 *     earned and whether it was a camp). The NSS Manual (Ministry of Youth
 *     Affairs and Sports, 2006) asks 120 hours of a volunteer a year.
 *   - the RESEARCH DEAN's read of the research register and the API-score
 *     inputs, and the EXAM FLYING SQUAD's log of visits to the halls.
 *
 * Coded lists here; never free text where a code is meant. What each says to
 * a person is a key under `streamRecords.*` or `duties.*` in the dictionary.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const text = (max: number) => z.string().trim().max(max);

/* ------------------------------------------------------------- the codes */

/** A lab batch's size when the office does not say: twenty, the usual practical batch of a division. */
export const LAB_BATCH_DEFAULT_SIZE = 20;
export const LAB_BATCH_MIN_SIZE = 5;
export const LAB_BATCH_MAX_SIZE = 60;

export const MOOT_COURT_KINDS = ["INTRA", "INTER", "NATIONAL"] as const;
export const mootCourtKindSchema = z.enum(MOOT_COURT_KINDS);
export type MootCourtKind = z.infer<typeof mootCourtKindSchema>;
/** How a team came out of a moot. */
export const MOOT_OUTCOMES = ["WINNER", "RUNNER_UP", "BEST_MEMORIAL", "BEST_SPEAKER", "PARTICIPATED"] as const;
export const mootOutcomeSchema = z.enum(MOOT_OUTCOMES);

/** The internship kinds a law student proposes (Internship.kind, beside the AICTE's INDUSTRY, RESEARCH, FAMILY_BUSINESS). */
export const LAW_INTERNSHIP_KINDS = ["COURT", "FIRM", "LEGAL_AID"] as const;
export type LawInternshipKind = (typeof LAW_INTERNSHIP_KINDS)[number];
/** A management programme's summer internship (Internship.kind SUMMER): its credits reach the exam cell as every internship's do. */
export const MANAGEMENT_INTERNSHIP_KINDS = ["SUMMER"] as const;
/**
 * THE BCI's MINIMUM (Rules of Legal Education, 2008, rule 25 and Schedule III):
 * twenty weeks of internship over a five-year course, twelve over a
 * three-year one, done in the vacations of each year. A programme of five
 * years or more is held to the first.
 */
export const BCI_MIN_INTERNSHIP_WEEKS = { fiveYear: 20, threeYear: 12 } as const;
export function bciMinimumWeeks(durationYears: number): number {
  return durationYears >= 5 ? BCI_MIN_INTERNSHIP_WEEKS.fiveYear : BCI_MIN_INTERNSHIP_WEEKS.threeYear;
}
/** The windows a law internship may sit in: after each even semester of a five-year course. */
export const LAW_INTERNSHIP_WINDOWS = [2, 4, 6, 8, 10] as const;

/** The internship kinds a college's students may propose, by its streams: the AICTE's three always; the law kinds with LAW; SUMMER with MANAGEMENT. */
export function internshipKindsFor(streams: readonly StreamCode[]): string[] {
  return ["INDUSTRY", "RESEARCH", "FAMILY_BUSINESS", ...(streams.includes("LAW") ? LAW_INTERNSHIP_KINDS : []), ...(streams.includes("MANAGEMENT") ? MANAGEMENT_INTERNSHIP_KINDS : [])];
}
export function isLawInternshipKind(kind: string): kind is LawInternshipKind {
  return (LAW_INTERNSHIP_KINDS as readonly string[]).includes(kind);
}

/** THE NCTE's MINIMUM for a B.Ed. (NCTE Regulations 2014, Appendix 4): twenty weeks of school internship over the programme. */
export const NCTE_MIN_PRACTICE_WEEKS = 20;
/** A watched lesson's grade, as the observation sheets of the B.Ed. practicum print it. */
export const LESSON_GRADES = ["A", "B", "C", "D"] as const;
export const lessonGradeSchema = z.enum(LESSON_GRADES);

export const CORPS = ["NSS", "NCC"] as const;
export const corpsSchema = z.enum(CORPS);
export type CorpsCode = z.infer<typeof corpsSchema>;
/** The NSS Manual's hours a volunteer gives in a year (240 over the two years of a certificate). */
export const NSS_HOURS_PER_YEAR = 120;

/** An academic year's window as the filings read it: 1 June to 31 May. */
export function academicYearWindow(year: number): { from: string; to: string } {
  return { from: `${year}-06-01`, to: `${year + 1}-05-31` };
}
/** The academic year a day falls in: June onwards is that year's, before June the year before's. */
export function academicYearOf(dateKeyValue: string): number {
  const y = Number(dateKeyValue.slice(0, 4));
  return Number(dateKeyValue.slice(5, 7)) >= 6 ? y : y - 1;
}
/** Whole days from one day to another, both counted, as weeks to one decimal. */
export function weeksBetween(from: string, to: string): number {
  if (to < from) return 0;
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  return Math.round((days / 7) * 10) / 10;
}

/* ------------------------------------------------------------ lab batches */

const memberRow = z.object({ studentMembershipId: cuid, name: z.string(), rollNumber: z.number().int().nullable() });
export const labBatchSchema = z.object({ id: cuid, name: z.string(), capacity: z.number().int(), members: z.array(memberRow) });
export type LabBatchView = z.infer<typeof labBatchSchema>;
export const labDivisionSchema = z.object({
  divisionId: cuid,
  name: z.string(),
  programmeCode: z.string(),
  yearOfStudy: z.number().int(),
  academicYear: z.string(),
  students: z.number().int(),
  batches: z.array(labBatchSchema),
  /** Students of the division in no batch yet. */
  unbatched: z.array(memberRow),
  /**
   * THE DAY A CHANGE MADE NOW TAKES EFFECT (R-24, risks batch 5 Oct 2026), YYYY-MM-DD by the college's clock: today,
   * or tomorrow when a batch lab of the division is already marked today (a marked lecture keeps its roster); null
   * while no batch lab of the division is marked, when a re-split rewrites the batches from the start. The office's
   * page and the phone say it before the office acts ("from tomorrow"). Absent from older servers.
   */
  changesFrom: z.string().nullable().optional(),
});
/** GET /api/v1/stream-records/lab-batches — every division (or one) with its batches. */
export const labBatchesQuerySchema = z.object({ divisionId: cuid.optional() });
export const labBatchesSchema = z.object({
  offered: z.boolean(),
  defaultSize: z.number().int(),
  canEdit: z.boolean(),
  divisions: z.array(labDivisionSchema),
  /** On the answer to a split or a move only (R-24): the day the change took effect; null when it rewrote the batches from the start. */
  effectiveFrom: z.string().nullable().optional(),
});
export type LabBatches = z.infer<typeof labBatchesSchema>;
/** POST /api/v1/stream-records/lab-batches/split — the office splits a division evenly into batches of at most `size`, by roll number (re-running re-splits; batch names are A, B, C…). */
export const labBatchSplitSchema = z.object({ divisionId: cuid, size: z.number().int().min(LAB_BATCH_MIN_SIZE).max(LAB_BATCH_MAX_SIZE).optional() });
/** POST /api/v1/stream-records/lab-batches/{batchId}/members — the office moves students of the batch's division into it. */
export const labBatchMoveSchema = z.object({ studentMembershipIds: z.array(cuid).min(1).max(200) });

/* ------------------------------------------------------ practical record */

export const practicalRecordRowSchema = z.object({
  id: cuid,
  studentMembershipId: cuid,
  studentName: z.string(),
  experimentNo: z.number().int(),
  title: z.string(),
  performedOn: dateKey,
  marks: z.number().int().nullable(),
  signed: z.boolean(),
  signedByName: z.string().nullable(),
  signedAt: iso.nullable(),
});
export type PracticalRecordRow = z.infer<typeof practicalRecordRowSchema>;
export const practicalOfferingSchema = z.object({ offeringId: cuid, courseCode: z.string(), courseName: z.string(), divisionName: z.string().nullable(), facultyName: z.string().nullable(), practicalHours: z.number().int(), mine: z.boolean() });
/** GET /api/v1/stream-records/practicals?offeringId= — the offerings the caller may keep a record on, and one offering's students and record. */
export const practicalsQuerySchema = z.object({ offeringId: cuid.optional() });
export const practicalSheetSchema = z.object({
  offerings: z.array(practicalOfferingSchema),
  offeringId: cuid.nullable(),
  students: z.array(z.object({ studentMembershipId: cuid, name: z.string(), rollNumber: z.number().int().nullable(), batchName: z.string().nullable() })),
  records: z.array(practicalRecordRowSchema),
  canWrite: z.boolean(),
  canSign: z.boolean(),
});
export type PracticalSheet = z.infer<typeof practicalSheetSchema>;
/** POST /api/v1/stream-records/practicals — one experiment for some of an offering's students (a signed row is not changed). */
export const practicalSaveSchema = z.object({
  offeringId: cuid,
  experimentNo: z.number().int().min(1).max(200),
  title: text(160).min(2),
  performedOn: dateKey,
  entries: z.array(z.object({ studentMembershipId: cuid, marks: z.number().int().min(0).max(100).nullable() })).min(1).max(200),
});
/** POST /api/v1/stream-records/practicals/sign — the offering's teacher or a lab in-charge signs rows. */
export const practicalSignSchema = z.object({ recordIds: z.array(cuid).min(1).max(500) });
export const streamRecordsCountSchema = z.object({ count: z.number().int().min(0) });

/* ------------------------------------------------------------ moot courts */

export const mootTeamSchema = z.object({ name: text(80).min(1), membershipIds: z.array(cuid).max(10), outcome: mootOutcomeSchema });
export const mootCourtSaveSchema = z.object({
  id: cuid.optional(),
  name: text(160).min(2),
  at: dateKey,
  kind: mootCourtKindSchema,
  teams: z.array(mootTeamSchema).max(40),
  result: text(400),
  judgeNotes: text(2000),
});
export type MootCourtSave = z.infer<typeof mootCourtSaveSchema>;
export const mootCourtSchema = z.object({
  id: cuid,
  name: z.string(),
  at: dateKey,
  kind: mootCourtKindSchema,
  teams: z.array(z.object({ name: z.string(), outcome: mootOutcomeSchema, members: z.array(z.object({ membershipId: cuid, name: z.string() })) })),
  result: z.string(),
  judgeNotes: z.string(),
  /** Whether this reader may correct this moot (R-59, risks batch 5 Oct 2026): the office, its author or the law department's HOD, and never once frozen. The phone hides "Correct" where false. Absent from older servers. */
  canEdit: z.boolean().optional(),
  /** Frozen (R-53): the BCI return for the moot's academic year has been generated, so it stays as the return printed it. */
  frozen: z.boolean().optional(),
});
/** GET /api/v1/stream-records/moot-courts */
export const mootCourtsSchema = z.object({ offered: z.boolean(), canEdit: z.boolean(), items: z.array(mootCourtSchema), students: z.array(z.object({ membershipId: cuid, name: z.string() })) });

/* ------------------------------------------------------------- summaries */

/** What S1's filings and the homes read: the practical record of a year. */
export const practicalRecordSummarySchema = z.object({
  year: z.number().int(),
  records: z.number().int(),
  signed: z.number().int(),
  unsigned: z.number().int(),
  students: z.number().int(),
  offerings: z.number().int(),
  batches: z.number().int(),
  batchMembers: z.number().int(),
  byCourse: z.array(z.object({ courseCode: z.string(), courseName: z.string(), records: z.number().int(), signed: z.number().int(), students: z.number().int() })),
});
export type PracticalRecordSummary = z.infer<typeof practicalRecordSummarySchema>;
export const lawInternshipSummarySchema = z.object({
  year: z.number().int(),
  internships: z.number().int(),
  byKind: z.object({ COURT: z.number().int(), FIRM: z.number().int(), LEGAL_AID: z.number().int() }),
  weeks: z.number(),
  students: z.number().int(),
  meetingMinimum: z.number().int(),
  perStudent: z.array(z.object({ studentMembershipId: cuid, name: z.string(), programmeCode: z.string(), weeks: z.number(), minimumWeeks: z.number().int(), meets: z.boolean() })),
  mootCourts: z.object({ total: z.number().int(), INTRA: z.number().int(), INTER: z.number().int(), NATIONAL: z.number().int(), participants: z.number().int() }),
});
export type LawInternshipSummary = z.infer<typeof lawInternshipSummarySchema>;
export const teachingPracticeSummarySchema = z.object({
  year: z.number().int(),
  practiceSchools: z.number().int(),
  postings: z.number().int(),
  students: z.number().int(),
  lessonsPlanned: z.number().int(),
  lessonsObserved: z.number().int(),
  weeks: z.number(),
  minimumWeeks: z.number().int(),
  meetingMinimum: z.number().int(),
  bySchool: z.array(z.object({ practiceSchoolId: cuid, name: z.string(), udise: z.string().nullable(), postings: z.number().int(), students: z.number().int() })),
  perStudent: z.array(z.object({ studentMembershipId: cuid, name: z.string(), weeks: z.number(), lessonsPlanned: z.number().int(), lessonsObserved: z.number().int(), meets: z.boolean() })),
});
export type TeachingPracticeSummary = z.infer<typeof teachingPracticeSummarySchema>;
export const corpsSummarySchema = z.object({
  enrolled: z.number().int(),
  activities: z.number().int(),
  camps: z.number().int(),
  participations: z.number().int(),
  students: z.number().int(),
  hours: z.number(),
  perStudent: z.array(z.object({ studentMembershipId: cuid, name: z.string(), hours: z.number(), activities: z.number().int(), camp: z.boolean() })),
});
export type CorpsSummary = z.infer<typeof corpsSummarySchema>;
export const nssSummarySchema = z.object({ year: z.number().int(), nss: corpsSummarySchema, ncc: corpsSummarySchema, hoursPerYear: z.number().int() });
export type NssSummary = z.infer<typeof nssSummarySchema>;
/** GET /api/v1/stream-records/summary?year= — the four summaries with which streams the college has that make each one its own. */
export const streamRecordsSummaryQuerySchema = z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() });
export const streamRecordsSummarySchema = z.object({
  year: z.number().int(),
  streams: z.array(z.string()),
  labs: z.boolean(),
  law: z.boolean(),
  education: z.boolean(),
  practical: practicalRecordSummarySchema,
  lawInternships: lawInternshipSummarySchema,
  teachingPractice: teachingPracticeSummarySchema,
  corps: nssSummarySchema,
});
export type StreamRecordsSummary = z.infer<typeof streamRecordsSummarySchema>;
/** GET /api/v1/stream-records/law-internships?year= */
export const lawInternshipsQuerySchema = streamRecordsSummaryQuerySchema;

/* ------------------------------------------------------------- the desks */

/** GET /api/v1/duties/lab — the lab in-charge's desk. */
export const labDeskSchema = z.object({
  inventoryOn: z.boolean(),
  labs: z.array(
    z.object({
      roomId: cuid,
      name: z.string(),
      capacity: z.number().int(),
      stock: z.array(z.object({ itemCode: z.string(), itemName: z.string(), unit: z.string(), quantity: z.number().int() })),
      assets: z.array(z.object({ tagNumber: z.string(), name: z.string(), status: z.string(), condition: z.string() })),
    }),
  ),
  divisions: z.array(labDivisionSchema),
  toSign: z.array(practicalRecordRowSchema.extend({ offeringId: cuid, courseCode: z.string() })),
  breakages: z.array(z.object({ id: cuid, at: iso, itemCode: z.string(), itemName: z.string(), quantity: z.number().int(), location: z.string(), note: z.string(), byName: z.string() })),
});
export type LabDesk = z.infer<typeof labDeskSchema>;
/** POST /api/v1/duties/lab/breakage — a breakage written off the lab's stock (an inventory movement of kind WRITE_OFF at the lab). */
export const labBreakageSaveSchema = z.object({ roomId: cuid, itemCode: z.string().trim().min(1).max(40), quantity: z.number().int().min(1).max(10_000), note: text(400).min(3) });

/** The teaching-practice coordinator's desk. */
export const practiceSchoolSaveSchema = z.object({ id: cuid.optional(), name: text(160).min(2), udise: z.string().trim().regex(/^\d{11}$/, "udise").nullable(), contact: text(200) });
export const practicePostingSaveSchema = z.object({ id: cuid.optional(), studentMembershipId: cuid, practiceSchoolId: cuid, from: dateKey, to: dateKey, lessonsPlanned: z.number().int().min(0).max(400) });
export const lessonObservationSaveSchema = z.object({ at: dateKey, grade: lessonGradeSchema, note: text(1000) });
export const practicePostingSchema = z.object({
  id: cuid,
  studentMembershipId: cuid,
  studentName: z.string(),
  practiceSchoolId: cuid,
  practiceSchoolName: z.string(),
  from: dateKey,
  to: dateKey,
  weeks: z.number(),
  lessonsPlanned: z.number().int(),
  observations: z.array(z.object({ id: cuid, at: dateKey, observerName: z.string(), grade: lessonGradeSchema, note: z.string() })),
});
/** GET /api/v1/duties/teaching-practice */
export const teachingPracticeDeskSchema = z.object({
  offered: z.boolean(),
  canManage: z.boolean(),
  canObserve: z.boolean(),
  schools: z.array(z.object({ id: cuid, name: z.string(), udise: z.string().nullable(), contact: z.string(), postings: z.number().int() })),
  postings: z.array(practicePostingSchema),
  students: z.array(z.object({ membershipId: cuid, name: z.string(), programmeCode: z.string() })),
  summary: teachingPracticeSummarySchema,
});
export type TeachingPracticeDesk = z.infer<typeof teachingPracticeDeskSchema>;

/** The NSS or NCC officer's desk. */
export const corpsEnrolSchema = z.object({ studentMembershipIds: z.array(cuid).min(1).max(500), unit: text(80) });
export const corpsLeaveSchema = z.object({ studentMembershipIds: z.array(cuid).min(1).max(500), on: dateKey });
// participantMembershipIds is capped at 1000 on purpose (item 16, 2 Nov 2026): an NSS or NCC camp enrols the whole corps of a large college, where an enrolment or leave sheet (500) is one unit's.
export const corpsActivitySaveSchema = z.object({ title: text(160).min(2), at: dateKey, hours: z.number().min(0.5).max(240), camp: z.boolean(), participantMembershipIds: z.array(cuid).max(1000) });
/** GET /api/v1/duties/nss and /ncc */
export const corpsDeskSchema = z.object({
  corps: corpsSchema,
  year: z.number().int(),
  canEdit: z.boolean(),
  enrolled: z.array(z.object({ studentMembershipId: cuid, name: z.string(), unit: z.string(), enrolledOn: dateKey, hours: z.number() })),
  students: z.array(z.object({ membershipId: cuid, name: z.string() })),
  activities: z.array(z.object({ id: cuid, title: z.string(), at: dateKey, hours: z.number(), camp: z.boolean(), participants: z.number().int() })),
  summary: corpsSummarySchema,
  hoursPerYear: z.number().int(),
});
export type CorpsDesk = z.infer<typeof corpsDeskSchema>;

/** GET /api/v1/duties/research — the research dean's read. */
export const researchDeskSchema = z.object({
  items: z.array(z.object({ id: cuid, kind: z.string(), title: z.string(), indexing: z.string(), year: z.number().int(), amountLakhs: z.number().nullable(), facultyName: z.string().nullable() })),
  perFaculty: z.array(
    z.object({
      membershipId: cuid,
      name: z.string(),
      publications: z.number().int(),
      books: z.number().int(),
      projects: z.number().int(),
      amountLakhs: z.number(),
      /** The office's and the head's only; null to a member reading as the research dean (appraisal input, A3-S-11). */
      apiScoreInputs: z.object({ teaching: z.number(), research: z.number(), service: z.number() }).nullable(),
      apiScore: z.number().nullable(),
    }),
  ),
  byYear: z.array(z.object({ year: z.number().int(), publications: z.number().int(), projects: z.number().int(), amountLakhs: z.number() })),
});
export type ResearchDesk = z.infer<typeof researchDeskSchema>;

/** GET /api/v1/duties/exam-squad — the flying squad's desk. */
export const examSquadDeskSchema = z.object({
  papers: z.array(z.object({ scheduleId: cuid, sessionName: z.string(), courseCode: z.string(), courseName: z.string(), at: iso, durationMin: z.number().int(), halls: z.array(z.object({ id: cuid, name: z.string() })), visits: z.number().int() })),
  visits: z.array(z.object({ id: cuid, scheduleId: cuid, courseCode: z.string(), hallName: z.string().nullable(), at: iso, byName: z.string(), members: z.string(), flagged: z.boolean(), note: z.string() })),
  cases: z.array(z.object({ id: cuid, courseCode: z.string(), sessionName: z.string(), reportedOn: dateKey, studentName: z.string(), decided: z.boolean(), decision: z.string().nullable() })),
});
export type ExamSquadDesk = z.infer<typeof examSquadDeskSchema>;
/** POST /api/v1/duties/exam-squad/visits */
export const examSquadVisitSaveSchema = z.object({ scheduleId: cuid, examRoomId: cuid.nullable(), members: text(300), flagged: z.boolean(), note: text(1000) });
export const streamRecordsIdSchema = z.object({ id: cuid });
