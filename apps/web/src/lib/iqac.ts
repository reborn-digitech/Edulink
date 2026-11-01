import "server-only";
import { writePan } from "./pan";
import { createHash, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import {
  applicableFilings,
  NAAC_FRAMEWORKS,
  REGULATOR_CALENDAR,
  NIRF_PARAMETERS,
  SURVEY_QUESTIONS,
  IQAC_ENTERED_INPUTS,
  GRIEVANCE_LIMIT_WORKING_DAYS,
  frameworkForKind,
  type NaacFramework,
  type NaacFrameworkCode,
  type IqacMetricView,
  type IqacPredictor,
  type IqacCycle,
  type IqacOverview,
  type SurveyKind,
} from "@edulink/contracts";
import type { z } from "zod";
import type {
  activitySaveSchema,
  committeeMeetingSaveSchema,
  committeeSaveSchema,
  facultyRecordSaveSchema,
  grievanceActionSchema,
  grievanceFileSchema,
  researchItemSaveSchema,
  surveySaveSchema,
  iqacScoreSchema,
  iqacInputsSaveSchema,
  actionTakenSaveSchema,
} from "@edulink/contracts";
import { db } from "./db";
import { forSchool } from "./tenant-context";
import { AccessError } from "./tenancy";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn, isModuleOn } from "./modules";
import { audit } from "./audit";
import { notify } from "./notify";
import { addDaysToKey, parseTeachingDays, todayKey } from "./dates";
import { closedDayKeys, listHolidays } from "./holidays";
import { readJsonArray } from "./json";
import { getT } from "./i18n/server";
import type { Translate, TranslationKey } from "./i18n/dictionary";
import { sealingAvailable } from "./secret-box";
import { readFeesSecretKey } from "./env";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { streamsOf } from "./streams";
import {
  FORMULAS,
  SURVEY_MIN_RESPONSES,
  addWorkingDays,
  type WorkingCalendar,
  aggregate,
  cgpaOf,
  cheapest,
  evaluate,
  gainPerUnit,
  gradeOf,
  nextBand,
  overallMean,
  round2,
  totalWeight,
  weightedScore,
  type Facts,
} from "./iqac-rules";
import { gatherFacts, nirfFacts, readEntered, type EvidenceRow, type FactReason, type FactSource } from "./iqac-facts";
import { nirfScore } from "./accreditation-insights";

/**
 * THE IQAC DESK (module IQAC, role IQAC; the owner's plan of 4 October 2026).
 *
 * WHO. The IQAC coordinator keeps the accreditation file: opens a NAAC
 * cycle, recomputes the predictor, scores the qualitative metrics with
 * evidence, runs the surveys, and generates the filings (lib/iqac-filings.ts).
 * The office (ADMIN) keeps the committees and their minutes, the faculty
 * records and the grievance line, and may do what the coordinator does; the
 * principal reads everything and signs off the NAAC documents. A faculty
 * member keeps their own research items; the HOD reads the department's and
 * records its activities. A student gives course feedback, answers the SSS
 * and the exit survey, and files grievances; an alumnus answers the alumni
 * survey; faculty answer the teachers' survey.
 *
 * NEVER A PROMISE. Every page that shows a score says that the platform does
 * not score for NAAC; the quantitative readings are against the platform's
 * own benchmarks (lib/iqac-rules.ts) and the qualitative ones are the
 * coordinator's provisional judgement.
 *
 * ONE WRITER of the stored CGPA: `writeCycleCgpa`, called by the
 * recomputation and by a qualitative score; data:audit recomputes it from
 * the MetricScore rows.
 */

type Tx = typeof db;
const DESK_READ: readonly Role[] = ["IQAC", "ADMIN", "PRINCIPAL"];
const DESK_WRITE: readonly Role[] = ["IQAC", "ADMIN"];
const TEACHERS: readonly Role[] = ["FACULTY", "HOD"];

export type Desk = { schoolId: string; userId: string; role: Role; membershipId: string };

/** The session at a college with IQAC on, in one of `roles`; refused before anything is read. */
export async function iqacActor(ctx: ActiveContext, roles: readonly Role[]): Promise<Desk> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "IQAC");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId };
}

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

/* -------------------------------------------------------------------------- */
/* Evidence files                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A file the caller uploaded (POST /api/v1/uploads gave them a ticket), now
 * the college's: the ticket is spent and an IqacFile row says who may read it
 * (lib/files.ts). A file already registered at this college is accepted as it
 * stands — citing the same minutes twice is not a second upload.
 */
export async function spendFile(desk: Desk, fileId: string | null | undefined, purpose: string, title: string): Promise<string | null> {
  if (!fileId) return null;
  const known = await db.iqacFile.findFirst({ where: { fileId, schoolId: desk.schoolId }, select: { fileId: true } });
  if (known) return known.fileId;
  const spent = await db.uploadTicket.updateMany({ where: { fileId, userId: desk.userId, consumedAt: null }, data: { consumedAt: new Date() } });
  if (spent.count === 0) throw new RuleRefusal("iqac.refuseFile", 422, undefined, "fileId");
  await db.iqacFile.create({ data: { schoolId: desk.schoolId, fileId, title: title.slice(0, 200), purpose, uploadedByUserId: desk.userId, uploadedByMembershipId: desk.membershipId } });
  return fileId;
}

/** A file already stored by the web form (storeAttachments), registered the same way. */
export async function registerStoredFile(ctx: ActiveContext, fileId: string, purpose: string, title: string): Promise<void> {
  if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await db.iqacFile.create({ data: { schoolId: ctx.schoolId, fileId, title: title.slice(0, 200), purpose, uploadedByUserId: ctx.user.id, uploadedByMembershipId: ctx.membershipId } });
}

export async function uploadEvidence(ctx: ActiveContext, input: { fileId: string; title: string }) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  await spendFile(desk, input.fileId, "EVIDENCE", input.title);
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.evidence.upload", targetType: "IqacFile", targetId: input.fileId, meta: { title: input.title } });
  return listEvidence(ctx);
}

export async function listEvidence(ctx: ActiveContext) {
  const desk = await iqacActor(ctx, DESK_READ);
  // Never a grievance's attachment: its title is the kind (RAGGING, HARASSMENT) and its uploader the
  // student who filed it, which the grievance desk keeps from the IQAC (campaign S-9).
  const rows = await db.iqacFile.findMany({ where: { schoolId: desk.schoolId, purpose: { not: "GRIEVANCE" } }, orderBy: { createdAt: "desc" }, take: 200, select: { fileId: true, title: true, createdAt: true, uploadedByUserId: true } });
  const users = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.uploadedByUserId))] } }, select: { id: true, name: true } });
  const name = new Map(users.map((u) => [u.id, u.name]));
  return { items: rows.map((r) => ({ fileId: r.fileId, title: r.title, uploadedAt: r.createdAt.toISOString(), by: name.get(r.uploadedByUserId) ?? "" })) };
}

async function filesNamed(schoolId: string, fileIds: string[]): Promise<{ fileId: string; title: string }[]> {
  if (!fileIds.length) return [];
  return db.iqacFile.findMany({ where: { schoolId, fileId: { in: fileIds } }, select: { fileId: true, title: true } });
}

/* -------------------------------------------------------------------------- */
/* Cycles and the predictor                                                    */
/* -------------------------------------------------------------------------- */

type CycleRow = { id: string; schoolId: string; framework: string; institutionType: string; windowFrom: string; windowTo: string; status: string; cgpa: number | null; cgpaComputedAt: Date | null; enteredJson: string };
const CYCLE_SELECT = { id: true, schoolId: true, framework: true, institutionType: true, windowFrom: true, windowTo: true, status: true, cgpa: true, cgpaComputedAt: true, enteredJson: true } as const;

export function frameworkOf(code: string): NaacFramework {
  return NAAC_FRAMEWORKS[(code in NAAC_FRAMEWORKS ? code : "AFFILIATED_UG") as NaacFrameworkCode];
}

type ScoreRow = { metricCode: string; kind: string; value: number | null; score: number | null; provisional: boolean; evidenceJson: string; note: string; computedAt: Date; runId: string; scoredByUserId: string | null };

/** The latest row of every metric of a cycle (optionally as it stood at `asOf`). */
async function latestScores(cycleId: string, asOf?: Date): Promise<Map<string, ScoreRow>> {
  const rows = await db.metricScore.findMany({ where: { cycleId, ...(asOf ? { computedAt: { lte: asOf } } : {}) }, orderBy: { computedAt: "asc" }, select: { metricCode: true, kind: true, value: true, score: true, provisional: true, evidenceJson: true, note: true, computedAt: true, runId: true, scoredByUserId: true } });
  const out = new Map<string, ScoreRow>();
  for (const r of rows) out.set(r.metricCode, r);
  return out;
}

/** THE ONE WRITER of AccreditationCycle.cgpa: the CGPA of the latest score of every metric. */
export async function writeCycleCgpa(cycleId: string, client: Tx = db): Promise<number> {
  const cycle = await client.accreditationCycle.findUniqueOrThrow({ where: { id: cycleId }, select: { framework: true } });
  const latest = await latestScores(cycleId);
  const cgpa = cgpaOf(frameworkOf(cycle.framework), new Map([...latest].map(([k, v]) => [k, v.score])));
  await client.accreditationCycle.update({ where: { id: cycleId }, data: { cgpa, cgpaComputedAt: new Date() } });
  return cgpa;
}

/** The CGPA the cycle's MetricScore rows give, for data:audit and the trend. */
export async function cgpaFromRows(cycleId: string, framework: string, asOf?: Date): Promise<number> {
  const latest = await latestScores(cycleId, asOf);
  return cgpaOf(frameworkOf(framework), new Map([...latest].map(([k, v]) => [k, v.score])));
}

function cycleView(c: CycleRow, scored: number): IqacCycle {
  const fw = frameworkOf(c.framework);
  return {
    id: c.id,
    framework: fw.code,
    institutionType: c.institutionType,
    windowFrom: c.windowFrom,
    windowTo: c.windowTo,
    status: c.status as IqacCycle["status"],
    cgpa: c.cgpa,
    grade: c.cgpa === null ? null : gradeOf(c.cgpa),
    computedAt: c.cgpaComputedAt?.toISOString() ?? null,
    metricCount: fw.metrics.length,
    scoredCount: scored,
  };
}

async function cycleOf(desk: Desk, cycleId: string): Promise<CycleRow> {
  const c = await db.accreditationCycle.findFirst({ where: { id: cycleId, schoolId: desk.schoolId }, select: CYCLE_SELECT });
  if (!c) throw new AccessError("iqac.refuseNoCycle", "NOT_FOUND");
  return c;
}

export async function listCycles(ctx: ActiveContext) {
  const desk = await iqacActor(ctx, DESK_READ);
  const rows = await db.accreditationCycle.findMany({ where: { schoolId: desk.schoolId }, orderBy: { createdAt: "desc" }, select: CYCLE_SELECT });
  const items = await Promise.all(rows.map(async (c) => cycleView(c, (await latestScores(c.id)).size)));
  return { items, canEdit: DESK_WRITE.includes(desk.role) };
}

/** Open a cycle over a window of one to five academic years; one open cycle at a time. */
export async function openCycle(ctx: ActiveContext, input: { windowFrom: string; windowTo: string }) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  if (input.windowTo <= input.windowFrom) throw new RuleRefusal("iqac.refuseWindow", 422, undefined, "windowTo");
  const days = (Date.parse(input.windowTo) - Date.parse(input.windowFrom)) / 86_400_000;
  if (days > 5 * 366 + 2) throw new RuleRefusal("iqac.refuseWindow", 422, undefined, "windowTo");
  const open = await db.accreditationCycle.findFirst({ where: { schoolId: desk.schoolId, status: "OPEN" }, select: { id: true } });
  if (open) throw new RuleRefusal("iqac.refuseOpenCycle", 409);
  const school = await db.school.findUniqueOrThrow({ where: { id: desk.schoolId }, select: { kind: true } });
  const cycle = await db.accreditationCycle.create({ data: { schoolId: desk.schoolId, framework: frameworkForKind(school.kind), institutionType: school.kind, windowFrom: input.windowFrom, windowTo: input.windowTo, createdByUserId: desk.userId }, select: { id: true } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.cycle.open", targetType: "AccreditationCycle", targetId: cycle.id, meta: { ...input } });
  await recompute(desk, cycle.id);
  return listCycles(ctx);
}

/**
 * Recompute every quantitative metric of a cycle from the rows: one MetricScore
 * per metric under one run id, then the CGPA. Run by the desk's button, by
 * opening a cycle, and after the entered figures change.
 */
async function recompute(desk: Desk, cycleId: string, now = new Date()): Promise<void> {
  const cycle = await cycleOf(desk, cycleId);
  if (cycle.status === "CLOSED") throw new RuleRefusal("iqac.refuseClosedCycle", 409);
  const fw = frameworkOf(cycle.framework);
  const gathered = await gatherFacts(desk.schoolId, cycle.windowFrom, cycle.windowTo, readEntered(cycle.enteredJson), now);
  const runId = `run_${now.getTime().toString(36)}_${randomBytes(4).toString("hex")}`;
  const data = fw.metrics
    .filter((m) => m.kind === "QN" && m.formula)
    .map((m) => {
      const spec = FORMULAS[m.formula!];
      const ev = evaluate(m.formula!, gathered.facts);
      const inputs = spec.inputs.map((k) => ({ key: k, value: gathered.facts[k] ?? null, source: gathered.source[k] ?? "MISSING", reason: gathered.reasons[k] ?? null }));
      const rows = uniqueEvidence(spec.inputs.flatMap((k) => gathered.evidence[k] ?? [])).slice(0, 50);
      return { schoolId: desk.schoolId, cycleId, metricCode: m.code, kind: "QN", runId, value: ev.value, score: ev.score, provisional: true, evidenceJson: JSON.stringify({ rows, files: [], inputs }), computedAt: now };
    });
  await db.metricScore.createMany({ data });
  const cgpa = await writeCycleCgpa(cycleId);
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.cycle.compute", targetType: "AccreditationCycle", targetId: cycleId, meta: { metrics: data.length, cgpa } });
}

export async function recomputeCycle(ctx: ActiveContext, cycleId: string) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  await recompute(desk, cycleId);
  return predictorFor(ctx, cycleId);
}

/** For the fixture script and the tests: recompute as the school's own IQAC run, with no session. */
export async function recomputeAsSystem(schoolId: string, cycleId: string, actorUserId: string, now = new Date()): Promise<number> {
  await recompute({ schoolId, userId: actorUserId, role: "IQAC", membershipId: "" }, cycleId, now);
  return (await db.accreditationCycle.findUniqueOrThrow({ where: { id: cycleId }, select: { cgpa: true } })).cgpa ?? 0;
}

/** Score a qualitative metric 0–4. Evidence is required: at least one registered file or one register row of this college. */
export async function scoreQualitative(ctx: ActiveContext, cycleId: string, code: string, input: z.infer<typeof iqacScoreSchema>) {
  const desk = await iqacActor(ctx, ["IQAC"]);
  return scoreQualitativeAs(desk, cycleId, code, input).then(() => predictorFor(ctx, cycleId));
}

export async function scoreQualitativeAs(desk: Desk, cycleId: string, code: string, input: z.infer<typeof iqacScoreSchema>): Promise<void> {
  const cycle = await cycleOf(desk, cycleId);
  if (cycle.status !== "OPEN") throw new RuleRefusal("iqac.refuseClosedCycle", 409);
  const metric = frameworkOf(cycle.framework).metrics.find((m) => m.code === code);
  if (!metric) throw new AccessError("iqac.refuseNoMetric", "NOT_FOUND");
  if (metric.kind !== "QL") throw new RuleRefusal("iqac.refuseNotQualitative", 422);
  const files = await filesNamed(desk.schoolId, input.fileIds);
  if (files.length !== new Set(input.fileIds).size) throw new RuleRefusal("iqac.refuseFile", 422, undefined, "fileIds");
  const rows: EvidenceRow[] = [];
  for (const e of input.evidence) {
    const label = await evidenceLabel(desk.schoolId, e.type, e.id);
    if (!label) throw new RuleRefusal("iqac.refuseEvidenceRow", 422, undefined, "evidence");
    rows.push({ type: e.type, id: e.id, label });
  }
  if (files.length + rows.length === 0) throw new RuleRefusal("iqac.refuseNoEvidence", 422, undefined, "fileIds");
  await db.metricScore.create({ data: { schoolId: desk.schoolId, cycleId, metricCode: code, kind: "QL", runId: `ql_${Date.now().toString(36)}`, value: input.score, score: input.score, provisional: true, evidenceJson: JSON.stringify({ rows, files: files.map((f) => f.fileId), inputs: [] }), note: input.note, scoredByUserId: desk.userId } });
  const cgpa = await writeCycleCgpa(cycleId);
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.metric.score", targetType: "AccreditationCycle", targetId: cycleId, meta: { metric: code, score: input.score, files: files.length, rows: rows.length, cgpa } });
}

async function evidenceLabel(schoolId: string, type: string, id: string): Promise<string | null> {
  switch (type) {
    case "ResearchItem":
      return (await db.researchItem.findFirst({ where: { id, schoolId }, select: { title: true } }))?.title ?? null;
    case "Activity": {
      const a = await db.activity.findFirst({ where: { id, schoolId }, select: { title: true, at: true } });
      return a ? `${a.title} (${a.at})` : null;
    }
    case "CommitteeMeeting": {
      const m = await db.committeeMeeting.findFirst({ where: { id, schoolId }, select: { at: true, committee: { select: { name: true } } } });
      return m ? `${m.committee.name} (${m.at})` : null;
    }
    case "Survey":
      return (await db.survey.findFirst({ where: { id, schoolId }, select: { title: true } }))?.title ?? null;
    case "ActionTakenReport": {
      const a = await db.actionTakenReport.findFirst({ where: { id, schoolId }, select: { survey: { select: { title: true } } } });
      return a?.survey.title ?? null;
    }
    case "Filing": {
      const f = await db.collegeFiling.findFirst({ where: { id, schoolId }, select: { kind: true, year: true } });
      return f ? `${f.kind} ${f.year}` : null;
    }
    default:
      return null;
  }
}

/** The figures the platform does not hold, entered with evidence; the cycle is recomputed. */
export async function saveEnteredInputs(ctx: ActiveContext, cycleId: string, input: z.infer<typeof iqacInputsSaveSchema>) {
  const desk = await iqacActor(ctx, ["IQAC"]);
  const cycle = await cycleOf(desk, cycleId);
  if (cycle.status !== "OPEN") throw new RuleRefusal("iqac.refuseClosedCycle", 409);
  const files = await filesNamed(desk.schoolId, input.fileIds);
  if (files.length !== new Set(input.fileIds).size) throw new RuleRefusal("iqac.refuseFile", 422, undefined, "fileIds");
  if (input.values.some((v) => v.value !== null) && files.length === 0) throw new RuleRefusal("iqac.refuseNoEvidence", 422, undefined, "fileIds");
  const entered = readEntered(cycle.enteredJson);
  const at = new Date().toISOString();
  for (const v of input.values) entered[v.key] = { value: v.value, byUserId: desk.userId, at, fileIds: files.map((f) => f.fileId) };
  await db.accreditationCycle.update({ where: { id: cycleId }, data: { enteredJson: JSON.stringify(entered) } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.inputs.save", targetType: "AccreditationCycle", targetId: cycleId, meta: { keys: input.values.map((v) => v.key), files: files.length } });
  await recompute(desk, cycleId);
  return predictorFor(ctx, cycleId);
}

const termOf = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const start = m >= 6 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")} ${m >= 6 && m <= 11 ? "I" : "II"}`;
};

function whyOf(t: Translate, m: { kind: string; formula: string | null }, row: ScoreRow | undefined, inputs: IqacMetricView["inputs"]): string {
  if (!row) return t(m.kind === "QL" ? "iqac.whyNotScored" : "iqac.whyNotComputed");
  if (m.kind === "QL") {
    const ev = readEvidence(row.evidenceJson);
    return t("iqac.whyQualitative", { score: String(row.score ?? 0), n: ev.rows.length + ev.files.length });
  }
  const missing = inputs.find((i) => i.source === "MISSING" || (i.value === 0 && i.reason));
  if (row.value === null && missing) return t("iqac.whyMissing", { fact: missing.label, reason: missing.reason ?? "" });
  const spec = FORMULAS[m.formula as keyof typeof FORMULAS];
  const vars = { value: String(row.value ?? 0), score: String(row.score ?? 0) };
  switch (spec.scale.type) {
    case "percent":
      return t("iqac.whyPercent", { ...vars, benchmark: spec.scale.benchmark });
    case "count":
      return t("iqac.whyCount", { ...vars, benchmark: spec.scale.benchmark });
    case "lowBetter":
      return t("iqac.whyRatio", { ...vars, benchmark: spec.scale.benchmark });
    case "linearLow":
      return t("iqac.whyLinearLow", { ...vars, zeroAt: spec.scale.zeroAt });
    case "options":
      return t("iqac.whyOptions", vars);
    case "bands":
      return t("iqac.whyBands", vars);
    case "direct":
      return t("iqac.whyDirect", vars);
  }
}

function readEvidence(raw: string): { rows: EvidenceRow[]; files: string[]; inputs: { key: string; value: number | null; source: FactSource; reason: FactReason | null }[] } {
  try {
    const v = JSON.parse(raw) as Partial<{ rows: EvidenceRow[]; files: string[]; inputs: { key: string; value: number | null; source: FactSource; reason: FactReason | null }[] }>;
    return { rows: uniqueEvidence(v.rows ?? []), files: v.files ?? [], inputs: v.inputs ?? [] };
  } catch {
    return { rows: [], files: [], inputs: [] };
  }
}

/**
 * One line per row of evidence. A metric whose formula reads two facts drawn
 * from the same rows ("placed" over "outgoing", both the placement table's
 * batches) listed each batch twice, and the predictor drew two list items
 * with one key, 18 times a page (the walk of 4 October). Read as well as
 * written, so a cycle computed before this still shows once.
 */
export function uniqueEvidence<R extends { type: string; id: string }>(rows: R[]): R[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.type}:${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function reasonText(t: Translate, reason: FactReason | null): string | null {
  if (!reason) return null;
  if (reason === "entered") return t("iqac.reasonEntered");
  if (reason === "zero") return t("iqac.reasonZero");
  const mod = reason.slice("module:".length);
  return t("iqac.reasonModule", { module: t(`iqac.source.${mod}` as TranslationKey) });
}

/** The predictor as the page reads it: criteria → KIs → metrics, each with its value, score, why and evidence. */
export async function predictorFor(ctx: ActiveContext, cycleId: string): Promise<IqacPredictor> {
  const desk = await iqacActor(ctx, DESK_READ);
  const t = await getT();
  const cycle = await cycleOf(desk, cycleId);
  const fw = frameworkOf(cycle.framework);
  const total = totalWeight(fw);
  const latest = await latestScores(cycleId);
  const scores = new Map([...latest].map(([k, v]) => [k, v.score]));
  const allFiles = await filesNamed(desk.schoolId, [...new Set([...latest.values()].flatMap((r) => readEvidence(r.evidenceJson).files))]);
  const fileTitle = new Map(allFiles.map((f) => [f.fileId, f.title]));
  const entered = readEntered(cycle.enteredJson);
  const metricViews = new Map<string, IqacMetricView>();
  for (const m of fw.metrics) {
    const row = latest.get(m.code);
    const ev = row ? readEvidence(row.evidenceJson) : { rows: [], files: [], inputs: [] };
    const inputs = ev.inputs.map((i) => ({ key: i.key, label: t(`iqac.fact.${i.key}` as TranslationKey), value: i.value, source: i.source, reason: reasonText(t, i.reason) }));
    const facts: Facts = Object.fromEntries(ev.inputs.map((i) => [i.key, i.value]));
    const gain = gainPerUnit(m, facts, row?.score ?? null, total);
    const unit = m.kind === "QL" ? t("iqac.unit.step") : t(`iqac.unit.${FORMULAS[m.formula!].unit}` as TranslationKey);
    metricViews.set(m.code, {
      code: m.code,
      ki: m.ki,
      kind: m.kind,
      weight: m.weight,
      text: m.text,
      formula: m.formula,
      window: m.window,
      value: row?.value ?? null,
      score: row?.score ?? null,
      provisional: row?.provisional ?? true,
      why: whyOf(t, m, row, inputs),
      inputs,
      evidence: ev.rows,
      files: ev.files.map((f) => ({ fileId: f, title: fileTitle.get(f) ?? f })),
      note: row?.note ?? "",
      computedAt: row?.computedAt.toISOString() ?? null,
      gainPerUnit: gain,
      unit,
    });
  }
  const criteria = fw.criteria.map((c) => {
    const kis = fw.keyIndicators.filter((k) => k.criterion === c.code).map((k) => {
      const ms = fw.metrics.filter((m) => m.ki === k.code);
      return { code: k.code, name: k.name, weight: k.weight, score: weightedScore(ms, scores), metrics: ms.map((m) => metricViews.get(m.code)!) };
    });
    return { code: c.code, name: c.name, weight: c.weight, score: weightedScore(fw.metrics.filter((m) => m.ki.split(".")[0] === c.code), scores), kis };
  });
  const cgpa = cycle.cgpa ?? 0;
  // The trend: the CGPA as each run left it, the last run of each term.
  const runs = await db.metricScore.groupBy({ by: ["runId"], where: { cycleId }, _max: { computedAt: true } });
  const points = await Promise.all(runs.map(async (r) => ({ at: r._max.computedAt!, cgpa: await cgpaFromRows(cycleId, cycle.framework, r._max.computedAt!) })));
  const byTerm = new Map<string, { term: string; cgpa: number; computedAt: string }>();
  for (const p of points.sort((a, b) => a.at.getTime() - b.at.getTime())) byTerm.set(termOf(p.at), { term: termOf(p.at), cgpa: p.cgpa, computedAt: p.at.toISOString() });
  return {
    cycle: cycleView(cycle, latest.size),
    criteria,
    nextBand: cycle.cgpa === null ? null : nextBand(cgpa),
    cheapest: cheapest([...metricViews.values()]).map((m) => ({ code: m.code, text: m.text, gainPerUnit: m.gainPerUnit, unit: m.unit })),
    trend: [...byTerm.values()],
    entered: IQAC_ENTERED_INPUTS.map((k) => ({ key: k, label: t(`iqac.entered.${k}` as TranslationKey), value: entered[k]?.value ?? null })),
    canEdit: desk.role === "IQAC" && cycle.status === "OPEN",
  };
}

/** Close a cycle (after the visit): read-only from then on. */
export async function closeCycle(ctx: ActiveContext, cycleId: string) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  const cycle = await cycleOf(desk, cycleId);
  if (cycle.status !== "CLOSED") {
    await db.accreditationCycle.update({ where: { id: cycleId }, data: { status: "CLOSED" } });
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.cycle.close", targetType: "AccreditationCycle", targetId: cycleId, meta: {} });
  }
  return listCycles(ctx);
}

/* -------------------------------------------------------------------------- */
/* Research register                                                           */
/* -------------------------------------------------------------------------- */

/** The departments whose HOD this membership is (academics' Department.hodMembershipId), and their faculty. */
async function departmentOf(schoolId: string, membershipId: string): Promise<{ departmentIds: string[]; facultyIds: string[] }> {
  const departments = await db.department.findMany({ where: { schoolId, hodMembershipId: membershipId }, select: { id: true } });
  const ids = departments.map((d) => d.id);
  const faculty = ids.length ? await db.departmentFaculty.findMany({ where: { schoolId, departmentId: { in: ids } }, select: { membershipId: true } }) : [];
  return { departmentIds: ids, facultyIds: [...faculty.map((f) => f.membershipId), membershipId] };
}

/** The departments a teacher belongs to (DepartmentFaculty) or heads. */
async function departmentsOfTeacher(schoolId: string, membershipId: string): Promise<string[]> {
  const [headed, member] = await Promise.all([
    db.department.findMany({ where: { schoolId, hodMembershipId: membershipId }, select: { id: true } }),
    db.departmentFaculty.findMany({ where: { schoolId, membershipId }, select: { departmentId: true } }),
  ]);
  return [...headed.map((d) => d.id), ...member.map((m) => m.departmentId)];
}

export async function researchRegister(ctx: ActiveContext) {
  const actor = await iqacActor(ctx, [...DESK_READ, ...TEACHERS]);
  let where: Record<string, unknown> = { schoolId: actor.schoolId };
  let scope: "MINE" | "DEPARTMENT" | "COLLEGE" = "COLLEGE";
  if (actor.role === "FACULTY") {
    where = { schoolId: actor.schoolId, facultyMembershipId: actor.membershipId };
    scope = "MINE";
  } else if (actor.role === "HOD") {
    const d = await departmentOf(actor.schoolId, actor.membershipId);
    where = { schoolId: actor.schoolId, OR: [{ facultyMembershipId: { in: d.facultyIds } }, ...(d.departmentIds.length ? [{ departmentId: { in: d.departmentIds } }] : [])] };
    scope = "DEPARTMENT";
  }
  const items = await db.researchItem.findMany({ where, orderBy: [{ year: "desc" }, { createdAt: "desc" }], take: 500, select: { id: true, kind: true, title: true, indexing: true, year: true, amountLakhs: true, facultyMembershipId: true, departmentId: true, fileId: true, faculty: { select: { user: { select: { name: true } } } } } });
  const teacherIds = new Set(items.map((i) => i.facultyMembershipId).filter(Boolean));
  const teachers = scope === "COLLEGE" ? await db.membership.count({ where: { schoolId: actor.schoolId, role: { in: [...TEACHERS] }, status: "ACTIVE", leftAt: null } }) : Math.max(1, teacherIds.size);
  const pubs = items.filter((i) => i.kind === "PUBLICATION").length;
  const books = items.filter((i) => i.kind === "BOOK" || i.kind === "CONFERENCE").length;
  return {
    items: items.map((i) => ({ id: i.id, kind: i.kind as never, title: i.title, indexing: i.indexing as never, year: i.year, amountLakhs: i.amountLakhs, facultyMembershipId: i.facultyMembershipId, facultyName: i.faculty?.user.name ?? null, departmentId: i.departmentId, fileId: i.fileId, mine: i.facultyMembershipId === actor.membershipId })),
    perTeacher: { teachers, publications: teachers ? round2(pubs / teachers) : 0, books: teachers ? round2(books / teachers) : 0 },
    scope,
  };
}

/** A faculty member's own item (always theirs), or the desk's for any teacher of the college. */
export async function addResearchItem(ctx: ActiveContext, input: z.infer<typeof researchItemSaveSchema>) {
  const actor = await iqacActor(ctx, [...DESK_WRITE, ...TEACHERS]);
  let facultyMembershipId = input.facultyMembershipId;
  if (TEACHERS.includes(actor.role)) facultyMembershipId = actor.membershipId;
  else if (facultyMembershipId) {
    const t = await db.membership.findFirst({ where: { id: facultyMembershipId, schoolId: actor.schoolId, role: { in: [...TEACHERS] } }, select: { id: true } });
    if (!t) throw new RuleRefusal("iqac.refuseNotTeacher", 422, undefined, "facultyMembershipId");
  }
  if (input.kind === "PUBLICATION" && input.indexing === "NONE") throw new RuleRefusal("iqac.refuseIndexing", 422, undefined, "indexing");
  /*
   * THE DEPARTMENT IS CHECKED, not stored as sent (owner's item 14, 1 Nov 2026): ResearchItem.departmentId has no
   * foreign key, and the HOD's register reads every item filed under their department, so an unchecked id let a
   * teacher place their item in any department's register. The desk names any department of this college; a
   * teacher one they belong to or head. Anything else is 422 on departmentId.
   */
  if (input.departmentId) {
    const department = await db.department.findFirst({ where: { id: input.departmentId, schoolId: actor.schoolId }, select: { id: true } });
    const own = department && TEACHERS.includes(actor.role) ? (await departmentsOfTeacher(actor.schoolId, actor.membershipId)).includes(department.id) : Boolean(department);
    if (!own) throw new RuleRefusal("iqac.refuseDepartment", 422, undefined, "departmentId");
  }
  const fileId = await spendFile(actor, input.fileId, "RESEARCH", input.title);
  const row = await db.researchItem.create({ data: { schoolId: actor.schoolId, kind: input.kind, title: input.title, indexing: input.kind === "PUBLICATION" ? input.indexing : "NONE", year: input.year, amountLakhs: input.amountLakhs, facultyMembershipId, departmentId: input.departmentId, fileId, createdByUserId: actor.userId }, select: { id: true } });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.research.add", targetType: "ResearchItem", targetId: row.id, meta: { kind: input.kind, year: input.year } });
  return researchRegister(ctx);
}

export async function removeResearchItem(ctx: ActiveContext, itemId: string) {
  const actor = await iqacActor(ctx, [...DESK_WRITE, ...TEACHERS]);
  const item = await db.researchItem.findFirst({ where: { id: itemId, schoolId: actor.schoolId }, select: { id: true, facultyMembershipId: true } });
  if (!item || (TEACHERS.includes(actor.role) && item.facultyMembershipId !== actor.membershipId)) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  await db.researchItem.delete({ where: { id: item.id } });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.research.remove", targetType: "ResearchItem", targetId: item.id, meta: {} });
  return researchRegister(ctx);
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                  */
/* -------------------------------------------------------------------------- */

export async function listActivities(ctx: ActiveContext) {
  const actor = await iqacActor(ctx, [...DESK_READ, "HOD"]);
  let where: Record<string, unknown> = { schoolId: actor.schoolId };
  if (actor.role === "HOD") {
    const d = await departmentOf(actor.schoolId, actor.membershipId);
    where = { schoolId: actor.schoolId, OR: [{ departmentId: { in: d.departmentIds } }, { createdByUserId: actor.userId }] };
  }
  const rows = await db.activity.findMany({ where, orderBy: { at: "desc" }, take: 500, select: { id: true, kind: true, title: true, at: true, participants: true, participantIdsJson: true, theme: true, departmentId: true, fileId: true } });
  return { items: rows.map((a) => ({ id: a.id, kind: a.kind as never, title: a.title, at: a.at, participants: a.participants, staffParticipants: readJsonArray<string>(a.participantIdsJson).length, theme: (a.theme ?? null) as never, departmentId: a.departmentId, fileId: a.fileId })), canEdit: [...DESK_WRITE, "HOD"].includes(actor.role) };
}

export async function addActivity(ctx: ActiveContext, input: z.infer<typeof activitySaveSchema>) {
  const actor = await iqacActor(ctx, [...DESK_WRITE, "HOD"]);
  if (input.kind === "CAPACITY_BUILDING" && !input.theme) throw new RuleRefusal("iqac.refuseTheme", 422, undefined, "theme");
  const staff = input.participantMembershipIds.length ? await db.membership.findMany({ where: { id: { in: input.participantMembershipIds }, schoolId: actor.schoolId }, select: { id: true } }) : [];
  if (staff.length !== new Set(input.participantMembershipIds).size) throw new RuleRefusal("iqac.refuseParticipants", 422, undefined, "participantMembershipIds");
  let departmentId = input.departmentId;
  if (actor.role === "HOD") {
    const d = await departmentOf(actor.schoolId, actor.membershipId);
    departmentId = departmentId && d.departmentIds.includes(departmentId) ? departmentId : (d.departmentIds[0] ?? null);
  }
  const fileId = await spendFile(actor, input.fileId, "ACTIVITY", input.title);
  const row = await db.activity.create({ data: { schoolId: actor.schoolId, kind: input.kind, title: input.title, at: input.at, participants: Math.max(input.participants, staff.length), participantIdsJson: JSON.stringify(staff.map((s) => s.id)), theme: input.kind === "CAPACITY_BUILDING" ? input.theme : null, departmentId, fileId, createdByUserId: actor.userId }, select: { id: true } });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.activity.add", targetType: "Activity", targetId: row.id, meta: { kind: input.kind, at: input.at } });
  return listActivities(ctx);
}

/* -------------------------------------------------------------------------- */
/* Committees and minutes                                                      */
/* -------------------------------------------------------------------------- */

export async function listCommittees(ctx: ActiveContext) {
  const actor = await iqacActor(ctx, DESK_READ);
  const rows = await db.committee.findMany({ where: { schoolId: actor.schoolId }, orderBy: [{ kind: "asc" }, { name: "asc" }], select: { id: true, kind: true, name: true, membersJson: true, meetings: { orderBy: { at: "desc" }, take: 50, select: { id: true, at: true, minutesFileId: true, actionTaken: true } } } });
  return {
    items: rows.map((c) => ({ id: c.id, kind: c.kind as never, name: c.name, members: readJsonArray<{ name: string; role: string; membershipId: string | null }>(c.membersJson), meetings: c.meetings })),
    canEdit: actor.role === "ADMIN",
  };
}

export async function saveCommittee(ctx: ActiveContext, input: z.infer<typeof committeeSaveSchema>, committeeId?: string) {
  const actor = await iqacActor(ctx, ["ADMIN"]);
  // The student council is kept on its own page with its members' accounts (council-notices.ts `saveCouncil`, its one writer):
  // a committee written here names its members as text, which would take away the council's right to post (risks batch 5A).
  if (input.kind === "STUDENT_COUNCIL" || (committeeId && (await db.committee.findFirst({ where: { id: committeeId, schoolId: actor.schoolId, kind: "STUDENT_COUNCIL" }, select: { id: true } })))) throw new RuleRefusal("councilNotices.refuseKeptOnCouncilPage", 422, undefined, "kind");
  const ids = input.members.map((m) => m.membershipId).filter((x): x is string => !!x);
  if (ids.length) {
    const found = await db.membership.count({ where: { id: { in: ids }, schoolId: actor.schoolId } });
    if (found !== new Set(ids).size) throw new RuleRefusal("iqac.refuseParticipants", 422, undefined, "members");
  }
  const data = { kind: input.kind, name: input.name, membersJson: JSON.stringify(input.members) };
  let id = committeeId;
  if (id) {
    const c = await db.committee.findFirst({ where: { id, schoolId: actor.schoolId }, select: { id: true } });
    if (!c) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
    await db.committee.update({ where: { id }, data });
  } else id = (await db.committee.create({ data: { schoolId: actor.schoolId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.committee.save", targetType: "Committee", targetId: id, meta: { kind: input.kind, members: input.members.length } });
  return listCommittees(ctx);
}

/** Minutes of a meeting: the office for any committee, the IQAC for its own cell's. */
export async function addMeeting(ctx: ActiveContext, committeeId: string, input: z.infer<typeof committeeMeetingSaveSchema>) {
  const actor = await iqacActor(ctx, ["ADMIN", "IQAC"]);
  const c = await db.committee.findFirst({ where: { id: committeeId, schoolId: actor.schoolId }, select: { id: true, kind: true, name: true } });
  if (!c) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (actor.role === "IQAC" && c.kind !== "IQAC") throw new AccessError("iqac.refuseOnlyIqacMinutes");
  const minutesFileId = await spendFile(actor, input.minutesFileId, "MINUTES", `${c.name} ${input.at}`);
  const m = await db.committeeMeeting.create({ data: { schoolId: actor.schoolId, committeeId, at: input.at, minutesFileId, actionTaken: input.actionTaken, createdByUserId: actor.userId }, select: { id: true } });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.meeting.add", targetType: "CommitteeMeeting", targetId: m.id, meta: { committee: c.kind, at: input.at } });
  return listCommittees(ctx);
}

/* -------------------------------------------------------------------------- */
/* Surveys                                                                     */
/* -------------------------------------------------------------------------- */

const ANONYMOUS = (kind: string) => kind !== "COURSE_FEEDBACK";
/** Who answers each kind: an EMPLOYER's form is transcribed by the desk. */
const RESPONDENT_ROLE: Record<SurveyKind, Role | null> = { SSS: "STUDENT", COURSE_FEEDBACK: "STUDENT", EXIT: "STUDENT", ALUMNI: "ALUMNUS", PARENT: "PARENT", TEACHER: "FACULTY", EMPLOYER: null };

function statusOf(s: { opensOn: string; closesOn: string; closedAt: Date | null }, today: string): "UPCOMING" | "OPEN" | "CLOSED" {
  if (s.closedAt || s.closesOn < today) return "CLOSED";
  return s.opensOn > today ? "UPCOMING" : "OPEN";
}

const SURVEY_SELECT = { id: true, kind: true, title: true, opensOn: true, closesOn: true, offeringId: true, closedAt: true, salt: true, schoolId: true, questionsJson: true, _count: { select: { responses: true } }, atr: { select: { publishedAt: true, text: true, fileId: true } } } as const;
type SurveyRow = { id: string; kind: string; title: string; opensOn: string; closesOn: string; offeringId: string | null; closedAt: Date | null; salt: string; schoolId: string; questionsJson: string; _count: { responses: number }; atr: { publishedAt: Date | null; text: string; fileId: string | null } | null };

function surveyView(s: SurveyRow, today: string) {
  return { id: s.id, kind: s.kind as SurveyKind, title: s.title, opensOn: s.opensOn, closesOn: s.closesOn, offeringId: s.offeringId, status: statusOf(s, today), responses: s._count.responses, anonymous: ANONYMOUS(s.kind), atrPublishedAt: s.atr?.publishedAt?.toISOString() ?? null };
}

export async function listSurveys(ctx: ActiveContext) {
  const desk = await iqacActor(ctx, DESK_READ);
  const today = todayKey(await zoneOf(desk.schoolId));
  const rows = await db.survey.findMany({ where: { schoolId: desk.schoolId }, orderBy: { opensOn: "desc" }, take: 200, select: SURVEY_SELECT });
  return { items: rows.map((s) => surveyView(s, today)), canEdit: DESK_WRITE.includes(desk.role) };
}

export async function createSurvey(ctx: ActiveContext, input: z.infer<typeof surveySaveSchema>) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  // NO KEY, NO ANONYMOUS SURVEY (G4-3, risks batch 5 Oct 2026; 08's recommended option). Without FEES_SECRET_KEY the
  // respondent hash is keyed on the survey's salt alone, which sits in the same row: anyone with the database could
  // hash each member against it until the survey closes and match answers to people. Opening one is refused with a
  // sentence; a survey already open keeps the salt-only hash it was opened with (respondentHash) until it closes.
  if (ANONYMOUS(input.kind) && !readFeesSecretKey().ok) throw new RuleRefusal("riskDecisions.refuseSurveyNoKey", 409);
  if (input.closesOn < input.opensOn) throw new RuleRefusal("iqac.refuseWindow", 422, undefined, "closesOn");
  if (input.kind === "COURSE_FEEDBACK") {
    if (!input.offeringId) throw new RuleRefusal("iqac.refuseOffering", 422, undefined, "offeringId");
    const o = await db.courseOffering.findFirst({ where: { id: input.offeringId, schoolId: desk.schoolId }, select: { id: true } });
    if (!o) throw new RuleRefusal("iqac.refuseOffering", 422, undefined, "offeringId");
  }
  const s = await db.survey.create({ data: { schoolId: desk.schoolId, kind: input.kind, title: input.title, opensOn: input.opensOn, closesOn: input.closesOn, offeringId: input.kind === "COURSE_FEEDBACK" ? input.offeringId : null, termId: input.termId, questionsJson: JSON.stringify(SURVEY_QUESTIONS[input.kind]), salt: randomBytes(16).toString("hex"), createdByUserId: desk.userId }, select: { id: true } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.survey.open", targetType: "Survey", targetId: s.id, meta: { kind: input.kind, closesOn: input.closesOn } });
  return listSurveys(ctx);
}

/** Close a survey now; the salt is wiped, so no answer can be matched to a person afterwards even with the database in hand. */
export async function closeSurvey(ctx: ActiveContext, surveyId: string) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  const s = await db.survey.findFirst({ where: { id: surveyId, schoolId: desk.schoolId }, select: { id: true, closedAt: true } });
  if (!s) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (!s.closedAt) {
    await db.survey.update({ where: { id: surveyId }, data: { closedAt: new Date(), salt: "" } });
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.survey.close", targetType: "Survey", targetId: surveyId, meta: {} });
  }
  return listSurveys(ctx);
}

/**
 * The college's own working days from a day on (G4-17, risks batch 5 Oct 2026): its teaching week and the closing
 * holidays of the next year, for the grievance limit and any other count of working days (iqac-rules.ts addWorkingDays).
 */
export async function workingCalendar(schoolId: string, fromKey: string): Promise<WorkingCalendar> {
  const [school, spans] = await Promise.all([db.school.findUnique({ where: { id: schoolId }, select: { teachingDays: true } }), listHolidays(schoolId, { fromKey, toKey: addDaysToKey(fromKey, 366) })]);
  return { teachingDays: parseTeachingDays(school?.teachingDays), closed: closedDayKeys(spans) };
}

/**
 * The respondent's hash: HMAC-SHA256 of the survey and the membership under
 * a key derived from the operator's FEES_SECRET_KEY (kept out of the
 * database) and the survey's own salt. With the key absent (a development
 * machine), the salt alone, which is wiped at close.
 */
export function respondentHash(surveyId: string, membershipId: string, salt: string): string {
  const read = readFeesSecretKey();
  const key = read.ok ? Buffer.from(hkdfSync("sha256", read.key, Buffer.from(salt || "closed"), Buffer.from("iqac-respondent"), 32)) : Buffer.from(salt || "closed");
  return createHmac("sha256", key).update(`${surveyId}:${membershipId}`).digest("hex");
}

/** Who may read a survey's aggregates: the desk always; for course feedback, the offering's own teacher and the department's HOD. */
async function mayReadResults(ctx: ActiveContext, survey: { kind: string; offeringId: string | null }): Promise<Desk> {
  const actor = await iqacActor(ctx, [...DESK_READ, ...TEACHERS]);
  if (DESK_READ.includes(actor.role)) return actor;
  if (survey.kind !== "COURSE_FEEDBACK" || !survey.offeringId) throw new AccessError("access.wrongRoleForThisAction");
  const o = await db.courseOffering.findFirst({ where: { id: survey.offeringId, schoolId: actor.schoolId }, select: { facultyMembershipId: true } });
  if (o?.facultyMembershipId === actor.membershipId) return actor;
  if (actor.role === "HOD" && o?.facultyMembershipId && (await departmentOf(actor.schoolId, actor.membershipId)).facultyIds.includes(o.facultyMembershipId)) return actor;
  throw new AccessError("access.wrongRoleForThisAction");
}

export async function surveyResults(ctx: ActiveContext, surveyId: string) {
  if (!ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  const pre = await db.survey.findFirst({ where: { id: surveyId, schoolId: ctx.schoolId }, select: { kind: true, offeringId: true } });
  if (!pre) {
    await iqacActor(ctx, [...DESK_READ, ...TEACHERS]);
    throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  }
  const actor = await mayReadResults(ctx, pre);
  const t = await getT();
  const s = (await db.survey.findFirst({ where: { id: surveyId, schoolId: actor.schoolId }, select: SURVEY_SELECT }))!;
  const today = todayKey(await zoneOf(actor.schoolId));
  const responses = await db.surveyResponse.findMany({ where: { surveyId }, select: { answersJson: true } });
  const answers = responses.map((r) => JSON.parse(r.answersJson) as Record<string, number>);
  const suppressed = answers.length < SURVEY_MIN_RESPONSES;
  const questions = readJsonArray<string>(s.questionsJson);
  const agg = aggregate(questions, suppressed ? [] : answers);
  return {
    survey: surveyView(s, today),
    questions: agg.map((q) => ({ code: q.code, label: questionLabel(t, s.kind, q.code), mean: q.mean, counts: q.counts })),
    overall: suppressed ? null : overallMean(answers),
    suppressed,
    atr: s.atr ? { text: s.atr.text, fileId: s.atr.fileId, publishedAt: s.atr.publishedAt?.toISOString() ?? null } : null,
  };
}

export function questionLabel(t: Translate, kind: string, code: string): string {
  return kind === "SSS" ? t(`iqac.sss.${code}` as TranslationKey) : t(`iqac.q.${code}` as TranslationKey);
}

/** The action-taken report on a survey; `publish` shows it to everyone the survey asked. */
export async function saveActionTaken(ctx: ActiveContext, surveyId: string, input: z.infer<typeof actionTakenSaveSchema>) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  const s = await db.survey.findFirst({ where: { id: surveyId, schoolId: desk.schoolId }, select: { id: true, title: true } });
  if (!s) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  const fileId = await spendFile(desk, input.fileId, "ATR", s.title);
  const data = { text: input.text, fileId, publishedAt: input.publish ? new Date() : null };
  const row = await db.actionTakenReport.upsert({ where: { surveyId }, create: { schoolId: desk.schoolId, surveyId, createdByUserId: desk.userId, ...data }, update: data, select: { id: true } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: input.publish ? "iqac.atr.publish" : "iqac.atr.save", targetType: "ActionTakenReport", targetId: row.id, meta: { surveyId } });
  return surveyResults(ctx, surveyId);
}

/** An employer's (or any paper) form, typed in by the desk: a response of its own, with where it came from. */
export async function transcribeResponse(ctx: ActiveContext, surveyId: string, input: { answers: Record<string, number>; source: string }) {
  const desk = await iqacActor(ctx, DESK_WRITE);
  const s = await db.survey.findFirst({ where: { id: surveyId, schoolId: desk.schoolId }, select: SURVEY_SELECT });
  if (!s) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (s.kind !== "EMPLOYER" && s.kind !== "PARENT") throw new RuleRefusal("iqac.refuseTranscribe", 422);
  const answers = checkedAnswers(readJsonArray<string>(s.questionsJson), input.answers);
  await db.surveyResponse.create({ data: { schoolId: desk.schoolId, surveyId, respondentHash: `paper_${randomBytes(12).toString("hex")}`, answersJson: JSON.stringify(answers), source: input.source } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.survey.transcribe", targetType: "Survey", targetId: surveyId, meta: { kind: s.kind } });
  return surveyResults(ctx, surveyId);
}

function checkedAnswers(questions: string[], answers: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of questions) {
    const v = answers[q];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 4) throw new RuleRefusal("iqac.refuseAnswers", 422, undefined, "answers");
    out[q] = v;
  }
  return out;
}

/**
 * The offering's INDIRECT attainment, for the academics builder's
 * `attainmentForOffering`: the mean answer to "the course met its stated
 * outcomes" across the offering's course-feedback surveys, on NBA's
 * three-level scale (0–4 × ¾). Null with fewer than SURVEY_MIN_RESPONSES.
 */
export async function indirectAttainment(offeringId: string): Promise<{ level: number | null; mean: number | null; responses: number }> {
  const surveys = await db.survey.findMany({ where: { offeringId, kind: "COURSE_FEEDBACK" }, select: { id: true } });
  const responses = surveys.length ? await db.surveyResponse.findMany({ where: { surveyId: { in: surveys.map((s) => s.id) } }, select: { answersJson: true } }) : [];
  const values = responses.map((r) => (JSON.parse(r.answersJson) as Record<string, number>).OUTCOMES).filter((v): v is number => typeof v === "number");
  if (values.length < SURVEY_MIN_RESPONSES) return { level: null, mean: null, responses: values.length };
  const mean = round2(values.reduce((a, b) => a + b, 0) / values.length);
  return { level: round2((mean * 3) / 4), mean, responses: values.length };
}

/**
 * The academics module's seam (academics-coursefile.ts `indirectAttainment`):
 * the course-exit level for each course outcome of an offering. The course
 * feedback asks once whether the course met its stated outcomes, so every
 * outcome of the course takes the offering's one indirect level; an empty map
 * below five answers, which leaves the attainment direct-only.
 */
export async function indirectLevelsByOutcome(offeringId: string): Promise<Map<string, number>> {
  const { level } = await indirectAttainment(offeringId);
  if (level === null) return new Map();
  const o = await db.courseOffering.findUnique({ where: { id: offeringId }, select: { course: { select: { outcomes: true } } } });
  const outcomes = readJsonArray<{ code?: string }>(o?.course.outcomes).map((x) => x.code).filter((c): c is string => !!c);
  return new Map(outcomes.map((code) => [code, level]));
}

/* -------------------------------------------------------------------------- */
/* The respondent's side: the student's voice                                   */
/* -------------------------------------------------------------------------- */

const VOICE_ROLES: readonly Role[] = ["STUDENT", "ALUMNUS", "FACULTY", "HOD"];

async function eligibleSurveys(actor: Desk, today: string): Promise<SurveyRow[]> {
  const kinds: SurveyKind[] = actor.role === "STUDENT" ? ["SSS", "EXIT", "COURSE_FEEDBACK"] : actor.role === "ALUMNUS" ? ["ALUMNI"] : ["TEACHER"];
  const rows = await db.survey.findMany({ where: { schoolId: actor.schoolId, kind: { in: kinds }, opensOn: { lte: today }, closesOn: { gte: today }, closedAt: null }, orderBy: { closesOn: "asc" }, select: SURVEY_SELECT });
  if (actor.role !== "STUDENT") return rows;
  const offerings = rows.filter((s) => s.kind === "COURSE_FEEDBACK" && s.offeringId).map((s) => s.offeringId!);
  // A current registration only: a student who DROPPED the course neither sees nor answers its feedback (owner's item 14).
  const mine = offerings.length ? new Set((await db.courseRegistration.findMany({ where: { studentMembershipId: actor.membershipId, offeringId: { in: offerings }, status: "REGISTERED" }, select: { offeringId: true } })).map((r) => r.offeringId)) : new Set<string>();
  return rows.filter((s) => s.kind !== "COURSE_FEEDBACK" || (s.offeringId && mine.has(s.offeringId)));
}

export async function myVoice(ctx: ActiveContext) {
  if (ctx.role === "PARENT") return parentVoice(ctx);
  const actor = await iqacActor(ctx, VOICE_ROLES);
  const t = await getT();
  const today = todayKey(await zoneOf(actor.schoolId));
  const surveys = await eligibleSurveys(actor, today);
  const hashes = surveys.map((s) => respondentHash(s.id, actor.membershipId, s.salt));
  const answered = new Set((await db.surveyResponse.findMany({ where: { surveyId: { in: surveys.map((s) => s.id) }, respondentHash: { in: hashes } }, select: { surveyId: true } })).map((r) => r.surveyId));
  const grievances = actor.role === "STUDENT" ? await db.grievance.findMany({ where: { byMembershipId: actor.membershipId }, orderBy: { filedAt: "desc" }, select: { id: true, kind: true, text: true, status: true, filedAt: true, dueOn: true, response: true, escalatedAt: true } }) : [];
  return {
    surveys: surveys.map((s) => ({ id: s.id, kind: s.kind as SurveyKind, title: s.title, closesOn: s.closesOn, answered: answered.has(s.id), questions: readJsonArray<string>(s.questionsJson).map((code) => ({ code, label: questionLabel(t, s.kind, code) })) })),
    grievances: grievances.map((g) => ({ id: g.id, kind: g.kind as never, text: g.text, status: g.status as never, filedAt: g.filedAt.toISOString(), dueOn: g.dueOn, overdue: g.status !== "RESOLVED" && g.dueOn < today, response: g.response, escalatedAt: g.escalatedAt?.toISOString() ?? null })),
    canFileGrievance: actor.role === "STUDENT",
  };
}

/** One answer per person per survey; an anonymous survey stores no membership id at all. */
export async function answerSurvey(ctx: ActiveContext, surveyId: string, answers: Record<string, number>) {
  if (ctx.role === "PARENT") return answerAsParent(ctx, surveyId, answers);
  const actor = await iqacActor(ctx, VOICE_ROLES);
  const today = todayKey(await zoneOf(actor.schoolId));
  const survey = (await eligibleSurveys(actor, today)).find((s) => s.id === surveyId);
  if (!survey) throw new AccessError("iqac.refuseNotYourSurvey", "NOT_FOUND");
  const role = RESPONDENT_ROLE[survey.kind as SurveyKind];
  if (role && role !== actor.role && !(role === "FACULTY" && actor.role === "HOD")) throw new AccessError("iqac.refuseNotYourSurvey", "NOT_FOUND");
  const clean = checkedAnswers(readJsonArray<string>(survey.questionsJson), answers);
  const hash = respondentHash(survey.id, actor.membershipId, survey.salt);
  try {
    await db.surveyResponse.create({ data: { schoolId: actor.schoolId, surveyId, respondentHash: hash, respondentMembershipId: ANONYMOUS(survey.kind) ? null : actor.membershipId, answersJson: JSON.stringify(clean) } });
  } catch {
    throw new RuleRefusal("iqac.refuseAnswered", 409);
  }
  // No audit row names the respondent of an anonymous survey: the log would undo the anonymity.
  if (!ANONYMOUS(survey.kind)) await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.survey.answer", targetType: "Survey", targetId: surveyId, meta: {} });
  return myVoice(ctx);
}

/* -------------------------------------------------------------------------- */
/* The parents' and the employers' voice (G-5, 4 Oct 2026)                      */
/* -------------------------------------------------------------------------- */

/**
 * PARENT and EMPLOYER were survey kinds nobody could answer: the voice doors
 * took students, alumni and faculty, and both kinds were "transcribed by the
 * desk". Now a guardian answers the open PARENT surveys of each college or
 * school a child of theirs is at, through the same voice doors (a guardian
 * belongs to no school, so the surveys are those of the children's schools,
 * with IQAC on); and anyone the desk hands a link — an employer, a parent
 * without an account — answers one survey once through a signed link,
 * signed out, rate-limited at the door. Both are anonymous as the kinds are:
 * the respondent hash is keyed as the members' is and no name is kept.
 */
const LINK_KINDS: readonly SurveyKind[] = ["EMPLOYER", "PARENT"];

async function parentSchools(ctx: ActiveContext): Promise<string[]> {
  const rows = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentSchoolId: true }, distinct: ["studentSchoolId"] });
  const out: string[] = [];
  for (const r of rows) if (await isModuleOn(r.studentSchoolId, "IQAC")) out.push(r.studentSchoolId);
  return out;
}

async function openParentSurveys(ctx: ActiveContext): Promise<SurveyRow[]> {
  const out: SurveyRow[] = [];
  for (const schoolId of await parentSchools(ctx)) {
    const today = todayKey(await zoneOf(schoolId));
    out.push(...(await db.survey.findMany({ where: { schoolId, kind: "PARENT", opensOn: { lte: today }, closesOn: { gte: today }, closedAt: null }, orderBy: { closesOn: "asc" }, select: SURVEY_SELECT })));
  }
  return out;
}

async function parentVoice(ctx: ActiveContext) {
  const t = await getT();
  const surveys = await openParentSurveys(ctx);
  const hashes = surveys.map((s) => respondentHash(s.id, `parent:${ctx.user.id}`, s.salt));
  const answered = new Set(surveys.length ? (await db.surveyResponse.findMany({ where: { surveyId: { in: surveys.map((s) => s.id) }, respondentHash: { in: hashes } }, select: { surveyId: true } })).map((r) => r.surveyId) : []);
  return {
    surveys: surveys.map((s) => ({ id: s.id, kind: s.kind as SurveyKind, title: s.title, closesOn: s.closesOn, answered: answered.has(s.id), questions: readJsonArray<string>(s.questionsJson).map((code) => ({ code, label: questionLabel(t, s.kind, code) })) })),
    grievances: [],
    canFileGrievance: false,
  };
}

async function answerAsParent(ctx: ActiveContext, surveyId: string, answers: Record<string, number>) {
  const survey = (await openParentSurveys(ctx)).find((s) => s.id === surveyId);
  if (!survey) throw new AccessError("iqac.refuseNotYourSurvey", "NOT_FOUND");
  const clean = checkedAnswers(readJsonArray<string>(survey.questionsJson), answers);
  try {
    await db.surveyResponse.create({ data: { schoolId: survey.schoolId, surveyId, respondentHash: respondentHash(survey.id, `parent:${ctx.user.id}`, survey.salt), respondentMembershipId: null, answersJson: JSON.stringify(clean), source: "parent" } });
  } catch {
    throw new RuleRefusal("iqac.refuseAnswered", 409);
  }
  return parentVoice(ctx);
}

/** The link's signing key: derived from the operator's key and the survey's salt, so closing the survey (which wipes the salt) kills every link. */
function linkKey(salt: string): Buffer {
  const read = readFeesSecretKey();
  return read.ok ? Buffer.from(hkdfSync("sha256", read.key, Buffer.from(salt || "closed"), Buffer.from("iqac-survey-link"), 32)) : Buffer.from(`link:${salt || "closed"}`);
}
const linkSig = (salt: string, schoolId: string, surveyId: string, nonce: string) => createHmac("sha256", linkKey(salt)).update(`${schoolId}.${surveyId}.${nonce}`).digest("base64url");

/** The desk makes one link for one respondent of an EMPLOYER or PARENT survey: one answer per link. */
export async function makeSurveyLink(ctx: ActiveContext, surveyId: string): Promise<{ token: string; path: string }> {
  const desk = await iqacActor(ctx, DESK_WRITE);
  const s = await db.survey.findFirst({ where: { id: surveyId, schoolId: desk.schoolId }, select: { id: true, kind: true, salt: true, closedAt: true } });
  if (!s) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (!LINK_KINDS.includes(s.kind as SurveyKind)) throw new RuleRefusal("iqac.refuseLinkKind", 422);
  if (s.closedAt || !s.salt) throw new RuleRefusal("iqac.refuseLinkClosed", 409);
  const nonce = randomBytes(12).toString("base64url");
  const token = `${desk.schoolId}.${s.id}.${nonce}.${linkSig(s.salt, desk.schoolId, s.id, nonce)}`;
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.survey.link", targetType: "Survey", targetId: s.id, meta: { kind: s.kind } });
  return { token, path: `/survey/${token}` };
}

type LinkedSurvey = { survey: SurveyRow; nonce: string };

/** A link read back: the survey it was signed for, open today, or null for anything else (a forged, closed or wrong link reads the same). */
async function linkedSurvey(token: string): Promise<LinkedSurvey | null> {
  const parts = token.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^[A-Za-z0-9_-]{8,64}$/.test(p))) return null;
  const [schoolId, surveyId, nonce, sig] = parts as [string, string, string, string];
  return forSchool(schoolId, async () => {
    const survey = await db.survey.findFirst({ where: { id: surveyId, schoolId }, select: SURVEY_SELECT });
    if (!survey || !LINK_KINDS.includes(survey.kind as SurveyKind) || !survey.salt) return null;
    const want = Buffer.from(linkSig(survey.salt, schoolId, surveyId, nonce));
    const got = Buffer.from(sig);
    if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
    if (statusOf(survey, todayKey(await zoneOf(schoolId))) !== "OPEN") return null;
    return { survey, nonce };
  });
}

/** What a signed-out respondent sees: the survey's title and questions, and whether this link has been answered. */
export async function linkSurveyView(token: string, t: Translate): Promise<{ title: string; kind: SurveyKind; closesOn: string; answered: boolean; questions: { code: string; label: string }[] } | null> {
  const linked = await linkedSurvey(token);
  if (!linked) return null;
  const { survey, nonce } = linked;
  const answered = await forSchool(survey.schoolId, () => db.surveyResponse.findFirst({ where: { surveyId: survey.id, respondentHash: respondentHash(survey.id, `link:${nonce}`, survey.salt) }, select: { id: true } }));
  return { title: survey.title, kind: survey.kind as SurveyKind, closesOn: survey.closesOn, answered: Boolean(answered), questions: readJsonArray<string>(survey.questionsJson).map((code) => ({ code, label: questionLabel(t, survey.kind, code) })) };
}

/** A signed-out respondent answers once through their link. */
export async function answerByLink(token: string, answers: Record<string, number>, t: Translate) {
  const linked = await linkedSurvey(token);
  if (!linked) throw new AccessError("iqac.refuseNotYourSurvey", "NOT_FOUND");
  const { survey, nonce } = linked;
  const clean = checkedAnswers(readJsonArray<string>(survey.questionsJson), answers);
  try {
    await forSchool(survey.schoolId, () => db.surveyResponse.create({ data: { schoolId: survey.schoolId, surveyId: survey.id, respondentHash: respondentHash(survey.id, `link:${nonce}`, survey.salt), respondentMembershipId: null, answersJson: JSON.stringify(clean), source: "link" } }));
  } catch {
    throw new RuleRefusal("iqac.refuseAnswered", 409);
  }
  return (await linkSurveyView(token, t))!;
}

/* -------------------------------------------------------------------------- */
/* Grievances                                                                  */
/* -------------------------------------------------------------------------- */

const COMMITTEE_FOR: Record<string, "GRIEVANCE" | "ANTI_RAGGING" | "ICC"> = { RAGGING: "ANTI_RAGGING", HARASSMENT: "ICC" };
/** Grievances whose words stay with the office and the head: ragging and harassment. The IQAC counts them and reads nothing more. */
const CONFIDENTIAL = new Set(["ANTI_RAGGING", "ICC"]);

export async function fileGrievance(ctx: ActiveContext, input: z.infer<typeof grievanceFileSchema>) {
  const actor = await iqacActor(ctx, ["STUDENT"]);
  const today = todayKey(await zoneOf(actor.schoolId));
  const committeeKind = COMMITTEE_FOR[input.kind] ?? "GRIEVANCE";
  const fileId = await spendFile(actor, input.fileId, "GRIEVANCE", input.kind);
  const g = await db.grievance.create({ data: { schoolId: actor.schoolId, byMembershipId: actor.membershipId, kind: input.kind, committeeKind, text: input.text, fileId, anonymousToStaff: input.anonymousToStaff, dueOn: addWorkingDays(today, GRIEVANCE_LIMIT_WORKING_DAYS, await workingCalendar(actor.schoolId, today)) }, select: { id: true, dueOn: true } });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.grievance.file", targetType: "Grievance", targetId: g.id, meta: { kind: input.kind, committee: committeeKind, dueOn: g.dueOn } });
  const office = await db.membership.findMany({ where: { schoolId: actor.schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } });
  for (const o of office) await notify({ userId: o.userId, schoolId: actor.schoolId, kind: "SYSTEM", titleKey: "iqac.notifyGrievanceTitle", bodyKey: "iqac.notifyGrievanceBody", bodyVars: { due: g.dueOn }, url: "/iqac/grievances", urgent: input.kind === "RAGGING" });
  return myVoice(ctx);
}

/** The student's appeal to the Ombudsperson: once the committee is past its time limit, or after a resolution they do not accept. */
export async function escalateMyGrievance(ctx: ActiveContext, grievanceId: string, note: string) {
  const actor = await iqacActor(ctx, ["STUDENT"]);
  const g = await db.grievance.findFirst({ where: { id: grievanceId, byMembershipId: actor.membershipId }, select: { id: true, status: true, dueOn: true } });
  if (!g) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  const today = todayKey(await zoneOf(actor.schoolId));
  if (g.status === "ESCALATED") return myVoice(ctx);
  if (g.status !== "RESOLVED" && g.dueOn >= today) throw new RuleRefusal("iqac.refuseEscalateEarly", 409, { due: g.dueOn });
  await db.grievance.update({ where: { id: g.id }, data: { status: "ESCALATED", escalatedAt: new Date(), ombudspersonNote: note } });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.grievance.escalate", targetType: "Grievance", targetId: g.id, meta: { by: "student" } });
  return myVoice(ctx);
}

export async function grievanceDesk(ctx: ActiveContext, month?: string) {
  const actor = await iqacActor(ctx, DESK_READ);
  const t = await getT();
  const today = todayKey(await zoneOf(actor.schoolId));
  const rows = await db.grievance.findMany({ where: { schoolId: actor.schoolId }, orderBy: { filedAt: "desc" }, take: 500, select: { id: true, kind: true, committeeKind: true, text: true, status: true, filedAt: true, dueOn: true, response: true, ombudspersonNote: true, anonymousToStaff: true, resolvedAt: true, escalatedAt: true, fileId: true, by: { select: { user: { select: { name: true } } } } } });
  const office = actor.role === "ADMIN" || actor.role === "PRINCIPAL";
  const m = month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const inMonth = rows.filter((g) => g.filedAt.toISOString().slice(0, 7) === m);
  return {
    items: rows.map((g) => {
      const hidden = !office && CONFIDENTIAL.has(g.committeeKind);
      return {
        id: g.id,
        kind: g.kind as never,
        text: hidden ? t("iqac.grievanceConfidential") : g.text,
        by: hidden || (g.anonymousToStaff && !office) ? t("iqac.grievanceNameWithheld") : g.by.user.name,
        status: g.status as never,
        filedAt: g.filedAt.toISOString(),
        dueOn: g.dueOn,
        overdue: g.status !== "RESOLVED" && g.status !== "ESCALATED" && g.dueOn < today,
        response: hidden ? "" : g.response,
        ombudspersonNote: hidden ? "" : g.ombudspersonNote,
        committee: g.committeeKind as never,
        fileId: hidden ? null : g.fileId,
      };
    }),
    summary: {
      month: m,
      filed: inMonth.length,
      resolved: inMonth.filter((g) => g.status === "RESOLVED").length,
      withinLimit: inMonth.filter((g) => g.resolvedAt && g.resolvedAt.toISOString().slice(0, 10) <= g.dueOn).length,
      overdue: inMonth.filter((g) => g.status !== "RESOLVED" && g.status !== "ESCALATED" && g.dueOn < today).length,
      escalated: inMonth.filter((g) => g.status === "ESCALATED").length,
      open: rows.filter((g) => g.status === "OPEN" || g.status === "ACKNOWLEDGED").length,
    },
    canAct: office,
  };
}

/** The office's and the head's: acknowledge, resolve with a response, or send to the Ombudsperson. The student is told each time. */
export async function actOnGrievance(ctx: ActiveContext, grievanceId: string, input: z.infer<typeof grievanceActionSchema>) {
  const actor = await iqacActor(ctx, ["ADMIN", "PRINCIPAL"]);
  const g = await db.grievance.findFirst({ where: { id: grievanceId, schoolId: actor.schoolId }, select: { id: true, status: true, by: { select: { userId: true } } } });
  if (!g) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  const now = new Date();
  const next = input.action === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : input.action === "RESOLVE" ? "RESOLVED" : "ESCALATED";
  if (g.status === "RESOLVED" && input.action !== "ESCALATE") throw new RuleRefusal("iqac.refuseGrievanceClosed", 409);
  if (g.status === "ESCALATED") throw new RuleRefusal("iqac.refuseGrievanceClosed", 409);
  const data =
    input.action === "ACKNOWLEDGE"
      ? { status: next, acknowledgedAt: now, response: input.note, decidedByUserId: actor.userId }
      : input.action === "RESOLVE"
        ? { status: next, resolvedAt: now, response: input.note, decidedByUserId: actor.userId }
        : { status: next, escalatedAt: now, ombudspersonNote: input.note, decidedByUserId: actor.userId };
  await db.grievance.update({ where: { id: g.id }, data });
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: `iqac.grievance.${input.action.toLowerCase()}`, targetType: "Grievance", targetId: g.id, meta: {} });
  await notify({ userId: g.by.userId, schoolId: actor.schoolId, kind: "SYSTEM", titleKey: `iqac.notifyGrievance${input.action === "ACKNOWLEDGE" ? "Ack" : input.action === "RESOLVE" ? "Resolved" : "Escalated"}` as TranslationKey, url: "/student/voice" });
  return grievanceDesk(ctx);
}

/* -------------------------------------------------------------------------- */
/* Faculty records                                                             */
/* -------------------------------------------------------------------------- */

const apiInputsOf = (raw: string) => {
  try {
    const v = JSON.parse(raw) as { teaching?: number; research?: number; service?: number };
    return { teaching: v.teaching ?? 0, research: v.research ?? 0, service: v.service ?? 0 };
  } catch {
    return { teaching: 0, research: 0, service: 0 };
  }
};

const apiScoreOf = (raw: string) => {
  try {
    const v = JSON.parse(raw) as { teaching?: number; research?: number; service?: number };
    return round2((v.teaching ?? 0) + (v.research ?? 0) + (v.service ?? 0));
  } catch {
    return 0;
  }
};

export async function facultyRecords(ctx: ActiveContext) {
  const actor = await iqacActor(ctx, DESK_READ);
  const [people, records, fdp, pubs, students] = await Promise.all([
    db.membership.findMany({ where: { schoolId: actor.schoolId, role: { in: [...TEACHERS, "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, orderBy: { user: { name: "asc" } }, select: { id: true, role: true, joinedAt: true, user: { select: { name: true } } } }),
    db.facultyRecord.findMany({ where: { schoolId: actor.schoolId } }),
    db.activity.findMany({ where: { schoolId: actor.schoolId, kind: "FDP" }, select: { participantIdsJson: true } }),
    db.researchItem.groupBy({ by: ["facultyMembershipId"], where: { schoolId: actor.schoolId, kind: "PUBLICATION" }, _count: { _all: true } }),
    db.membership.count({ where: { schoolId: actor.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
  ]);
  const rec = new Map(records.map((r) => [r.membershipId, r]));
  const fdpCount = new Map<string, number>();
  for (const a of fdp) for (const id of readJsonArray<string>(a.participantIdsJson)) fdpCount.set(id, (fdpCount.get(id) ?? 0) + 1);
  const pubCount = new Map(pubs.map((p) => [p.facultyMembershipId, p._count._all]));
  const now = Date.now();
  const items = people.map((p) => {
    const r = rec.get(p.id);
    const joined = r?.joinedOn ? Date.parse(`${r.joinedOn}T00:00:00Z`) : p.joinedAt.getTime();
    return {
      membershipId: p.id,
      name: p.user.name,
      role: p.role,
      designation: (r?.designation ?? null) as never,
      appointment: (r?.appointment ?? null) as never,
      highestQualification: (r?.highestQualification ?? null) as never,
      netSetQualified: r?.netSetQualified ?? false,
      experienceYears: r ? round2((r.experienceBeforeYears ?? 0) + Math.max(0, (now - joined) / (365.25 * 86_400_000))) : null,
      joinedOn: r?.joinedOn ?? null,
      departmentId: r?.departmentId ?? null,
      apaarFacultyId: r?.apaarFacultyId ?? null,
      panLast4: r?.panLast4 ?? null,
      apiScore: r ? apiScoreOf(r.apiScoreJson) : 0,
      experienceBeforeYears: r?.experienceBeforeYears ?? 0,
      apiScoreInputs: apiInputsOf(r?.apiScoreJson ?? "{}"),
      fdps: fdpCount.get(p.id) ?? 0,
      publications: pubCount.get(p.id) ?? 0,
      complete: !!r && !!r.joinedOn && !!r.panLast4,
    };
  });
  const fullTime = items.filter((i) => i.role !== "PRINCIPAL" && i.appointment !== "VISITING").length;
  return { items, canEdit: actor.role === "ADMIN", ratio: { students, fullTime } };
}

export async function saveFacultyRecord(ctx: ActiveContext, input: z.infer<typeof facultyRecordSaveSchema>) {
  const actor = await iqacActor(ctx, ["ADMIN"]);
  const m = await db.membership.findFirst({ where: { id: input.membershipId, schoolId: actor.schoolId, role: { in: [...TEACHERS, "PRINCIPAL"] } }, select: { id: true } });
  if (!m) throw new RuleRefusal("iqac.refuseNotTeacher", 422, undefined, "membershipId");
  if (input.pan && !sealingAvailable()) throw new RuleRefusal("iqac.refuseSealing", 422, undefined, "pan");
  const data = { designation: input.designation, appointment: input.appointment, highestQualification: input.highestQualification, netSetQualified: input.netSetQualified, experienceBeforeYears: input.experienceBeforeYears, joinedOn: input.joinedOn, departmentId: input.departmentId, apaarFacultyId: input.apaarFacultyId, apiScoreJson: JSON.stringify(input.apiScoreInputs), updatedByUserId: actor.userId };
  await db.facultyRecord.upsert({ where: { membershipId: m.id }, create: { schoolId: actor.schoolId, membershipId: m.id, ...data }, update: data });
  // The one writer (G4-14): the record's copy and payroll's, together.
  if (input.pan) await writePan({ kind: "STAFF", schoolId: actor.schoolId, membershipId: m.id }, input.pan);
  // The PAN never enters the log, sealed or not.
  await audit({ schoolId: actor.schoolId, actorUserId: actor.userId, action: "iqac.facultyRecord.save", targetType: "Membership", targetId: m.id, meta: { designation: input.designation, pan: Boolean(input.pan) } });
  return facultyRecords(ctx);
}

/** A faculty member's own profile: the record the office keeps, their research and FDPs. */
export async function myFacultyProfile(ctx: ActiveContext) {
  const actor = await iqacActor(ctx, TEACHERS);
  const all = await facultyRecordsUnchecked(actor.schoolId);
  return all.find((r) => r.membershipId === actor.membershipId) ?? null;
}

async function facultyRecordsUnchecked(schoolId: string) {
  const [people, records, fdp, pubs] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: { in: [...TEACHERS] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, joinedAt: true, user: { select: { name: true } } } }),
    db.facultyRecord.findMany({ where: { schoolId } }),
    db.activity.findMany({ where: { schoolId, kind: "FDP" }, select: { participantIdsJson: true } }),
    db.researchItem.groupBy({ by: ["facultyMembershipId"], where: { schoolId, kind: "PUBLICATION" }, _count: { _all: true } }),
  ]);
  const rec = new Map(records.map((r) => [r.membershipId, r]));
  return people.map((p) => {
    const r = rec.get(p.id);
    return { membershipId: p.id, name: p.user.name, role: p.role, designation: r?.designation ?? null, highestQualification: r?.highestQualification ?? null, netSetQualified: r?.netSetQualified ?? false, apiScore: r ? apiScoreOf(r.apiScoreJson) : 0, fdps: fdp.filter((a) => readJsonArray<string>(a.participantIdsJson).includes(p.id)).length, publications: pubs.find((x) => x.facultyMembershipId === p.id)?._count._all ?? 0 };
  });
}

/* -------------------------------------------------------------------------- */
/* The home                                                                    */
/* -------------------------------------------------------------------------- */

/** `applies`: the filings the college's streams bring (5 Oct 2026) — a law college is not shown AICTE's extension. */
function calendarFor(today: string, filedKinds: Set<string>, t: Translate, applies: readonly string[]): IqacOverview["calendar"] {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  return REGULATOR_CALENDAR.filter((c) => applies.includes(c.filing)).map((c) => {
    // The window's next (or current) occurrence: a range crossing the year end starts in the earlier year.
    const crosses = c.toMonth < c.fromMonth;
    let startYear = y;
    if (crosses ? m <= c.toMonth : false) startYear = y - 1;
    else if (!crosses && m > c.toMonth) startYear = y + 1;
    else if (crosses && m > c.toMonth && m < c.fromMonth) startYear = y;
    const endYear = crosses ? startYear + 1 : startYear;
    const last = new Date(Date.UTC(endYear, c.toMonth, 0)).getUTCDate();
    return { code: c.code, label: t(`iqac.calendar.${c.code}` as TranslationKey), from: `${startYear}-${String(c.fromMonth).padStart(2, "0")}-01`, to: `${endYear}-${String(c.toMonth).padStart(2, "0")}-${String(last).padStart(2, "0")}`, filing: c.filing, filedThisYear: filedKinds.has(c.filing) };
  }).sort((a, b) => a.from.localeCompare(b.from));
}

export async function iqacOverview(ctx: ActiveContext): Promise<IqacOverview> {
  const desk = await iqacActor(ctx, DESK_READ);
  const t = await getT();
  const today = todayKey(await zoneOf(desk.schoolId));
  const cycle = await db.accreditationCycle.findFirst({ where: { schoolId: desk.schoolId, status: { in: ["OPEN", "SUBMITTED"] } }, orderBy: { createdAt: "desc" }, select: CYCLE_SELECT });
  const year = Number(today.slice(0, 4));
  const [research, activities, committees, openSurveys, grievances, filings, disclosure] = await Promise.all([
    db.researchItem.count({ where: { schoolId: desk.schoolId } }),
    db.activity.count({ where: { schoolId: desk.schoolId } }),
    db.committee.count({ where: { schoolId: desk.schoolId } }),
    db.survey.count({ where: { schoolId: desk.schoolId, closedAt: null, opensOn: { lte: today }, closesOn: { gte: today } } }),
    db.grievance.findMany({ where: { schoolId: desk.schoolId, status: { in: ["OPEN", "ACKNOWLEDGED"] } }, select: { dueOn: true } }),
    db.collegeFiling.findMany({ where: { schoolId: desk.schoolId }, select: { kind: true, year: true, status: true } }),
    db.disclosurePage.findUnique({ where: { schoolId: desk.schoolId }, select: { publishedAt: true } }),
  ]);
  let predictor: IqacPredictor | null = null;
  if (cycle) predictor = await predictorFor(ctx, cycle.id);
  const gathered = cycle ? await gatherFacts(desk.schoolId, cycle.windowFrom, cycle.windowTo, readEntered(cycle.enteredJson)) : null;
  // NIRF's published formulas put together per parameter in ONE place (accreditation-insights.ts nirfScore, 5 Oct 2026),
  // which the NIRF insights and the simulator read too; with no cycle, every parameter reads no marks, as before.
  const scored = gathered ? nirfScore(await nirfFacts(desk.schoolId, gathered)) : null;
  const parameters = (scored?.parameters ?? NIRF_PARAMETERS.map((p) => ({ code: p.code, name: p.name, weight: p.weight, marks: null, covered: 0 }))).map((p) => ({ ...p, note: t("iqac.nirfCovered", { covered: p.covered, of: 100 }) }));
  const partial = scored?.partial ?? 0;
  const coveredMarks = scored?.coveredMarks ?? 0;
  const filedKinds = new Set(filings.filter((f) => f.year === year || f.year === year - 1).map((f) => f.kind));
  return {
    cycle: predictor?.cycle ?? null,
    nextBand: predictor?.nextBand ?? null,
    cheapest: predictor?.cheapest ?? [],
    counts: { research, activities, committees, openSurveys, openGrievances: grievances.length, overdueGrievances: grievances.filter((g) => g.dueOn < today).length, filings: filings.length, awaitingSignoff: filings.filter((f) => f.status === "AWAITING_SIGNOFF").length },
    calendar: calendarFor(today, filedKinds, t, applicableFilings(await streamsOf(desk.schoolId))),
    nirf: { partial, coveredMarks, parameters: parameters.map((p) => ({ code: p.code, name: p.name, weight: p.weight, marks: p.marks, note: p.note })) },
    disclosurePublishedAt: disclosure?.publishedAt?.toISOString() ?? null,
  };
}

/** For pages that only need to know whether to draw the IQAC's links. */
export async function iqacOn(schoolId: string | null | undefined): Promise<boolean> {
  return isModuleOn(schoolId, "IQAC");
}

export const iqacHash = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");
