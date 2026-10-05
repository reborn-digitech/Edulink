import { z } from "zod";
import { naacFrameworkSchema, naacFormulaIdSchema, NAAC_METRIC_KINDS, NAAC_WINDOWS } from "./naac";

/**
 * iqac: the IQAC module's coded lists and the shapes of its doors (module
 * IQAC, role IQAC; 4 October 2026). The framework itself is ./naac.ts.
 *
 * Every list a filing or a metric reads is coded here and refused as free
 * text: a research item's kind and indexing, an activity's kind, a
 * committee's kind, a survey's kind, a grievance's kind, a faculty member's
 * highest qualification and designation, a filing's kind.
 */

/* -------------------------------------------------------------------------- */
/* Coded lists                                                                 */
/* -------------------------------------------------------------------------- */

export const RESEARCH_KINDS = ["PUBLICATION", "PATENT", "PROJECT", "CONSULTANCY", "BOOK", "CONFERENCE", "PHD_GUIDED", "AWARD", "MOU", "SEED_MONEY"] as const;
export const researchKindSchema = z.enum(RESEARCH_KINDS);
export type ResearchKind = z.infer<typeof researchKindSchema>;
/** Where a publication is indexed; NONE for every other kind of item. */
export const RESEARCH_INDEXING = ["UGC_CARE", "SCOPUS", "WEB_OF_SCIENCE", "PEER_REVIEWED", "NONE"] as const;
export const researchIndexingSchema = z.enum(RESEARCH_INDEXING);

/**
 * What the activity register records. The brief's fourteen kinds, and eight
 * more that NAAC metrics count and the brief's list had no home for
 * (value-added courses 1.2.1, capacity building 5.1.2, career guidance 5.1.3,
 * students qualifying in competitive examinations 5.2.2, students' awards
 * 5.3.1, awards for extension 3.3.2, collaborative activities 3.4.1, IPR
 * workshops 3.3.2 autonomous).
 */
export const ACTIVITY_KINDS = [
  "FDP", "WORKSHOP", "EXTENSION", "NSS", "NCC", "CULTURAL", "SPORTS", "GUEST_LECTURE", "INDUSTRIAL_VISIT", "FIELD_PROJECT",
  "AUDIT_GREEN", "AUDIT_ENERGY", "AUDIT_GENDER", "AUDIT_ACADEMIC",
  "VALUE_ADDED_COURSE", "CAPACITY_BUILDING", "CAREER_GUIDANCE", "COMPETITIVE_EXAM", "STUDENT_AWARD", "EXTENSION_AWARD", "COLLABORATION", "IPR_WORKSHOP",
] as const;
export const activityKindSchema = z.enum(ACTIVITY_KINDS);
export type ActivityKind = z.infer<typeof activityKindSchema>;
/** NAAC 5.1.2's four skills, for a CAPACITY_BUILDING activity. */
export const CAPACITY_THEMES = ["SOFT_SKILLS", "LANGUAGE", "LIFE_SKILLS", "ICT"] as const;
export const capacityThemeSchema = z.enum(CAPACITY_THEMES);

/** STUDENT_COUNCIL (risks batch 5A, 5 Oct 2026): the students' council, kept by the office on the council page (council-notices.ts) with its members' accounts, which posts council notices on the bulletin. */
export const COMMITTEE_KINDS = ["GRIEVANCE", "ANTI_RAGGING", "ICC", "CDC", "GOVERNING_BODY", "IQAC", "ADVISORY", "OTHER", "STUDENT_COUNCIL"] as const;
export const committeeKindSchema = z.enum(COMMITTEE_KINDS);
export type CommitteeKind = z.infer<typeof committeeKindSchema>;

/**
 * Surveys. SSS is NAAC's Student Satisfaction Survey (twenty questions,
 * each answered 4 to 0, anonymous); COURSE_FEEDBACK is a student's feedback
 * on one course offering (the teacher-review questions of the school
 * version, plus whether the course met its outcomes — read back as the
 * offering's indirect attainment); EXIT is the outgoing student's survey of
 * the programme outcomes; ALUMNI, EMPLOYER, PARENT and TEACHER are the other
 * stakeholders NAAC 1.4.1 names. An EMPLOYER has no account: the desk
 * transcribes the employer's form.
 */
export const SURVEY_KINDS = ["SSS", "COURSE_FEEDBACK", "EXIT", "ALUMNI", "EMPLOYER", "PARENT", "TEACHER"] as const;
export const surveyKindSchema = z.enum(SURVEY_KINDS);
export type SurveyKind = z.infer<typeof surveyKindSchema>;

/** NAAC's SSS, twenty questions; the words are dictionary keys `iqac.sss.<code>`. */
export const SSS_QUESTIONS = ["Q01", "Q02", "Q03", "Q04", "Q05", "Q06", "Q07", "Q08", "Q09", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q18", "Q19", "Q20"] as const;
/** The other surveys' questions, by kind; words at `iqac.q.<code>`. Every answer is 4 (best) to 0. */
export const SURVEY_QUESTIONS: Record<SurveyKind, readonly string[]> = {
  SSS: SSS_QUESTIONS,
  COURSE_FEEDBACK: ["CLARITY", "SUPPORT", "FAIRNESS", "ENGAGEMENT", "RESPECT", "SYLLABUS", "OUTCOMES"],
  EXIT: ["PO_KNOWLEDGE", "PO_PROBLEM", "PO_TOOLS", "PO_ETHICS", "PO_TEAM", "PO_COMMUNICATION", "PO_LIFELONG"],
  ALUMNI: ["CURRICULUM", "EMPLOYABILITY", "FACULTY", "INFRASTRUCTURE", "CONNECT"],
  EMPLOYER: ["KNOWLEDGE", "SKILLS", "ATTITUDE", "COMMUNICATION", "CURRICULUM"],
  PARENT: ["CURRICULUM", "FACULTY", "SAFETY", "COMMUNICATION", "INFRASTRUCTURE"],
  TEACHER: ["CURRICULUM", "SYLLABUS_LOAD", "RESOURCES", "AUTONOMY", "INFRASTRUCTURE"],
};
export const SURVEY_SCALE = [4, 3, 2, 1, 0] as const;

export const GRIEVANCE_KINDS = ["ACADEMIC", "EXAMINATION", "ADMISSION", "FEES", "HOSTEL", "HARASSMENT", "RAGGING", "DISCRIMINATION", "OTHER"] as const;
export const grievanceKindSchema = z.enum(GRIEVANCE_KINDS);
export const GRIEVANCE_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "ESCALATED"] as const;
export const grievanceStatusSchema = z.enum(GRIEVANCE_STATUSES);
/**
 * THE UGC'S TIME LIMITS (UGC (Redress of Grievances of Students)
 * Regulations, 2023): the Students' Grievance Redressal Committee decides
 * within fifteen working days of receiving a grievance; an appeal to the
 * Ombudsperson is decided within thirty days. Working days here are Monday to
 * Saturday, as a college in Maharashtra works.
 */
export const GRIEVANCE_LIMIT_WORKING_DAYS = 15;
export const OMBUDSPERSON_LIMIT_DAYS = 30;

export const FACULTY_QUALIFICATIONS = ["PHD", "MPHIL", "PG", "UG", "OTHER"] as const;
export const facultyQualificationSchema = z.enum(FACULTY_QUALIFICATIONS);
export const FACULTY_DESIGNATIONS = ["PRINCIPAL", "PROFESSOR", "ASSOCIATE_PROFESSOR", "ASSISTANT_PROFESSOR", "LECTURER", "VISITING_FACULTY"] as const;
export const facultyDesignationSchema = z.enum(FACULTY_DESIGNATIONS);
export const FACULTY_APPOINTMENTS = ["REGULAR", "CONTRACT", "ADHOC", "VISITING"] as const;
export const facultyAppointmentSchema = z.enum(FACULTY_APPOINTMENTS);
/** The Income Tax Department's PAN: five letters, four digits, a letter. */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * The college's filings. The first seven are every college's (the NAAC
 * documents, NIRF, AISHE) or an AICTE college's (the disclosure and the
 * affiliation return); the four after them (5 Oct 2026) are a council's own:
 * the PCI inspection data for pharmacy, the BCI return for law, the NCTE
 * return for teacher education, and NBA's self-assessment report for an
 * engineering department. Which apply to a college is read from its streams
 * (`applicableFilings` in v1/council-filings.ts).
 */
export const COLLEGE_FILING_KINDS = ["SSR", "AQAR", "IIQA", "NIRF", "AISHE", "AICTE_DISCLOSURE", "AFFILIATION_RETURN", "PCI_INSPECTION", "BCI_RETURN", "NCTE_RETURN", "NBA_SAR"] as const;
export const collegeFilingKindSchema = z.enum(COLLEGE_FILING_KINDS);
export type CollegeFilingKind = z.infer<typeof collegeFilingKindSchema>;
export const COLLEGE_FILING_STATUSES = ["DRAFT", "AWAITING_SIGNOFF", "SIGNED_OFF", "RETURNED", "FILED"] as const;
export const collegeFilingStatusSchema = z.enum(COLLEGE_FILING_STATUSES);
/** Which filings the principal signs off before they go: the NAAC documents, and an engineering department's NBA SAR (5 Oct 2026). */
export const SIGNED_FILINGS: readonly CollegeFilingKind[] = ["SSR", "AQAR", "IIQA", "NBA_SAR"];

export const CYCLE_STATUSES = ["OPEN", "SUBMITTED", "CLOSED"] as const;

/**
 * THE FIGURES THE PLATFORM DOES NOT HOLD, which the coordinator enters for a
 * cycle with evidence (a sanctioned-post letter, the ISP's bill, the audited
 * statement): each is read by the metrics that name it, and the predictor
 * shows "entered by the IQAC" beside it.
 */
export const IQAC_ENTERED_INPUTS = [
  "SANCTIONED_POSTS",
  "BANDWIDTH_MBPS",
  "COMPUTERS",
  "NON_SALARY_EXPENDITURE_LAKHS",
  "INFRA_EXPENDITURE_LAKHS",
  "MAINTENANCE_EXPENDITURE_LAKHS",
  "RESERVED_SEATS_EARMARKED",
  "GREEN_OPTIONS",
  "QA_CERTIFICATIONS",
  "EMPLOYABILITY_COURSES",
  "NEW_COURSES",
  "TOTAL_COURSES",
] as const;
export const iqacEnteredInputSchema = z.enum(IQAC_ENTERED_INPUTS);
export type IqacEnteredInput = z.infer<typeof iqacEnteredInputSchema>;

/* -------------------------------------------------------------------------- */
/* Shapes                                                                      */
/* -------------------------------------------------------------------------- */

const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const fileRef = z.object({ fileId: z.string(), title: z.string() });

export const iqacMetricInputSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number().nullable(),
  /** ROWS: counted from the platform's rows; ENTERED: typed by the IQAC with evidence; MISSING: the rows do not exist (yet). */
  source: z.enum(["ROWS", "ENTERED", "MISSING"]),
  reason: z.string().nullable(),
});
export const iqacMetricViewSchema = z.object({
  code: z.string(),
  ki: z.string(),
  kind: z.enum(NAAC_METRIC_KINDS),
  weight: z.number(),
  text: z.string(),
  formula: naacFormulaIdSchema.nullable(),
  window: z.enum(NAAC_WINDOWS),
  value: z.number().nullable(),
  /** 0–4: the platform's reading for QN, the coordinator's provisional score for QL; null when not scored yet. */
  score: z.number().nullable(),
  provisional: z.boolean(),
  /** One sentence in the reader's language: how the value came out of the rows. */
  why: z.string(),
  inputs: z.array(iqacMetricInputSchema),
  evidence: z.array(z.object({ type: z.string(), id: z.string(), label: z.string() })),
  files: z.array(fileRef),
  note: z.string(),
  computedAt: z.string().datetime().nullable(),
  /** CGPA the college would gain with one more unit of this metric's lever (a QL: one step of score). */
  gainPerUnit: z.number(),
  unit: z.string(),
});
export type IqacMetricView = z.infer<typeof iqacMetricViewSchema>;

export const iqacCycleSchema = z.object({
  id: z.string(),
  framework: naacFrameworkSchema,
  institutionType: z.string(),
  windowFrom: dateKey,
  windowTo: dateKey,
  status: z.enum(CYCLE_STATUSES),
  cgpa: z.number().nullable(),
  grade: z.string().nullable(),
  computedAt: z.string().datetime().nullable(),
  metricCount: z.number().int(),
  scoredCount: z.number().int(),
});
export type IqacCycle = z.infer<typeof iqacCycleSchema>;
export const iqacCyclesSchema = z.object({ items: z.array(iqacCycleSchema), canEdit: z.boolean() });
export const iqacCycleCreateSchema = z.object({ windowFrom: dateKey, windowTo: dateKey });

export const iqacPredictorSchema = z.object({
  cycle: iqacCycleSchema,
  criteria: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      weight: z.number(),
      score: z.number(),
      kis: z.array(z.object({ code: z.string(), name: z.string(), weight: z.number(), score: z.number(), metrics: z.array(iqacMetricViewSchema) })),
    }),
  ),
  nextBand: z.object({ grade: z.string(), min: z.number(), distance: z.number() }).nullable(),
  cheapest: z.array(z.object({ code: z.string(), text: z.string(), gainPerUnit: z.number(), unit: z.string() })),
  trend: z.array(z.object({ term: z.string(), cgpa: z.number(), computedAt: z.string().datetime() })),
  entered: z.array(z.object({ key: iqacEnteredInputSchema, label: z.string(), value: z.number().nullable() })),
  canEdit: z.boolean(),
});
export type IqacPredictor = z.infer<typeof iqacPredictorSchema>;

/** POST …/metrics/{code}: a qualitative score with evidence (at least one file or row), or a note. */
export const iqacScoreSchema = z.object({
  score: z.number().min(0).max(4).multipleOf(0.25),
  note: z.string().trim().max(4000).default(""),
  fileIds: z.array(z.string().min(1).max(200)).max(20).default([]),
  evidence: z.array(z.object({ type: z.enum(["ResearchItem", "Activity", "CommitteeMeeting", "Survey", "ActionTakenReport", "Filing"]), id })).max(50).default([]),
});
/** POST …/inputs: the figures the platform does not hold, each with a file. */
export const iqacInputsSaveSchema = z.object({ values: z.array(z.object({ key: iqacEnteredInputSchema, value: z.number().min(0).max(1e9).nullable() })).min(1).max(IQAC_ENTERED_INPUTS.length), fileIds: z.array(z.string().min(1).max(200)).max(5).default([]) });

export const iqacEvidenceUploadSchema = z.object({ fileId: z.string().min(1).max(200), title: z.string().trim().min(2).max(200) });
export const iqacFileSchema = z.object({ fileId: z.string(), title: z.string(), uploadedAt: z.string().datetime(), by: z.string() });
export const iqacFilesSchema = z.object({ items: z.array(iqacFileSchema) });

/* Registers ----------------------------------------------------------------- */

export const researchItemSaveSchema = z.object({
  kind: researchKindSchema,
  title: z.string().trim().min(3).max(400),
  indexing: researchIndexingSchema.default("NONE"),
  year: z.number().int().min(1950).max(2100),
  amountLakhs: z.number().min(0).max(100000).nullable().default(null),
  facultyMembershipId: id.nullable().default(null),
  departmentId: z.string().max(64).nullable().default(null),
  fileId: z.string().max(200).nullable().default(null),
});
export const researchItemSchema = z.object({
  id: z.string(),
  kind: researchKindSchema,
  title: z.string(),
  indexing: researchIndexingSchema,
  year: z.number().int(),
  amountLakhs: z.number().nullable(),
  facultyMembershipId: z.string().nullable(),
  facultyName: z.string().nullable(),
  departmentId: z.string().nullable(),
  fileId: z.string().nullable(),
  mine: z.boolean(),
});
export const researchRegisterSchema = z.object({
  items: z.array(researchItemSchema),
  /** Per teacher: items by kind, the ratio NAAC 3.2.1 / 3.4.1 reads. */
  perTeacher: z.object({ teachers: z.number().int(), publications: z.number(), books: z.number() }),
  scope: z.enum(["MINE", "DEPARTMENT", "COLLEGE"]),
});

export const activitySaveSchema = z.object({
  kind: activityKindSchema,
  title: z.string().trim().min(3).max(300),
  at: dateKey,
  participants: z.number().int().min(0).max(100000).default(0),
  participantMembershipIds: z.array(id).max(2000).default([]),
  theme: capacityThemeSchema.nullable().default(null),
  departmentId: z.string().max(64).nullable().default(null),
  fileId: z.string().max(200).nullable().default(null),
});
export const activitySchema = z.object({ id: z.string(), kind: activityKindSchema, title: z.string(), at: dateKey, participants: z.number().int(), staffParticipants: z.number().int(), theme: capacityThemeSchema.nullable(), departmentId: z.string().nullable(), fileId: z.string().nullable() });
export const activitiesSchema = z.object({ items: z.array(activitySchema), canEdit: z.boolean() });

export const committeeSaveSchema = z.object({
  kind: committeeKindSchema,
  name: z.string().trim().min(3).max(200),
  members: z.array(z.object({ name: z.string().trim().min(2).max(120), role: z.string().trim().max(120).default(""), membershipId: id.nullable().default(null) })).min(1).max(40),
});
export const committeeMeetingSaveSchema = z.object({ at: dateKey, minutesFileId: z.string().max(200).nullable().default(null), actionTaken: z.string().trim().max(4000).default("") });
export const committeeSchema = z.object({
  id: z.string(),
  kind: committeeKindSchema,
  name: z.string(),
  members: z.array(z.object({ name: z.string(), role: z.string(), membershipId: z.string().nullable() })),
  meetings: z.array(z.object({ id: z.string(), at: dateKey, minutesFileId: z.string().nullable(), actionTaken: z.string() })),
});
export const committeesSchema = z.object({ items: z.array(committeeSchema), canEdit: z.boolean() });

/* Surveys -------------------------------------------------------------------- */

export const surveySaveSchema = z.object({
  kind: surveyKindSchema,
  title: z.string().trim().min(3).max(200),
  opensOn: dateKey,
  closesOn: dateKey,
  /** COURSE_FEEDBACK only: the academics builder's CourseOffering id. */
  offeringId: z.string().max(64).nullable().default(null),
  termId: z.string().max(64).nullable().default(null),
});
export const surveySchema = z.object({
  id: z.string(),
  kind: surveyKindSchema,
  title: z.string(),
  opensOn: dateKey,
  closesOn: dateKey,
  offeringId: z.string().nullable(),
  status: z.enum(["UPCOMING", "OPEN", "CLOSED"]),
  responses: z.number().int(),
  anonymous: z.boolean(),
  atrPublishedAt: z.string().datetime().nullable(),
});
export const surveysSchema = z.object({ items: z.array(surveySchema), canEdit: z.boolean() });
export const surveyResultsSchema = z.object({
  survey: surveySchema,
  /** Aggregates only, never a respondent: mean (0–4) and the count of each answer per question. Hidden below five responses. */
  questions: z.array(z.object({ code: z.string(), label: z.string(), mean: z.number().nullable(), counts: z.array(z.number().int()) })),
  overall: z.number().nullable(),
  suppressed: z.boolean(),
  atr: z.object({ text: z.string(), fileId: z.string().nullable(), publishedAt: z.string().datetime().nullable() }).nullable(),
});
export const surveyAnswerSchema = z.object({ answers: z.record(z.string().max(40), z.number().int().min(0).max(4)) });
export const surveyTranscribeSchema = z.object({ answers: z.record(z.string().max(40), z.number().int().min(0).max(4)), source: z.string().trim().min(2).max(200) });
export const actionTakenSaveSchema = z.object({ text: z.string().trim().min(10).max(8000), fileId: z.string().max(200).nullable().default(null), publish: z.boolean().default(false) });

/* The student's voice ------------------------------------------------------- */

export const voiceSchema = z.object({
  surveys: z.array(z.object({ id: z.string(), kind: surveyKindSchema, title: z.string(), closesOn: dateKey, answered: z.boolean(), questions: z.array(z.object({ code: z.string(), label: z.string() })) })),
  grievances: z.array(z.object({ id: z.string(), kind: grievanceKindSchema, text: z.string(), status: grievanceStatusSchema, filedAt: z.string().datetime(), dueOn: dateKey, overdue: z.boolean(), response: z.string(), escalatedAt: z.string().datetime().nullable() })),
  canFileGrievance: z.boolean(),
});
/** G-5: a signed link for one respondent of an employer's or a parent's survey, and what a signed-out respondent reads through it. */
export const surveyLinkSchema = z.object({ token: z.string(), path: z.string() });
export const publicSurveySchema = z.object({ title: z.string(), kind: surveyKindSchema, closesOn: dateKey, answered: z.boolean(), questions: z.array(z.object({ code: z.string(), label: z.string() })) });
export const grievanceFileSchema = z.object({ kind: grievanceKindSchema, text: z.string().trim().min(10).max(4000), fileId: z.string().max(200).nullable().default(null), anonymousToStaff: z.boolean().default(false) });
export const grievanceActionSchema = z.object({ action: z.enum(["ACKNOWLEDGE", "RESOLVE", "ESCALATE"]), note: z.string().trim().min(2).max(4000) });
export const grievanceDeskSchema = z.object({
  items: z.array(z.object({ id: z.string(), kind: grievanceKindSchema, text: z.string(), by: z.string(), status: grievanceStatusSchema, filedAt: z.string().datetime(), dueOn: dateKey, overdue: z.boolean(), response: z.string(), ombudspersonNote: z.string(), committee: committeeKindSchema, fileId: z.string().nullable() })),
  summary: z.object({ month: z.string(), filed: z.number().int(), resolved: z.number().int(), withinLimit: z.number().int(), overdue: z.number().int(), escalated: z.number().int(), open: z.number().int() }),
  canAct: z.boolean(),
});

/* Faculty records ------------------------------------------------------------ */

export const facultyRecordSaveSchema = z.object({
  membershipId: id,
  designation: facultyDesignationSchema,
  appointment: facultyAppointmentSchema,
  highestQualification: facultyQualificationSchema,
  netSetQualified: z.boolean().default(false),
  experienceBeforeYears: z.number().min(0).max(60).default(0),
  joinedOn: dateKey.nullable().default(null),
  departmentId: z.string().max(64).nullable().default(null),
  apaarFacultyId: z.string().trim().max(40).nullable().default(null),
  /** Typed once and sealed; omitted keeps the one on file. */
  pan: z.string().trim().toUpperCase().regex(PAN_PATTERN).nullable().optional(),
  apiScoreInputs: z.object({ teaching: z.number().min(0).max(1000).default(0), research: z.number().min(0).max(1000).default(0), service: z.number().min(0).max(1000).default(0) }).default({}),
});
export const facultyRecordSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  role: z.string(),
  designation: facultyDesignationSchema.nullable(),
  appointment: facultyAppointmentSchema.nullable(),
  highestQualification: facultyQualificationSchema.nullable(),
  netSetQualified: z.boolean(),
  experienceYears: z.number().nullable(),
  joinedOn: dateKey.nullable(),
  departmentId: z.string().nullable(),
  apaarFacultyId: z.string().nullable(),
  panLast4: z.string().nullable(),
  apiScore: z.number(),
  experienceBeforeYears: z.number(),
  apiScoreInputs: z.object({ teaching: z.number(), research: z.number(), service: z.number() }),
  fdps: z.number().int(),
  publications: z.number().int(),
  complete: z.boolean(),
});
export const facultyRecordsSchema = z.object({ items: z.array(facultyRecordSchema), canEdit: z.boolean(), ratio: z.object({ students: z.number().int(), fullTime: z.number().int() }) });

/* Filings -------------------------------------------------------------------- */

/** `departmentId`: the engineering department an NBA SAR is for (one SAR per department per year); every other kind is the college's and ignores it. */
/** `again`: make it although that year's is already filed (audit of 5 Oct 2026, A3-journeys-35); without it that is refused with the warning. */
export const collegeFilingGenerateSchema = z.object({ kind: collegeFilingKindSchema, year: z.number().int().min(2000).max(2100), cycleId: z.string().max(64).nullable().default(null), departmentId: z.string().max(64).nullable().default(null), again: z.boolean().default(false) });
export const collegeFilingSchema = z.object({
  id: z.string(),
  kind: collegeFilingKindSchema,
  year: z.number().int(),
  format: z.enum(["PDF", "CSV"]),
  generatedAt: z.string().datetime(),
  hash: z.string(),
  status: collegeFilingStatusSchema,
  checked: z.boolean(),
  principalNote: z.string(),
  signedOffAt: z.string().datetime().nullable(),
  figures: z.record(z.string(), z.number()),
  /** An NBA SAR's department; null for a college-wide filing (5 Oct 2026). */
  departmentId: z.string().nullable().default(null),
});
export const collegeFilingsSchema = z.object({ items: z.array(collegeFilingSchema), canGenerate: z.boolean(), canSignOff: z.boolean() });
export const collegeFilingSignoffSchema = z.object({ decision: z.enum(["SIGN", "RETURN"]), note: z.string().trim().max(4000).default("") });

/* The home ------------------------------------------------------------------- */

export const iqacOverviewSchema = z.object({
  cycle: iqacCycleSchema.nullable(),
  nextBand: z.object({ grade: z.string(), min: z.number(), distance: z.number() }).nullable(),
  cheapest: z.array(z.object({ code: z.string(), text: z.string(), gainPerUnit: z.number(), unit: z.string() })),
  counts: z.object({ research: z.number().int(), activities: z.number().int(), committees: z.number().int(), openSurveys: z.number().int(), openGrievances: z.number().int(), overdueGrievances: z.number().int(), filings: z.number().int(), awaitingSignoff: z.number().int() }),
  calendar: z.array(z.object({ code: z.string(), label: z.string(), from: dateKey, to: dateKey, filing: collegeFilingKindSchema, filedThisYear: z.boolean() })),
  nirf: z.object({ partial: z.number(), coveredMarks: z.number(), parameters: z.array(z.object({ code: z.string(), name: z.string(), weight: z.number(), marks: z.number().nullable(), note: z.string() })) }),
  disclosurePublishedAt: z.string().datetime().nullable(),
});
export type IqacOverview = z.infer<typeof iqacOverviewSchema>;

export const disclosureSetSchema = z.object({ publish: z.boolean() });
export const disclosureSchema = z.object({ publishedAt: z.string().datetime().nullable(), slug: z.string(), url: z.string() });

export const filingFiledSchema = z.object({ fileId: z.string().max(200).nullable().default(null) });
export const grievanceEscalateSchema = z.object({ note: z.string().trim().min(2).max(4000) });
/** GET /api/v1/iqac/faculty-records/mine — a teacher's own record as the office keeps it; null until it does. */
export const myFacultyProfileSchema = z
  .object({ membershipId: z.string(), name: z.string(), role: z.string(), designation: z.string().nullable(), highestQualification: z.string().nullable(), netSetQualified: z.boolean(), apiScore: z.number(), fdps: z.number().int(), publications: z.number().int() })
  .nullable();

export type Voice = z.infer<typeof voiceSchema>;

/**
 * A FACULTY MEMBER'S PUBLIC PROFILE (5 Oct 2026; integration decision 10): the snapshot a teacher publishes for the
 * college's website, linked from the published disclosure. Codes, not words — the page says them in its reader's
 * language. No contact detail, no PAN, no student.
 */
export const facultyProfileSnapshotSchema = z.object({
  name: z.string(),
  collegeName: z.string(),
  departmentName: z.string().nullable(),
  designation: z.string(),
  qualification: z.string(),
  netSetQualified: z.boolean(),
  experienceYears: z.number(),
  research: z.array(z.object({ kind: z.string(), title: z.string(), year: z.number().int(), indexing: z.string() })),
});
export type FacultyProfileSnapshot = z.infer<typeof facultyProfileSnapshotSchema>;
/** GET /api/v1/faculty/profile — my record's public page: whether there is a record to publish, the preview, and whether it is up. */
export const myFacultyPublicProfileSchema = z.object({ hasRecord: z.boolean(), publishedAt: z.string().datetime().nullable(), preview: facultyProfileSnapshotSchema.nullable(), url: z.string().nullable() });
/** POST /api/v1/faculty/profile — publish (or refresh) my page, or take it down. */
export const facultyProfilePublishSchema = z.object({ publish: z.boolean() });
/** GET /api/v1/public/faculty/{slug} — a college's published profiles, signed out. */
export const publicFacultySchema = z.object({ collegeName: z.string().nullable(), profiles: z.array(facultyProfileSnapshotSchema.extend({ id: z.string(), publishedAt: z.string().datetime() })) });
