import { z } from "zod";
import { COLLEGE_FILING_KINDS, collegeFilingKindSchema, type CollegeFilingKind } from "./iqac";
import { NOT_BUILT, STREAMS, STREAM_PRESETS, presetUnion, streamSchema, type StreamCode } from "./streams";

/**
 * WHICH FILINGS A COLLEGE MAKES, BY ITS STREAMS, AND THE COUNCILS' OWN
 * RETURNS (the owner's decision of 5 October 2026).
 *
 * A filing applies to a college when one of its streams brings it
 * (`STREAM_PRESETS[stream].filings`, the union over the college's streams):
 * every college the NAAC documents, NIRF and AISHE; a college with an AICTE
 * stream (management, engineering, pharmacy) the AICTE mandatory disclosure
 * and the affiliation return; pharmacy the PCI inspection data, law the BCI
 * return, teacher education the NCTE return, engineering NBA's SAR for each
 * engineering department. A college with no stream recorded (one made before
 * the streams, or by hand in a test) keeps the seven filings it always had:
 * LEGACY_FILINGS, so nothing a college already filed disappears from under it.
 *
 * THE THREE WORKSHEETS. What a return asks that no row of the platform holds
 * is a worksheet the college fills (FilingWorksheet): the BCI's compliance
 * items and NCTE's infrastructure items as a checklist the office answers
 * (complied, not complied, not applicable, with a note), and NBA's qualitative
 * criteria as templates the HOD writes, each self-assessed against the SAR's
 * marks. The filing prints the worksheet as it stood when generated.
 *
 * SOURCES (check each against the council's current notice; the English item
 * texts below are what the generated document prints, as FILING_TEXT is):
 *   BCI — the Bar Council of India's Rules of Legal Education, 2008 (and their
 *     schedules on minimum infrastructure, clinical courses and attendance);
 *   NCTE — the NCTE (Recognition Norms and Procedure) Regulations, 2014,
 *     Appendix 4 (norms for the B.Ed. programme: infrastructure and
 *     instructional facilities, school internship);
 *   NBA — the Self Assessment Report (SAR) format for UG Engineering
 *     programmes, Tier-II (the format for an affiliated or non-autonomous
 *     institution, 1,000 marks: criteria 1–7 at programme level, 780; 8–10 at
 *     institute level, 220), nbaind.org. The marks per item below are that
 *     format's; the quantitative items' formulas are in apps/web
 *     src/lib/council-rules.ts with the same item numbers.
 *   PCI — the Pharmacy Council of India's inspection of a pharmacy
 *     institution (teaching staff by cadre and qualification, laboratories and
 *     equipment, students by course, practical records), pci.nic.in.
 */

/** What a college with no stream recorded files: the seven filings that existed before the streams. */
export const LEGACY_FILINGS: readonly CollegeFilingKind[] = ["SSR", "AQAR", "IIQA", "NIRF", "AISHE", "AICTE_DISCLOSURE", "AFFILIATION_RETURN"];

/** The councils' own returns (5 Oct 2026). */
export const COUNCIL_FILINGS = ["PCI_INSPECTION", "BCI_RETURN", "NCTE_RETURN", "NBA_SAR"] as const satisfies readonly CollegeFilingKind[];
export type CouncilFilingKind = (typeof COUNCIL_FILINGS)[number];

/** The filings a college of these streams makes, in COLLEGE_FILING_KINDS order. */
export function applicableFilings(streams: readonly StreamCode[]): CollegeFilingKind[] {
  if (streams.length === 0) return COLLEGE_FILING_KINDS.filter((k) => LEGACY_FILINGS.includes(k));
  return presetUnion(streams).filings.slice();
}

export function filingApplies(kind: CollegeFilingKind, streams: readonly StreamCode[]): boolean {
  return applicableFilings(streams).includes(kind);
}

/** The streams whose preset brings this filing: what the documents page names beside a greyed one. */
export function streamsBringing(kind: CollegeFilingKind): StreamCode[] {
  return STREAMS.filter((s) => STREAM_PRESETS[s].filings.includes(kind));
}

/** The body each filing goes to (a word the documents page prints, as the bodies call themselves). */
export const FILING_BODY: Record<CollegeFilingKind, string> = {
  SSR: "NAAC",
  AQAR: "NAAC",
  IIQA: "NAAC",
  NIRF: "NIRF",
  AISHE: "AISHE",
  AICTE_DISCLOSURE: "AICTE",
  AFFILIATION_RETURN: "University",
  PCI_INSPECTION: "PCI",
  BCI_RETURN: "BCI",
  NCTE_RETURN: "NCTE",
  NBA_SAR: "NBA",
};

/**
 * The councils whose returns are not built: the streams whose preset names
 * records the app does not keep (health sciences: NMC, DCI, INC;
 * architecture: COA; agriculture: ICAR). The documents page shows each as
 * "not yet built" with the preset's own sentences, never as an empty card.
 */
export const UNBUILT_COUNCIL_STREAMS: readonly StreamCode[] = STREAMS.filter((s) => STREAM_PRESETS[s].notBuilt.length > 0);

/* -------------------------------------------------------------------------- */
/* The worksheets                                                              */
/* -------------------------------------------------------------------------- */

/** The BCI return's compliance items (Rules of Legal Education, 2008), as the office answers them. */
export const BCI_ITEMS = [
  "UNIVERSITY_AFFILIATION",
  "BCI_APPROVAL",
  "PRINCIPAL_IN_LAW",
  "FULL_TIME_FACULTY",
  "STUDENT_TEACHER_RATIO",
  "SECTION_SIZE",
  "MOOT_COURT_HALL",
  "LEGAL_AID_CLINIC",
  "LAW_LIBRARY",
  "LEGAL_DATABASES",
  "CLINICAL_COURSES",
  "ATTENDANCE_RULE",
  "COMMON_ROOMS",
  "WEBSITE_PARTICULARS",
] as const;
export const BCI_ITEM_TEXT: Record<(typeof BCI_ITEMS)[number], string> = {
  UNIVERSITY_AFFILIATION: "Affiliation to the university current for the academic year",
  BCI_APPROVAL: "Approval of the Bar Council of India current for the academic year",
  PRINCIPAL_IN_LAW: "A full-time principal qualified in law",
  FULL_TIME_FACULTY: "Full-time law teachers as the Rules require for the sections run",
  STUDENT_TEACHER_RATIO: "Student–teacher ratio not above 40:1",
  SECTION_SIZE: "No section above sixty students",
  MOOT_COURT_HALL: "A moot court hall",
  LEGAL_AID_CLINIC: "A legal aid clinic run by the college",
  LAW_LIBRARY: "Law library with the minimum titles, journals and law reports",
  LEGAL_DATABASES: "Computers with access to online legal databases",
  CLINICAL_COURSES: "The four clinical courses taught: drafting, professional ethics, alternative dispute resolution, moot court and internship",
  ATTENDANCE_RULE: "Attendance of seventy per cent in each subject required before the examination",
  COMMON_ROOMS: "Separate common rooms for women and men",
  WEBSITE_PARTICULARS: "The college's particulars published on its website",
};

/** NCTE's infrastructure and instructional facilities for the B.Ed. (Regulations 2014, Appendix 4), as the office answers them. */
export const NCTE_ITEMS = [
  "LAND",
  "BUILT_UP_AREA",
  "CLASSROOMS",
  "MULTIPURPOSE_HALL",
  "LIBRARY_READING_ROOM",
  "ICT_CENTRE",
  "CURRICULUM_LAB",
  "ART_CRAFT_CENTRE",
  "HEALTH_PE_CENTRE",
  "LIBRARY_TITLES",
  "COMMON_ROOMS",
  "BARRIER_FREE",
  "SCHOOL_AGREEMENTS",
  "WEBSITE_PARTICULARS",
] as const;
export const NCTE_ITEM_TEXT: Record<(typeof NCTE_ITEMS)[number], string> = {
  LAND: "Land in the institution's possession as the norms require for the units run",
  BUILT_UP_AREA: "Built-up area as the norms require for the units run",
  CLASSROOMS: "A classroom for each section",
  MULTIPURPOSE_HALL: "A multipurpose hall",
  LIBRARY_READING_ROOM: "A library-cum-reading room",
  ICT_CENTRE: "An ICT resource centre",
  CURRICULUM_LAB: "A curriculum laboratory",
  ART_CRAFT_CENTRE: "An art and craft resource centre",
  HEALTH_PE_CENTRE: "A health and physical education resource centre, with a games field",
  LIBRARY_TITLES: "Books, titles and journals on education as the norms require",
  COMMON_ROOMS: "Separate common rooms for women and men",
  BARRIER_FREE: "Barrier-free access: ramps and accessible toilets",
  SCHOOL_AGREEMENTS: "Written agreements with the schools that take students for the school internship",
  WEBSITE_PARTICULARS: "The institution's particulars published on its website",
};

/** NBA SAR Tier-II: the ten criteria and their marks (1,000). */
export const NBA_SAR_CRITERIA = [
  { code: "1", marks: 60, text: "Vision, Mission and Program Educational Objectives" },
  { code: "2", marks: 120, text: "Program Curriculum and Teaching–Learning Processes" },
  { code: "3", marks: 120, text: "Course Outcomes and Program Outcomes" },
  { code: "4", marks: 150, text: "Students' Performance" },
  { code: "5", marks: 200, text: "Faculty Information and Contributions" },
  { code: "6", marks: 80, text: "Facilities and Technical Support" },
  { code: "7", marks: 50, text: "Continuous Improvement" },
  { code: "8", marks: 50, text: "First Year Academics" },
  { code: "9", marks: 50, text: "Student Support Systems" },
  { code: "10", marks: 120, text: "Governance, Institutional Support and Financial Resources" },
] as const;

/**
 * NBA SAR Tier-II's items as the platform keeps them: a whole criterion where
 * the department writes all of it, its numbered items where some are
 * computed from the rows. `computed` items are scored by council-rules.ts and
 * never typed; the rest the HOD self-assesses against `marks`.
 */
export const NBA_SAR_ITEMS = [
  { code: "1", criterion: "1", marks: 60, computed: false, text: "Vision, Mission and Program Educational Objectives" },
  { code: "2", criterion: "2", marks: 120, computed: false, text: "Program Curriculum and Teaching–Learning Processes" },
  { code: "3.1", criterion: "3", marks: 20, computed: false, text: "Correlation between the courses and the Program Outcomes and Program Specific Outcomes" },
  { code: "3.2", criterion: "3", marks: 50, computed: false, text: "Attainment of Course Outcomes" },
  { code: "3.3", criterion: "3", marks: 50, computed: false, text: "Attainment of Program Outcomes and Program Specific Outcomes" },
  { code: "4.1", criterion: "4", marks: 20, computed: true, text: "Enrolment ratio" },
  { code: "4.2.1", criterion: "4", marks: 25, computed: true, text: "Success rate without backlogs in any semester or year of study" },
  { code: "4.2.2", criterion: "4", marks: 15, computed: true, text: "Success rate in the stipulated period of study" },
  { code: "4.3", criterion: "4", marks: 15, computed: true, text: "Academic performance in the third year" },
  { code: "4.4", criterion: "4", marks: 15, computed: true, text: "Academic performance in the second year" },
  { code: "4.5", criterion: "4", marks: 40, computed: true, text: "Placement, higher studies and entrepreneurship" },
  { code: "4.6", criterion: "4", marks: 20, computed: false, text: "Professional activities" },
  { code: "5.1", criterion: "5", marks: 20, computed: true, text: "Student–Faculty Ratio (SFR)" },
  { code: "5.2", criterion: "5", marks: 25, computed: true, text: "Faculty cadre proportion" },
  { code: "5.3", criterion: "5", marks: 25, computed: true, text: "Faculty qualification" },
  { code: "5.4", criterion: "5", marks: 25, computed: false, text: "Faculty retention" },
  { code: "5.5", criterion: "5", marks: 20, computed: false, text: "Innovations by the faculty in teaching and learning" },
  { code: "5.6", criterion: "5", marks: 15, computed: false, text: "Faculty as participants in faculty development or training activities" },
  { code: "5.7", criterion: "5", marks: 30, computed: false, text: "Research and development" },
  { code: "5.8", criterion: "5", marks: 30, computed: false, text: "Faculty performance appraisal and development system" },
  { code: "5.9", criterion: "5", marks: 10, computed: false, text: "Visiting, adjunct and emeritus faculty" },
  { code: "6", criterion: "6", marks: 80, computed: false, text: "Facilities and Technical Support" },
  { code: "7", criterion: "7", marks: 50, computed: false, text: "Continuous Improvement" },
  { code: "8.1", criterion: "8", marks: 5, computed: true, text: "First-year Student–Faculty Ratio" },
  { code: "8.2", criterion: "8", marks: 5, computed: false, text: "Qualification of the faculty teaching first-year common courses" },
  { code: "8.3", criterion: "8", marks: 10, computed: true, text: "First-year academic performance" },
  { code: "8.4", criterion: "8", marks: 10, computed: false, text: "Attainment of Course Outcomes of first-year courses" },
  { code: "8.5", criterion: "8", marks: 20, computed: false, text: "Attainment of Program Outcomes from first-year courses" },
  { code: "9", criterion: "9", marks: 50, computed: false, text: "Student Support Systems" },
  { code: "10", criterion: "10", marks: 120, computed: false, text: "Governance, Institutional Support and Financial Resources" },
] as const;
export type NbaSarItemCode = (typeof NBA_SAR_ITEMS)[number]["code"];

/** The kinds with a worksheet, and the item codes each takes. */
export const WORKSHEET_KINDS = ["BCI_RETURN", "NCTE_RETURN", "NBA_SAR"] as const satisfies readonly CollegeFilingKind[];
export type WorksheetKind = (typeof WORKSHEET_KINDS)[number];

export type WorksheetItemSpec = { code: string; marks: number | null; computed: boolean; text: string };
export function worksheetItems(kind: CollegeFilingKind): WorksheetItemSpec[] {
  if (kind === "BCI_RETURN") return BCI_ITEMS.map((code) => ({ code, marks: null, computed: false, text: BCI_ITEM_TEXT[code] }));
  if (kind === "NCTE_RETURN") return NCTE_ITEMS.map((code) => ({ code, marks: null, computed: false, text: NCTE_ITEM_TEXT[code] }));
  if (kind === "NBA_SAR") return NBA_SAR_ITEMS.map((i) => ({ code: i.code, marks: i.marks, computed: i.computed, text: i.text }));
  return [];
}

/** A dictionary-safe form of an item code ("4.2.1" → "4_2_1"): `councilFilings.nbaItem.<it>`. */
export const itemKey = (code: string) => code.replace(/\./g, "_");

export const WORKSHEET_ANSWERS = ["YES", "NO", "NA"] as const;
export const worksheetAnswerSchema = z.enum(WORKSHEET_ANSWERS);
export type WorksheetAnswer = z.infer<typeof worksheetAnswerSchema>;

/** One item as a form or a door sends it: a checklist's answer, or a criterion's self-assessed marks and account. */
export const worksheetItemSaveSchema = z.object({
  code: z.string().trim().min(1).max(32),
  answer: worksheetAnswerSchema.nullable().default(null),
  score: z.number().min(0).max(1000).nullable().default(null),
  note: z.string().trim().max(8000).default(""),
});
/** POST /api/v1/iqac/council/{bci|ncte|nba} — the items given replace those codes' answers; the others stand. */
export const worksheetSaveSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  departmentId: z.string().max(64).nullable().default(null),
  items: z.array(worksheetItemSaveSchema).min(1).max(60),
});
/** GET ?year=&departmentId= on the council doors. */
export const councilQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  departmentId: z.string().max(64).optional(),
});

const departmentRef = z.object({ id: z.string(), code: z.string(), name: z.string() });

/** GET /api/v1/iqac/council/{pci|bci|ncte|nba} — the return's figures from the rows as they stand, and its worksheet. */
export const councilViewSchema = z.object({
  kind: collegeFilingKindSchema,
  year: z.number().int(),
  departmentId: z.string().nullable(),
  departmentName: z.string().nullable(),
  departments: z.array(departmentRef),
  figures: z.record(z.string(), z.number()),
  items: z.array(
    z.object({
      code: z.string(),
      marks: z.number().nullable(),
      computed: z.boolean(),
      score: z.number().nullable(),
      answer: worksheetAnswerSchema.nullable(),
      note: z.string(),
    }),
  ),
  /** NBA: the marks from the records plus the self-assessed, out of 1,000; null for a checklist. */
  total: z.object({ computed: z.number(), self: z.number(), max: z.number() }).nullable(),
  canEdit: z.boolean(),
  updatedAt: z.string().datetime().nullable(),
});
export type CouncilView = z.infer<typeof councilViewSchema>;

/** GET /api/v1/iqac/council — which filings the college's streams bring, which they do not and which stream would, and the councils not built. */
export const councilOverviewSchema = z.object({
  streams: z.array(streamSchema),
  items: z.array(z.object({ kind: collegeFilingKindSchema, applies: z.boolean(), streams: z.array(streamSchema), body: z.string() })),
  notBuilt: z.array(z.object({ stream: streamSchema, councils: z.array(z.string()), items: z.array(z.enum(NOT_BUILT)), here: z.boolean() })),
  nbaDepartments: z.array(departmentRef),
  canGenerate: z.boolean(),
});
export type CouncilOverview = z.infer<typeof councilOverviewSchema>;
