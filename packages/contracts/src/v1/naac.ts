import { z } from "zod";

/**
 * THE NAAC FRAMEWORK AS DATA (the IQAC module, 4 October 2026).
 *
 * WHAT THIS FILE IS. The National Assessment and Accreditation Council's
 * Revised Accreditation Framework as a college is graded on it: seven
 * criteria, their key indicators (KIs) and the metrics under each, every
 * metric quantitative (QN: a figure the college's own rows yield) or
 * qualitative (QL: a write-up the peer team reads, which the IQAC
 * coordinator scores 0–4 here with evidence attached). The predictor
 * (apps/web/src/lib/iqac-rules.ts) reads it; nothing else decides a weight.
 *
 * SOURCES, DATED.
 *   - Criterion and KI weights per institution type: the tabulation of the
 *     revised NAAC manuals of 21 December 2022 (AKS University IQAC,
 *     "Distribution of Weightages across KIs of all 7 NAAC Criteria", read
 *     4 October 2026). Affiliated UG college 100/350/110/100/140/100/100;
 *     autonomous college 150/300/150/100/100/100/100; both total 1,000.
 *     That tabulation prints 19 for the affiliated UG college's research
 *     publications KI, which does not add up to its own criterion total of
 *     110; this file uses 15, which does.
 *   - Metric texts and metric weights inside a KI: the affiliated/constituent
 *     college manual (as reduced in January 2022) and the autonomous college
 *     manual, as reconstructed by the builder from the published SSR and AQAR
 *     formats. The KI totals are exact; THE SPLIT OF A KI'S WEIGHT BETWEEN ITS
 *     METRICS MUST BE CHECKED AGAINST THE MANUAL by the coordinator before
 *     the figures are relied on (the report of 4 October 2026 lists this as
 *     untested). The brief counted 55 affiliated metrics and 107 autonomous;
 *     this file carries the metrics a college is scored on that the builder
 *     could source, and `NAAC_FRAMEWORKS[...].metrics.length` is the honest
 *     count.
 *   - The grading table: the Revised Accreditation Framework's CGPA ranges
 *     (A++ 3.51–4.00 … D ≤ 1.50, not accredited).
 *   - The binary and maturity-based levels: NAAC's public notice of
 *     22 April 2026 says the framework is not yet launched and its manuals
 *     are unpublished. `BINARY_MATURITY` is a slot with no metrics until they
 *     are.
 *
 * WORDING. A metric's `text` is NAAC's own wording in English, printed the
 * way the SSR and the AQAR print it, so the coordinator matches it to the
 * portal's field word for word — the same reason the ESIC and EPFO column
 * names stay as those bodies print them. Every sentence the app says ABOUT a
 * metric is a dictionary key.
 *
 * NEVER A PROMISE. The platform does not score for NAAC. Each quantitative
 * metric's 0–4 here is the platform's reading against a benchmark this file
 * names (NAAC normalises against values it does not publish per metric); the
 * qualitative ones are the coordinator's own provisional judgement.
 */

export const NAAC_FRAMEWORK_CODES = ["AFFILIATED_UG", "AUTONOMOUS", "BINARY_MATURITY"] as const;
export const naacFrameworkSchema = z.enum(NAAC_FRAMEWORK_CODES);
export type NaacFrameworkCode = z.infer<typeof naacFrameworkSchema>;

export const NAAC_METRIC_KINDS = ["QN", "QL"] as const;
export type NaacMetricKind = (typeof NAAC_METRIC_KINDS)[number];

/** Over which years a metric's figure is read: the assessment's five years, the latest completed year, or as things stand now. */
export const NAAC_WINDOWS = ["FIVE_YEARS", "LATEST_YEAR", "CURRENT"] as const;
export type NaacWindow = (typeof NAAC_WINDOWS)[number];

/**
 * Every quantitative metric's formula, by id. The function behind each is in
 * apps/web/src/lib/iqac-rules.ts (`FORMULAS`), a pure function of the inputs
 * named there; where the inputs come from is apps/web/src/lib/iqac-facts.ts.
 */
export const NAAC_FORMULA_IDS = [
  "VALUE_ADDED_COURSES",
  "VALUE_ADDED_ENROLMENT_PCT",
  "PROJECT_WORK_PCT",
  "FEEDBACK_STAKEHOLDERS",
  "FEEDBACK_PROCESS",
  "SYLLABUS_REVISION_PCT",
  "EMPLOYABILITY_COURSES_PCT",
  "NEW_COURSES_PCT",
  "CBCS_PCT",
  "ENROLMENT_PCT",
  "RESERVED_SEATS_PCT",
  "STUDENT_TEACHER_RATIO",
  "MENTOR_RATIO",
  "FULLTIME_VS_SANCTIONED_PCT",
  "PHD_NET_PCT",
  "TEACHING_EXPERIENCE",
  "TEACHER_AWARDS_PCT",
  "RESULT_DAYS",
  "EVAL_GRIEVANCE_PCT",
  "PASS_PCT",
  "SSS",
  "SEED_MONEY",
  "RESEARCH_GRANTS",
  "IPR_WORKSHOPS",
  "PAPERS_PER_TEACHER",
  "BOOKS_PER_TEACHER",
  "CONSULTANCY_REVENUE",
  "EXTENSION_AWARDS",
  "EXTENSION_PROGRAMMES",
  "EXTENSION_STUDENT_PCT",
  "COLLABORATIONS",
  "MOUS",
  "INFRA_EXPENDITURE_PCT",
  "STUDENT_COMPUTER_RATIO",
  "BANDWIDTH",
  "MAINTENANCE_EXPENDITURE_PCT",
  "SCHOLARSHIP_PCT",
  "CAPACITY_BUILDING",
  "CAREER_GUIDANCE_PCT",
  "GRIEVANCE_MECHANISM",
  "PROGRESSION_PCT",
  "COMPETITIVE_EXAMS_PCT",
  "STUDENT_AWARDS",
  "EVENTS_PER_YEAR",
  "EGOVERNANCE",
  "TEACHER_SUPPORT_PCT",
  "FDP_PCT",
  "QA_INITIATIVES",
  "GREEN_FACILITIES",
  "QUALITY_AUDITS",
] as const;
export const naacFormulaIdSchema = z.enum(NAAC_FORMULA_IDS);
export type NaacFormulaId = z.infer<typeof naacFormulaIdSchema>;

export type NaacCriterion = { code: string; name: string };
export type NaacKeyIndicator = { code: string; criterion: string; name: string; weight: number };
export type NaacMetric = { code: string; ki: string; kind: NaacMetricKind; weight: number; text: string; formula: NaacFormulaId | null; window: NaacWindow };
export type NaacFramework = { code: NaacFrameworkCode; criteria: (NaacCriterion & { weight: number })[]; keyIndicators: NaacKeyIndicator[]; metrics: NaacMetric[]; note: string | null };

export const NAAC_CRITERIA: NaacCriterion[] = [
  { code: "1", name: "Curricular Aspects" },
  { code: "2", name: "Teaching-Learning and Evaluation" },
  { code: "3", name: "Research, Innovations and Extension" },
  { code: "4", name: "Infrastructure and Learning Resources" },
  { code: "5", name: "Student Support and Progression" },
  { code: "6", name: "Governance, Leadership and Management" },
  { code: "7", name: "Institutional Values and Best Practices" },
];

const QL = (code: string, weight: number, text: string, window: NaacWindow = "CURRENT"): Omit<NaacMetric, "ki"> => ({ code, kind: "QL", weight, text, formula: null, window });
const QN = (code: string, weight: number, formula: NaacFormulaId, text: string, window: NaacWindow = "FIVE_YEARS"): Omit<NaacMetric, "ki"> => ({ code, kind: "QN", weight, text, formula, window });

type KiSpec = { code: string; name: string; metrics: Omit<NaacMetric, "ki">[] };

function build(code: NaacFrameworkCode, kis: KiSpec[]): NaacFramework {
  const keyIndicators = kis.map((k) => ({ code: k.code, criterion: k.code.split(".")[0]!, name: k.name, weight: k.metrics.reduce((a, m) => a + m.weight, 0) }));
  const criteria = NAAC_CRITERIA.map((c) => ({ ...c, weight: keyIndicators.filter((k) => k.criterion === c.code).reduce((a, k) => a + k.weight, 0) }));
  return { code, criteria, keyIndicators, metrics: kis.flatMap((k) => k.metrics.map((m) => ({ ...m, ki: k.code }))), note: null };
}

/* Shared wording: the same metric in both manuals. */
const T = {
  crossCutting: "Institution integrates crosscutting issues relevant to Professional Ethics, Gender, Human Values, Environment and Sustainability into the Curriculum",
  valueAdded: "Number of Certificate/Value added courses offered and online courses of MOOCs, SWAYAM, NPTEL etc. where the students of the institution have enrolled and successfully completed during the last five years",
  valueAddedPct: "Percentage of students enrolled in Certificate/Value added courses and also completed online courses of MOOCs, SWAYAM, NPTEL etc. as against the total number of students during the last five years",
  projects: "Percentage of students undertaking project work/field work/internships (data for the latest completed academic year)",
  feedback: "Institution obtains feedback on the syllabus and its transaction at the institution from the following stakeholders: Students, Teachers, Employers, Alumni",
  feedbackProcess: "Feedback process of the Institution: collected, analysed, action taken and made available on the website",
  enrolment: "Enrolment percentage (average during the last five years)",
  reserved: "Percentage of seats filled against seats reserved for various categories (SC, ST, OBC, Divyangjan, etc.) as per applicable reservation policy (average during the last five years)",
  learners: "The institution assesses the learning levels of the students and organises special programmes for advanced learners and slow learners",
  ratio: "Student – Full time teacher ratio (data for the latest completed academic year)",
  studentCentric: "Student centric methods, such as experiential learning, participative learning and problem solving methodologies are used for enhancing learning experiences",
  ict: "Teachers use ICT enabled tools including online resources for effective teaching and learning process",
  mentor: "Ratio of students to mentor for academic and other related issues (data for the latest completed academic year)",
  sanctioned: "Percentage of full-time teachers against sanctioned posts (average during the last five years)",
  phd: "Percentage of full-time teachers with NET/SET/SLET/Ph.D./D.M./M.Ch./D.N.B Superspeciality/D.Sc./D.Litt. (average during the last five years)",
  experience: "Average teaching experience of full time teachers in the same institution (data for the latest completed academic year in number of years)",
  outcomesStated: "Programme Outcomes (POs) and Course Outcomes (COs) for all Programmes offered by the institution are stated and displayed on website and attainment of POs and COs are evaluated",
  outcomesAttained: "Attainment of POs and COs are evaluated; the institution describes the method of measuring the level of attainment",
  pass: "Pass percentage of students during the last five years (excluding backlog students)",
  sss: "Online Student Satisfaction Survey regarding teaching learning process",
  grants: "Grants received from Government and non-governmental agencies for research projects / endowments in the institution during the last five years (INR in lakhs)",
  papers: "Number of research papers published per teacher in the Journals notified on UGC CARE list during the last five years",
  books: "Number of books and chapters in edited volumes/books published and papers published in national/international conference proceedings per teacher during the last five years",
  extensionQl: "Extension activities are carried out in the neighbourhood community, sensitising students to social issues, for their holistic development, and the impact thereof during the last five years",
  extensionAwards: "Awards and recognitions received for extension activities from government / government recognised bodies during the last five years",
  extensionProgrammes: "Number of extension and outreach programmes conducted by the institution through NSS/NCC/Red Cross/YRC etc. (including Government initiated programmes) during the last five years",
  extensionStudents: "Average percentage of students participating in extension activities at 3.3.3 above during the last five years",
  collaborations: "Number of collaborative activities for research, faculty exchange, student exchange/internship, on-the-job training, project work during the last five years",
  mous: "Number of functional MoUs with national/international institutions, universities, industries, corporate houses etc. during the last five years",
  facilities: "The Institution has adequate infrastructure and physical facilities for teaching-learning, viz., classrooms, laboratories, computing equipment, sports, games and cultural activities",
  infra: "Percentage of expenditure, excluding salary, for infrastructure augmentation during the last five years",
  library: "Library is automated using Integrated Library Management System (ILMS), subscription to e-journals, e-books, e-ShodhSindhu, Shodhganga, and the library is optimally used by faculty and students",
  it: "Institution has an IT policy, makes appropriate budgetary provision and updates its IT facilities including Wi-Fi facility",
  computers: "Student – Computer ratio (data for the latest completed academic year)",
  bandwidth: "Bandwidth of internet connection in the Institution (in MBPS)",
  maintenance: "Percentage of expenditure incurred on maintenance of physical and academic support facilities, excluding salary component, during the last five years",
  maintenanceQl: "There are established systems and procedures for maintaining and utilising physical, academic and support facilities",
  scholarships: "Percentage of students benefited by scholarships and freeships provided by the Government and non-government agencies during the last five years",
  capacity: "Capacity building and skills enhancement initiatives taken by the institution: soft skills, language and communication skills, life skills, ICT/computing skills",
  guidance: "Percentage of students benefited by guidance for competitive examinations and career counselling offered by the institution during the last five years",
  grievance: "The Institution has a transparent mechanism for timely redressal of student grievances including sexual harassment and ragging cases",
  progression: "Percentage of placement of outgoing students and students progressing to higher education during the last five years",
  competitive: "Percentage of students qualifying in state/national/international level examinations (NET/SLET/GATE/GMAT/CAT/GRE/TOEFL/Civil Services/State government examinations) during the last five years",
  awards: "Number of awards/medals for outstanding performance in sports/cultural activities at University/State/National/International level during the last five years",
  events: "Average number of sports and cultural events/competitions organised by the institution per year during the last five years",
  alumni: "There is a registered Alumni Association that contributes significantly to the development of the institution through financial and other support services",
  vision: "The governance of the institution is reflective of and in tune with the vision and mission of the institution, with decentralisation and participative management",
  strategic: "The institutional bodies are effective and efficient as visible from policies, administrative setup, appointment and service rules, and the deployment of the strategic plan",
  egov: "Implementation of e-governance in areas of operation: Administration, Finance and Accounts, Student Admission and Support, Examination",
  welfare: "The institution has effective welfare measures and performance appraisal system for teaching and non-teaching staff",
  support: "Percentage of teachers provided with financial support to attend conferences/workshops and towards membership fee of professional bodies during the last five years",
  fdp: "Percentage of teaching and non-teaching staff participating in Faculty Development Programmes (FDP), professional development/administrative training programmes during the last five years",
  finance: "Institutional strategies for mobilisation of funds and the optimal utilisation of resources; regular internal and external financial audits",
  iqac: "Internal Quality Assurance Cell (IQAC) has contributed significantly for institutionalising the quality assurance strategies and processes",
  qa: "Quality assurance initiatives of the institution include: regular IQAC meetings and follow-up action, collaborative quality initiatives, participation in NIRF and other rankings, any other quality audit or accreditation (ISO, NBA)",
  gender: "Measures initiated by the Institution for the promotion of gender equity and the gender audit during the last five years",
  green: "The Institution has facilities and initiatives for alternate sources of energy and energy conservation, waste management, water conservation, green campus initiatives and a disabled-friendly, barrier-free environment",
  audits: "Quality audits on environment and energy regularly undertaken by the institution: green audit, energy audit, environment audit, clean and green campus recognitions",
  inclusive: "Institution's efforts and initiatives in providing an inclusive environment, and sensitisation of students and employees to the constitutional obligations",
  best: "Describe two best practices successfully implemented by the Institution as per NAAC format",
  distinct: "Portray the performance of the Institution in one area distinctive to its priority and thrust",
};

const C4: KiSpec[] = [
  { code: "4.1", name: "Physical Facilities", metrics: [QL("4.1.1", 15, T.facilities), QN("4.1.2", 15, "INFRA_EXPENDITURE_PCT", T.infra)] },
  { code: "4.2", name: "Library as a Learning Resource", metrics: [QL("4.2.1", 20, T.library)] },
  { code: "4.3", name: "IT Infrastructure", metrics: [QL("4.3.1", 15, T.it), QN("4.3.2", 10, "STUDENT_COMPUTER_RATIO", T.computers, "LATEST_YEAR"), QN("4.3.3", 5, "BANDWIDTH", T.bandwidth, "CURRENT")] },
  { code: "4.4", name: "Maintenance of Campus Infrastructure", metrics: [QN("4.4.1", 10, "MAINTENANCE_EXPENDITURE_PCT", T.maintenance), QL("4.4.2", 10, T.maintenanceQl)] },
];
const C6: KiSpec[] = [
  { code: "6.1", name: "Institutional Vision and Leadership", metrics: [QL("6.1.1", 10, T.vision)] },
  { code: "6.2", name: "Strategy Development and Deployment", metrics: [QL("6.2.1", 5, T.strategic), QN("6.2.2", 5, "EGOVERNANCE", T.egov, "CURRENT")] },
  { code: "6.3", name: "Faculty Empowerment Strategies", metrics: [QL("6.3.1", 10, T.welfare), QN("6.3.2", 10, "TEACHER_SUPPORT_PCT", T.support), QN("6.3.3", 10, "FDP_PCT", T.fdp)] },
  { code: "6.4", name: "Financial Management and Resource Mobilization", metrics: [QL("6.4.1", 20, T.finance)] },
  { code: "6.5", name: "Internal Quality Assurance System", metrics: [QL("6.5.1", 15, T.iqac), QN("6.5.2", 15, "QA_INITIATIVES", T.qa, "CURRENT")] },
];
const C7: KiSpec[] = [
  { code: "7.1", name: "Institutional Values and Social Responsibilities", metrics: [QL("7.1.1", 20, T.gender), QN("7.1.2", 10, "GREEN_FACILITIES", T.green, "CURRENT"), QN("7.1.3", 10, "QUALITY_AUDITS", T.audits), QL("7.1.4", 10, T.inclusive)] },
  { code: "7.2", name: "Best Practices", metrics: [QL("7.2.1", 30, T.best)] },
  { code: "7.3", name: "Institutional Distinctiveness", metrics: [QL("7.3.1", 20, T.distinct)] },
];

/** The affiliated / constituent UG college (the manual as reduced in January 2022; KI weights of 21 Dec 2022). */
const AFFILIATED_UG = build("AFFILIATED_UG", [
  { code: "1.1", name: "Curricular Planning and Implementation", metrics: [QL("1.1.1", 20, "The Institution ensures effective curriculum planning and delivery through a well-planned and documented process including Academic calendar and conduct of continuous internal assessment")] },
  { code: "1.2", name: "Academic Flexibility", metrics: [QN("1.2.1", 15, "VALUE_ADDED_COURSES", T.valueAdded), QN("1.2.2", 15, "VALUE_ADDED_ENROLMENT_PCT", T.valueAddedPct)] },
  { code: "1.3", name: "Curriculum Enrichment", metrics: [QL("1.3.1", 10, T.crossCutting), QN("1.3.2", 20, "PROJECT_WORK_PCT", T.projects, "LATEST_YEAR")] },
  { code: "1.4", name: "Feedback System", metrics: [QN("1.4.1", 10, "FEEDBACK_STAKEHOLDERS", T.feedback, "CURRENT"), QN("1.4.2", 10, "FEEDBACK_PROCESS", T.feedbackProcess, "CURRENT")] },
  { code: "2.1", name: "Student Enrollment and Profile", metrics: [QN("2.1.1", 20, "ENROLMENT_PCT", T.enrolment), QN("2.1.2", 20, "RESERVED_SEATS_PCT", T.reserved)] },
  { code: "2.2", name: "Catering to Student Diversity", metrics: [QL("2.2.1", 20, T.learners), QN("2.2.2", 30, "STUDENT_TEACHER_RATIO", T.ratio, "LATEST_YEAR")] },
  { code: "2.3", name: "Teaching-Learning Process", metrics: [QL("2.3.1", 20, T.studentCentric), QL("2.3.2", 20, T.ict), QN("2.3.3", 10, "MENTOR_RATIO", T.mentor, "LATEST_YEAR")] },
  { code: "2.4", name: "Teacher Profile and Quality", metrics: [QN("2.4.1", 20, "FULLTIME_VS_SANCTIONED_PCT", T.sanctioned), QN("2.4.2", 20, "PHD_NET_PCT", T.phd), QN("2.4.3", 20, "TEACHING_EXPERIENCE", T.experience, "LATEST_YEAR")] },
  { code: "2.5", name: "Evaluation Process and Reforms", metrics: [QL("2.5.1", 30, "Mechanism of internal/external assessment is transparent and the grievance redressal system is time-bound and efficient")] },
  { code: "2.6", name: "Student Performance and Learning Outcomes", metrics: [QL("2.6.1", 10, T.outcomesStated), QL("2.6.2", 20, T.outcomesAttained), QN("2.6.3", 30, "PASS_PCT", T.pass)] },
  { code: "2.7", name: "Student Satisfaction Survey", metrics: [QN("2.7.1", 60, "SSS", T.sss, "LATEST_YEAR")] },
  { code: "3.1", name: "Resource Mobilization for Research", metrics: [QN("3.1.1", 15, "RESEARCH_GRANTS", T.grants)] },
  { code: "3.2", name: "Research Publications and Awards", metrics: [QN("3.2.1", 8, "PAPERS_PER_TEACHER", T.papers), QN("3.2.2", 7, "BOOKS_PER_TEACHER", T.books)] },
  { code: "3.3", name: "Extension Activities", metrics: [QL("3.3.1", 20, T.extensionQl), QN("3.3.2", 10, "EXTENSION_AWARDS", T.extensionAwards), QN("3.3.3", 15, "EXTENSION_PROGRAMMES", T.extensionProgrammes), QN("3.3.4", 15, "EXTENSION_STUDENT_PCT", T.extensionStudents)] },
  { code: "3.4", name: "Collaboration", metrics: [QN("3.4.1", 10, "COLLABORATIONS", T.collaborations), QN("3.4.2", 10, "MOUS", T.mous)] },
  ...C4,
  { code: "5.1", name: "Student Support", metrics: [QN("5.1.1", 15, "SCHOLARSHIP_PCT", T.scholarships), QN("5.1.2", 10, "CAPACITY_BUILDING", T.capacity, "CURRENT"), QN("5.1.3", 10, "CAREER_GUIDANCE_PCT", T.guidance), QN("5.1.4", 15, "GRIEVANCE_MECHANISM", T.grievance, "CURRENT")] },
  { code: "5.2", name: "Student Progression", metrics: [QN("5.2.1", 15, "PROGRESSION_PCT", T.progression), QN("5.2.2", 15, "COMPETITIVE_EXAMS_PCT", T.competitive)] },
  { code: "5.3", name: "Student Participation and Activities", metrics: [QN("5.3.1", 25, "STUDENT_AWARDS", T.awards), QN("5.3.2", 25, "EVENTS_PER_YEAR", T.events)] },
  { code: "5.4", name: "Alumni Engagement", metrics: [QL("5.4.1", 10, T.alumni)] },
  ...C6,
  ...C7,
]);

/** The autonomous college (its own manual; KI weights of 21 Dec 2022). */
const AUTONOMOUS = build("AUTONOMOUS", [
  { code: "1.1", name: "Curriculum Design and Development", metrics: [QL("1.1.1", 20, "Curricula developed and implemented have relevance to the local, national, regional and global developmental needs, which is reflected in Programme outcomes (POs), Programme Specific Outcomes (PSOs) and Course Outcomes (COs)"), QN("1.1.2", 15, "SYLLABUS_REVISION_PCT", "Percentage of Programmes where syllabus revision was carried out during the last five years"), QN("1.1.3", 15, "EMPLOYABILITY_COURSES_PCT", "Average percentage of courses having focus on employability/entrepreneurship/skill development offered by the institution during the last five years")] },
  { code: "1.2", name: "Academic Flexibility", metrics: [QN("1.2.1", 20, "NEW_COURSES_PCT", "Percentage of new courses introduced of the total number of courses across all programmes offered during the last five years"), QN("1.2.2", 20, "CBCS_PCT", "Percentage of Programmes in which Choice Based Credit System (CBCS)/elective course system has been implemented", "CURRENT")] },
  { code: "1.3", name: "Curriculum Enrichment", metrics: [QL("1.3.1", 10, T.crossCutting), QN("1.3.2", 10, "VALUE_ADDED_COURSES", "Number of value-added courses for imparting transferable and life skills offered during the last five years"), QN("1.3.3", 10, "VALUE_ADDED_ENROLMENT_PCT", "Average percentage of students enrolled in the value-added courses during the last five years"), QN("1.3.4", 10, "PROJECT_WORK_PCT", "Percentage of students undertaking field projects / research projects / internships (data for the latest completed academic year)", "LATEST_YEAR")] },
  { code: "1.4", name: "Feedback System", metrics: [QN("1.4.1", 10, "FEEDBACK_STAKEHOLDERS", T.feedback, "CURRENT"), QN("1.4.2", 10, "FEEDBACK_PROCESS", T.feedbackProcess, "CURRENT")] },
  { code: "2.1", name: "Student Enrollment and Profile", metrics: [QN("2.1.1", 10, "ENROLMENT_PCT", T.enrolment), QN("2.1.2", 10, "RESERVED_SEATS_PCT", T.reserved)] },
  { code: "2.2", name: "Catering to Student Diversity", metrics: [QL("2.2.1", 15, T.learners), QN("2.2.2", 15, "STUDENT_TEACHER_RATIO", T.ratio, "LATEST_YEAR")] },
  { code: "2.3", name: "Teaching-Learning Process", metrics: [QL("2.3.1", 20, T.studentCentric), QL("2.3.2", 20, T.ict), QN("2.3.3", 10, "MENTOR_RATIO", T.mentor, "LATEST_YEAR")] },
  { code: "2.4", name: "Teacher Profile and Quality", metrics: [QN("2.4.1", 15, "FULLTIME_VS_SANCTIONED_PCT", T.sanctioned), QN("2.4.2", 15, "PHD_NET_PCT", T.phd), QN("2.4.3", 10, "TEACHING_EXPERIENCE", T.experience, "LATEST_YEAR"), QN("2.4.4", 10, "TEACHER_AWARDS_PCT", "Percentage of full time teachers who received awards, recognition, fellowships at State, National, International level from Government/recognised bodies during the last five years")] },
  { code: "2.5", name: "Evaluation Process and Reforms", metrics: [QN("2.5.1", 15, "RESULT_DAYS", "Average number of days from the date of last semester-end/year-end examination till the declaration of results during the last five years"), QN("2.5.2", 15, "EVAL_GRIEVANCE_PCT", "Percentage of student complaints/grievances about evaluation against the total number of students appeared in the examinations during the last five years"), QL("2.5.3", 10, "IT integration and reforms in the examination procedures and processes including Continuous Internal Assessment (CIA) have brought in considerable improvement in the Examination Management System (EMS) of the Institution"), QL("2.5.4", 10, "Status of automation of Examination division along with approved examination manual")] },
  { code: "2.6", name: "Student Performance and Learning Outcomes", metrics: [QL("2.6.1", 10, T.outcomesStated), QL("2.6.2", 15, T.outcomesAttained), QN("2.6.3", 25, "PASS_PCT", T.pass)] },
  { code: "2.7", name: "Student Satisfaction Survey", metrics: [QN("2.7.1", 50, "SSS", T.sss, "LATEST_YEAR")] },
  { code: "3.1", name: "Promotion of Research and Facilities", metrics: [QL("3.1.1", 10, "The institution's research facilities are frequently updated and there is a well defined policy for promotion of research which is uploaded on the institutional website and implemented"), QN("3.1.2", 10, "SEED_MONEY", "The institution provides seed money to its teachers for research (amount in INR lakhs during the last five years)")] },
  { code: "3.2", name: "Resource Mobilization for Research", metrics: [QN("3.2.1", 10, "RESEARCH_GRANTS", T.grants)] },
  { code: "3.3", name: "Innovation Ecosystem", metrics: [QL("3.3.1", 5, "Institution has created an ecosystem for innovations, creation and transfer of knowledge supported by dedicated centres for research, entrepreneurship, community orientation, incubation, etc."), QN("3.3.2", 5, "IPR_WORKSHOPS", "Number of workshops/seminars conducted on Intellectual Property Rights (IPR) and Industry-Academia Innovative practices during the last five years")] },
  { code: "3.4", name: "Research Publications and Awards", metrics: [QN("3.4.1", 15, "PAPERS_PER_TEACHER", T.papers), QN("3.4.2", 15, "BOOKS_PER_TEACHER", T.books)] },
  { code: "3.5", name: "Consultancy", metrics: [QN("3.5.1", 10, "CONSULTANCY_REVENUE", "Revenue generated from consultancy and corporate training during the last five years (INR in lakhs)")] },
  { code: "3.6", name: "Extension Activities", metrics: [QL("3.6.1", 15, T.extensionQl), QN("3.6.2", 10, "EXTENSION_AWARDS", T.extensionAwards), QN("3.6.3", 15, "EXTENSION_PROGRAMMES", T.extensionProgrammes), QN("3.6.4", 10, "EXTENSION_STUDENT_PCT", "Average percentage of students participating in extension activities at 3.6.3 above during the last five years")] },
  { code: "3.7", name: "Collaboration", metrics: [QN("3.7.1", 10, "COLLABORATIONS", T.collaborations), QN("3.7.2", 10, "MOUS", T.mous)] },
  ...C4,
  { code: "5.1", name: "Student Support", metrics: [QN("5.1.1", 10, "SCHOLARSHIP_PCT", T.scholarships), QN("5.1.2", 5, "CAPACITY_BUILDING", T.capacity, "CURRENT"), QN("5.1.3", 5, "CAREER_GUIDANCE_PCT", T.guidance), QN("5.1.4", 10, "GRIEVANCE_MECHANISM", T.grievance, "CURRENT")] },
  { code: "5.2", name: "Student Progression", metrics: [QN("5.2.1", 15, "PROGRESSION_PCT", T.progression), QN("5.2.2", 15, "COMPETITIVE_EXAMS_PCT", T.competitive)] },
  { code: "5.3", name: "Student Participation and Activities", metrics: [QN("5.3.1", 15, "STUDENT_AWARDS", T.awards), QN("5.3.2", 15, "EVENTS_PER_YEAR", T.events)] },
  { code: "5.4", name: "Alumni Engagement", metrics: [QL("5.4.1", 10, T.alumni)] },
  ...C6,
  ...C7,
]);

const BINARY_MATURITY: NaacFramework = {
  code: "BINARY_MATURITY",
  criteria: NAAC_CRITERIA.map((c) => ({ ...c, weight: 0 })),
  keyIndicators: [],
  metrics: [],
  note: "NAAC's binary accreditation and maturity-based graded levels: not launched, manuals unpublished (NAAC public notice of 22 April 2026). No metric is scored under this slot until they are.",
};

export const NAAC_FRAMEWORKS: Record<NaacFrameworkCode, NaacFramework> = { AFFILIATED_UG, AUTONOMOUS, BINARY_MATURITY };

/** Which framework a college is graded under, by its kind: an autonomous college on its own manual, every other college on the affiliated one. */
export function frameworkForKind(kind: string): NaacFrameworkCode {
  return kind === "AUTONOMOUS_COLLEGE" ? "AUTONOMOUS" : "AFFILIATED_UG";
}

/**
 * THE GRADING TABLE: CGPA on a four-point scale to the grade NAAC awards
 * (the Revised Accreditation Framework). Below 1.51 is D: not accredited.
 * Ordered from the top; `min` is the lowest CGPA in the band.
 */
export const NAAC_BANDS = [
  { grade: "A++", min: 3.51 },
  { grade: "A+", min: 3.26 },
  { grade: "A", min: 3.01 },
  { grade: "B++", min: 2.76 },
  { grade: "B+", min: 2.51 },
  { grade: "B", min: 2.01 },
  { grade: "C", min: 1.51 },
  { grade: "D", min: 0 },
] as const;

/**
 * NIRF's college framework (NIRF 2025, Colleges): five parameters, their
 * weights, and the sub-parameters whose formulas NIRF publishes in full —
 * FSR, FQE, GPH, GUE, WD and RD. SS, FRU, PU, QP, GMS, ESCS and PR use
 * functions NIRF determines and does not publish ("f(…)"), so the estimate
 * carries the data for them and no marks.
 */
export const NIRF_PARAMETERS = [
  { code: "TLR", name: "Teaching, Learning & Resources", weight: 0.4, subs: [{ code: "SS", marks: 20, published: false }, { code: "FSR", marks: 30, published: true }, { code: "FQE", marks: 20, published: true }, { code: "FRU", marks: 30, published: false }] },
  { code: "RP", name: "Research and Professional Practice", weight: 0.15, subs: [{ code: "PU", marks: 70, published: false }, { code: "QP", marks: 30, published: false }] },
  { code: "GO", name: "Graduation Outcomes", weight: 0.25, subs: [{ code: "GPH", marks: 40, published: true }, { code: "GUE", marks: 40, published: true }, { code: "GMS", marks: 20, published: false }] },
  { code: "OI", name: "Outreach and Inclusivity", weight: 0.1, subs: [{ code: "RD", marks: 30, published: true }, { code: "WD", marks: 30, published: true }, { code: "ESCS", marks: 20, published: false }, { code: "PCS", marks: 20, published: true }] },
  { code: "PR", name: "Perception", weight: 0.1, subs: [{ code: "PR", marks: 100, published: false }] },
] as const;

/**
 * THE REGULATORS' CALENDAR: when each body expects a college's return, as a
 * month range in the academic year (dates move each year by notice; the
 * calendar says "check the regulator's notice"). Sources: the AQAR is the
 * yearly report the plan fixes in September (NAAC AQAR FAQ); AISHE's
 * data-capture window opens after the reference year (AISHE 2022-23 report,
 * §1.8); NIRF's data capture runs in the winter before the ranking; AICTE's
 * extension of approval is applied for in the spring before the session.
 */
export const REGULATOR_CALENDAR = [
  { code: "AQAR", fromMonth: 7, toMonth: 9, filing: "AQAR" },
  { code: "AISHE", fromMonth: 11, toMonth: 1, filing: "AISHE" },
  { code: "NIRF", fromMonth: 11, toMonth: 1, filing: "NIRF" },
  { code: "AICTE_EOA", fromMonth: 2, toMonth: 4, filing: "AICTE_DISCLOSURE" },
  { code: "AFFILIATION", fromMonth: 3, toMonth: 5, filing: "AFFILIATION_RETURN" },
] as const;
export type RegulatorCalendarCode = (typeof REGULATOR_CALENDAR)[number]["code"];
