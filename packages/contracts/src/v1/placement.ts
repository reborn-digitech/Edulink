import { z } from "zod";

/**
 * THE PLACEMENT MODULE (module PLACEMENT, roles TPO and RECRUITER; the owner's
 * college plan of 4 October 2026). The placement cell runs on the college's
 * own record: eligibility for a drive is computed from the exam cell's CGPA
 * and live backlogs and the programme a student is enrolled on, never typed;
 * a recruiter is an outside account that reaches a college only through a
 * drive whose company it is bound to, and sees a student's name only after
 * that student has consented to that drive; internships are kept per student
 * under the AICTE policy; and the three-year table NAAC, NBA and NIRF ask for
 * comes out of the same rows. Money never touches the platform (decision
 * 0003): a package is a number a company states, a gift is a record of what
 * the college received outside the app.
 */

const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const text = (max: number) => z.string().trim().max(max);

/* -------------------------------------------------------------------------- */
/* Coded lists                                                                 */
/* -------------------------------------------------------------------------- */

export const DRIVE_KINDS = ["ON_CAMPUS", "OFF_CAMPUS", "POOLED"] as const;
export const driveKindSchema = z.enum(DRIVE_KINDS);
export type DriveKind = z.infer<typeof driveKindSchema>;

/** A drive's life: DRAFT (the cell preparing) → OPEN (applications) → SHORTLISTING → ROUNDS → OFFERS → CLOSED. */
export const DRIVE_STATUSES = ["DRAFT", "OPEN", "SHORTLISTING", "ROUNDS", "OFFERS", "CLOSED"] as const;
export const driveStatusSchema = z.enum(DRIVE_STATUSES);
export type DriveStatus = z.infer<typeof driveStatusSchema>;
/** The statuses a bound recruiter reads a drive in; DRAFT is the cell's and CLOSED is nobody's (nothing leaves after a drive closes). */
export const RECRUITER_LIVE_STATUSES = ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"] as const;

/**
 * Where an application stands, computed on read from the round results and
 * the offers (never stored twice): APPLIED, SHORTLISTED (passed round 0, the
 * shortlist), ROUND (in round `round`), SELECTED (an offer), REJECTED (a round
 * said no), WITHDRAWN (the student's own act).
 */
export const APPLICATION_STATUSES = ["APPLIED", "SHORTLISTED", "ROUND", "SELECTED", "REJECTED", "WITHDRAWN"] as const;
export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

/** A round's outcome for one candidate. Round 0 is the shortlist. */
export const ROUND_OUTCOMES = ["PASSED", "REJECTED", "ABSENT", "ON_HOLD"] as const;
export const roundOutcomeSchema = z.enum(ROUND_OUTCOMES);
export type RoundOutcome = z.infer<typeof roundOutcomeSchema>;

/** The kinds of round a company plans, coded so the schedule reads the same in three languages. */
export const ROUND_KINDS = ["APTITUDE", "TECHNICAL_TEST", "GROUP_DISCUSSION", "TECHNICAL_INTERVIEW", "HR_INTERVIEW", "CODING", "CASE", "OTHER"] as const;
export const roundKindSchema = z.enum(ROUND_KINDS);

/** Sectors, for "recruiters by sector" and the brochure. */
export const PLACEMENT_SECTORS = ["IT_SOFTWARE", "CORE_ENGINEERING", "BFSI", "CONSULTING", "MANUFACTURING", "PHARMA_HEALTH", "FMCG_RETAIL", "EDTECH", "GOVT_PSU", "STARTUP", "OTHER"] as const;
export const placementSectorSchema = z.enum(PLACEMENT_SECTORS);
export type PlacementSector = z.infer<typeof placementSectorSchema>;

/** Gender as the record codes it (PupilRecord.gender), for a drive whose company insists and whose college allows. */
export const PLACEMENT_GENDERS = ["M", "F", "T"] as const;
export const placementGenderSchema = z.enum(PLACEMENT_GENDERS);

/** Why a student is not eligible for a drive, one code per failed condition. */
export const ELIGIBILITY_FAILURES = ["CGPA", "CGPA_UNKNOWN", "BACKLOGS", "BACKLOGS_UNKNOWN", "PROGRAMME", "BATCH", "GENDER", "OPTED_OUT", "PLACED"] as const;
export const eligibilityFailureSchema = z.enum(ELIGIBILITY_FAILURES);
export type EligibilityFailure = z.infer<typeof eligibilityFailureSchema>;

/** Salary bands for the table (lakh rupees a year, CTC). */
export const SALARY_BANDS = ["UNDER_3", "3_TO_5", "5_TO_8", "8_TO_12", "12_PLUS"] as const;
export const salaryBandSchema = z.enum(SALARY_BANDS);
export type SalaryBand = z.infer<typeof salaryBandSchema>;
export function salaryBandOf(rupees: number): SalaryBand {
  const lakh = rupees / 100_000;
  if (lakh < 3) return "UNDER_3";
  if (lakh < 5) return "3_TO_5";
  if (lakh < 8) return "5_TO_8";
  if (lakh < 12) return "8_TO_12";
  return "12_PLUS";
}

/** The AICTE's three, then (stream records, 5 Oct 2026, ./stream-records.ts) a law student's COURT, FIRM and LEGAL_AID and a management student's SUMMER; `internshipKindsFor(streams)` says which a college offers. */
export const INTERNSHIP_KINDS = ["INDUSTRY", "RESEARCH", "FAMILY_BUSINESS", "COURT", "FIRM", "LEGAL_AID", "SUMMER"] as const;
export const internshipKindSchema = z.enum(INTERNSHIP_KINDS);
export type InternshipKind = z.infer<typeof internshipKindSchema>;
/** PROPOSED by the student → APPROVED by the cell or the HOD → SUBMITTED (report in) → EVALUATED (grade, visit, viva) → CREDITED; REFUSED at the first step. */
export const INTERNSHIP_STATUSES = ["PROPOSED", "APPROVED", "SUBMITTED", "EVALUATED", "CREDITED", "REFUSED"] as const;
export const internshipStatusSchema = z.enum(INTERNSHIP_STATUSES);
export type InternshipStatus = z.infer<typeof internshipStatusSchema>;
/** The industry supervisor's grade, as the form the student brings back prints it. */
export const INDUSTRY_GRADES = ["O", "A", "B", "C", "D", "F"] as const;
export const industryGradeSchema = z.enum(INDUSTRY_GRADES);

/**
 * THE AICTE INTERNSHIP RULE for a four-year B.Tech (AICTE Internship Policy:
 * Guidelines & Procedures, 2019, https://aicte.gov.in/sites/default/files/AICTE%20Internship%20Policy.pdf):
 * 14 to 20 credits of internship over the programme, 600 to 700 hours in all,
 * done in the summer windows after the second, fourth and sixth semesters.
 * The credits of one internship are decided by the cell or the HOD when it
 * is evaluated — never computed from the hours here — and the programme's
 * running total may not pass the maximum.
 */
export const AICTE_INTERNSHIP_BTECH = {
  creditsMin: 14,
  creditsMax: 20,
  hoursMin: 600,
  hoursMax: 700,
  windows: [2, 4, 6] as const,
  source: "AICTE Internship Policy (2019), aicte.gov.in",
} as const;
export const INTERNSHIP_WINDOWS = [2, 4, 6] as const;
/** 2, 4 or 6 for the AICTE's kinds; a law internship may also sit after semester 8 or 10 (LAW_INTERNSHIP_WINDOWS, 5 Oct 2026) — the library refuses the rest. */
export const internshipWindowSchema = z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8), z.literal(10)]);

export const ALUMNI_GIFT_KINDS = ["DONATION", "ENDOWMENT", "SCHOLARSHIP", "IN_KIND"] as const;
export const alumniGiftKindSchema = z.enum(ALUMNI_GIFT_KINDS);
export type AlumniGiftKind = z.infer<typeof alumniGiftKindSchema>;

/**
 * The placement bank's subjects on the practice-quiz engine (no new table:
 * topics in the shared bank carry one of these as their subject).
 */
export const PLACEMENT_PREP_SUBJECTS = ["APTITUDE", "REASONING", "CODING"] as const;

/**
 * A company's registration number, format-checked and never looked up: a
 * GSTIN (two-digit state code, the PAN, an entity digit, Z, a check
 * character — the check character verified) or a CIN (listing, industry code,
 * state, year, ownership, serial).
 */
const GSTIN_RE = /^(\d{2})([A-Z]{5}\d{4}[A-Z])([1-9A-Z])Z([0-9A-Z])$/;
const CIN_RE = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const GST_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const value = GST_CHARS.indexOf(first14[i]!);
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GST_CHARS[(36 - (sum % 36)) % 36]!;
}
export function isGstin(raw: string): boolean {
  const s = raw.trim().toUpperCase();
  if (!GSTIN_RE.test(s)) return false;
  return gstinCheckChar(s.slice(0, 14)) === s[14];
}
export function isCin(raw: string): boolean {
  return CIN_RE.test(raw.trim().toUpperCase());
}
export const companyIdentifierSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase().replace(/\s+/g, ""))
  .refine((v) => isGstin(v) || isCin(v), "gstinOrCin");

/* -------------------------------------------------------------------------- */
/* The record, the rule, eligibility                                           */
/* -------------------------------------------------------------------------- */

/** What the exam cell and the office hold about a student, as the placement cell reads it. Every field null when not known yet. */
export const placementRecordSchema = z.object({
  cgpa: z.number().nullable(),
  liveBacklogs: z.number().int().nullable(),
  attendancePct: z.number().nullable(),
  programmeId: z.string().nullable(),
  programmeName: z.string().nullable(),
  batchYear: z.number().int().nullable(),
  gender: placementGenderSchema.nullable(),
  category: z.string().nullable(),
});
export type PlacementRecord = z.infer<typeof placementRecordSchema>;
/**
 * The record as SHARED on an application — with the drive's company, a pooled
 * drive's host, and anyone reading the application — without gender and
 * caste category: the cell reads those live for a gender-limited rule and
 * the category-wise analytics, but the student never consented to hand them
 * to a recruiter, and the CSV and the resume already leave them out
 * (campaign S-3).
 */
export const sharedPlacementRecordSchema = placementRecordSchema.omit({ gender: true, category: true });
export type SharedPlacementRecord = z.infer<typeof sharedPlacementRecordSchema>;

/** A drive's eligibility rule. Empty lists mean "any". */
export const eligibilityRuleSchema = z.object({
  cgpaMin: z.number().min(0).max(10).nullable().default(null),
  noLiveBacklogs: z.boolean().default(false),
  programmeIds: z.array(z.string().max(40)).max(40).default([]),
  batchYear: z.number().int().min(2000).max(2100).nullable().default(null),
  genders: z.array(placementGenderSchema).max(3).default([]),
});
export type EligibilityRule = z.infer<typeof eligibilityRuleSchema>;

export const eligibilityFailSchema = z.object({ code: eligibilityFailureSchema, need: z.string().nullable(), have: z.string().nullable() });
export type EligibilityFail = z.infer<typeof eligibilityFailSchema>;

export const eligibilityRowSchema = z.object({
  studentMembershipId: z.string(),
  name: z.string(),
  eligible: z.boolean(),
  failed: z.array(eligibilityFailSchema),
  record: placementRecordSchema,
});
/** GET /api/v1/placement/drives/{driveId}/eligibility — who qualifies and, for each who does not, every failed condition. */
export const driveEligibilitySchema = z.object({ driveId: z.string(), eligible: z.number().int(), total: z.number().int(), rows: z.array(eligibilityRowSchema) });

/* -------------------------------------------------------------------------- */
/* Companies and requirements                                                  */
/* -------------------------------------------------------------------------- */

export const companyViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  identifier: z.string(),
  sectors: z.array(placementSectorSchema),
  pointOfContact: z.string(),
  verifiedAt: isoOrNull,
  recruiters: z.number().int(),
  /** This college's first visit year, when it has one. */
  firstVisitYear: z.number().int().nullable(),
  drives: z.number().int(),
});
export type CompanyView = z.infer<typeof companyViewSchema>;
export const companyListSchema = z.object({ companies: z.array(companyViewSchema) });

/** POST /api/v1/placement/companies (the cell) and /api/v1/recruiter/company (a recruiter's own). */
export const companySaveSchema = z.object({
  name: text(160).min(2),
  identifier: companyIdentifierSchema,
  sectors: z.array(placementSectorSchema).min(1).max(5),
  pointOfContact: text(200).min(2),
});
export type CompanySave = z.infer<typeof companySaveSchema>;

export const roundPlanSchema = z.object({ kind: roundKindSchema, note: text(200).default("") });
export type RoundPlan = z.infer<typeof roundPlanSchema>;

export const requirementViewSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  companyVerified: z.boolean(),
  role: z.string(),
  packageRupees: z.number().int(),
  bond: z.string(),
  locations: z.string(),
  eligibilityAsked: eligibilityRuleSchema,
  rounds: z.array(roundPlanSchema),
  datesProposed: z.string(),
  targetSchools: z.array(z.object({ id: z.string(), name: z.string() })),
  createdAt: iso,
  /** For the cell: the drive this college made of it, if any. */
  driveId: z.string().nullable(),
});
export type RequirementView = z.infer<typeof requirementViewSchema>;
export const requirementListSchema = z.object({ requirements: z.array(requirementViewSchema) });

/** POST /api/v1/recruiter/requirements — one requirement to one college or several. */
export const requirementSaveSchema = z.object({
  role: text(160).min(2),
  packageRupees: z.number().int().min(0).max(1_000_000_000),
  bond: text(300).default(""),
  locations: text(300).default(""),
  eligibilityAsked: eligibilityRuleSchema.default({}),
  rounds: z.array(roundPlanSchema).max(8).default([]),
  datesProposed: text(300).default(""),
  targetSchoolIds: z.array(z.string().max(40)).min(1).max(30),
});
export type RequirementSave = z.infer<typeof requirementSaveSchema>;

/* -------------------------------------------------------------------------- */
/* Drives                                                                      */
/* -------------------------------------------------------------------------- */

export const driveScheduleItemSchema = z.object({ label: text(120).min(1), at: iso });
export const driveRoundSchema = z.object({ n: z.number().int().min(1).max(8), kind: roundKindSchema, note: text(200).default(""), at: isoOrNull.default(null) });
export type DriveRound = z.infer<typeof driveRoundSchema>;

export const driveSaveSchema = z.object({
  companyId: cuid,
  requirementId: cuid.nullable().default(null),
  kind: driveKindSchema,
  title: text(160).min(2),
  jd: text(6000).default(""),
  packageMinRupees: z.number().int().min(0).max(1_000_000_000),
  packageMaxRupees: z.number().int().min(0).max(1_000_000_000),
  bond: text(300).default(""),
  rounds: z.array(driveRoundSchema).max(8).default([]),
  schedule: z.array(driveScheduleItemSchema).max(20).default([]),
  venues: text(300).default(""),
  rule: eligibilityRuleSchema.default({}),
  /** A pooled drive's guest colleges (the host is the cell opening it). */
  poolSchoolIds: z.array(z.string().max(40)).max(20).default([]),
});
export type DriveSave = z.infer<typeof driveSaveSchema>;

/** POST /api/v1/placement/drives/{driveId} — the cell's edit: any of the fields, or the next status. */
export const driveUpdateSchema = driveSaveSchema.partial().extend({ status: driveStatusSchema.optional() });
export type DriveUpdate = z.infer<typeof driveUpdateSchema>;

export const roundResultViewSchema = z.object({ round: z.number().int(), outcome: roundOutcomeSchema, feedback: z.string().nullable(), feedbackShared: z.boolean(), at: iso });

export const offerViewSchema = z.object({
  id: z.string(),
  driveId: z.string(),
  driveTitle: z.string(),
  companyName: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  packageRupees: z.number().int(),
  hasLetter: z.boolean(),
  /** The letter's stored file, served at /api/files/{id} to the student, their consenting guardian, the host's cell and the bound recruiter. */
  letterFileId: z.string().nullable(),
  acceptedAt: isoOrNull,
  declinedAt: isoOrNull,
  joinedAt: isoOrNull,
  dreamException: z.boolean(),
  createdAt: iso,
});
export type OfferView = z.infer<typeof offerViewSchema>;

export const applicationViewSchema = z.object({
  id: z.string(),
  driveId: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  /** The student's college, for a pooled drive's guests. */
  schoolName: z.string(),
  appliedAt: iso,
  consentAt: isoOrNull,
  status: applicationStatusSchema,
  /** The round the candidate is in, for ROUND. */
  round: z.number().int().nullable(),
  /** The record the student consented to share, frozen at applying — never gender or category. */
  record: sharedPlacementRecordSchema,
  skills: z.array(z.string()),
  results: z.array(roundResultViewSchema),
  offer: offerViewSchema.nullable(),
});
export type DriveApplicationView = z.infer<typeof applicationViewSchema>;

export const driveSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  companyVerified: z.boolean(),
  kind: driveKindSchema,
  status: driveStatusSchema,
  packageMinRupees: z.number().int(),
  packageMaxRupees: z.number().int(),
  /** The host college's name; the reader's own college for its own drives. */
  hostName: z.string(),
  /** True when the reader's college hosts it (a pooled guest reads a drive it cannot edit). */
  hosted: z.boolean(),
  nextAt: isoOrNull,
  applicants: z.number().int(),
  offers: z.number().int(),
  createdAt: iso,
});
export type DriveSummary = z.infer<typeof driveSummarySchema>;
export const driveListSchema = z.object({ drives: z.array(driveSummarySchema), canEdit: z.boolean() });

export const driveViewSchema = driveSummarySchema.extend({
  jd: z.string(),
  bond: z.string(),
  rounds: z.array(driveRoundSchema),
  schedule: z.array(driveScheduleItemSchema),
  venues: z.string(),
  rule: eligibilityRuleSchema,
  requirementId: z.string().nullable(),
  poolSchools: z.array(z.object({ id: z.string(), name: z.string() })),
  eligibleCount: z.number().int(),
  invitedAt: isoOrNull,
  closedAt: isoOrNull,
  applications: z.array(applicationViewSchema),
  recruiterRating: z.number().int().nullable(),
  recruiterFeedback: z.string().nullable(),
  canEdit: z.boolean(),
});
export type DriveView = z.infer<typeof driveViewSchema>;

/** POST /api/v1/placement/drives/{driveId}/results — a round's outcomes, by the cell or the bound recruiter. Round 0 is the shortlist. */
export const roundResultsSaveSchema = z.object({
  round: z.number().int().min(0).max(8),
  results: z
    .array(z.object({ studentMembershipId: z.string().max(40), outcome: roundOutcomeSchema, feedback: text(1000).nullable().default(null), feedbackShared: z.boolean().default(false) }))
    .min(1)
    .max(500),
});
export type RoundResultsSave = z.infer<typeof roundResultsSaveSchema>;
export const roundResultsResultSchema = z.object({ saved: z.number().int(), told: z.number().int() });

/** POST /api/v1/placement/drives/{driveId}/offers — an offer to a selected candidate, the letter through an upload ticket. */
export const offerSaveSchema = z.object({
  studentMembershipId: z.string().max(40),
  packageRupees: z.number().int().min(0).max(1_000_000_000),
  letterFileId: z.string().max(200).nullable().default(null),
  /**
   * The recorder has seen the warning (A3-journeys-18, 5 October 2026): an
   * offer above HIGH_OFFER_RATIO (1.5) times the drive's highest package is
   * answered 409 `placement.confirmHighOffer` unless this is true.
   */
  confirmedHigh: z.boolean().optional(),
});
export type OfferSave = z.infer<typeof offerSaveSchema>;

/** POST /api/v1/placement/offers/{offerId}/joined */
export const offerJoinedSchema = z.object({ joinedOn: dateKey });

export const inviteResultSchema = z.object({ told: z.number().int(), eligible: z.number().int() });

/* -------------------------------------------------------------------------- */
/* The cell's own pages                                                        */
/* -------------------------------------------------------------------------- */

export const placementSettingsSchema = z.object({
  /** The batch (year of passing) whose season this is. */
  seasonBatchYear: z.number().int().min(2000).max(2100),
  /** A dream drive's package must exceed the accepted one by this ratio (1.5 = 50 % more). */
  dreamRatio: z.number().min(1).max(5),
  /** The college allows a drive to be limited by gender when a company insists. */
  allowGenderRule: z.boolean(),
});
export type PlacementSettings = z.infer<typeof placementSettingsSchema>;
export const placementSettingsViewSchema = placementSettingsSchema.extend({ canEdit: z.boolean() });

export const placementStudentSchema = z.object({
  studentMembershipId: z.string(),
  name: z.string(),
  record: placementRecordSchema,
  optedOut: z.boolean(),
  dreamFlag: z.boolean(),
  higherStudies: z.boolean(),
  entrepreneur: z.boolean(),
  consentAt: isoOrNull,
  offers: z.number().int(),
  acceptedRupees: z.number().int().nullable(),
  /** Soft-skills trainings completed (R-2, 5 Oct 2026; ./placement-events.ts `softSkillsCompleted`), computed on read. */
  softSkillsCompleted: z.number().int().default(0),
});
export const placementStudentsSchema = z.object({ students: z.array(placementStudentSchema), canEdit: z.boolean() });
export const dreamFlagSaveSchema = z.object({ on: z.boolean() });

export const placementTableSchema = z.object({
  batchYear: z.number().int(),
  finalYear: z.number().int(),
  placed: z.number().int(),
  higherStudies: z.number().int(),
  entrepreneurs: z.number().int(),
  placementIndex: z.number().nullable(),
  medianSalaryRupees: z.number().int().nullable(),
  offers: z.number().int(),
  byCompany: z.array(z.object({ company: z.string(), offers: z.number().int(), medianRupees: z.number().int().nullable() })),
  byProgramme: z.array(z.object({ programmeId: z.string(), programmeName: z.string(), finalYear: z.number().int(), placed: z.number().int() })),
  byCategory: z.array(z.object({ category: z.string(), finalYear: z.number().int(), placed: z.number().int() })),
  bands: z.array(z.object({ band: salaryBandSchema, count: z.number().int() })),
  bySector: z.array(z.object({ sector: placementSectorSchema, companies: z.number().int(), offers: z.number().int() })),
  offersPerStudent: z.number().nullable(),
});
export type PlacementTable = z.infer<typeof placementTableSchema>;

/** GET /api/v1/placement/analytics — the season and the three years before it, newest first, with the stored season row where published. */
export const placementAnalyticsSchema = z.object({
  tables: z.array(placementTableSchema),
  seasons: z.array(z.object({ batchYear: z.number().int(), placed: z.number().int(), higherStudies: z.number().int(), entrepreneurs: z.number().int(), medianSalaryRupees: z.number().int().nullable(), computedAt: iso })),
});
export const seasonPublishSchema = z.object({ batchYear: z.number().int().min(2000).max(2100) });
export const seasonViewSchema = z.object({ batchYear: z.number().int(), placed: z.number().int(), higherStudies: z.number().int(), entrepreneurs: z.number().int(), medianSalaryRupees: z.number().int().nullable(), computedAt: iso });

/** GET /api/v1/placement/summary — the cell's home. */
export const placementSummarySchema = z.object({
  batchYear: z.number().int(),
  table: placementTableSchema,
  drives: z.array(driveSummarySchema),
  requirementsWaiting: z.number().int(),
  internshipsWaiting: z.number().int(),
  unverifiedCompanies: z.number().int(),
  canEdit: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* The student                                                                 */
/* -------------------------------------------------------------------------- */

export const profileProjectSchema = z.object({ title: text(160).min(1), note: text(500).default("") });
export const placementProfileSaveSchema = z.object({
  skills: z.array(text(60).min(1)).max(30).default([]),
  certifications: z.array(text(160).min(1)).max(20).default([]),
  projects: z.array(profileProjectSchema).max(15).default([]),
  /** Required, so an empty body is refused rather than read as a consent. */
  optedOut: z.boolean(),
  higherStudies: z.boolean().default(false),
  entrepreneur: z.boolean().default(false),
});
export type PlacementProfileSave = z.infer<typeof placementProfileSaveSchema>;

export const placementProfileSchema = z.object({
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  projects: z.array(z.object({ title: z.string(), note: z.string() })),
  optedOut: z.boolean(),
  dreamFlag: z.boolean(),
  higherStudies: z.boolean(),
  entrepreneur: z.boolean(),
  consentAt: isoOrNull,
});

export const studentDriveSchema = z.object({
  drive: driveSummarySchema.extend({ jd: z.string(), bond: z.string(), venues: z.string(), rounds: z.array(driveRoundSchema), schedule: z.array(driveScheduleItemSchema) }),
  eligible: z.boolean(),
  failed: z.array(eligibilityFailSchema),
  application: applicationViewSchema.nullable(),
});

export const internshipViewSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  companyName: z.string(),
  kind: internshipKindSchema,
  from: dateKey,
  to: dateKey,
  hours: z.number().int(),
  credits: z.number().int().nullable(),
  windowSemester: z.number().int(),
  supervisorName: z.string(),
  facultyMembershipId: z.string().nullable(),
  facultyName: z.string().nullable(),
  diary: z.array(z.object({ on: dateKey, hours: z.number(), text: z.string() })),
  hasReport: z.boolean(),
  reportFileId: z.string().nullable(),
  industryGrade: industryGradeSchema.nullable(),
  facultyVisitAt: isoOrNull,
  vivaMarks: z.number().int().nullable(),
  status: internshipStatusSchema,
  needsDeclaration: z.boolean(),
  hasDeclaration: z.boolean(),
  declarationFileId: z.string().nullable(),
  creditedAt: isoOrNull,
});
export type InternshipView = z.infer<typeof internshipViewSchema>;
export const internshipListSchema = z.object({ internships: z.array(internshipViewSchema), creditsTotal: z.number().int().nullable(), rule: z.object({ creditsMin: z.number().int(), creditsMax: z.number().int(), hoursMin: z.number().int(), hoursMax: z.number().int(), windows: z.array(z.number().int()) }), canDecide: z.boolean() });

/** POST /api/v1/student/internships — the student proposes one. */
export const internshipProposeSchema = z.object({
  companyName: text(160).min(2),
  kind: internshipKindSchema,
  from: dateKey,
  to: dateKey,
  hours: z.number().int().min(1).max(2000),
  windowSemester: internshipWindowSchema,
  supervisorName: text(120).min(2),
});
export type InternshipPropose = z.infer<typeof internshipProposeSchema>;
/** The most hours one day of the diary holds, all its entries together (the library refuses past it, A3-journeys-22). */
export const INTERNSHIP_DIARY_DAY_HOURS = 16;
/** POST /api/v1/student/internships/{id}/diary */
export const internshipDiarySchema = z.object({ on: dateKey, hours: z.number().min(0.5).max(INTERNSHIP_DIARY_DAY_HOURS), text: text(2000).min(3) });
/** POST /api/v1/student/internships/{id}/files — the report, or a parent's declaration for a family business, by upload ticket. */
export const internshipFileSchema = z.object({ kind: z.enum(["REPORT", "DECLARATION"]), fileId: z.string().max(200) });
/** POST /api/v1/placement/internships/{id}/decide — the cell or the HOD approves (naming the supervising faculty) or refuses. */
export const internshipDecideSchema = z.object({ approve: z.boolean(), facultyMembershipId: z.string().max(40).nullable().default(null), reason: text(500).default("") });
/** POST /api/v1/placement/internships/{id}/evaluate — the grade, the visit, the viva; `credits` moves it to CREDITED. */
export const internshipEvaluateSchema = z.object({
  industryGrade: industryGradeSchema.nullable().optional(),
  facultyVisitOn: dateKey.nullable().optional(),
  vivaMarks: z.number().int().min(0).max(100).nullable().optional(),
  credits: z.number().int().min(1).max(20).nullable().optional(),
});

export const projectViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  guideMembershipId: z.string(),
  guideName: z.string(),
  students: z.array(z.object({ membershipId: z.string(), name: z.string() })),
  reviews: z.array(z.object({ on: dateKey, byName: z.string(), note: z.string(), marks: z.number().nullable() })),
  marks: z.number().nullable(),
  createdAt: iso,
});
export type ProjectView = z.infer<typeof projectViewSchema>;
export const projectListSchema = z.object({ projects: z.array(projectViewSchema), canCreate: z.boolean() });
export const projectSaveSchema = z.object({ title: text(200).min(3), guideMembershipId: z.string().max(40), studentMembershipIds: z.array(z.string().max(40)).min(1).max(6) });
export const projectReviewSchema = z.object({ on: dateKey, note: text(2000).min(3), marks: z.number().min(0).max(100).nullable().default(null), final: z.boolean().default(false) });

export const prepTopicSchema = z.object({ slug: z.string(), name: z.string(), subject: z.string(), questionCount: z.number().int(), level: z.number().int() });
export const mentorSlotSchema = z.object({ id: z.string(), title: z.string(), startsAt: iso, endsAt: iso, mentorName: z.string(), batchYear: z.number().int().nullable(), seatsLeft: z.number().int() });

/** GET /api/v1/student/placement — the student's placement page. */
export const studentPlacementSchema = z.object({
  batchYear: z.number().int(),
  profile: placementProfileSchema,
  record: placementRecordSchema,
  drives: z.array(studentDriveSchema),
  offers: z.array(offerViewSchema),
  internships: z.array(internshipViewSchema),
  internshipCredits: z.number().int(),
  prep: z.array(prepTopicSchema),
  mentorSlots: z.array(mentorSlotSchema),
  /** The soft-skills trainings the student completed (R-2, 5 Oct 2026): a line on their placement profile. */
  softSkills: z.array(z.object({ trainingId: z.string(), title: z.string(), skill: z.string() })).default([]),
});
export type StudentPlacement = z.infer<typeof studentPlacementSchema>;

/** POST /api/v1/student/placement/drives/{driveId}/apply — consent to share the profile and record with the drive's company is the act. */
export const driveApplySchema = z.object({ consent: z.literal(true) });
/** POST /api/v1/student/placement/offers/{offerId} */
export const offerAnswerSchema = z.object({ accept: z.boolean() });

/** GET /api/v1/family/placement?childId= — a guardian's view: offers and internships, with the PLACEMENT grant for an adult. */
export const familyPlacementSchema = z.object({
  name: z.string(),
  offers: z.array(offerViewSchema),
  internships: z.array(internshipViewSchema),
  /** A minor's applications that wait for this guardian's consent before the company sees anything (campaign S-6). */
  awaitingConsent: z.array(z.object({ applicationId: z.string(), driveTitle: z.string(), companyName: z.string() })).default([]),
});
/** POST /api/v1/family/placement/applications/{applicationId}/consent — a guardian's consent to a minor's drive application. */
export const familyPlacementConsentSchema = z.object({ childId: z.string().max(40) });

/* -------------------------------------------------------------------------- */
/* The recruiter                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The recruiter's company, the colleagues who accepted it, and the companies
 * that invited this recruiter and wait for an answer (campaign S-16: a binding
 * counts only once the invited recruiter accepts it).
 */
export const recruiterCompanySchema = z.object({
  company: companyViewSchema.nullable(),
  colleagues: z.array(z.object({ name: z.string(), email: z.string() })),
  invitations: z.array(z.object({ companyId: z.string(), companyName: z.string() })).default([]),
});
export const recruiterColleagueSchema = z.object({ email: z.string().trim().email().max(200) });
/** POST /api/v1/recruiter/company/invitations/{companyId} — accept or decline a colleague's invitation. */
export const recruiterInvitationAnswerSchema = z.object({ accept: z.boolean() });
export const recruiterCollegesSchema = z.object({ colleges: z.array(z.object({ id: z.string(), name: z.string(), city: z.string().nullable() })) });

/** What a bound recruiter reads of a drive: the eligible count always, names only of those who consented, and nothing once it closes. */
export const recruiterDriveSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: driveStatusSchema,
  kind: driveKindSchema,
  collegeName: z.string(),
  packageMinRupees: z.number().int(),
  packageMaxRupees: z.number().int(),
  rounds: z.array(driveRoundSchema),
  schedule: z.array(driveScheduleItemSchema),
  venues: z.string(),
  eligibleCount: z.number().int(),
  applicants: z.array(applicationViewSchema),
  recruiterRating: z.number().int().nullable(),
  recruiterFeedback: z.string().nullable(),
});
export type RecruiterDrive = z.infer<typeof recruiterDriveSchema>;
export const recruiterDrivesSchema = z.object({ drives: z.array(recruiterDriveSchema.omit({ applicants: true }).extend({ applicantCount: z.number().int() })), company: companyViewSchema.nullable() });
/** POST /api/v1/recruiter/drives/{driveId}/feedback — on the college's preparation, with a rating out of five. */
export const recruiterFeedbackSchema = z.object({ rating: z.number().int().min(1).max(5), feedback: text(2000).default("") });

/* -------------------------------------------------------------------------- */
/* Alumni, the college's additions                                            */
/* -------------------------------------------------------------------------- */

export const alumniGiftViewSchema = z.object({ id: z.string(), alumnusName: z.string(), batchYear: z.number().int().nullable(), kind: alumniGiftKindSchema, amountRupees: z.number().int().nullable(), receiptRef: z.string(), note: z.string(), on: dateKey });
export const alumniGiftSaveSchema = z.object({ alumnusMembershipId: z.string().max(40), kind: alumniGiftKindSchema, amountRupees: z.number().int().min(0).max(1_000_000_000).nullable().default(null), receiptRef: text(80).min(1), note: text(500).default(""), on: dateKey });
export const alumniReferralViewSchema = z.object({ id: z.string(), alumnusName: z.string(), companyName: z.string(), driveTitle: z.string().nullable(), note: z.string(), createdAt: iso });
export const alumniReferralSaveSchema = z.object({ driveId: z.string().max(40).nullable().default(null), companyName: text(160).default(""), note: text(1000).min(3) });
export const alumniMeetViewSchema = z.object({ id: z.string(), title: z.string(), on: dateKey, venue: z.string(), note: z.string(), batchYear: z.number().int().nullable(), registered: z.number().int(), mine: z.boolean() });
export const alumniMeetSaveSchema = z.object({ title: text(160).min(2), on: dateKey, venue: text(200).default(""), note: text(1000).default(""), batchYear: z.number().int().min(1950).max(2100).nullable().default(null) });
export const alumniMentorSlotSaveSchema = z.object({ title: text(160).min(2), startsAt: iso, minutes: z.number().int().min(15).max(120).default(30), meetingUrl: z.string().trim().url().max(500) });

/** GET /api/v1/alumni/college — the college's additions to an alumnus's home. */
export const alumniCollegeSchema = z.object({
  mentor: z.boolean(),
  slots: z.array(mentorSlotSchema),
  referrals: z.array(alumniReferralViewSchema),
  gifts: z.array(alumniGiftViewSchema),
  meets: z.array(alumniMeetViewSchema),
  openDrives: z.array(z.object({ id: z.string(), title: z.string(), companyName: z.string() })),
  surveyUrl: z.string().nullable(),
});

/** GET /api/v1/admin/alumni/college — the office's side: gifts, meets, mentors, referrals and the batch table for the AQAR. */
export const alumniCollegeAdminSchema = z.object({
  gifts: z.array(alumniGiftViewSchema),
  meets: z.array(alumniMeetViewSchema),
  referrals: z.array(alumniReferralViewSchema),
  batches: z.array(z.object({ batchYear: z.number().int(), alumni: z.number().int(), listed: z.number().int(), mentors: z.number().int(), gifts: z.number().int() })),
  alumni: z.array(z.object({ membershipId: z.string(), name: z.string(), batchYear: z.number().int() })),
});

/** POST /api/v1/alumni/college/company — an alumnus who recruits names their company by its GSTIN or CIN; null clears it. */
export const alumniCompanyLinkSaveSchema = z.object({ identifier: companyIdentifierSchema.nullable(), role: text(120).default("") });
export const alumniCompanyLinkResultSchema = z.object({ linked: z.boolean() });
/** POST /api/v1/alumni/college/meets/{meetId} — going, or not any more. */
export const alumniMeetGoingSchema = z.object({ going: z.boolean() });
export const placementChangedSchema = z.object({ changed: z.boolean() });
/** GET /api/v1/placement/analytics/export — which sheet. */
export const placementExportQuerySchema = z.object({ kind: z.enum(["NBA", "NIRF", "OFFERS"]), batchYear: z.coerce.number().int().min(2000).max(2100).optional() });
export const placementAnalyticsQuerySchema = z.object({ batchYear: z.coerce.number().int().min(2000).max(2100).optional() });
export const familyPlacementQuerySchema = z.object({ childId: z.string().max(40).optional() });
