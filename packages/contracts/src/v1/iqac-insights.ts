import { z } from "zod";
import { NAAC_METRIC_KINDS } from "./naac";
import { iqacCycleSchema } from "./iqac";
import { roleSchema } from "./auth";

/**
 * ACTIONABLE INSIGHTS AND THE SIMULATOR (5 October 2026, module IQAC).
 *
 * WHAT THIS IS. For every accreditation the college faces — NAAC (the
 * affiliated or the autonomous framework), an engineering department's NBA
 * SAR, NIRF — the engine (apps/web/src/lib/accreditation-insights.ts) reads
 * the same pure functions the predictor and the SAR read (iqac-rules.ts,
 * council-rules.ts) and says, metric by metric, how far the college is from
 * the next step of the metric's scale, what that step adds, what it costs in
 * the metric's own unit (two more teachers with a PhD, twelve more survey
 * answers, three more students placed) and where the change is made and by
 * whom (a call to action). The simulator lets the IQAC change the figures and
 * see the grade, from the same functions shipped to the browser; scenarios
 * are saved, compared, and turned back into insights.
 *
 * NEVER A PROMISE. The platform does not score for NAAC, NBA or NIRF: every
 * reading is the platform's against its own benchmarks, and every response
 * carries the sentence that says so (`notAScore`).
 */

export const INSIGHT_KINDS = ["NAAC", "NBA", "NIRF"] as const;
export const insightKindSchema = z.enum(INSIGHT_KINDS);
export type InsightKind = z.infer<typeof insightKindSchema>;

/**
 * WHERE A CHANGE IS MADE, AND BY WHOM: a call to action's code, the web page
 * (the phone opens it in the browser, as the college desks do) and the roles
 * that do it there. One list, so the web, the phone and the test read the same
 * routes; a test holds that every `href` is a page of the web app.
 */
export const INSIGHT_CTAS = {
  FACULTY_RECORDS: { href: "/admin/faculty-records", roles: ["ADMIN"] },
  PEOPLE: { href: "/admin/people", roles: ["ADMIN"] },
  RESEARCH: { href: "/iqac/registers", roles: ["IQAC"] },
  ACTIVITIES: { href: "/iqac/registers", roles: ["IQAC"] },
  SURVEYS: { href: "/iqac/surveys", roles: ["IQAC"] },
  COMMITTEES: { href: "/admin/committees", roles: ["ADMIN"] },
  GRIEVANCES: { href: "/iqac/grievances", roles: ["ADMIN", "PRINCIPAL"] },
  ENTERED: { href: "/iqac/predictor#entered", roles: ["IQAC"] },
  QUALITATIVE: { href: "/iqac/predictor", roles: ["IQAC"] },
  ACADEMICS: { href: "/admin/academics", roles: ["ADMIN"] },
  ADMISSIONS: { href: "/admin/college-admissions", roles: ["ADMIN"] },
  EXAMS: { href: "/exam-cell", roles: ["EXAM_CONTROLLER"] },
  PLACEMENT: { href: "/placement", roles: ["TPO"] },
  INTERNSHIPS: { href: "/placement/internships", roles: ["TPO"] },
  SCHOLARSHIPS: { href: "/accounts/scholarships", roles: ["ACCOUNTS"] },
  PURCHASES: { href: "/admin/inventory/purchases", roles: ["ADMIN"] },
  LIBRARY: { href: "/library", roles: ["LIBRARIAN"] },
  MODULES: { href: "/admin/settings/modules", roles: ["ADMIN"] },
  NBA_WORKSHEET: { href: "/hod/nba", roles: ["HOD"] },
  DOCUMENTS: { href: "/iqac/documents", roles: ["IQAC"] },
} as const satisfies Record<string, { href: string; roles: readonly z.infer<typeof roleSchema>[] }>;
export type InsightCtaCode = keyof typeof INSIGHT_CTAS;
export const INSIGHT_CTA_CODES = Object.keys(INSIGHT_CTAS) as [InsightCtaCode, ...InsightCtaCode[]];
export const insightCtaCodeSchema = z.enum(INSIGHT_CTA_CODES);

/**
 * One of our own web paths, which the phone opens on the API's host: a single leading slash, no backslash, no space or
 * control character (A3-S-14, audit of 5 Oct 2026) — "@evil.example/x" or "//host" would move the host. The phone's
 * openWeb reads this same pattern (apps/mobile/src/lib/links.ts webPathUrl).
 */
export const WEB_PATH_PATTERN = /^\/(?!\/)[^\\\s\u0000-\u001f\u007f]*$/;
/** A call to action as a response carries it: `label` is a sentence in the reader's language ("Faculty records — the office"). */
export const insightCtaSchema = z.object({ code: insightCtaCodeSchema, href: z.string().regex(WEB_PATH_PATTERN), roles: z.array(roleSchema), label: z.string() });
export type InsightCta = z.infer<typeof insightCtaSchema>;

/**
 * A step a metric can take: `units` — how many of the lever's unit (`unit`
 * on the insight: teachers, papers, percentage points, tenths of a point) —
 * and `delta`, the lever's figure's change (positive is more; a "fewer is
 * better" lever is negative: −3 days; a share's percentage points), the metric's value
 * and 0–4 score after it, and what it adds — CGPA points for NAAC, marks for
 * the NBA SAR, score points (marks × the parameter's weight) for NIRF.
 */
export const insightStepSchema = z.object({ units: z.number(), delta: z.number(), toValue: z.number().nullable(), toScore: z.number(), points: z.number() });
export type InsightStep = z.infer<typeof insightStepSchema>;

/** Something done since the last compute through a CTA's page, from the audit log ("what you did last"). */
/** `labelKey`: the dictionary key of the action's words (null when there is none), so the phone says it in its own language (A3-states-16). */
export const insightDoneSchema = z.object({ action: z.string(), label: z.string(), labelKey: z.string().nullable().default(null), at: z.string().datetime(), by: z.string().nullable(), cta: insightCtaCodeSchema.nullable(), sinceCompute: z.boolean() });

/* -------------------------------------------------------------------------- */
/* NAAC                                                                        */
/* -------------------------------------------------------------------------- */

export const naacInsightSchema = z.object({
  code: z.string(),
  ki: z.string(),
  criterion: z.string(),
  kind: z.enum(NAAC_METRIC_KINDS),
  text: z.string(),
  weight: z.number(),
  value: z.number().nullable(),
  /** 0–4 as the predictor reads it; 0 for an unscored metric. */
  score: z.number(),
  scored: z.boolean(),
  /** The fact the college moves (a QN metric's lever), its label and value today; null for a QL metric. */
  lever: z.string().nullable(),
  leverLabel: z.string().nullable(),
  leverValue: z.number().nullable(),
  /** The lever's unit in the reader's language ("teacher", "lakh", "day"); "step" for a QL metric. */
  unit: z.string(),
  /** To the next whole step of the 0–4 scale (a QL metric: one step of score, 1.0). Null at the top or when the lever cannot reach it. */
  nextStep: insightStepSchema.nullable(),
  /** To 4, the top of the scale; null when already there or out of reach. */
  toTop: insightStepSchema.nullable(),
  /** CGPA one unit of the lever adds (iqac-rules.ts gainPerUnit): the ranking's measure. */
  pointsPerUnit: z.number(),
  /** One sentence: "2 more teachers with a PhD or NET/SET take 2.4.2 from 1.60 to 2.00: +0.0080 CGPA." */
  sentence: z.string(),
  /** Facts the metric reads that the rows do not hold (their labels): the first thing to fix. */
  missing: z.array(z.string()),
  cta: insightCtaSchema,
});
export type NaacInsight = z.infer<typeof naacInsightSchema>;

/** The way to a band: the cheapest steps, in order, until their points cover the distance. */
export const naacPathSchema = z.object({
  grade: z.string(),
  min: z.number(),
  distance: z.number(),
  /** Σ points of `steps`; ≥ distance when `reachable`. */
  points: z.number(),
  reachable: z.boolean(),
  steps: z.array(z.object({ code: z.string(), delta: z.number(), unit: z.string(), points: z.number(), sentence: z.string(), cta: insightCtaSchema })),
  /** "From C to B: 0.42 CGPA; the cheapest five metrics give it." */
  sentence: z.string(),
});
export type NaacPath = z.infer<typeof naacPathSchema>;

/** GET /api/v1/iqac/insights?cycleId=&scenarioId= */
export const naacInsightsSchema = z.object({
  cycle: iqacCycleSchema,
  /** Set when the insights are a saved scenario's gap rather than today's ("show as insights"). */
  scenarioId: z.string().nullable(),
  scenarioName: z.string().nullable(),
  cgpa: z.number(),
  grade: z.string(),
  /** The next band and the band after (none at A++). */
  paths: z.array(naacPathSchema),
  /** Quantitative metrics below 4, by CGPA per unit of effort (most first). */
  ranked: z.array(naacInsightSchema),
  /** Qualitative metrics below 4: "score this with evidence" (unscored first). */
  qualitative: z.array(naacInsightSchema),
  lastDone: z.array(insightDoneSchema),
  computedAt: z.string().datetime().nullable(),
  notAScore: z.string(),
});
export type NaacInsights = z.infer<typeof naacInsightsSchema>;

/* -------------------------------------------------------------------------- */
/* NBA SAR (an engineering department)                                         */
/* -------------------------------------------------------------------------- */

/** The figures the SAR's computed items read (council-rules.ts), as the simulator edits them. Means of indices are 0–1; APIs on the 10-point scale. */
export const nbaInputsSchema = z.object({
  S: z.number().int().min(0).max(100000),
  F: z.number().int().min(0).max(10000),
  intake: z.number().int().min(0).max(100000),
  admitted: z.number().int().min(0).max(100000),
  successNoBacklog: z.number().min(0).max(1).nullable(),
  successStipulated: z.number().min(0).max(1).nullable(),
  apiFirst: z.number().min(0).max(10).nullable(),
  apiSecond: z.number().min(0).max(10).nullable(),
  apiThird: z.number().min(0).max(10).nullable(),
  placement: z.number().min(0).max(1).nullable(),
  professors: z.number().int().min(0).max(10000),
  associates: z.number().int().min(0).max(10000),
  assistants: z.number().int().min(0).max(10000),
  phd: z.number().int().min(0).max(10000),
  masters: z.number().int().min(0).max(10000),
  firstYearStudents: z.number().int().min(0).max(100000),
  firstYearFaculty: z.number().int().min(0).max(10000),
  /** The self-assessed items' marks (NBA_SAR_ITEMS not computed), by item code; missing is 0. */
  self: z.record(z.string(), z.number().min(0).max(1000)).default({}),
});
export type NbaInputs = z.infer<typeof nbaInputsSchema>;

export const nbaInsightSchema = z.object({
  code: z.string(),
  criterion: z.string(),
  text: z.string(),
  max: z.number(),
  marks: z.number(),
  computed: z.boolean(),
  /** The figure the item reads (enrolment ratio, SFR, FQ…) and the lever moved; null for a self-assessed item. */
  figure: z.number().nullable(),
  lever: z.string().nullable(),
  leverLabel: z.string().nullable(),
  leverValue: z.number().nullable(),
  unit: z.string(),
  /** The smallest change of the lever that raises the item's marks, and to full marks. */
  nextStep: insightStepSchema.nullable(),
  toTop: insightStepSchema.nullable(),
  pointsPerUnit: z.number(),
  sentence: z.string(),
  cta: insightCtaSchema,
});
export type NbaInsight = z.infer<typeof nbaInsightSchema>;

/** GET /api/v1/iqac/insights/nba?year=&departmentId=&scenarioId= */
export const nbaInsightsSchema = z.object({
  year: z.number().int(),
  departmentId: z.string(),
  departmentName: z.string(),
  departments: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })),
  scenarioId: z.string().nullable(),
  scenarioName: z.string().nullable(),
  computed: z.number(),
  self: z.number(),
  total: z.number(),
  max: z.number(),
  /** Computed items below full marks, by marks per unit of effort. */
  ranked: z.array(nbaInsightSchema),
  /** Self-assessed criteria below their marks: "write this criterion with its evidence" (unwritten first). */
  selfAssess: z.array(nbaInsightSchema),
  lastDone: z.array(insightDoneSchema),
  notAScore: z.string(),
});
export type NbaInsights = z.infer<typeof nbaInsightsSchema>;

/* -------------------------------------------------------------------------- */
/* NIRF                                                                        */
/* -------------------------------------------------------------------------- */

/** The facts NIRF's published formulas read (iqac-rules.ts NirfFacts); percentages 0–100, F1–F3 fractions 0–1. */
export const nirfInputsSchema = z.object({
  faculty: z.number().min(0).max(100000).nullable(),
  intake: z.number().min(0).max(100000).nullable(),
  phdPct: z.number().min(0).max(100).nullable(),
  f1: z.number().min(0).max(1).nullable(),
  f2: z.number().min(0).max(1).nullable(),
  f3: z.number().min(0).max(1).nullable(),
  placedPct: z.number().min(0).max(100).nullable(),
  higherPct: z.number().min(0).max(100).nullable(),
  passInTimePct: z.number().min(0).max(100).nullable(),
  womenStudentsPct: z.number().min(0).max(100).nullable(),
  womenFacultyPct: z.number().min(0).max(100).nullable(),
});
export type NirfInputs = z.infer<typeof nirfInputsSchema>;

/**
 * THE RANK-BAND ESTIMATE'S TABLE — THE PLATFORM'S, NOT NIRF'S. NIRF ranks the
 * top hundred colleges and bands the next ones (101–150, 151–200, 201–300) by
 * an overall score out of 100, and it publishes each year's scores but no
 * cut-off. These minimums are the builder's approximate reading of the
 * college list's published scores (NIRF 2024 and 2025, not re-fetched on
 * 5 October 2026); they move every year, and the page says "check the year's
 * list". The estimate projects the partial score (only the sub-parameters
 * whose formulas NIRF publishes) to 100 as if the rest scored at the same
 * rate — the rest (SS, FRU, PU, QP, GMS, ESCS, PR) NIRF does not publish.
 */
export const NIRF_BANDS = [
  { code: "TOP_100", min: 57 },
  { code: "B101_150", min: 54 },
  { code: "B151_200", min: 51 },
  { code: "B201_300", min: 47 },
  { code: "BELOW", min: 0 },
] as const;
export const NIRF_BAND_CODES = NIRF_BANDS.map((b) => b.code) as [(typeof NIRF_BANDS)[number]["code"], ...(typeof NIRF_BANDS)[number]["code"][]];

export const nirfInsightSchema = z.object({
  code: z.string(),
  parameter: z.string(),
  max: z.number(),
  marks: z.number().nullable(),
  published: z.boolean(),
  lever: z.string().nullable(),
  leverLabel: z.string().nullable(),
  leverValue: z.number().nullable(),
  unit: z.string(),
  nextStep: insightStepSchema.nullable(),
  toTop: insightStepSchema.nullable(),
  pointsPerUnit: z.number(),
  sentence: z.string(),
  cta: insightCtaSchema,
});
export type NirfInsight = z.infer<typeof nirfInsightSchema>;

/** GET /api/v1/iqac/insights/nirf */
export const nirfInsightsSchema = z.object({
  windowFrom: z.string(),
  windowTo: z.string(),
  cycleId: z.string().nullable(),
  inputs: nirfInputsSchema,
  /** Σ marks × weight over the published sub-parameters, and how many of the 100 they cover. */
  partial: z.number(),
  coveredMarks: z.number(),
  /** partial ÷ coveredMarks × 100; null when nothing is covered. */
  projected: z.number().nullable(),
  band: z.object({ code: z.enum(NIRF_BAND_CODES), label: z.string(), min: z.number() }).nullable(),
  nextBand: z.object({ code: z.enum(NIRF_BAND_CODES), label: z.string(), min: z.number(), distance: z.number() }).nullable(),
  parameters: z.array(z.object({ code: z.string(), name: z.string(), weight: z.number(), marks: z.number().nullable(), covered: z.number() })),
  /** Published sub-parameters below their marks, by score points per unit; the unpublished ones last, with what to keep ready. */
  ranked: z.array(nirfInsightSchema),
  notAScore: z.string(),
});
export type NirfInsights = z.infer<typeof nirfInsightsSchema>;

/* -------------------------------------------------------------------------- */
/* Scenarios and the simulator                                                 */
/* -------------------------------------------------------------------------- */

/** A NAAC scenario's inputs: every fact the framework's formulas read, and every qualitative metric's 0–4 (null = unscored); NIRF's facts beside. */
export const naacScenarioInputsSchema = z.object({
  facts: z.record(z.string().max(64), z.number().min(0).max(1e9).nullable()),
  ql: z.record(z.string().max(16), z.number().min(0).max(4).nullable()),
  nirf: nirfInputsSchema.nullable().default(null),
});
export type NaacScenarioInputs = z.infer<typeof naacScenarioInputsSchema>;

export const SCENARIO_KINDS = ["NAAC", "NBA"] as const;
export const scenarioKindSchema = z.enum(SCENARIO_KINDS);

/** POST /api/v1/iqac/scenarios — save what the simulator shows under a name. The result is recomputed on the server; a sent result is not read. */
export const scenarioSaveSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("NAAC"), cycleId: z.string().min(1).max(64), name: z.string().trim().min(2).max(120), inputs: naacScenarioInputsSchema }),
  z.object({ kind: z.literal("NBA"), year: z.number().int().min(2000).max(2100), departmentId: z.string().min(1).max(64), name: z.string().trim().min(2).max(120), inputs: nbaInputsSchema }),
]);
export type ScenarioSave = z.infer<typeof scenarioSaveSchema>;

/** GET /api/v1/iqac/scenarios?kind=&cycleId=&year=&departmentId= */
export const scenarioQuerySchema = z.object({
  kind: scenarioKindSchema.optional(),
  cycleId: z.string().max(64).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  departmentId: z.string().max(64).optional(),
});

export const scenarioSchema = z.object({
  id: z.string(),
  kind: scenarioKindSchema,
  name: z.string(),
  cycleId: z.string().nullable(),
  year: z.number().int().nullable(),
  departmentId: z.string().nullable(),
  by: z.string(),
  at: z.string().datetime(),
  /** NAAC: the CGPA; NBA: the SAR's total of 1,000 — recomputed now from the inputs with today's formulas. */
  result: z.number(),
  /** What it read when saved (the stored copy; data:audit holds it equal to `result`). */
  savedResult: z.number(),
  grade: z.string().nullable(),
  /** Today's result for the same cycle or department, and the scenario's lead over it. */
  today: z.number(),
  delta: z.number(),
  canRemove: z.boolean(),
});
export type Scenario = z.infer<typeof scenarioSchema>;

export const scenariosSchema = z.object({ items: z.array(scenarioSchema), canWrite: z.boolean() });
export type Scenarios = z.infer<typeof scenariosSchema>;

/** GET /api/v1/iqac/scenarios/compare?a=&b= — two scenarios of the same cycle or department side by side. */
export const scenarioCompareQuerySchema = z.object({ a: z.string().min(1).max(64), b: z.string().min(1).max(64) });
export const scenarioCompareSchema = z.object({
  kind: scenarioKindSchema,
  a: scenarioSchema,
  b: scenarioSchema,
  /** Every input that differs (or every metric's score), with b − a. */
  inputs: z.array(z.object({ key: z.string(), label: z.string(), a: z.number().nullable(), b: z.number().nullable(), delta: z.number().nullable() })),
  scores: z.array(z.object({ code: z.string(), label: z.string(), a: z.number(), b: z.number(), delta: z.number() })),
  result: z.object({ a: z.number(), b: z.number(), delta: z.number() }),
});
export type ScenarioCompare = z.infer<typeof scenarioCompareSchema>;

/** GET /api/v1/iqac/simulate?cycleId=&scenarioId= — the server's recompute of today's figures or a saved scenario (the phone and the test read it; the page computes the same in the browser). */
export const simulateQuerySchema = z.object({ cycleId: z.string().max(64).optional(), scenarioId: z.string().max(64).optional() });
export const naacSimulationSchema = z.object({
  cycleId: z.string(),
  framework: z.string(),
  scenarioId: z.string().nullable(),
  inputs: naacScenarioInputsSchema,
  cgpa: z.number(),
  grade: z.string(),
  nextBand: z.object({ grade: z.string(), min: z.number(), distance: z.number() }).nullable(),
  criteria: z.array(z.object({ code: z.string(), score: z.number() })),
  metrics: z.array(z.object({ code: z.string(), kind: z.enum(NAAC_METRIC_KINDS), value: z.number().nullable(), score: z.number() })),
  nirf: z.object({ partial: z.number(), coveredMarks: z.number(), projected: z.number().nullable(), subs: z.record(z.string(), z.number().nullable()) }).nullable(),
  notAScore: z.string(),
});
export type NaacSimulation = z.infer<typeof naacSimulationSchema>;

/** GET /api/v1/iqac/simulate/nba?year=&departmentId=&scenarioId= */
export const nbaSimulateQuerySchema = z.object({ year: z.coerce.number().int().min(2000).max(2100).optional(), departmentId: z.string().max(64).optional(), scenarioId: z.string().max(64).optional() });
export const nbaSimulationSchema = z.object({
  year: z.number().int(),
  departmentId: z.string(),
  scenarioId: z.string().nullable(),
  inputs: nbaInputsSchema,
  marks: z.record(z.string(), z.number()),
  computed: z.number(),
  self: z.number(),
  total: z.number(),
  max: z.number(),
  notAScore: z.string(),
});
export type NbaSimulation = z.infer<typeof nbaSimulationSchema>;

/** GET ?cycleId=&scenarioId= on the NAAC insights door; ?year=&departmentId=&scenarioId= on the NBA one. */
export const insightsQuerySchema = z.object({ cycleId: z.string().max(64).optional(), scenarioId: z.string().max(64).optional() });
export const nbaInsightsQuerySchema = nbaSimulateQuerySchema;
