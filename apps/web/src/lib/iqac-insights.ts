import "server-only";
import {
  INSIGHT_CTAS,
  NAAC_BANDS,
  NBA_SAR_ITEMS,
  NIRF_BANDS,
  nbaInputsSchema,
  naacScenarioInputsSchema,
  type IqacCycle,
  type InsightCta,
  type InsightCtaCode,
  type NaacFramework,
  type NaacInsights,
  type NaacScenarioInputs,
  type NaacSimulation,
  type NbaInputs,
  type NbaInsights,
  type NbaSimulation,
  type NirfInputs,
  type NirfInsights,
  type RoleCode,
  type Scenario,
  type ScenarioCompare,
  type ScenarioSave,
  type Scenarios,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { getT } from "./i18n/server";
import type { Translate, TranslationKey } from "./i18n/dictionary";
import { actionKey } from "./safety-labels";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { frameworkOf, iqacActor, type Desk } from "./iqac";
import { benchmarkStatus } from "./iqac-benchmarks";
import { gatherFacts, nirfFacts, readEntered } from "./iqac-facts";
import { FORMULAS, gradeOf, round2, type Facts } from "./iqac-rules";
import { assertFilingApplies, councilDefaultYear, defaultFilingYear, headsOf, nbaDepartmentFor, nbaDepartments, nbaFacts, readWorksheet } from "./council-filings";
import { windowOf } from "./iqac-filings";
import {
  NAAC_WHOLES,
  NBA_PART_WHOLES,
  NIRF_PART_WHOLES,
  naacInsightsOf,
  nbaInsightsOf,
  partsOver,
  nbaTotals,
  nirfInsightsOf,
  nirfScore,
  pathToBand,
  simulateNaac,
  type NaacInputs,
  type RawNaacInsight,
  type RawNbaInsight,
  type RawNirfInsight,
} from "./accreditation-insights";

/**
 * ACTIONABLE INSIGHTS, SCENARIOS AND THE SERVER'S SIMULATOR (module IQAC,
 * 5 October 2026). The arithmetic is accreditation-insights.ts (pure, shipped
 * to the browser too); this file reads the figures from the rows, says every
 * step in the reader's language with its call to action, keeps the saved
 * scenarios, and reads "what you did last" from the audit log.
 *
 * TODAY'S FIGURES, NAAC: the latest score row of every metric of the cycle —
 * the quantitative ones' facts as the last recompute stored them, the
 * qualitative ones' scores — so the simulator at today's figures gives the
 * predictor's CGPA exactly (tests/accreditation-insights.test.ts holds it).
 * Something changed through a CTA's page since that recompute shows under
 * "what you did last" with "recompute to see it". NBA: nbaFacts' figures for
 * the department and year as the rows stand (the SAR is read live), and the
 * worksheet's self-assessed marks. NIRF: the open cycle's window, or the NIRF
 * filing's three years ending with the last finished year.
 *
 * WHO. The desk (IQAC, ADMIN, PRINCIPAL) reads every insight and scenario;
 * the HOD reads their own engineering department's NBA insights and
 * scenarios. The IQAC and the principal save and remove scenarios; the HOD
 * the department's NBA ones. Saving and removing are audited.
 *
 * STORED COPIES. IqacScenario.cgpa and .marks are what a scenario read when
 * saved — one writer (saveScenario), and data:audit recomputes them from
 * inputsJson; every read recomputes them.
 */

const DESK: readonly Role[] = ["IQAC", "ADMIN", "PRINCIPAL"];
const WRITERS: readonly Role[] = ["IQAC", "PRINCIPAL"];
const MAX_SCENARIOS = 100;
/**
 * WITHIN THE HUNDRED (R-47, risks batch 5 Oct 2026; 08's recommended option, A3-S-7): one person keeps at most this
 * many, and an HOD's saves stop at this many for their department, so neither one author nor one department's HOD can
 * fill the college's hundred and lock the IQAC out. Named constants: the owner may move them.
 */
export const MAX_SCENARIOS_PER_AUTHOR = 25;
export const MAX_SCENARIOS_PER_DEPARTMENT = 25;

const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);
const num = (x: number) => (Number.isInteger(x) ? String(x) : String(round2(x)));

const ROLE_KEY: Partial<Record<RoleCode, TranslationKey>> = {
  ADMIN: "role.collegeAdmin",
  PRINCIPAL: "role.principal",
  IQAC: "role.iqac",
  FACULTY: "role.faculty",
  HOD: "role.hod",
  EXAM_CONTROLLER: "role.examController",
  TPO: "role.tpo",
  ACCOUNTS: "role.accounts",
  LIBRARIAN: "role.librarian",
};

export function ctaOf(t: Translate, code: InsightCtaCode, metricCode?: string): InsightCta {
  const spec = INSIGHT_CTAS[code];
  const href = code === "QUALITATIVE" && metricCode ? `${spec.href}#metric-${metricCode.replace(/\./g, "-")}` : spec.href;
  const who = spec.roles.map((r) => t(ROLE_KEY[r] ?? "role.iqac")).join(", ");
  return { code, href, roles: [...spec.roles], label: t("insights.ctaLabel", { page: t(`insights.cta.${code}` as TranslationKey), who }) };
}

/* -------------------------------------------------------------------------- */
/* "What you did last"                                                         */
/* -------------------------------------------------------------------------- */

/** The audit actions that change a fact a CTA's page holds, by prefix. */
const DONE_CTA: readonly (readonly [string, InsightCtaCode])[] = [
  ["iqac.research.", "RESEARCH"],
  ["iqac.activity.", "ACTIVITIES"],
  ["iqac.facultyRecord.", "FACULTY_RECORDS"],
  ["iqac.committee.", "COMMITTEES"],
  ["iqac.meeting.", "COMMITTEES"],
  ["iqac.survey.open", "SURVEYS"],
  ["iqac.survey.close", "SURVEYS"],
  ["iqac.survey.transcribe", "SURVEYS"],
  ["iqac.inputs.", "ENTERED"],
  ["iqac.metric.", "QUALITATIVE"],
  ["iqac.worksheet.", "NBA_WORKSHEET"],
  ["academics.programme.", "ACADEMICS"],
  ["academics.scheme.", "ACADEMICS"],
  ["academics.course.", "ACADEMICS"],
  ["academics.mentoring.group", "ACADEMICS"],
  ["college.admissions.admit", "ADMISSIONS"],
  ["exam.result.publish", "EXAMS"],
  ["placement.offer", "PLACEMENT"],
  ["placement.internship.", "INTERNSHIPS"],
  ["inventory.purchase", "PURCHASES"],
  ["inventory.asset.create", "PURCHASES"],
  ["invite.accept", "PEOPLE"],
];

/**
 * The latest audit rows that changed a fact a CTA's page holds. With `hod` (an HOD reading their department's NBA
 * insights, A3-S-11): only their own department's NBA worksheet saves (targetId `NBA_SAR:<year>:<departmentId>`) and
 * their own actions, never the whole college's log with its actors' names.
 */
async function lastDone(t: Translate, schoolId: string, since: Date | null, take = 6, hod?: { userId: string; departmentId: string }) {
  const done = DONE_CTA.map(([prefix]) => ({ action: { startsWith: prefix } }));
  const where = hod
    ? { schoolId, OR: [{ action: { startsWith: "iqac.worksheet." }, targetId: { startsWith: "NBA_SAR:", endsWith: `:${hod.departmentId}` } }, { actorUserId: hod.userId, OR: done }] }
    : { schoolId, OR: done };
  const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, select: { action: true, createdAt: true, actorUserId: true } });
  const people = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorUserId).filter((x): x is string => !!x))] } }, select: { id: true, name: true } });
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  return rows.map((r) => {
    const key = actionKey(r.action);
    return { action: r.action, label: key ? t(key) : r.action, labelKey: key, at: r.createdAt.toISOString(), by: r.actorUserId ? (nameOf.get(r.actorUserId) ?? null) : null, cta: DONE_CTA.find(([p]) => r.action.startsWith(p))?.[1] ?? null, sinceCompute: since ? r.createdAt > since : false };
  });
}

/* -------------------------------------------------------------------------- */
/* NAAC                                                                        */
/* -------------------------------------------------------------------------- */

type CycleRow = { id: string; schoolId: string; framework: string; institutionType: string; windowFrom: string; windowTo: string; status: string; cgpa: number | null; cgpaComputedAt: Date | null; enteredJson: string };
const CYCLE_SELECT = { id: true, schoolId: true, framework: true, institutionType: true, windowFrom: true, windowTo: true, status: true, cgpa: true, cgpaComputedAt: true, enteredJson: true } as const;

/** The cycle asked for at this college, or the open (else submitted) one; 404 as the predictor says it. */
async function cycleFor(desk: Desk, cycleId?: string | null): Promise<CycleRow> {
  const c = cycleId
    ? await db.accreditationCycle.findFirst({ where: { id: cycleId, schoolId: desk.schoolId }, select: CYCLE_SELECT })
    : await db.accreditationCycle.findFirst({ where: { schoolId: desk.schoolId, status: { in: ["OPEN", "SUBMITTED"] } }, orderBy: { createdAt: "desc" }, select: CYCLE_SELECT });
  if (!c) throw new AccessError("iqac.refuseNoCycle", "NOT_FOUND");
  return c;
}

/**
 * TODAY'S FIGURES: the latest row of every metric — a quantitative row's
 * stored inputs are the facts its formula read at the last recompute, a
 * qualitative row's score is the coordinator's. `computedAt`: the last
 * recompute (the latest quantitative row).
 */
export async function naacBaseline(cycleId: string): Promise<NaacInputs & { computedAt: Date | null; scored: number }> {
  const rows = await db.metricScore.findMany({ where: { cycleId }, orderBy: { computedAt: "asc" }, select: { metricCode: true, kind: true, score: true, evidenceJson: true, computedAt: true } });
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) latest.set(r.metricCode, r);
  const facts: Facts = {};
  const ql: Record<string, number | null> = {};
  let computedAt: Date | null = null;
  for (const r of latest.values()) {
    if (r.kind === "QL") {
      ql[r.metricCode] = r.score;
      continue;
    }
    if (!computedAt || r.computedAt > computedAt) computedAt = r.computedAt;
    try {
      const inputs = (JSON.parse(r.evidenceJson) as { inputs?: { key: string; value: number | null }[] }).inputs ?? [];
      for (const i of inputs) facts[i.key] = i.value;
    } catch {
      /* a row without inputs reads as missing facts: its metric is 0, as the predictor reads it */
    }
  }
  return { facts, ql, computedAt, scored: latest.size };
}

function cycleView(c: CycleRow, fw: NaacFramework, scored: number, grade: (x: number) => string): IqacCycle {
  return { id: c.id, framework: fw.code, institutionType: c.institutionType, windowFrom: c.windowFrom, windowTo: c.windowTo, status: c.status as IqacCycle["status"], cgpa: c.cgpa, grade: c.cgpa === null ? null : grade(c.cgpa), computedAt: c.cgpaComputedAt?.toISOString() ?? null, metricCount: fw.metrics.length, scoredCount: scored };
}

function stepSentence(t: Translate, raw: RawNaacInsight): string {
  if (raw.kind === "QL") {
    const points = f3(raw.nextStep?.points ?? 0);
    return raw.scored ? t("insights.qlScored", { code: raw.code, from: f2(raw.score), points }) : t("insights.qlUnscored", { code: raw.code, points });
  }
  if (raw.missing.length) return t("insights.missing", { code: raw.code, fact: t(`iqac.fact.${raw.missing[0]}` as TranslationKey) });
  const lever = raw.lever ? t(`iqac.fact.${raw.lever}` as TranslationKey) : "";
  if (!raw.nextStep) return t("insights.stepNone", { code: raw.code, lever });
  const vars = { code: raw.code, lever, units: num(raw.nextStep.units), unit: t(`iqac.unit.${raw.unit}` as TranslationKey), from: f2(raw.score), to: f2(raw.nextStep.toScore), points: f3(raw.nextStep.points) };
  return t(raw.nextStep.delta < 0 ? "insights.stepLess" : "insights.stepMore", vars);
}

function naacInsightView(t: Translate, fw: NaacFramework, raw: RawNaacInsight): NaacInsights["ranked"][number] {
  const m = fw.metrics.find((x) => x.code === raw.code)!;
  return {
    code: raw.code,
    ki: raw.ki,
    criterion: raw.criterion,
    kind: raw.kind,
    text: m.text,
    weight: raw.weight,
    value: raw.value,
    score: raw.score,
    scored: raw.scored,
    lever: raw.lever,
    leverLabel: raw.lever ? t(`iqac.fact.${raw.lever}` as TranslationKey) : null,
    leverValue: raw.leverValue,
    unit: t(`iqac.unit.${raw.unit}` as TranslationKey),
    nextStep: raw.nextStep,
    toTop: raw.toTop,
    pointsPerUnit: raw.pointsPerUnit,
    sentence: stepSentence(t, raw),
    missing: raw.missing.map((k) => t(`iqac.fact.${k}` as TranslationKey)),
    cta: ctaOf(t, raw.cta, raw.code),
  };
}

/** The NAAC insights over any figures: the paths to the next band and the one after, the ranked steps, the qualitative ones. */
export function naacInsightsFor(t: Translate, fw: NaacFramework, inputs: NaacInputs): Pick<NaacInsights, "cgpa" | "grade" | "paths" | "ranked" | "qualitative"> {
  const sim = simulateNaac(fw, inputs);
  const raws = naacInsightsOf(fw, inputs);
  const above = [...NAAC_BANDS].reverse().filter((b) => b.min > sim.cgpa).slice(0, 2);
  const paths = above.map((band) => {
    const path = pathToBand(fw, inputs, band.min);
    const distance = round2(band.min - sim.cgpa);
    return {
      grade: band.grade,
      min: band.min,
      distance,
      points: path.points,
      reachable: path.reachable,
      steps: path.steps.map((s) => {
        const vars = { code: s.code, units: num(s.units), unit: t(s.kind === "QL" ? "iqac.unit.step" : (`iqac.unit.${s.unit}` as TranslationKey)), points: f3(s.points) };
        return { code: s.code, delta: s.delta, unit: vars.unit, points: s.points, sentence: t(s.delta < 0 ? "insights.pathStepLess" : "insights.pathStep", vars), cta: ctaOf(t, s.cta, s.code) };
      }),
      sentence: path.reachable ? t("insights.pathReach", { from: sim.grade, to: band.grade, distance: f2(distance), n: path.steps.length }) : t("insights.pathShort", { from: sim.grade, to: band.grade, distance: f2(distance), points: f3(path.points) }),
    };
  });
  return {
    cgpa: sim.cgpa,
    grade: sim.grade,
    paths,
    ranked: raws.filter((r) => r.kind === "QN").map((r) => naacInsightView(t, fw, r)),
    qualitative: raws.filter((r) => r.kind === "QL").map((r) => naacInsightView(t, fw, r)),
  };
}

async function scenarioRow(desk: Desk, scenarioId: string) {
  const s = await db.iqacScenario.findFirst({ where: { id: scenarioId, schoolId: desk.schoolId }, select: { id: true, kind: true, name: true, cycleId: true, year: true, departmentId: true, inputsJson: true, cgpa: true, marks: true, createdByUserId: true, createdAt: true } });
  if (!s) throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  return s;
}
type ScenarioRow = Awaited<ReturnType<typeof scenarioRow>>;

function naacInputsOf(s: ScenarioRow): NaacScenarioInputs {
  const parsed = naacScenarioInputsSchema.safeParse(JSON.parse(s.inputsJson || "{}"));
  return parsed.success ? parsed.data : { facts: {}, ql: {}, nirf: null };
}
function nbaInputsOf(s: ScenarioRow): NbaInputs {
  const parsed = nbaInputsSchema.safeParse(JSON.parse(s.inputsJson || "{}"));
  if (!parsed.success) throw new RuleRefusal("insights.refuseScenarioInputs", 422);
  return parsed.data;
}

/** GET /api/v1/iqac/insights?cycleId=&scenarioId= */
export async function naacInsights(ctx: ActiveContext, query: { cycleId?: string; scenarioId?: string }): Promise<NaacInsights> {
  const desk = await iqacActor(ctx, DESK);
  const t = await getT();
  const scenario = query.scenarioId ? await scenarioRow(desk, query.scenarioId) : null;
  if (scenario && scenario.kind !== "NAAC") throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  const cycle = await cycleFor(desk, scenario?.cycleId ?? query.cycleId);
  const fw = frameworkOf(cycle.framework);
  const base = await naacBaseline(cycle.id);
  const inputs = scenario ? naacInputsOf(scenario) : base;
  return {
    cycle: cycleView(cycle, fw, base.scored, gradeOf),
    scenarioId: scenario?.id ?? null,
    scenarioName: scenario?.name ?? null,
    ...naacInsightsFor(t, fw, inputs),
    lastDone: await lastDone(t, desk.schoolId, base.computedAt),
    computedAt: base.computedAt?.toISOString() ?? null,
    notAScore: t("insights.notAScore"),
    // Provisional until the coordinator signs the benchmark list (G4-15).
    benchmarks: await benchmarkStatus(desk.schoolId),
  };
}

/* -------------------------------------------------------------------------- */
/* NBA                                                                         */
/* -------------------------------------------------------------------------- */

const NBA_READERS: readonly Role[] = [...DESK, "HOD"];

async function nbaContext(ctx: ActiveContext, query: { year?: number; departmentId?: string }, roles: readonly Role[] = NBA_READERS) {
  const desk = await iqacActor(ctx, roles);
  await assertFilingApplies(desk.schoolId, "NBA_SAR");
  const dept = await nbaDepartmentFor(desk, query.departmentId ?? null);
  // The latest year the department has a report, else the filing default (A3-journeys-34).
  const year = query.year ?? (await councilDefaultYear(desk.schoolId, "NBA_SAR", dept.id));
  return { desk, dept, year };
}

/** Today's SAR figures for a department and year: nbaFacts' as the rows stand, and the worksheet's self-assessed marks. */
export async function nbaBaseline(schoolId: string, departmentId: string, year: number): Promise<NbaInputs> {
  const [f, sheet] = await Promise.all([nbaFacts(schoolId, departmentId, year), readWorksheet(schoolId, "NBA_SAR", year, departmentId)]);
  const self: Record<string, number> = {};
  for (const item of NBA_SAR_ITEMS) if (!item.computed && typeof sheet.items[item.code]?.score === "number") self[item.code] = sheet.items[item.code]!.score!;
  return { ...f.sarFigures, self };
}

const NBA_TEXT = Object.fromEntries(NBA_SAR_ITEMS.map((i) => [i.code, i.text])) as Record<string, string>;

function nbaInsightView(t: Translate, raw: RawNbaInsight): NbaInsights["ranked"][number] {
  const lever = raw.lever ? t(`insights.nbaLever.${raw.lever}` as TranslationKey) : null;
  const unit = t(`insights.unit.${raw.unit}` as TranslationKey);
  let sentence: string;
  if (!raw.computed) sentence = raw.leverValue === null ? t("insights.nbaSelfUnwritten", { code: raw.code, max: raw.max }) : t("insights.nbaSelfWritten", { code: raw.code, marks: num(raw.marks), max: raw.max, left: num(raw.max - raw.marks) });
  else if (raw.leverValue === null) sentence = t("insights.nbaNoFigure", { code: raw.code, lever: lever ?? "" });
  else if (!raw.nextStep) sentence = t("insights.nbaNoStep", { code: raw.code, lever: lever ?? "" });
  else sentence = t("insights.nbaStep", { code: raw.code, lever: lever ?? "", units: num(raw.nextStep.units), unit, from: num(raw.marks), to: num(raw.nextStep.toScore), max: raw.max });
  return {
    code: raw.code,
    criterion: raw.criterion,
    text: NBA_TEXT[raw.code] ?? raw.code,
    max: raw.max,
    marks: raw.marks,
    computed: raw.computed,
    figure: raw.computed ? raw.leverValue : null,
    lever: raw.lever,
    leverLabel: lever,
    leverValue: raw.leverValue,
    unit,
    nextStep: raw.nextStep,
    toTop: raw.toTop,
    pointsPerUnit: raw.efficiency,
    sentence,
    cta: ctaOf(t, raw.cta),
  };
}

/** GET /api/v1/iqac/insights/nba?year=&departmentId=&scenarioId= */
export async function nbaInsights(ctx: ActiveContext, query: { year?: number; departmentId?: string; scenarioId?: string }): Promise<NbaInsights> {
  const t = await getT();
  const desk0 = await iqacActor(ctx, NBA_READERS);
  const scenario = query.scenarioId ? await readableScenario(desk0, query.scenarioId) : null;
  if (scenario && scenario.kind !== "NBA") throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  const { desk, dept, year } = await nbaContext(ctx, scenario ? { year: scenario.year ?? undefined, departmentId: scenario.departmentId ?? undefined } : query);
  const inputs = scenario ? nbaInputsOf(scenario) : await nbaBaseline(desk.schoolId, dept.id, year);
  const totals = nbaTotals(inputs);
  const raws = nbaInsightsOf(inputs);
  const departments = desk.role === "HOD" ? [dept] : await nbaDepartments(desk.schoolId);
  const filing = await db.collegeFiling.findFirst({ where: { schoolId: desk.schoolId, kind: "NBA_SAR", year, departmentId: dept.id }, orderBy: { generatedAt: "desc" }, select: { generatedAt: true } });
  return {
    year,
    departmentId: dept.id,
    departmentName: dept.name,
    departments,
    scenarioId: scenario?.id ?? null,
    scenarioName: scenario?.name ?? null,
    computed: totals.computed,
    self: totals.self,
    total: totals.total,
    max: totals.max,
    ranked: raws.filter((r) => r.computed).map((r) => nbaInsightView(t, r)),
    selfAssess: raws.filter((r) => !r.computed).map((r) => nbaInsightView(t, r)),
    lastDone: await lastDone(t, desk.schoolId, filing?.generatedAt ?? null, 6, desk.role === "HOD" ? { userId: desk.userId, departmentId: dept.id } : undefined),
    notAScore: t("insights.notAScore"),
  };
}

/* -------------------------------------------------------------------------- */
/* NIRF                                                                        */
/* -------------------------------------------------------------------------- */

/** The figures NIRF's published formulas read: over the open cycle's window, else the NIRF filing's three years. */
export async function nirfBaseline(schoolId: string): Promise<{ inputs: NirfInputs; windowFrom: string; windowTo: string; cycleId: string | null }> {
  const cycle = await db.accreditationCycle.findFirst({ where: { schoolId, status: { in: ["OPEN", "SUBMITTED"] } }, orderBy: { createdAt: "desc" }, select: { id: true, windowFrom: true, windowTo: true, enteredJson: true } });
  const y = defaultFilingYear();
  const windowFrom = cycle?.windowFrom ?? `${y - 2}-06-01`;
  const windowTo = cycle?.windowTo ?? windowOf(y).to;
  const gathered = await gatherFacts(schoolId, windowFrom, windowTo, readEntered(cycle?.enteredJson));
  const nf = await nirfFacts(schoolId, gathered);
  return { inputs: nf, windowFrom, windowTo, cycleId: cycle?.id ?? null };
}

function nirfInsightView(t: Translate, raw: RawNirfInsight): NirfInsights["ranked"][number] {
  const lever = raw.lever ? t(`insights.nirfLever.${raw.lever}` as TranslationKey) : null;
  const unit = t(`insights.unit.${raw.unit}` as TranslationKey);
  let sentence: string;
  if (raw.marks === null) sentence = t(raw.published ? "insights.nirfNotHeld" : "insights.nirfUnpublished", { code: raw.code });
  else if (!raw.nextStep) sentence = t("insights.nirfNoStep", { code: raw.code });
  else sentence = t("insights.nirfStep", { code: raw.code, lever: lever ?? "", units: num(raw.nextStep.units), unit, from: f2(raw.marks), to: f2(raw.nextStep.toScore), max: raw.max, points: f2(raw.nextStep.points) });
  return { code: raw.code, parameter: raw.parameter, max: raw.max, marks: raw.marks, published: raw.published, lever: raw.lever, leverLabel: lever, leverValue: raw.leverValue, unit, nextStep: raw.nextStep, toTop: raw.toTop, pointsPerUnit: raw.efficiency, sentence, cta: ctaOf(t, raw.cta) };
}

/** GET /api/v1/iqac/insights/nirf */
export async function nirfInsights(ctx: ActiveContext): Promise<NirfInsights> {
  const desk = await iqacActor(ctx, DESK);
  await assertFilingApplies(desk.schoolId, "NIRF");
  const t = await getT();
  const base = await nirfBaseline(desk.schoolId);
  const s = nirfScore(base.inputs);
  const bandLabel = (code: (typeof NIRF_BANDS)[number]["code"]) => t(`insights.nirfBand.${code}` as TranslationKey);
  return {
    windowFrom: base.windowFrom,
    windowTo: base.windowTo,
    cycleId: base.cycleId,
    inputs: base.inputs,
    partial: s.partial,
    coveredMarks: s.coveredMarks,
    projected: s.projected,
    band: s.band ? { code: s.band.code, label: bandLabel(s.band.code), min: s.band.min } : null,
    nextBand: s.nextBand ? { code: s.nextBand.code, label: bandLabel(s.nextBand.code), min: s.nextBand.min, distance: s.nextBand.distance } : null,
    parameters: s.parameters,
    ranked: nirfInsightsOf(base.inputs).map((r) => nirfInsightView(t, r)),
    notAScore: t("insights.notAScore"),
    benchmarks: await benchmarkStatus(desk.schoolId),
  };
}

/* -------------------------------------------------------------------------- */
/* Scenarios                                                                   */
/* -------------------------------------------------------------------------- */

/** Every fact a framework's formulas read, so a scenario names no fact the simulator does not show. */
function factKeysOf(fw: NaacFramework): Set<string> {
  return new Set(fw.metrics.flatMap((m) => (m.kind === "QN" && m.formula ? [...FORMULAS[m.formula].inputs] : [])));
}

/** Who may save or remove this kind of scenario: the IQAC and the principal; for NBA, the HOD (their own department) too. */
function mayWrite(role: Role, kind: string): boolean {
  return WRITERS.includes(role) || (kind === "NBA" && role === "HOD");
}

/** Every department an HOD heads (TA-480: one person may head two); empty for anyone else. */
const hodDepartments = (desk: Desk): Promise<string[]> => headsOf(desk);

/** A scenario's result recomputed now with today's formulas: the CGPA for NAAC, the SAR's total for NBA. */
function resultOf(s: ScenarioRow, fwOf: (cycleId: string) => NaacFramework | null): { result: number; grade: string | null } {
  if (s.kind === "NBA") return { result: nbaTotals(nbaInputsOf(s)).total, grade: null };
  const fw = s.cycleId ? fwOf(s.cycleId) : null;
  if (!fw) return { result: s.cgpa ?? 0, grade: null };
  const sim = simulateNaac(fw, naacInputsOf(s));
  return { result: sim.cgpa, grade: sim.grade };
}

async function scenarioViews(desk: Desk, rows: ScenarioRow[]): Promise<Scenario[]> {
  const cycles = await db.accreditationCycle.findMany({ where: { schoolId: desk.schoolId, id: { in: [...new Set(rows.map((r) => r.cycleId).filter((x): x is string => !!x))] } }, select: { id: true, framework: true } });
  const fwById = new Map(cycles.map((c) => [c.id, frameworkOf(c.framework)]));
  const today = new Map<string, number>();
  for (const c of cycles) today.set(`NAAC:${c.id}`, simulateNaac(fwById.get(c.id)!, await naacBaseline(c.id)).cgpa);
  for (const key of new Set(rows.filter((r) => r.kind === "NBA" && r.departmentId && r.year).map((r) => `NBA:${r.departmentId}:${r.year}`))) {
    const [, dept, year] = key.split(":");
    try {
      today.set(key, nbaTotals(await nbaBaseline(desk.schoolId, dept!, Number(year))).total);
    } catch (error) {
      if (!(error instanceof RuleRefusal) && !(error instanceof AccessError)) throw error;
    }
  }
  const people = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.createdByUserId).filter((x): x is string => !!x))] } }, select: { id: true, name: true } });
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const own = await hodDepartments(desk);
  return rows.map((s) => {
    const { result, grade } = resultOf(s, (id) => fwById.get(id) ?? null);
    const base = today.get(s.kind === "NBA" ? `NBA:${s.departmentId}:${s.year}` : `NAAC:${s.cycleId}`) ?? result;
    return {
      id: s.id,
      kind: s.kind as Scenario["kind"],
      name: s.name,
      cycleId: s.cycleId,
      year: s.year,
      departmentId: s.departmentId,
      by: s.createdByUserId ? (nameOf.get(s.createdByUserId) ?? "") : "",
      at: s.createdAt.toISOString(),
      result,
      savedResult: (s.kind === "NBA" ? s.marks : s.cgpa) ?? result,
      grade,
      today: base,
      delta: round2(result - base),
      canRemove: mayWrite(desk.role, s.kind) && (desk.role !== "HOD" || (!!s.departmentId && own.includes(s.departmentId))),
    };
  });
}

const SCENARIO_SELECT = { id: true, kind: true, name: true, cycleId: true, year: true, departmentId: true, inputsJson: true, cgpa: true, marks: true, createdByUserId: true, createdAt: true } as const;

/** GET /api/v1/iqac/scenarios — the desk's scenarios (filtered), an HOD their own department's NBA ones. */
export async function listScenarios(ctx: ActiveContext, query: { kind?: "NAAC" | "NBA"; cycleId?: string; year?: number; departmentId?: string }): Promise<Scenarios> {
  const desk = await iqacActor(ctx, NBA_READERS);
  const own = await hodDepartments(desk);
  const where =
    desk.role === "HOD"
      ? { schoolId: desk.schoolId, kind: "NBA", departmentId: { in: own }, ...(query.year ? { year: query.year } : {}) }
      : { schoolId: desk.schoolId, ...(query.kind ? { kind: query.kind } : {}), ...(query.cycleId ? { cycleId: query.cycleId } : {}), ...(query.year ? { year: query.year } : {}), ...(query.departmentId ? { departmentId: query.departmentId } : {}) };
  const rows = await db.iqacScenario.findMany({ where, orderBy: { createdAt: "desc" }, take: MAX_SCENARIOS, select: SCENARIO_SELECT });
  return { items: await scenarioViews(desk, rows), canWrite: WRITERS.includes(desk.role) || (desk.role === "HOD" && own.length > 0) };
}

/**
 * POST /api/v1/iqac/scenarios — THE ONE WRITER of IqacScenario.cgpa and
 * .marks: the result is recomputed here from the inputs, never taken from the
 * caller. A NAAC scenario names facts the framework's formulas read and the
 * framework's qualitative metrics; an NBA one the SAR's self-assessed items,
 * each within its marks.
 */
export async function saveScenario(ctx: ActiveContext, input: ScenarioSave): Promise<Scenarios> {
  const desk = await iqacActor(ctx, input.kind === "NBA" ? [...WRITERS, "HOD"] : WRITERS);
  const saved = await writeScenario(desk, input);
  return listScenarios(ctx, saved.kind === "NBA" ? { kind: "NBA", year: saved.year ?? undefined, departmentId: saved.departmentId ?? undefined } : { kind: "NAAC", cycleId: saved.cycleId ?? undefined });
}

/** The write itself, for a desk already checked (the door above) or the fixture's own IQAC (zz-iqac.ts, with a fixed id). */
export async function writeScenario(desk: Desk, input: ScenarioSave, id?: string): Promise<{ id: string; kind: string; cycleId: string | null; year: number | null; departmentId: string | null; result: number }> {
  let data: { kind: string; cycleId: string | null; year: number | null; departmentId: string | null; inputsJson: string; cgpa: number | null; marks: number | null; result: number };
  if (input.kind === "NAAC") {
    const cycle = await cycleFor(desk, input.cycleId);
    if (cycle.status === "CLOSED") throw new RuleRefusal("iqac.refuseClosedCycle", 409);
    const fw = frameworkOf(cycle.framework);
    const known = factKeysOf(fw);
    const qlCodes = new Set(fw.metrics.filter((m) => m.kind === "QL").map((m) => m.code));
    if (Object.keys(input.inputs.facts).some((k) => !known.has(k))) throw new RuleRefusal("insights.refuseUnknownFact", 422, undefined, "inputs");
    if (Object.keys(input.inputs.ql).some((k) => !qlCodes.has(k))) throw new RuleRefusal("insights.refuseUnknownMetric", 422, undefined, "inputs");
    // A part above its whole is refused, not stored (A3-journeys-13): 50 passed of 3 appeared.
    const read = new Map(fw.metrics.filter((m) => m.formula).map((m) => [m.formula as string, m.code]));
    const naacOver = partsOver(NAAC_WHOLES.filter((w) => read.has(w.metric)), input.inputs.facts)[0];
    if (naacOver) throw await partsRefusal(naacOver, read.get(naacOver.metric)!, (k) => `iqac.fact.${k}`);
    const nirfOver = input.inputs.nirf ? partsOver(NIRF_PART_WHOLES, input.inputs.nirf)[0] : undefined;
    if (nirfOver) throw await partsRefusal(nirfOver, nirfOver.metric, (k) => `insights.nirfLever.${k}`);
    const cgpa = simulateNaac(fw, input.inputs).cgpa;
    data = { kind: "NAAC", cycleId: cycle.id, year: null, departmentId: null, inputsJson: JSON.stringify(input.inputs), cgpa, marks: null, result: cgpa };
  } else {
    await assertFilingApplies(desk.schoolId, "NBA_SAR");
    const dept = await nbaDepartmentFor(desk, input.departmentId);
    for (const [code, v] of Object.entries(input.inputs.self)) {
      const item = NBA_SAR_ITEMS.find((i) => i.code === code);
      if (!item || item.computed || v > item.marks) throw new RuleRefusal("councilFilings.refuseScore", 422, undefined, "inputs");
    }
    const nbaOver = partsOver(NBA_PART_WHOLES, input.inputs)[0];
    if (nbaOver) throw await partsRefusal(nbaOver, nbaOver.metric, (k) => `insights.nbaLever.${k}`);
    // The SAR's year within the years the department's programmes have run (R-47): 1900 is no year a SAR is for.
    const range = await nbaYearRange(desk.schoolId, dept.id);
    if (input.year < range.from || input.year > range.to) throw new RuleRefusal("riskDecisions.refuseScenarioYear", 422, { from: range.from, to: range.to }, "year");
    const marks = nbaTotals(input.inputs).total;
    data = { kind: "NBA", cycleId: null, year: input.year, departmentId: dept.id, inputsJson: JSON.stringify(input.inputs), cgpa: null, marks, result: marks };
  }
  const { result, ...row } = data;
  // THE CAP IS ONE STEP WITH THE WRITE (A3-S-7, 5 Oct 2026): counted and inserted under the college's own lock, so
  // two saves at the hundredth row cannot both pass a count taken before either wrote.
  const created = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // Upper case: SQL does not mind, and the i18n audit does not read a query as a sentence.
    await tx.$queryRaw`SELECT 1 FROM PG_ADVISORY_XACT_LOCK(HASHTEXT(${`iqac-scenarios:${desk.schoolId}`}))`;
    const count = await tx.iqacScenario.count({ where: { schoolId: desk.schoolId } });
    if (count >= MAX_SCENARIOS) throw new RuleRefusal("insights.refuseTooMany", 409, { max: MAX_SCENARIOS });
    // The per-author and the HOD's per-department ceilings (R-47), counted under the same lock as the college's.
    if ((await tx.iqacScenario.count({ where: { schoolId: desk.schoolId, createdByUserId: desk.userId } })) >= MAX_SCENARIOS_PER_AUTHOR) throw new RuleRefusal("riskDecisions.refuseScenarioAuthor", 409, { max: MAX_SCENARIOS_PER_AUTHOR });
    if (desk.role === "HOD" && data.departmentId && (await tx.iqacScenario.count({ where: { schoolId: desk.schoolId, departmentId: data.departmentId } })) >= MAX_SCENARIOS_PER_DEPARTMENT) throw new RuleRefusal("riskDecisions.refuseScenarioDepartment", 409, { max: MAX_SCENARIOS_PER_DEPARTMENT });
    return tx.iqacScenario.create({ data: { ...(id ? { id } : {}), schoolId: desk.schoolId, name: input.name, createdByUserId: desk.userId, ...row }, select: { id: true } });
  });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.scenario.save", targetType: "IqacScenario", targetId: created.id, meta: { kind: data.kind, name: input.name, result, cycleId: data.cycleId, year: data.year, departmentId: data.departmentId } });
  return { id: created.id, kind: data.kind, cycleId: data.cycleId, year: data.year, departmentId: data.departmentId, result };
}

/**
 * The years an NBA scenario may be for (R-47): from the department's first — the earliest entry year of a student on
 * one of its programmes; with no student yet, one programme length back — to the academic year running now (a SAR
 * is for a year that has begun).
 */
export async function nbaYearRange(schoolId: string, departmentId: string): Promise<{ from: number; to: number }> {
  const to = defaultFilingYear() + 1;
  const programmes = await db.programme.findMany({ where: { schoolId, departmentId }, select: { id: true, durationYears: true } });
  const earliest = programmes.length ? await db.studentProgramme.findFirst({ where: { schoolId, programmeId: { in: programmes.map((p) => p.id) } }, orderBy: { entryYear: "asc" }, select: { entryYear: true } }) : null;
  const longest = Math.max(1, ...programmes.map((p) => p.durationYears));
  return { from: Math.min(earliest?.entryYear ?? to - longest + 1, to), to };
}

/** The refusal for a part above its whole, its figures named in the reader's language: "Students who passed cannot be more than students who appeared (2.6.3)." */
async function partsRefusal(w: { metric: string; parts: readonly string[]; of: string | number }, metric: string, key: (fact: string) => string): Promise<RuleRefusal> {
  const t = await getT();
  const label = (k: string) => t(key(k) as TranslationKey);
  return new RuleRefusal("insights.refusePartsOverWhole", 422, { parts: w.parts.map(label).join(" + "), whole: typeof w.of === "number" ? String(w.of) : label(w.of), metric }, "inputs");
}

/** DELETE /api/v1/iqac/scenarios/{id} — the IQAC or the principal any; an HOD their department's NBA ones (404 for another's). */
export async function removeScenario(ctx: ActiveContext, scenarioId: string): Promise<Scenarios> {
  const desk = await iqacActor(ctx, [...WRITERS, "HOD"]);
  const s = await scenarioRow(desk, scenarioId);
  if (desk.role === "HOD" && (s.kind !== "NBA" || !s.departmentId || !(await hodDepartments(desk)).includes(s.departmentId))) throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  await db.iqacScenario.deleteMany({ where: { id: s.id, schoolId: desk.schoolId } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.scenario.remove", targetType: "IqacScenario", targetId: s.id, meta: { kind: s.kind, name: s.name } });
  return listScenarios(ctx, s.kind === "NBA" ? { kind: "NBA" } : { kind: "NAAC", cycleId: s.cycleId ?? undefined });
}

/** A scenario an HOD may read: their own department's NBA one; anything else of the college reads 404 to them. */
async function readableScenario(desk: Desk, scenarioId: string): Promise<ScenarioRow> {
  const s = await scenarioRow(desk, scenarioId);
  if (desk.role === "HOD" && (s.kind !== "NBA" || !s.departmentId || !(await hodDepartments(desk)).includes(s.departmentId))) throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  return s;
}

/** GET /api/v1/iqac/scenarios/compare?a=&b= — two scenarios of one kind, every input that differs and every score, b − a. */
export async function compareScenarios(ctx: ActiveContext, aId: string, bId: string): Promise<ScenarioCompare> {
  const desk = await iqacActor(ctx, NBA_READERS);
  const t = await getT();
  const [a, b] = [await readableScenario(desk, aId), await readableScenario(desk, bId)];
  if (a.kind !== b.kind) throw new RuleRefusal("insights.refuseCompareKinds", 422, undefined, "b");
  const [va, vb] = await scenarioViews(desk, [a, b]);
  const d = (x: number | null, y: number | null) => (x === null || y === null ? null : round2(y - x));
  if (a.kind === "NBA") {
    const ia = nbaInputsOf(a);
    const ib = nbaInputsOf(b);
    const keys = Object.keys(NBA_LEVERS_LABEL) as (keyof typeof NBA_LEVERS_LABEL)[];
    const inputs: ScenarioCompare["inputs"] = keys.filter((k) => ia[k] !== ib[k]).map((k) => ({ key: k as string, label: t(`insights.nbaLever.${k}` as TranslationKey), a: ia[k], b: ib[k], delta: d(ia[k], ib[k]) }));
    for (const item of NBA_SAR_ITEMS.filter((i) => !i.computed)) {
      const x = ia.self[item.code] ?? null;
      const y = ib.self[item.code] ?? null;
      if (x !== y) inputs.push({ key: `self:${item.code}`, label: item.code + " " + item.text, a: x, b: y, delta: d(x, y) });
    }
    const ma = nbaTotals(ia).marks;
    const mb = nbaTotals(ib).marks;
    const scores = (Object.keys(ma) as (keyof typeof ma)[]).map((code) => ({ code, label: NBA_TEXT[code] ?? code, a: ma[code], b: mb[code], delta: round2(mb[code] - ma[code]) }));
    return { kind: "NBA", a: va!, b: vb!, inputs, scores, result: { a: va!.result, b: vb!.result, delta: round2(vb!.result - va!.result) } };
  }
  const cycle = await cycleFor(desk, a.cycleId);
  const fw = frameworkOf(cycle.framework);
  const ia = naacInputsOf(a);
  const ib = naacInputsOf(b);
  const factKeys = [...new Set([...Object.keys(ia.facts), ...Object.keys(ib.facts)])].sort();
  const inputs = factKeys.filter((k) => (ia.facts[k] ?? null) !== (ib.facts[k] ?? null)).map((k) => ({ key: k, label: t(`iqac.fact.${k}` as TranslationKey), a: ia.facts[k] ?? null, b: ib.facts[k] ?? null, delta: d(ia.facts[k] ?? null, ib.facts[k] ?? null) }));
  for (const m of fw.metrics.filter((x) => x.kind === "QL")) {
    const x = ia.ql[m.code] ?? null;
    const y = ib.ql[m.code] ?? null;
    if (x !== y) inputs.push({ key: `ql:${m.code}`, label: m.code, a: x, b: y, delta: d(x, y) });
  }
  const sa = simulateNaac(fw, ia).scores;
  const sb = simulateNaac(fw, ib).scores;
  const scores = fw.metrics.filter((m) => (sa.get(m.code) ?? 0) !== (sb.get(m.code) ?? 0)).map((m) => ({ code: m.code, label: m.text, a: sa.get(m.code) ?? 0, b: sb.get(m.code) ?? 0, delta: round2((sb.get(m.code) ?? 0) - (sa.get(m.code) ?? 0)) }));
  return { kind: "NAAC", a: va!, b: vb!, inputs, scores, result: { a: va!.result, b: vb!.result, delta: round2(vb!.result - va!.result) } };
}

/** The numeric figures of an NBA scenario, in the form's order (the compare and the simulator's labels). */
export const NBA_LEVERS_LABEL = {
  S: true,
  F: true,
  intake: true,
  admitted: true,
  successNoBacklog: true,
  successStipulated: true,
  apiFirst: true,
  apiSecond: true,
  apiThird: true,
  placement: true,
  professors: true,
  associates: true,
  assistants: true,
  phd: true,
  masters: true,
  firstYearStudents: true,
  firstYearFaculty: true,
} as const satisfies Record<Exclude<keyof NbaInputs, "self">, true>;

/* -------------------------------------------------------------------------- */
/* The server's simulator                                                      */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/iqac/simulate?cycleId=&scenarioId= — today's figures (or a scenario's) recomputed with the same functions the page ships. */
export async function simulateNaacDoor(ctx: ActiveContext, query: { cycleId?: string; scenarioId?: string }): Promise<NaacSimulation> {
  const desk = await iqacActor(ctx, DESK);
  const t = await getT();
  const scenario = query.scenarioId ? await scenarioRow(desk, query.scenarioId) : null;
  if (scenario && scenario.kind !== "NAAC") throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  const cycle = await cycleFor(desk, scenario?.cycleId ?? query.cycleId);
  const fw = frameworkOf(cycle.framework);
  const inputs: NaacScenarioInputs = scenario ? naacInputsOf(scenario) : { ...(await naacBaseline(cycle.id)), nirf: (await nirfBaseline(desk.schoolId)).inputs };
  const sim = simulateNaac(fw, inputs);
  const nirf = inputs.nirf ? nirfScore(inputs.nirf) : null;
  return {
    cycleId: cycle.id,
    framework: fw.code,
    scenarioId: scenario?.id ?? null,
    inputs: { facts: inputs.facts, ql: inputs.ql, nirf: inputs.nirf },
    cgpa: sim.cgpa,
    grade: sim.grade,
    nextBand: sim.nextBand,
    criteria: sim.criteria,
    metrics: fw.metrics.map((m) => ({ code: m.code, kind: m.kind, value: sim.values.get(m.code) ?? null, score: sim.scores.get(m.code) ?? 0 })),
    nirf: nirf ? { partial: nirf.partial, coveredMarks: nirf.coveredMarks, projected: nirf.projected, subs: nirf.subs } : null,
    notAScore: t("insights.notAScore"),
    benchmarks: await benchmarkStatus(desk.schoolId),
  };
}

/** GET /api/v1/iqac/simulate/nba?year=&departmentId=&scenarioId= */
export async function simulateNbaDoor(ctx: ActiveContext, query: { year?: number; departmentId?: string; scenarioId?: string }): Promise<NbaSimulation> {
  const t = await getT();
  const desk0 = await iqacActor(ctx, NBA_READERS);
  const scenario = query.scenarioId ? await readableScenario(desk0, query.scenarioId) : null;
  if (scenario && scenario.kind !== "NBA") throw new AccessError("insights.refuseNoScenario", "NOT_FOUND");
  const { desk, dept, year } = await nbaContext(ctx, scenario ? { year: scenario.year ?? undefined, departmentId: scenario.departmentId ?? undefined } : query);
  const inputs = scenario ? nbaInputsOf(scenario) : await nbaBaseline(desk.schoolId, dept.id, year);
  const totals = nbaTotals(inputs);
  return { year, departmentId: dept.id, scenarioId: scenario?.id ?? null, inputs, marks: totals.marks, computed: totals.computed, self: totals.self, total: totals.total, max: totals.max, notAScore: t("insights.notAScore") };
}
