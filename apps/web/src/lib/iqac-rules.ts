import { NAAC_BANDS, type NaacFormulaId, type NaacFramework, type NaacMetric } from "@edulink/contracts";

/**
 * THE PREDICTOR'S ARITHMETIC (the IQAC module, 4 October 2026) — pure, so a
 * test can hold every formula against a hand computation and the page, the
 * filings and the data audit all share one reading.
 *
 * A QUANTITATIVE METRIC is a formula over named facts (lib/iqac-facts.ts
 * gathers them from the rows) and a SCALE that turns its value into 0–4:
 *   percent / count — value ÷ benchmark × 4, capped at 4;
 *   lowBetter       — a ratio where less is better: 4 × benchmark ÷ value;
 *   linearLow       — a share where none is best: 4 × (1 − value ÷ zeroAt);
 *   options         — how many of NAAC's four options are met (A = 4 … E = 0);
 *   bands           — NAAC's own bands (bandwidth);
 *   direct          — already on 0–4 (the satisfaction survey's mean).
 * THE BENCHMARKS ARE THE PLATFORM'S, NOT NAAC'S: NAAC normalises against
 * values it does not publish per metric. A fact the rows do not hold makes
 * the value null and the score 0, and the page says why.
 *
 * THE CGPA is Σ(score × weight) ÷ Σ(weight) over every metric of the
 * framework — an unscored metric counts 0 — and its grade is NAAC_BANDS'.
 */

export type Scale =
  | { type: "percent"; benchmark: number }
  | { type: "count"; benchmark: number }
  | { type: "lowBetter"; benchmark: number }
  | { type: "linearLow"; zeroAt: number }
  | { type: "options" }
  | { type: "bands"; bands: readonly (readonly [number, number])[] }
  | { type: "direct" };

export type Facts = Record<string, number | null>;

export type FormulaSpec = {
  /** The facts the formula reads, in the order the page lists them. */
  inputs: readonly string[];
  compute: (f: Record<string, number>) => number | null;
  scale: Scale;
  /** The fact one more of which the college could add, and by how much (−1: one fewer is better). */
  lever: { fact: string; step: number };
  /** What one unit of the lever is called: a dictionary key's last part, `iqac.unit.<unit>`. */
  unit: string;
};

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : null);
const per = (num: number, den: number) => (den > 0 ? num / den : null);
/**
 * A share of students counted by head (participants of every course, camp or
 * guidance session over the window, over the student-years on the roll): one
 * student in two courses is two heads, so the share is capped at 100 % — the
 * most NAAC's "percentage of students" can be.
 */
const share = (num: number, den: number) => (den > 0 ? Math.min(100, (num / den) * 100) : null);

export const FORMULAS: Record<NaacFormulaId, FormulaSpec> = {
  VALUE_ADDED_COURSES: { inputs: ["valueAddedCourses"], compute: (f) => f.valueAddedCourses!, scale: { type: "count", benchmark: 20 }, lever: { fact: "valueAddedCourses", step: 1 }, unit: "course" },
  VALUE_ADDED_ENROLMENT_PCT: { inputs: ["valueAddedParticipants", "studentYears"], compute: (f) => share(f.valueAddedParticipants!, f.studentYears!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "valueAddedParticipants", step: 1 }, unit: "student" },
  PROJECT_WORK_PCT: { inputs: ["projectStudents", "studentsLatest"], compute: (f) => share(f.projectStudents!, f.studentsLatest!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "projectStudents", step: 1 }, unit: "student" },
  FEEDBACK_STAKEHOLDERS: { inputs: ["feedbackStakeholders"], compute: (f) => f.feedbackStakeholders!, scale: { type: "options" }, lever: { fact: "feedbackStakeholders", step: 1 }, unit: "stakeholder" },
  FEEDBACK_PROCESS: { inputs: ["feedbackProcess"], compute: (f) => f.feedbackProcess!, scale: { type: "options" }, lever: { fact: "feedbackProcess", step: 1 }, unit: "step" },
  SYLLABUS_REVISION_PCT: { inputs: ["programmesRevised", "programmes"], compute: (f) => pct(f.programmesRevised!, f.programmes!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "programmesRevised", step: 1 }, unit: "programme" },
  EMPLOYABILITY_COURSES_PCT: { inputs: ["employabilityCourses", "totalCourses"], compute: (f) => pct(f.employabilityCourses!, f.totalCourses!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "employabilityCourses", step: 1 }, unit: "course" },
  NEW_COURSES_PCT: { inputs: ["newCourses", "totalCourses"], compute: (f) => pct(f.newCourses!, f.totalCourses!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "newCourses", step: 1 }, unit: "course" },
  CBCS_PCT: { inputs: ["cbcsProgrammes", "programmes"], compute: (f) => pct(f.cbcsProgrammes!, f.programmes!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "cbcsProgrammes", step: 1 }, unit: "programme" },
  ENROLMENT_PCT: { inputs: ["admitted", "sanctionedSeats"], compute: (f) => pct(f.admitted!, f.sanctionedSeats!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "admitted", step: 1 }, unit: "student" },
  RESERVED_SEATS_PCT: { inputs: ["reservedAdmitted", "reservedEarmarked"], compute: (f) => pct(f.reservedAdmitted!, f.reservedEarmarked!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "reservedAdmitted", step: 1 }, unit: "student" },
  STUDENT_TEACHER_RATIO: { inputs: ["studentsLatest", "fullTimeTeachers"], compute: (f) => per(f.studentsLatest!, f.fullTimeTeachers!), scale: { type: "lowBetter", benchmark: 20 }, lever: { fact: "fullTimeTeachers", step: 1 }, unit: "teacher" },
  MENTOR_RATIO: { inputs: ["studentsLatest", "mentors"], compute: (f) => per(f.studentsLatest!, f.mentors!), scale: { type: "lowBetter", benchmark: 20 }, lever: { fact: "mentors", step: 1 }, unit: "mentor" },
  FULLTIME_VS_SANCTIONED_PCT: { inputs: ["fullTimeTeachers", "sanctionedPosts"], compute: (f) => pct(f.fullTimeTeachers!, f.sanctionedPosts!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "fullTimeTeachers", step: 1 }, unit: "teacher" },
  PHD_NET_PCT: { inputs: ["phdNetTeachers", "fullTimeTeachers"], compute: (f) => pct(f.phdNetTeachers!, f.fullTimeTeachers!), scale: { type: "percent", benchmark: 75 }, lever: { fact: "phdNetTeachers", step: 1 }, unit: "teacher" },
  TEACHING_EXPERIENCE: { inputs: ["experienceTotalYears", "fullTimeTeachers"], compute: (f) => per(f.experienceTotalYears!, f.fullTimeTeachers!), scale: { type: "count", benchmark: 15 }, lever: { fact: "experienceTotalYears", step: 1 }, unit: "year" },
  TEACHER_AWARDS_PCT: { inputs: ["teachersAwarded", "fullTimeTeachers"], compute: (f) => pct(f.teachersAwarded!, f.fullTimeTeachers!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "teachersAwarded", step: 1 }, unit: "teacher" },
  RESULT_DAYS: { inputs: ["resultDaysAvg"], compute: (f) => f.resultDaysAvg!, scale: { type: "lowBetter", benchmark: 30 }, lever: { fact: "resultDaysAvg", step: -1 }, unit: "day" },
  EVAL_GRIEVANCE_PCT: { inputs: ["evalGrievances", "examAppeared"], compute: (f) => pct(f.evalGrievances!, f.examAppeared!), scale: { type: "linearLow", zeroAt: 10 }, lever: { fact: "evalGrievances", step: -1 }, unit: "complaint" },
  PASS_PCT: { inputs: ["passed", "appeared"], compute: (f) => pct(f.passed!, f.appeared!), scale: { type: "percent", benchmark: 100 }, lever: { fact: "passed", step: 1 }, unit: "student" },
  SSS: { inputs: ["sssMean"], compute: (f) => f.sssMean!, scale: { type: "direct" }, lever: { fact: "sssMean", step: 0.1 }, unit: "tenth" },
  SEED_MONEY: { inputs: ["seedLakhs"], compute: (f) => f.seedLakhs!, scale: { type: "count", benchmark: 10 }, lever: { fact: "seedLakhs", step: 1 }, unit: "lakh" },
  RESEARCH_GRANTS: { inputs: ["grantLakhs"], compute: (f) => f.grantLakhs!, scale: { type: "count", benchmark: 50 }, lever: { fact: "grantLakhs", step: 1 }, unit: "lakh" },
  IPR_WORKSHOPS: { inputs: ["iprWorkshops"], compute: (f) => f.iprWorkshops!, scale: { type: "count", benchmark: 10 }, lever: { fact: "iprWorkshops", step: 1 }, unit: "workshop" },
  PAPERS_PER_TEACHER: { inputs: ["papers", "fullTimeTeachers"], compute: (f) => per(f.papers!, f.fullTimeTeachers!), scale: { type: "count", benchmark: 1 }, lever: { fact: "papers", step: 1 }, unit: "paper" },
  BOOKS_PER_TEACHER: { inputs: ["books", "fullTimeTeachers"], compute: (f) => per(f.books!, f.fullTimeTeachers!), scale: { type: "count", benchmark: 1 }, lever: { fact: "books", step: 1 }, unit: "book" },
  CONSULTANCY_REVENUE: { inputs: ["consultancyLakhs"], compute: (f) => f.consultancyLakhs!, scale: { type: "count", benchmark: 10 }, lever: { fact: "consultancyLakhs", step: 1 }, unit: "lakh" },
  EXTENSION_AWARDS: { inputs: ["extensionAwards"], compute: (f) => f.extensionAwards!, scale: { type: "count", benchmark: 5 }, lever: { fact: "extensionAwards", step: 1 }, unit: "award" },
  EXTENSION_PROGRAMMES: { inputs: ["extensionProgrammes"], compute: (f) => f.extensionProgrammes!, scale: { type: "count", benchmark: 50 }, lever: { fact: "extensionProgrammes", step: 1 }, unit: "programme" },
  EXTENSION_STUDENT_PCT: { inputs: ["extensionParticipants", "studentYears"], compute: (f) => share(f.extensionParticipants!, f.studentYears!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "extensionParticipants", step: 1 }, unit: "student" },
  COLLABORATIONS: { inputs: ["collaborations"], compute: (f) => f.collaborations!, scale: { type: "count", benchmark: 20 }, lever: { fact: "collaborations", step: 1 }, unit: "activity" },
  MOUS: { inputs: ["mous"], compute: (f) => f.mous!, scale: { type: "count", benchmark: 10 }, lever: { fact: "mous", step: 1 }, unit: "mou" },
  INFRA_EXPENDITURE_PCT: { inputs: ["infraLakhs", "nonSalaryLakhs"], compute: (f) => pct(f.infraLakhs!, f.nonSalaryLakhs!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "infraLakhs", step: 1 }, unit: "lakh" },
  STUDENT_COMPUTER_RATIO: { inputs: ["studentsLatest", "computers"], compute: (f) => per(f.studentsLatest!, f.computers!), scale: { type: "lowBetter", benchmark: 20 }, lever: { fact: "computers", step: 1 }, unit: "computer" },
  BANDWIDTH: { inputs: ["bandwidthMbps"], compute: (f) => f.bandwidthMbps!, scale: { type: "bands", bands: [[50, 4], [35, 3], [20, 2], [5, 1]] }, lever: { fact: "bandwidthMbps", step: 1 }, unit: "mbps" },
  MAINTENANCE_EXPENDITURE_PCT: { inputs: ["maintenanceLakhs", "nonSalaryLakhs"], compute: (f) => pct(f.maintenanceLakhs!, f.nonSalaryLakhs!), scale: { type: "percent", benchmark: 30 }, lever: { fact: "maintenanceLakhs", step: 1 }, unit: "lakh" },
  SCHOLARSHIP_PCT: { inputs: ["scholarshipBeneficiaries", "studentYears"], compute: (f) => share(f.scholarshipBeneficiaries!, f.studentYears!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "scholarshipBeneficiaries", step: 1 }, unit: "student" },
  CAPACITY_BUILDING: { inputs: ["capacityThemes"], compute: (f) => f.capacityThemes!, scale: { type: "options" }, lever: { fact: "capacityThemes", step: 1 }, unit: "skill" },
  CAREER_GUIDANCE_PCT: { inputs: ["careerGuidanceParticipants", "studentYears"], compute: (f) => share(f.careerGuidanceParticipants!, f.studentYears!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "careerGuidanceParticipants", step: 1 }, unit: "student" },
  GRIEVANCE_MECHANISM: { inputs: ["grievanceOptions"], compute: (f) => f.grievanceOptions!, scale: { type: "options" }, lever: { fact: "grievanceOptions", step: 1 }, unit: "option" },
  PROGRESSION_PCT: { inputs: ["placed", "higherStudies", "outgoing"], compute: (f) => share(f.placed! + f.higherStudies!, f.outgoing!), scale: { type: "percent", benchmark: 75 }, lever: { fact: "placed", step: 1 }, unit: "student" },
  COMPETITIVE_EXAMS_PCT: { inputs: ["competitiveQualified", "outgoing"], compute: (f) => share(f.competitiveQualified!, f.outgoing!), scale: { type: "percent", benchmark: 20 }, lever: { fact: "competitiveQualified", step: 1 }, unit: "student" },
  STUDENT_AWARDS: { inputs: ["studentAwards"], compute: (f) => f.studentAwards!, scale: { type: "count", benchmark: 20 }, lever: { fact: "studentAwards", step: 1 }, unit: "award" },
  EVENTS_PER_YEAR: { inputs: ["sportsCulturalEvents", "windowYears"], compute: (f) => per(f.sportsCulturalEvents!, f.windowYears!), scale: { type: "count", benchmark: 10 }, lever: { fact: "sportsCulturalEvents", step: 1 }, unit: "event" },
  EGOVERNANCE: { inputs: ["egovOptions"], compute: (f) => f.egovOptions!, scale: { type: "options" }, lever: { fact: "egovOptions", step: 1 }, unit: "area" },
  TEACHER_SUPPORT_PCT: { inputs: ["teachersSupported", "fullTimeTeachers"], compute: (f) => pct(f.teachersSupported!, f.fullTimeTeachers!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "teachersSupported", step: 1 }, unit: "teacher" },
  FDP_PCT: { inputs: ["staffInFdp", "staffTotal"], compute: (f) => pct(f.staffInFdp!, f.staffTotal!), scale: { type: "percent", benchmark: 50 }, lever: { fact: "staffInFdp", step: 1 }, unit: "person" },
  QA_INITIATIVES: { inputs: ["qaOptions"], compute: (f) => f.qaOptions!, scale: { type: "options" }, lever: { fact: "qaOptions", step: 1 }, unit: "option" },
  GREEN_FACILITIES: { inputs: ["greenOptions"], compute: (f) => f.greenOptions!, scale: { type: "options" }, lever: { fact: "greenOptions", step: 1 }, unit: "option" },
  QUALITY_AUDITS: { inputs: ["auditOptions"], compute: (f) => f.auditOptions!, scale: { type: "options" }, lever: { fact: "auditOptions", step: 1 }, unit: "audit" },
};

const clamp4 = (x: number) => Math.max(0, Math.min(4, x));
/** Two decimals, as NAAC prints a CGPA. */
export const round2 = (x: number) => Math.round(x * 100) / 100;

export function scoreOf(scale: Scale, value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  switch (scale.type) {
    case "percent":
    case "count":
      return clamp4((value / scale.benchmark) * 4);
    case "lowBetter":
      return value <= 0 ? 0 : clamp4((4 * scale.benchmark) / value);
    case "linearLow":
      return clamp4(4 * (1 - value / scale.zeroAt));
    case "options":
      return clamp4(Math.floor(value));
    case "bands":
      for (const [min, s] of scale.bands) if (value >= min) return s;
      return 0;
    case "direct":
      return clamp4(value);
  }
}

export type Evaluation = { value: number | null; score: number; missing: string[] };

/** One quantitative metric over the facts: null facts are named in `missing`, and the score is then 0. */
export function evaluate(formula: NaacFormulaId, facts: Facts): Evaluation {
  const spec = FORMULAS[formula];
  const missing = spec.inputs.filter((k) => facts[k] === null || facts[k] === undefined);
  if (missing.length) return { value: null, score: 0, missing };
  const raw = spec.compute(facts as Record<string, number>);
  const value = raw === null || !Number.isFinite(raw) ? null : Math.round(raw * 100) / 100;
  return { value, score: round2(scoreOf(spec.scale, value)), missing: value === null ? [...spec.inputs.filter((k) => facts[k] === 0)] : [] };
}

/** The CGPA one more unit of the metric's lever would add (0 when the lever is missing or the metric is at 4). */
export function gainPerUnit(metric: NaacMetric, facts: Facts, current: number | null, totalWeight: number): number {
  if (totalWeight <= 0) return 0;
  if (metric.kind === "QL") return round4((Math.min(1, 4 - (current ?? 0)) * metric.weight) / totalWeight);
  if (!metric.formula) return 0;
  const spec = FORMULAS[metric.formula];
  const lever = facts[spec.lever.fact];
  if (lever === null || lever === undefined) return 0;
  const before = evaluate(metric.formula, facts).score;
  const after = evaluate(metric.formula, { ...facts, [spec.lever.fact]: Math.max(0, lever + spec.lever.step) }).score;
  return round4(((after - before) * metric.weight) / totalWeight);
}
const round4 = (x: number) => Math.round(x * 10000) / 10000;

export const totalWeight = (fw: Pick<NaacFramework, "metrics">) => fw.metrics.reduce((a, m) => a + m.weight, 0);

/** Σ(score × weight) ÷ Σ(weight); an unscored metric is 0. */
export function cgpaOf(fw: Pick<NaacFramework, "metrics">, scores: Map<string, number | null>): number {
  const total = totalWeight(fw);
  if (total <= 0) return 0;
  return round2(fw.metrics.reduce((a, m) => a + (scores.get(m.code) ?? 0) * m.weight, 0) / total);
}

/** A weighted mean of the metrics given (a KI's or a criterion's score on 0–4). */
export function weightedScore(metrics: Pick<NaacMetric, "code" | "weight">[], scores: Map<string, number | null>): number {
  const w = metrics.reduce((a, m) => a + m.weight, 0);
  return w > 0 ? round2(metrics.reduce((a, m) => a + (scores.get(m.code) ?? 0) * m.weight, 0) / w) : 0;
}

export function gradeOf(cgpa: number): string {
  return NAAC_BANDS.find((b) => cgpa >= b.min)?.grade ?? "D";
}

/** The band above, and how far the CGPA is from it; null at A++. */
export function nextBand(cgpa: number): { grade: string; min: number; distance: number } | null {
  const above = [...NAAC_BANDS].reverse().find((b) => b.min > cgpa);
  return above ? { grade: above.grade, min: above.min, distance: round2(above.min - cgpa) } : null;
}

/** The ten metrics where one unit of effort adds the most CGPA. */
export function cheapest<T extends { code: string; gainPerUnit: number }>(rows: T[], n = 10): T[] {
  return rows.filter((r) => r.gainPerUnit > 0).sort((a, b) => b.gainPerUnit - a.gainPerUnit || a.code.localeCompare(b.code)).slice(0, n);
}

/* -------------------------------------------------------------------------- */
/* Grievance time limit                                                        */
/* -------------------------------------------------------------------------- */

/** `days` working days after `fromKey` (a date key), Monday to Saturday; Sunday is skipped. */
export function addWorkingDays(fromKey: string, days: number): string {
  const [y, m, d] = fromKey.split("-").map(Number) as [number, number, number];
  const at = new Date(Date.UTC(y, m - 1, d));
  let left = days;
  while (left > 0) {
    at.setUTCDate(at.getUTCDate() + 1);
    if (at.getUTCDay() !== 0) left -= 1;
  }
  return at.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Surveys                                                                     */
/* -------------------------------------------------------------------------- */

/** Below this many responses a survey's aggregates are not shown to anyone but the desk's count, so no answer can be traced to a person. */
export const SURVEY_MIN_RESPONSES = 5;

export function aggregate(questions: readonly string[], answers: Record<string, number>[]): { code: string; mean: number | null; counts: number[] }[] {
  return questions.map((code) => {
    const counts = [0, 0, 0, 0, 0];
    let sum = 0;
    let n = 0;
    for (const a of answers) {
      const v = a[code];
      if (typeof v !== "number" || v < 0 || v > 4) continue;
      counts[4 - v]! += 1;
      sum += v;
      n += 1;
    }
    return { code, mean: n ? round2(sum / n) : null, counts };
  });
}

/** The mean of every answer of every response, 0–4. */
export function overallMean(answers: Record<string, number>[]): number | null {
  const all = answers.flatMap((a) => Object.values(a).filter((v): v is number => typeof v === "number" && v >= 0 && v <= 4));
  return all.length ? round2(all.reduce((a, b) => a + b, 0) / all.length) : null;
}

/* -------------------------------------------------------------------------- */
/* NIRF (the sub-parameters whose formulas NIRF publishes)                      */
/* -------------------------------------------------------------------------- */

export type NirfFacts = {
  /** F and N: full-time faculty with a PhD or master's, and the sanctioned intake. */
  faculty: number | null;
  intake: number | null;
  /** FRA: % of faculty with a PhD; F1–F3: fractions by experience (≤ 8, 8–15, > 15 years). */
  phdPct: number | null;
  f1: number | null;
  f2: number | null;
  f3: number | null;
  /** Np, Nhs: % of graduates placed and gone to higher studies; Ng: % of intake passing in time. */
  placedPct: number | null;
  higherPct: number | null;
  passInTimePct: number | null;
  /** NWS, NWF: % women students and faculty. */
  womenStudentsPct: number | null;
  womenFacultyPct: number | null;
};

/** The marks NIRF's published formulas give (NIRF 2025, Colleges); null where a fact is missing. */
export function nirfSubs(f: NirfFacts): Record<"FSR" | "FQE" | "GPH" | "GUE" | "WD", number | null> {
  const fsr = f.faculty !== null && f.intake ? (f.faculty / f.intake < 1 / 70 ? 0 : Math.min(30, 30 * 20 * (f.faculty / f.intake))) : null;
  const fq = f.phdPct !== null ? 10 * Math.min(f.phdPct, 75) / 75 : null;
  const fe = f.f1 !== null && f.f2 !== null && f.f3 !== null ? 3 * Math.min(3 * f.f1, 1) + 3 * Math.min(3 * f.f2, 1) + 4 * Math.min(3 * f.f3, 1) : null;
  const fqe = fq !== null && fe !== null ? fq + fe : null;
  const gph = f.placedPct !== null && f.higherPct !== null ? Math.min(40, 40 * (f.placedPct / 100 + f.higherPct / 100)) : null;
  const gue = f.passInTimePct !== null ? 40 * Math.min(f.passInTimePct / 80, 1) : null;
  const wd = f.womenStudentsPct !== null && f.womenFacultyPct !== null ? 15 * Math.min(f.womenStudentsPct / 50, 1) + 15 * Math.min(f.womenFacultyPct / 20, 1) : null;
  const r = (x: number | null) => (x === null ? null : round2(x));
  return { FSR: r(fsr), FQE: r(fqe), GPH: r(gph), GUE: r(gue), WD: r(wd) };
}
