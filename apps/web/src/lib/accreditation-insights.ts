import {
  NBA_SAR_ITEMS,
  NIRF_BANDS,
  NIRF_PARAMETERS,
  type InsightCtaCode,
  type InsightStep,
  type NaacFormulaId,
  type NaacFramework,
  type NbaInputs,
  type NirfInputs,
} from "@edulink/contracts";
import { FORMULAS, NIRF_WHOLES, cgpaOf, evaluate, gainPerUnit, gradeOf, nextBand, nirfSubs, round2, totalWeight, weightedScore, type Facts } from "./iqac-rules";
import { NBA_COMPUTED, NBA_WHOLES, nbaMarks, type NbaComputedCode } from "./council-rules";

/**
 * ACTIONABLE INSIGHTS AND THE SIMULATOR'S ARITHMETIC (5 October 2026) — PURE.
 * It imports nothing but the contracts and the two rule files, so the
 * simulator page ships it to the browser and a test holds that it has no
 * server import. It never carries a formula of its own: every score is
 * iqac-rules.ts `evaluate`/`cgpaOf`/`nirfSubs`, every NBA mark council-rules.ts
 * `nbaMarks`, and the simulator at today's figures equals the predictor.
 *
 * WHAT A STEP IS. A quantitative NAAC metric moves by its lever (FORMULAS'
 * `lever`: the fact one more of which the college could add — a teacher, a
 * paper, a lakh, a day sooner). The next step is the smallest whole number of
 * lever steps that takes the metric's 0–4 score to the next whole number; the
 * top is the smallest that takes it to 4. What a step adds is the WHOLE
 * framework's CGPA change, not the metric's alone: a teacher more raises the
 * student–teacher ratio's score and lowers the PhD share's, and the insight
 * says the net. A qualitative metric's step is one whole step of the
 * coordinator's score, with evidence. An NBA item's step is the smallest
 * change of its figure that adds at least a mark (or the rest to full), a
 * NIRF sub-parameter's the smallest that adds at least a mark, weighed by its
 * parameter's weight.
 *
 * THE RANKING. By what the next step adds per unit of lever (`efficiency`),
 * most first; `pointsPerUnit` is the predictor's own gainPerUnit, shown beside.
 * Units are not commensurable (a lakh is not a teacher); the ranking says
 * where one unit of each buys the most, and the CTA says who spends it.
 */

export type QlScores = Record<string, number | null>;
export type NaacInputs = { facts: Facts; ql: QlScores };

const EPS = 1e-9;
const round4 = (x: number) => Math.round(x * 10000) / 10000;
const roundLever = (x: number) => Math.round(x * 10000) / 10000;

/* -------------------------------------------------------------------------- */
/* Where each fact is changed                                                  */
/* -------------------------------------------------------------------------- */

/** The page where a fact the formulas read is made, and so the CTA of a metric whose lever (or missing input) it is. */
export const FACT_CTA: Record<string, InsightCtaCode> = {
  studentYears: "ADMISSIONS",
  studentsLatest: "ADMISSIONS",
  windowYears: "QUALITATIVE",
  fullTimeTeachers: "PEOPLE",
  phdNetTeachers: "FACULTY_RECORDS",
  experienceTotalYears: "FACULTY_RECORDS",
  staffTotal: "PEOPLE",
  sanctionedPosts: "ENTERED",
  papers: "RESEARCH",
  books: "RESEARCH",
  grantLakhs: "RESEARCH",
  seedLakhs: "RESEARCH",
  consultancyLakhs: "RESEARCH",
  mous: "RESEARCH",
  teachersAwarded: "RESEARCH",
  teachersSupported: "RESEARCH",
  valueAddedCourses: "ACTIVITIES",
  valueAddedParticipants: "ACTIVITIES",
  extensionProgrammes: "ACTIVITIES",
  extensionParticipants: "ACTIVITIES",
  extensionAwards: "ACTIVITIES",
  collaborations: "ACTIVITIES",
  iprWorkshops: "ACTIVITIES",
  careerGuidanceParticipants: "ACTIVITIES",
  competitiveQualified: "ACTIVITIES",
  studentAwards: "ACTIVITIES",
  sportsCulturalEvents: "ACTIVITIES",
  capacityThemes: "ACTIVITIES",
  auditOptions: "ACTIVITIES",
  staffInFdp: "ACTIVITIES",
  grievanceOptions: "COMMITTEES",
  feedbackStakeholders: "SURVEYS",
  feedbackProcess: "SURVEYS",
  sssMean: "SURVEYS",
  qaOptions: "COMMITTEES",
  egovOptions: "MODULES",
  programmes: "ACADEMICS",
  programmesRevised: "ACADEMICS",
  cbcsProgrammes: "ACADEMICS",
  totalCourses: "ACADEMICS",
  newCourses: "ACADEMICS",
  mentors: "ACADEMICS",
  sanctionedSeats: "ACADEMICS",
  admitted: "ADMISSIONS",
  reservedAdmitted: "ADMISSIONS",
  reservedEarmarked: "ADMISSIONS",
  projectStudents: "INTERNSHIPS",
  appeared: "EXAMS",
  passed: "EXAMS",
  examAppeared: "EXAMS",
  resultDaysAvg: "EXAMS",
  evalGrievances: "EXAMS",
  outgoing: "PLACEMENT",
  placed: "PLACEMENT",
  higherStudies: "PLACEMENT",
  scholarshipBeneficiaries: "SCHOLARSHIPS",
  infraLakhs: "PURCHASES",
  computers: "PURCHASES",
  nonSalaryLakhs: "ENTERED",
  maintenanceLakhs: "ENTERED",
  bandwidthMbps: "ENTERED",
  greenOptions: "ENTERED",
  qaCertifications: "ENTERED",
  employabilityCourses: "ENTERED",
};
export const ctaOfFact = (fact: string): InsightCtaCode => FACT_CTA[fact] ?? "QUALITATIVE";

/* -------------------------------------------------------------------------- */
/* A part is never more than its whole (audit of 5 Oct 2026, A3-journeys-13)    */
/* -------------------------------------------------------------------------- */

/**
 * A whole and its parts: `of` names the figure (or is a fixed number — NIRF's
 * fractions of one) the parts' sum may not pass. `metric` is the formula, the
 * SAR item or the NIRF sub-parameter that reads them, for the refusal.
 * THE DECISION: the live simulator HOLDS a breach (NAAC and NIRF scale the
 * parts down to the whole — the score never changes, since every NAAC formula
 * with a whole is full marks at 100 %; the NBA SAR counts the extra designated
 * teachers as teachers, raising F) and a stored scenario that breaks one is
 * REFUSED (iqac-insights.ts writeScenario), so no saved figure is impossible.
 */
export type Whole = { metric: string; parts: readonly string[]; of: string | number };
type Figures = Record<string, unknown>;

/** Every NAAC formula's declared whole (FORMULAS[f].whole), named by the formula. */
export const NAAC_WHOLES: readonly Whole[] = Object.entries(FORMULAS).flatMap(([id, s]) => (s.whole ? [{ metric: id, parts: s.whole.parts, of: s.whole.of }] : []));
export const NIRF_PART_WHOLES: readonly Whole[] = NIRF_WHOLES;
export const NBA_PART_WHOLES: readonly Whole[] = NBA_WHOLES;

const numAt = (f: Figures, k: string): number | null => (typeof f[k] === "number" && Number.isFinite(f[k]) ? (f[k] as number) : null);
const wholeAt = (f: Figures, w: Whole) => (typeof w.of === "number" ? w.of : numAt(f, w.of));
const partsSum = (f: Figures, w: Whole) => w.parts.reduce((a, p) => a + (numAt(f, p) ?? 0), 0);

/** The wholes the figures break (a missing whole or no part given breaks nothing). */
export function partsOver(wholes: readonly Whole[], f: Figures): Whole[] {
  return wholes.filter((w) => {
    const whole = wholeAt(f, w);
    return whole !== null && w.parts.some((p) => numAt(f, p) !== null) && partsSum(f, w) > whole + EPS;
  });
}

/**
 * The figures with every broken whole's parts held to it: the part just
 * typed alone where the others leave room for it, else all of them scaled
 * down in proportion.
 */
export function holdParts<T extends Figures>(wholes: readonly Whole[], figures: T, typed?: string): T {
  const out: Figures = { ...figures };
  for (const w of partsOver(wholes, out)) {
    const whole = wholeAt(out, w)!;
    if (typed && w.parts.includes(typed)) {
      const others = partsSum(out, w) - (numAt(out, typed) ?? 0);
      if (others <= whole + EPS) {
        out[typed] = roundLever(Math.max(0, whole - others));
        continue;
      }
    }
    const k = whole / partsSum(out, w);
    for (const p of w.parts) if (numAt(out, p) !== null) out[p] = roundLever(numAt(out, p)! * k);
  }
  return out as T;
}

/**
 * The figures with every broken whole that is a figure raised to its parts'
 * sum (a professor more is a teacher more) — unless that whole is the figure
 * just typed, when its parts are held to it instead.
 */
export function raiseWholes<T extends Figures>(wholes: readonly Whole[], figures: T, typed?: string): T {
  let out: Figures = { ...figures };
  for (const w of partsOver(wholes, out)) {
    if (typeof w.of === "number" || w.of === typed) out = holdParts([w], out, typed);
    else out[w.of] = Math.max(numAt(out, w.of) ?? 0, partsSum(out, w));
  }
  return out as T;
}

/* -------------------------------------------------------------------------- */
/* NAAC: the simulator                                                         */
/* -------------------------------------------------------------------------- */

/** Σ score × weight ÷ Σ weight, unrounded (cgpaOf rounds to two places). */
export function exactCgpa(fw: Pick<NaacFramework, "metrics">, scores: Map<string, number | null>): number {
  const total = totalWeight(fw);
  return total > 0 ? fw.metrics.reduce((a, m) => a + (scores.get(m.code) ?? 0) * m.weight, 0) / total : 0;
}

export type NaacSimulated = {
  cgpa: number;
  grade: string;
  nextBand: { grade: string; min: number; distance: number } | null;
  scores: Map<string, number>;
  values: Map<string, number | null>;
  criteria: { code: string; score: number }[];
};

/** The predictor's arithmetic over a set of figures: each QN metric evaluate()d over the facts, each QL its 0–4 (null: 0). */
export function simulateNaac(fw: NaacFramework, inputs: NaacInputs): NaacSimulated {
  const scores = new Map<string, number>();
  const values = new Map<string, number | null>();
  // A part above its whole is held to it (A3-journeys-13); no score moves, the value reads at most 100 %.
  const facts = holdParts(NAAC_WHOLES, inputs.facts);
  for (const m of fw.metrics) {
    if (m.kind === "QN" && m.formula) {
      const ev = evaluate(m.formula, facts);
      scores.set(m.code, ev.score);
      values.set(m.code, ev.value);
    } else {
      const s = inputs.ql[m.code];
      scores.set(m.code, s === null || s === undefined ? 0 : Math.max(0, Math.min(4, s)));
      values.set(m.code, s ?? null);
    }
  }
  const cgpa = cgpaOf(fw, scores);
  const criteria = fw.criteria.map((c) => ({ code: c.code, score: weightedScore(fw.metrics.filter((m) => m.ki.split(".")[0] === c.code), scores) }));
  return { cgpa, grade: gradeOf(cgpa), nextBand: nextBand(cgpa), scores, values, criteria };
}

/* -------------------------------------------------------------------------- */
/* NAAC: steps                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The smallest whole number of lever steps (FORMULAS[f].lever.step each,
 * never below 0) taking the metric's score to `target` or more; null when the
 * lever is missing, another input is missing, or no number of steps can.
 * Every scale is monotone in its lever, so an exponential bracket and a
 * binary search find it.
 */
export function stepFor(formula: NaacFormulaId, facts: Facts, target: number): { units: number; delta: number; toValue: number | null; toScore: number } | null {
  const spec = FORMULAS[formula];
  const lever = facts[spec.lever.fact];
  if (lever === null || lever === undefined) return null;
  if (spec.inputs.some((k) => k !== spec.lever.fact && (facts[k] === null || facts[k] === undefined))) return null;
  const step = spec.lever.step;
  const at = (k: number) => evaluate(formula, { ...facts, [spec.lever.fact]: Math.max(0, roundLever(lever + k * step)) });
  if (at(0).score >= target - EPS) return { units: 0, delta: 0, toValue: at(0).value, toScore: at(0).score };
  const ceiling = step < 0 ? Math.ceil(lever / -step - EPS) : 10_000_000;
  let hi = 1;
  while (hi < ceiling && at(hi).score < target - EPS) hi *= 2;
  hi = Math.min(hi, ceiling);
  if (hi < 1 || at(hi).score < target - EPS) return null;
  let lo = Math.floor(hi / 2);
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (at(mid).score >= target - EPS) hi = mid;
    else lo = mid;
  }
  const end = at(hi);
  return { units: hi, delta: roundLever(Math.max(0, lever + hi * step) - lever), toValue: end.value, toScore: end.score };
}

export type RawNaacInsight = {
  code: string;
  ki: string;
  criterion: string;
  kind: "QN" | "QL";
  weight: number;
  value: number | null;
  score: number;
  scored: boolean;
  lever: string | null;
  leverValue: number | null;
  /** The last part of the unit's key: `iqac.unit.<unit>`. */
  unit: string;
  nextStep: InsightStep | null;
  toTop: InsightStep | null;
  units: number;
  pointsPerUnit: number;
  efficiency: number;
  missing: string[];
  cta: InsightCtaCode;
};

const withLever = (inputs: NaacInputs, fact: string, value: number): NaacInputs => ({ facts: { ...inputs.facts, [fact]: value }, ql: inputs.ql });

/**
 * Every metric below 4: its next whole step and its top, what each adds to the
 * CGPA (net, over the whole framework), its CTA. Ordered: quantitative metrics
 * with a step by efficiency (most first, code on ties), then those the rows
 * cannot move (a missing input first named), then the qualitative ones —
 * unscored first, then by weight.
 */
export function naacInsightsOf(fw: NaacFramework, inputs: NaacInputs): RawNaacInsight[] {
  const total = totalWeight(fw);
  const base = simulateNaac(fw, inputs);
  const baseExact = exactCgpa(fw, base.scores);
  const gainOf = (next: NaacInputs) => round4(exactCgpa(fw, simulateNaac(fw, next).scores) - baseExact);
  const out: RawNaacInsight[] = [];
  for (const m of fw.metrics) {
    const score = base.scores.get(m.code) ?? 0;
    if (score >= 4 - EPS) continue;
    const criterion = m.ki.split(".")[0]!;
    if (m.kind === "QL" || !m.formula) {
      const scored = inputs.ql[m.code] !== null && inputs.ql[m.code] !== undefined;
      const next = Math.min(4, Math.floor(score + EPS) + 1);
      const step = (to: number): InsightStep => ({ units: 1, delta: round4(to - score), toValue: to, toScore: to, points: round4(((to - score) * m.weight) / total) });
      const nextStep = step(next);
      out.push({ code: m.code, ki: m.ki, criterion, kind: "QL", weight: m.weight, value: scored ? score : null, score, scored, lever: null, leverValue: null, unit: "step", nextStep, toTop: step(4), units: 1, pointsPerUnit: gainPerUnit(m, inputs.facts, score, total), efficiency: nextStep.delta > 0 ? nextStep.points / nextStep.delta : 0, missing: [], cta: "QUALITATIVE" });
      continue;
    }
    const spec = FORMULAS[m.formula];
    const missing = spec.inputs.filter((k) => inputs.facts[k] === null || inputs.facts[k] === undefined);
    const lever = spec.lever.fact;
    const leverValue = inputs.facts[lever] ?? null;
    const asStep = (s: ReturnType<typeof stepFor>): InsightStep | null => (s && s.units > 0 ? { units: s.units, delta: s.delta, toValue: s.toValue, toScore: s.toScore, points: gainOf(withLever(inputs, lever, Math.max(0, roundLever((leverValue ?? 0) + s.units * spec.lever.step)))) } : null);
    const first = stepFor(m.formula, inputs.facts, Math.min(4, Math.floor(score + EPS) + 1));
    const top = stepFor(m.formula, inputs.facts, 4);
    const nextStep = asStep(first);
    out.push({
      code: m.code,
      ki: m.ki,
      criterion,
      kind: "QN",
      weight: m.weight,
      value: base.values.get(m.code) ?? null,
      score,
      scored: true,
      lever,
      leverValue,
      unit: spec.unit,
      nextStep,
      toTop: asStep(top),
      units: first?.units ?? 0,
      pointsPerUnit: gainPerUnit(m, inputs.facts, score, total),
      efficiency: nextStep && first && first.units > 0 ? nextStep.points / first.units : 0,
      missing,
      cta: ctaOfFact(missing[0] ?? lever),
    });
  }
  const qn = out.filter((i) => i.kind === "QN");
  const movable = qn.filter((i) => i.nextStep && i.nextStep.points > 0).sort((a, b) => b.efficiency - a.efficiency || a.code.localeCompare(b.code, "en", { numeric: true }));
  const stuck = qn.filter((i) => !movable.includes(i)).sort((a, b) => b.missing.length - a.missing.length || b.weight - a.weight || a.code.localeCompare(b.code, "en", { numeric: true }));
  const ql = out.filter((i) => i.kind === "QL").sort((a, b) => Number(a.scored) - Number(b.scored) || b.weight - a.weight || a.code.localeCompare(b.code, "en", { numeric: true }));
  return [...movable, ...stuck, ...ql];
}

export type PathStep = { code: string; kind: "QN" | "QL"; units: number; delta: number; points: number; unit: string; cta: InsightCtaCode };

/**
 * THE CHEAPEST WAY TO A BAND: take the best next step (by efficiency; the
 * quantitative ones while any adds anything, then the qualitative ones), apply
 * it, and look again — a step changes what the others add — until the CGPA as
 * the predictor rounds it reaches `min` and the steps' points cover the
 * distance. Steps on the same metric are merged. `reachable` is false when
 * the steps run out first.
 */
export function pathToBand(fw: NaacFramework, inputs: NaacInputs, min: number): { steps: PathStep[]; points: number; reachable: boolean; cgpaAfter: number } {
  const start = simulateNaac(fw, inputs);
  const distance = round2(min - start.cgpa);
  let cur: NaacInputs = { facts: { ...inputs.facts }, ql: { ...inputs.ql } };
  const steps = new Map<string, PathStep>();
  let points = 0;
  for (let guard = 0; guard < 400; guard += 1) {
    const now = simulateNaac(fw, cur);
    if (now.cgpa >= min - EPS && points >= distance - EPS) break;
    const all = naacInsightsOf(fw, cur);
    const pick = all.find((i) => i.kind === "QN" && i.nextStep && i.nextStep.points > 0) ?? all.filter((i) => i.kind === "QL" && i.nextStep && i.nextStep.points > 0).sort((a, b) => b.efficiency - a.efficiency || a.code.localeCompare(b.code, "en", { numeric: true }))[0];
    if (!pick || !pick.nextStep) break;
    if (pick.kind === "QN" && pick.lever) {
      const step = FORMULAS[fw.metrics.find((m) => m.code === pick.code)!.formula!].lever.step;
      cur = withLever(cur, pick.lever, Math.max(0, roundLever((pick.leverValue ?? 0) + pick.nextStep.units * step)));
    } else cur = { facts: cur.facts, ql: { ...cur.ql, [pick.code]: pick.nextStep.toScore } };
    points = round4(points + pick.nextStep.points);
    const had = steps.get(pick.code);
    steps.set(pick.code, had ? { ...had, units: had.units + pick.nextStep.units, delta: roundLever(had.delta + pick.nextStep.delta), points: round4(had.points + pick.nextStep.points) } : { code: pick.code, kind: pick.kind, units: pick.nextStep.units, delta: pick.nextStep.delta, points: pick.nextStep.points, unit: pick.unit, cta: pick.cta });
  }
  const after = simulateNaac(fw, cur);
  return { steps: [...steps.values()], points, reachable: after.cgpa >= min - EPS && points >= distance - EPS, cgpaAfter: after.cgpa };
}

/* -------------------------------------------------------------------------- */
/* NBA SAR                                                                     */
/* -------------------------------------------------------------------------- */

type NbaNumericKey = Exclude<keyof NbaInputs, "self">;

/** Each computed item's lever: the figure moved, by how much a unit, its bound, the unit's key (`insights.unit.<unit>`) and where it is changed. */
export const NBA_LEVERS: Record<NbaComputedCode, { lever: NbaNumericKey; step: number; max: number | null; unit: string; cta: InsightCtaCode }> = {
  "4.1": { lever: "admitted", step: 1, max: null, unit: "student", cta: "ADMISSIONS" },
  "4.2.1": { lever: "successNoBacklog", step: 0.01, max: 1, unit: "percentPoint", cta: "EXAMS" },
  "4.2.2": { lever: "successStipulated", step: 0.01, max: 1, unit: "percentPoint", cta: "EXAMS" },
  "4.3": { lever: "apiThird", step: 0.1, max: 10, unit: "gradeTenth", cta: "EXAMS" },
  "4.4": { lever: "apiSecond", step: 0.1, max: 10, unit: "gradeTenth", cta: "EXAMS" },
  "4.5": { lever: "placement", step: 0.01, max: 1, unit: "percentPoint", cta: "PLACEMENT" },
  "5.1": { lever: "F", step: 1, max: null, unit: "teacher", cta: "PEOPLE" },
  "5.2": { lever: "professors", step: 1, max: null, unit: "professor", cta: "FACULTY_RECORDS" },
  "5.3": { lever: "phd", step: 1, max: null, unit: "phdTeacher", cta: "FACULTY_RECORDS" },
  "8.1": { lever: "firstYearFaculty", step: 1, max: null, unit: "teacher", cta: "ACADEMICS" },
  "8.3": { lever: "apiFirst", step: 0.1, max: 10, unit: "gradeTenth", cta: "EXAMS" },
};

const NBA_MAX = Object.fromEntries(NBA_SAR_ITEMS.map((i) => [i.code, i.marks])) as Record<string, number>;
export const NBA_TOTAL = NBA_SAR_ITEMS.reduce((a, i) => a + i.marks, 0);

/** The SAR's totals over a set of figures: the computed items by nbaMarks, the self-assessed ones as typed, each capped at its marks. */
export function nbaTotals(i: NbaInputs): { marks: Record<NbaComputedCode, number>; computed: number; self: number; total: number; max: number } {
  // A designated teacher beyond F is one more teacher (A3-journeys-13); the rows never give one.
  const marks = nbaMarks(raiseWholes(NBA_PART_WHOLES, i));
  const computed = round2(NBA_SAR_ITEMS.filter((x) => x.computed).reduce((a, x) => a + (marks[x.code as NbaComputedCode] ?? 0), 0));
  const self = round2(NBA_SAR_ITEMS.filter((x) => !x.computed).reduce((a, x) => a + Math.min(x.marks, i.self[x.code] ?? 0), 0));
  return { marks, computed, self, total: round2(computed + self), max: NBA_TOTAL };
}

/** The smallest k of `step` (up to the lever's bound) for which `ok(k)`; null if none. */
function smallest(start: number, step: number, max: number | null, ok: (value: number) => boolean): { units: number; value: number } | null {
  const valueAt = (k: number) => roundLever(max === null ? start + k * step : Math.min(max, start + k * step));
  const ceiling = max === null ? 10_000_000 : Math.max(0, Math.ceil((max - start) / step - EPS));
  if (ceiling < 1) return null;
  let hi = 1;
  while (hi < ceiling && !ok(valueAt(hi))) hi *= 2;
  hi = Math.min(hi, ceiling);
  if (!ok(valueAt(hi))) return null;
  let lo = Math.floor(hi / 2);
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (ok(valueAt(mid))) hi = mid;
    else lo = mid;
  }
  return { units: hi, value: valueAt(hi) };
}

export type RawNbaInsight = {
  code: string;
  criterion: string;
  max: number;
  marks: number;
  computed: boolean;
  lever: NbaNumericKey | null;
  leverValue: number | null;
  unit: string;
  nextStep: InsightStep | null;
  toTop: InsightStep | null;
  units: number;
  efficiency: number;
  cta: InsightCtaCode;
};

/**
 * Every SAR item below full marks. A computed item: the smallest change of
 * its figure that adds at least a mark (or what is left to full), and to full;
 * a figure the rows do not hold yet (no batch finished, nobody appeared) has
 * no step. A self-assessed item: what is left to its marks, written with
 * evidence. Computed items by marks per unit (most first), then the
 * self-assessed ones, unwritten first then by marks left.
 */
export function nbaInsightsOf(i: NbaInputs): RawNbaInsight[] {
  const base = nbaMarks(i);
  const out: RawNbaInsight[] = [];
  for (const code of NBA_COMPUTED) {
    const max = NBA_MAX[code] ?? 0;
    const marks = base[code];
    if (marks >= max - EPS) continue;
    const spec = NBA_LEVERS[code];
    const start = i[spec.lever];
    const marksAt = (v: number) => nbaMarks({ ...i, [spec.lever]: v })[code];
    const step = (to: { units: number; value: number } | null): InsightStep | null => {
      if (!to || start === null) return null;
      const after = marksAt(to.value);
      return { units: to.units, delta: roundLever(to.value - start), toValue: to.value, toScore: after, points: round2(after - marks) };
    };
    const want = Math.min(1, max - marks);
    const next = start === null ? null : smallest(start, spec.step, spec.max, (v) => marksAt(v) - marks >= want - EPS);
    const full = start === null ? null : smallest(start, spec.step, spec.max, (v) => marksAt(v) >= max - EPS);
    const nextStep = step(next);
    out.push({ code, criterion: code.split(".")[0]!, max, marks, computed: true, lever: spec.lever, leverValue: start, unit: spec.unit, nextStep, toTop: step(full), units: next?.units ?? 0, efficiency: nextStep && next ? nextStep.points / next.units : 0, cta: spec.cta });
  }
  out.sort((a, b) => b.efficiency - a.efficiency || a.code.localeCompare(b.code, "en", { numeric: true }));
  const self: RawNbaInsight[] = [];
  for (const item of NBA_SAR_ITEMS) {
    if (item.computed) continue;
    const written = i.self[item.code];
    const marks = Math.min(item.marks, written ?? 0);
    if (marks >= item.marks - EPS) continue;
    const left = round2(item.marks - marks);
    const s: InsightStep = { units: left, delta: left, toValue: item.marks, toScore: item.marks, points: left };
    self.push({ code: item.code, criterion: item.criterion, max: item.marks, marks, computed: false, lever: null, leverValue: written ?? null, unit: "mark", nextStep: s, toTop: s, units: left, efficiency: 1, cta: "NBA_WORKSHEET" });
  }
  self.sort((a, b) => Number(a.leverValue !== null) - Number(b.leverValue !== null) || b.max - b.marks - (a.max - a.marks) || a.code.localeCompare(b.code, "en", { numeric: true }));
  return [...out, ...self];
}

/* -------------------------------------------------------------------------- */
/* NIRF                                                                        */
/* -------------------------------------------------------------------------- */

type NirfSubCode = "FSR" | "FQE" | "GPH" | "GUE" | "WD";
type NirfBand = (typeof NIRF_BANDS)[number];

/**
 * NIRF's published formulas over a set of figures (iqac-rules.ts nirfSubs),
 * put together per parameter exactly as the IQAC home always has: a
 * parameter's marks are its computed published subs, `partial` their sum
 * weighed, `coveredMarks` the marks those subs could give weighed. The
 * projection and the band are the platform's reading (NIRF_BANDS).
 */
export function nirfScore(i: NirfInputs): {
  subs: Record<NirfSubCode, number | null>;
  parameters: { code: string; name: string; weight: number; marks: number | null; covered: number }[];
  partial: number;
  coveredMarks: number;
  projected: number | null;
  band: NirfBand | null;
  nextBand: { code: NirfBand["code"]; min: number; distance: number } | null;
} {
  // Fractions of one and shares of a hundred held to their whole (A3-journeys-13).
  const subs = nirfSubs(holdParts(NIRF_PART_WHOLES, i));
  const byCode = subs as Record<string, number | null>;
  const parameters = NIRF_PARAMETERS.map((p) => {
    const computed = p.subs.filter((s) => s.published && byCode[s.code] !== null && byCode[s.code] !== undefined);
    return { code: p.code, name: p.name, weight: p.weight, marks: computed.length ? round2(computed.reduce((a, s) => a + (byCode[s.code] ?? 0), 0)) : null, covered: computed.reduce((a, s) => a + s.marks, 0) };
  });
  const partial = round2(parameters.reduce((a, p) => a + (p.marks ?? 0) * p.weight, 0));
  const coveredMarks = round2(parameters.reduce((a, p) => a + p.covered * p.weight, 0));
  const projected = coveredMarks > 0 ? round2((partial / coveredMarks) * 100) : null;
  const band = projected === null ? null : (NIRF_BANDS.find((b) => projected >= b.min - EPS) ?? null);
  const at = band ? NIRF_BANDS.findIndex((b) => b.code === band.code) : -1;
  const above = at > 0 ? NIRF_BANDS[at - 1]! : null;
  return { subs, parameters, partial, coveredMarks, projected, band, nextBand: above && projected !== null ? { code: above.code, min: above.min, distance: round2(above.min - projected) } : null };
}

/** Each published sub-parameter's lever: one unit is a teacher, or a percentage point. FQE's unit is one more teacher with a PhD, so its step is 100 ÷ faculty. */
const NIRF_LEVERS: Record<NirfSubCode, { cta: InsightCtaCode; pick: (i: NirfInputs) => { lever: keyof NirfInputs; step: number | null; max: number | null; unit: string } }> = {
  FSR: { cta: "PEOPLE", pick: () => ({ lever: "faculty", step: 1, max: null, unit: "teacher" }) },
  FQE: { cta: "FACULTY_RECORDS", pick: (i) => ({ lever: "phdPct", step: i.faculty ? 100 / i.faculty : null, max: 100, unit: "phdTeacher" }) },
  GPH: { cta: "PLACEMENT", pick: () => ({ lever: "placedPct", step: 1, max: 100, unit: "percentPoint" }) },
  GUE: { cta: "EXAMS", pick: () => ({ lever: "passInTimePct", step: 1, max: 100, unit: "percentPoint" }) },
  WD: { cta: "PEOPLE", pick: (i) => ((i.womenFacultyPct ?? 0) < 20 ? { lever: "womenFacultyPct", step: 1, max: 100, unit: "percentPoint" } : { lever: "womenStudentsPct", step: 1, max: 100, unit: "percentPoint" }) },
};

export type RawNirfInsight = {
  code: string;
  parameter: string;
  max: number;
  marks: number | null;
  published: boolean;
  lever: keyof NirfInputs | null;
  leverValue: number | null;
  unit: string;
  nextStep: InsightStep | null;
  toTop: InsightStep | null;
  units: number;
  efficiency: number;
  cta: InsightCtaCode;
};

/**
 * Every NIRF sub-parameter below its marks. A published one the platform
 * computes: the smallest change of its lever adding at least a mark, and to
 * full, each as score points (marks × the parameter's weight). The rest —
 * formulas NIRF does not publish, or data the platform does not hold (RD,
 * PCS) — listed last with no step: keep their data ready.
 */
export function nirfInsightsOf(i: NirfInputs): RawNirfInsight[] {
  const base = nirfSubs(i) as Record<string, number | null>;
  const computed: RawNirfInsight[] = [];
  const rest: RawNirfInsight[] = [];
  for (const p of NIRF_PARAMETERS) {
    for (const s of p.subs) {
      const marks = base[s.code];
      const spec = s.code in NIRF_LEVERS ? NIRF_LEVERS[s.code as NirfSubCode] : null;
      if (!spec || marks === null || marks === undefined) {
        rest.push({ code: s.code, parameter: p.code, max: s.marks, marks: null, published: s.published, lever: null, leverValue: null, unit: "mark", nextStep: null, toTop: null, units: 0, efficiency: 0, cta: "DOCUMENTS" });
        continue;
      }
      if (marks >= s.marks - EPS) continue;
      const lv = spec.pick(i);
      const start = i[lv.lever];
      const marksAt = (v: number) => (nirfSubs({ ...i, [lv.lever]: v }) as Record<string, number | null>)[s.code] ?? 0;
      const step = (to: { units: number; value: number } | null): InsightStep | null => {
        if (!to || start === null) return null;
        const after = marksAt(to.value);
        return { units: to.units, delta: roundLever(to.value - start), toValue: to.value, toScore: after, points: round4((after - marks) * p.weight) };
      };
      const want = Math.min(1, s.marks - marks);
      const next = start === null || !lv.step ? null : smallest(start, lv.step, lv.max, (v) => marksAt(v) - marks >= want - EPS);
      const full = start === null || !lv.step ? null : smallest(start, lv.step, lv.max, (v) => marksAt(v) >= s.marks - EPS);
      const nextStep = step(next);
      computed.push({ code: s.code, parameter: p.code, max: s.marks, marks, published: true, lever: lv.lever, leverValue: start, unit: lv.unit, nextStep, toTop: step(full), units: next?.units ?? 0, efficiency: nextStep && next ? nextStep.points / next.units : 0, cta: spec.cta });
    }
  }
  computed.sort((a, b) => b.efficiency - a.efficiency || a.code.localeCompare(b.code));
  return [...computed, ...rest];
}
