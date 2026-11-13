import "server-only";
import {
  VISIT_ITEMS_MAX,
  VISIT_MAX_DAYS,
  VISIT_NAAC_CRITERIA,
  VISIT_NBA_CRITERIA,
  criterionOf,
  type PeerFramework,
  type VisitDetail,
  type VisitItemSave,
  type VisitItemView,
  type VisitList,
  type VisitSave,
  type VisitSummary,
  type VisitUpdate,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn } from "./modules";
import { readJson, writeJson } from "./json";
import { addDaysToKey } from "./dates";
import { nbaDepartments } from "./council-filings";
import type { ActiveContext } from "./session";

/**
 * THE PEER-TEAM VISIT FILE (the risks batch, R-2, 5 October 2026; module
 * IQAC). NAAC's peer team and NBA's expert team each come for two or three
 * days and ask, criterion by criterion, "where is the evidence?". This keeps
 * the visit's schedule and the evidence index in one place beside the SAR
 * pack, which is READ from the filings each time (never copied): for NAAC the
 * cycle's IIQA, SSR and AQARs with their state and hash and the cycle's CGPA;
 * for NBA the department's SAR of the visit's year and its marks.
 *
 * AN EVIDENCE LINE points at what already exists — a filing, an IQAC file, a
 * metric's latest score, the NBA worksheet — or at a link or a note; each is
 * resolved on read, and a line whose target is gone says MISSING, so the
 * index cannot quietly point at nothing on the day.
 *
 * WHO. The IQAC writes any visit; an HOD writes and reads the NBA visits of
 * the department they head; the principal and the office read every visit.
 * Every write is audited.
 */

type Desk = { schoolId: string; userId: string; role: string; membershipId: string; headOf: string[] };
const READERS = ["IQAC", "HOD", "PRINCIPAL", "ADMIN"];

async function deskOf(ctx: ActiveContext): Promise<Desk> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !READERS.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "IQAC");
  // Every department the HOD heads (TA-480: one person may head two).
  const headOf = ctx.role === "HOD" ? (await db.department.findMany({ where: { schoolId: ctx.schoolId, hodMembershipId: ctx.membershipId }, select: { id: true } })).map((x) => x.id) : [];
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, headOf };
}

/** Whether this desk may change this visit: the IQAC any, an HOD their own department's NBA visit. */
function canEdit(d: Desk, v: { framework: string; departmentId: string | null }): boolean {
  if (d.role === "IQAC") return true;
  return d.role === "HOD" && v.framework === "NBA" && !!v.departmentId && d.headOf.includes(v.departmentId);
}
function canRead(d: Desk, v: { framework: string; departmentId: string | null }): boolean {
  return d.role === "HOD" ? canEdit(d, v) : true;
}

type VisitRow = NonNullable<Awaited<ReturnType<typeof loadVisit>>>;
async function loadVisit(schoolId: string, visitId: string) {
  return db.peerTeamVisit.findFirst({ where: { id: visitId, schoolId }, include: { items: { orderBy: [{ kind: "asc" }, { dayKey: "asc" }, { startMinute: "asc" }, { position: "asc" }, { createdAt: "asc" }] } } });
}

async function departmentNames(schoolId: string, ids: (string | null)[]): Promise<Map<string, string>> {
  const want = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!want.length) return new Map();
  const rows = await db.department.findMany({ where: { schoolId, id: { in: want } }, select: { id: true, name: true } });
  return new Map(rows.map((r) => [r.id, r.name]));
}

function summaryOf(d: Desk, v: { id: string; framework: string; title: string; year: number; fromDate: string; toDate: string; status: string; departmentId: string | null; cycleId: string | null; items: { kind: string }[] }, departments: Map<string, string>): VisitSummary {
  return {
    id: v.id,
    framework: v.framework as PeerFramework,
    title: v.title,
    year: v.year,
    fromDate: v.fromDate,
    toDate: v.toDate,
    status: v.status as VisitSummary["status"],
    departmentId: v.departmentId,
    departmentName: v.departmentId ? (departments.get(v.departmentId) ?? null) : null,
    cycleId: v.cycleId,
    scheduleCount: v.items.filter((i) => i.kind === "SCHEDULE").length,
    evidenceCount: v.items.filter((i) => i.kind === "EVIDENCE").length,
    canEdit: canEdit(d, v),
  };
}

/** The visits the reader may see, the next first; what they may make. */
export async function listVisits(ctx: ActiveContext): Promise<VisitList> {
  const d = await deskOf(ctx);
  const rows = await db.peerTeamVisit.findMany({ where: { schoolId: d.schoolId, ...(d.role === "HOD" ? { framework: "NBA", departmentId: { in: d.headOf } } : {}) }, include: { items: { select: { kind: true } } }, orderBy: { fromDate: "desc" } });
  const departments = await departmentNames(d.schoolId, rows.map((r) => r.departmentId));
  const nba = await nbaDepartments(d.schoolId);
  const cycles = d.role === "HOD" ? [] : await db.accreditationCycle.findMany({ where: { schoolId: d.schoolId }, orderBy: { createdAt: "desc" }, select: { id: true, framework: true, windowFrom: true, windowTo: true } });
  return {
    visits: rows.map((r) => summaryOf(d, r, departments)),
    canCreateNaac: d.role === "IQAC",
    nbaDepartments: (d.role === "IQAC" ? nba : d.role === "HOD" ? nba.filter((x) => d.headOf.includes(x.id)) : []).map((x) => ({ id: x.id, name: x.name })),
    cycles: cycles.map((c) => ({ id: c.id, label: `${c.framework} ${c.windowFrom}–${c.windowTo}` })),
  };
}

function assertDates(from: string, to: string): void {
  if (to < from) throw new RuleRefusal("peerVisit.refuseDates", 422, undefined, "toDate");
  if (addDaysToKey(from, VISIT_MAX_DAYS) <= to) throw new RuleRefusal("peerVisit.refuseTooLong", 422, { days: VISIT_MAX_DAYS }, "toDate");
}

/** A visit: NAAC by the IQAC with its cycle; NBA by the IQAC or the department's HOD for an engineering department. Audited. */
export async function createVisit(ctx: ActiveContext, input: VisitSave): Promise<VisitDetail> {
  const d = await deskOf(ctx);
  assertDates(input.fromDate, input.toDate);
  let cycleId: string | null = null;
  let departmentId: string | null = null;
  if (input.framework === "NAAC") {
    if (d.role !== "IQAC") throw new AccessError("access.wrongRoleForThisAction");
    if (!input.cycleId) throw new RuleRefusal("peerVisit.refuseCycle", 422, undefined, "cycleId");
    const cycle = await db.accreditationCycle.findFirst({ where: { id: input.cycleId, schoolId: d.schoolId }, select: { id: true } });
    if (!cycle) throw new RuleRefusal("peerVisit.refuseCycle", 422, undefined, "cycleId");
    cycleId = cycle.id;
  } else {
    const allowed = (await nbaDepartments(d.schoolId)).map((x) => x.id);
    if (!input.departmentId || !allowed.includes(input.departmentId)) throw new RuleRefusal("peerVisit.refuseDepartment", 422, undefined, "departmentId");
    if (!canEdit(d, { framework: "NBA", departmentId: input.departmentId })) throw new AccessError("access.wrongRoleForThisAction");
    departmentId = input.departmentId;
  }
  const v = await db.peerTeamVisit.create({
    data: { schoolId: d.schoolId, framework: input.framework, cycleId, departmentId, year: input.year, title: input.title, fromDate: input.fromDate, toDate: input.toDate, teamJson: writeJson(input.team), createdByUserId: d.userId },
    select: { id: true },
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "iqac.visit.create", targetType: "PeerTeamVisit", targetId: v.id, meta: { framework: input.framework, departmentId } });
  return visitDetail(ctx, v.id);
}

async function editable(ctx: ActiveContext, visitId: string): Promise<{ d: Desk; v: VisitRow }> {
  const d = await deskOf(ctx);
  const v = await loadVisit(d.schoolId, visitId);
  if (!v || !canRead(d, v)) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (!canEdit(d, v)) throw new AccessError("access.wrongRoleForThisAction");
  return { d, v };
}

/** The title, the dates (no schedule line left outside them), the team, the status. Audited. */
export async function updateVisit(ctx: ActiveContext, visitId: string, input: VisitUpdate): Promise<VisitDetail> {
  const { d, v } = await editable(ctx, visitId);
  const from = input.fromDate ?? v.fromDate;
  const to = input.toDate ?? v.toDate;
  assertDates(from, to);
  if (v.items.some((i) => i.kind === "SCHEDULE" && i.dayKey && (i.dayKey < from || i.dayKey > to))) throw new RuleRefusal("peerVisit.refuseScheduleOutside", 409, undefined, "fromDate");
  await db.peerTeamVisit.update({
    where: { id: v.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.fromDate !== undefined ? { fromDate: input.fromDate } : {}),
      ...(input.toDate !== undefined ? { toDate: input.toDate } : {}),
      ...(input.team !== undefined ? { teamJson: writeJson(input.team) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "iqac.visit.update", targetType: "PeerTeamVisit", targetId: v.id, meta: { fields: Object.keys(input) } });
  return visitDetail(ctx, v.id);
}

/** A schedule slot inside the visit's days, or an evidence line whose target is this college's. Audited. */
export async function addVisitItem(ctx: ActiveContext, visitId: string, input: VisitItemSave): Promise<VisitDetail> {
  const { d, v } = await editable(ctx, visitId);
  if (v.items.length >= VISIT_ITEMS_MAX) throw new RuleRefusal("peerVisit.refuseTooMany", 409, { max: VISIT_ITEMS_MAX });
  const position = v.items.filter((i) => i.kind === input.kind).length;
  if (input.kind === "SCHEDULE") {
    if (input.dayKey < v.fromDate || input.dayKey > v.toDate) throw new RuleRefusal("peerVisit.refuseDayOutside", 422, undefined, "dayKey");
    if (input.endMinute <= input.startMinute) throw new RuleRefusal("peerVisit.refuseTimes", 422, undefined, "endMinute");
    const item = await db.peerVisitItem.create({ data: { schoolId: d.schoolId, visitId: v.id, kind: "SCHEDULE", dayKey: input.dayKey, startMinute: input.startMinute, endMinute: input.endMinute, activity: input.activity, venue: input.venue, ownerName: input.ownerName, position, createdByUserId: d.userId }, select: { id: true } });
    await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "iqac.visit.item", targetType: "PeerVisitItem", targetId: item.id, meta: { visitId: v.id, kind: "SCHEDULE" } });
    return visitDetail(ctx, v.id);
  }
  let linkId: string | null = input.linkId?.trim() || null;
  let url: string | null = null;
  if (input.linkKind === "FILING") {
    const f = linkId ? await db.collegeFiling.findFirst({ where: { id: linkId, schoolId: d.schoolId }, select: { id: true } }) : null;
    if (!f) throw new RuleRefusal("peerVisit.refuseLink", 422, undefined, "linkId");
  } else if (input.linkKind === "FILE") {
    // Never a grievance's attachment (TA-305), which the evidence list keeps from the IQAC too (campaign S-9).
    const f = linkId ? await db.iqacFile.findFirst({ where: { id: linkId, schoolId: d.schoolId, purpose: { not: "GRIEVANCE" } }, select: { id: true } }) : null;
    if (!f) throw new RuleRefusal("peerVisit.refuseLink", 422, undefined, "linkId");
  } else if (input.linkKind === "METRIC") {
    linkId = linkId ?? input.criterion;
    if (!/^\d{1,2}(\.\d{1,2}){1,3}$/.test(linkId)) throw new RuleRefusal("peerVisit.refuseLink", 422, undefined, "linkId");
  } else if (input.linkKind === "LINK") {
    if (!input.url || !/^https:\/\//i.test(input.url)) throw new RuleRefusal("peerVisit.refuseUrl", 422, undefined, "url");
    url = input.url;
    linkId = null;
  } else {
    // WORKSHEET (the visit's own NBA worksheet) and NOTE point at nothing to check now.
    if (input.linkKind === "WORKSHEET" && v.framework !== "NBA") throw new RuleRefusal("peerVisit.refuseWorksheet", 422, undefined, "linkKind");
    linkId = null;
  }
  const item = await db.peerVisitItem.create({ data: { schoolId: d.schoolId, visitId: v.id, kind: "EVIDENCE", criterion: input.criterion, title: input.title, linkKind: input.linkKind, linkId, url, note: input.note, position, createdByUserId: d.userId }, select: { id: true } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "iqac.visit.item", targetType: "PeerVisitItem", targetId: item.id, meta: { visitId: v.id, kind: "EVIDENCE", linkKind: input.linkKind } });
  return visitDetail(ctx, v.id);
}

/** A line taken off the file. Audited. */
export async function removeVisitItem(ctx: ActiveContext, visitId: string, itemId: string): Promise<VisitDetail> {
  const { d, v } = await editable(ctx, visitId);
  const item = v.items.find((i) => i.id === itemId);
  if (!item) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  await db.peerVisitItem.delete({ where: { id: item.id } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "iqac.visit.itemRemove", targetType: "PeerVisitItem", targetId: item.id, meta: { visitId: v.id, kind: item.kind } });
  return visitDetail(ctx, v.id);
}

const nbaHref = (year: number, departmentId: string | null) => `/iqac/documents/nba?year=${year}${departmentId ? `&departmentId=${departmentId}` : ""}`;
function filingHref(f: { kind: string; year: number; departmentId: string | null }): string {
  if (f.kind === "NBA_SAR") return nbaHref(f.year, f.departmentId);
  return `/iqac/documents#${f.kind.toLowerCase()}`;
}

/** The whole file: the schedule, the evidence index resolved, the SAR pack read from the filings, what a line may point at. */
export async function visitDetail(ctx: ActiveContext, visitId: string): Promise<VisitDetail> {
  const d = await deskOf(ctx);
  const v = await loadVisit(d.schoolId, visitId);
  if (!v || !canRead(d, v)) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const departments = await departmentNames(d.schoolId, [v.departmentId]);

  // The pack, from the filings as they stand.
  const packKinds = v.framework === "NAAC" ? ["IIQA", "SSR", "AQAR"] : ["NBA_SAR"];
  const filingRows = await db.collegeFiling.findMany({
    where: { schoolId: d.schoolId, kind: { in: packKinds }, ...(v.framework === "NAAC" ? { OR: [{ cycleId: v.cycleId }, { cycleId: null }] } : { departmentId: v.departmentId, year: v.year }) },
    orderBy: [{ kind: "asc" }, { year: "desc" }, { generatedAt: "desc" }],
    select: { id: true, kind: true, year: true, status: true, hash: true, generatedAt: true, departmentId: true, figuresJson: true },
  });
  const latest = new Map<string, (typeof filingRows)[number]>();
  for (const f of filingRows) if (!latest.has(`${f.kind}|${f.year}`)) latest.set(`${f.kind}|${f.year}`, f);
  const pack = [...latest.values()];
  const missing = packKinds.filter((k) => !pack.some((f) => f.kind === k));
  let figure: number | null = null;
  if (v.framework === "NAAC" && v.cycleId) figure = (await db.accreditationCycle.findFirst({ where: { id: v.cycleId, schoolId: d.schoolId }, select: { cgpa: true } }))?.cgpa ?? null;
  if (v.framework === "NBA") {
    const sar = pack.find((f) => f.kind === "NBA_SAR");
    const total = sar ? readJson<Record<string, number>>(sar.figuresJson, {}).totalMarks : undefined;
    figure = typeof total === "number" ? total : null;
  }

  // The evidence lines, each resolved against what it points at today.
  const evidence = v.items.filter((i) => i.kind === "EVIDENCE");
  const filingIds = evidence.filter((i) => i.linkKind === "FILING" && i.linkId).map((i) => i.linkId!);
  const fileIds = evidence.filter((i) => i.linkKind === "FILE" && i.linkId).map((i) => i.linkId!);
  const metricCodes = evidence.filter((i) => i.linkKind === "METRIC" && i.linkId).map((i) => i.linkId!);
  const [linkedFilings, linkedFiles, metrics, worksheet, allFilings, allFiles] = await Promise.all([
    filingIds.length ? db.collegeFiling.findMany({ where: { schoolId: d.schoolId, id: { in: filingIds } }, select: { id: true, kind: true, year: true, status: true, departmentId: true } }) : [],
    fileIds.length ? db.iqacFile.findMany({ where: { schoolId: d.schoolId, id: { in: fileIds }, purpose: { not: "GRIEVANCE" } }, select: { id: true, title: true, fileId: true } }) : [],
    metricCodes.length && v.cycleId ? db.metricScore.findMany({ where: { schoolId: d.schoolId, cycleId: v.cycleId, metricCode: { in: metricCodes } }, orderBy: { computedAt: "desc" }, select: { metricCode: true, score: true, value: true } }) : [],
    v.framework === "NBA" ? db.filingWorksheet.findFirst({ where: { schoolId: d.schoolId, kind: "NBA_SAR", year: v.year, departmentId: v.departmentId ?? "" }, select: { id: true } }) : null,
    db.collegeFiling.findMany({ where: { schoolId: d.schoolId, ...(v.framework === "NBA" ? { kind: "NBA_SAR", departmentId: v.departmentId } : { kind: { not: "NBA_SAR" } }) }, orderBy: [{ year: "desc" }, { generatedAt: "desc" }], take: 60, select: { id: true, kind: true, year: true, status: true } }),
    // The picker never lists a grievance's attachment, whose title is its kind (TA-305).
    db.iqacFile.findMany({ where: { schoolId: d.schoolId, purpose: { not: "GRIEVANCE" } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, title: true } }),
  ]);
  const filingOf = new Map(linkedFilings.map((f) => [f.id, f]));
  const fileOf = new Map(linkedFiles.map((f) => [f.id, f]));
  const metricOf = new Map<string, { score: number | null; value: number | null }>();
  for (const m of metrics) if (!metricOf.has(m.metricCode)) metricOf.set(m.metricCode, m);

  const item = (i: VisitRow["items"][number]): VisitItemView => {
    let resolved: VisitItemView["resolved"] = null;
    if (i.kind === "EVIDENCE") {
      if (i.linkKind === "FILING") {
        const f = i.linkId ? filingOf.get(i.linkId) : undefined;
        resolved = f ? { ok: true, label: `${f.kind} ${f.year} · ${f.status}`, href: filingHref(f) } : { ok: false, label: "", href: null };
      } else if (i.linkKind === "FILE") {
        const f = i.linkId ? fileOf.get(i.linkId) : undefined;
        resolved = f ? { ok: true, label: f.title, href: `/api/files/${f.fileId}` } : { ok: false, label: "", href: null };
      } else if (i.linkKind === "METRIC") {
        const m = i.linkId ? metricOf.get(i.linkId) : undefined;
        resolved = m ? { ok: true, label: `${i.linkId} · ${m.score ?? "—"}`, href: `/iqac/predictor#metric-${i.linkId!.replace(/\./g, "-")}` } : { ok: false, label: i.linkId ?? "", href: null };
      } else if (i.linkKind === "WORKSHEET") {
        resolved = worksheet ? { ok: true, label: `NBA ${v.year}`, href: nbaHref(v.year, v.departmentId) } : { ok: false, label: "", href: null };
      } else if (i.linkKind === "LINK") {
        resolved = { ok: Boolean(i.url), label: i.url ?? "", href: i.url };
      } else {
        resolved = { ok: true, label: "", href: null };
      }
    }
    return { id: i.id, kind: i.kind as VisitItemView["kind"], dayKey: i.dayKey, startMinute: i.startMinute, endMinute: i.endMinute, activity: i.activity, venue: i.venue, ownerName: i.ownerName, criterion: i.criterion, title: i.title, linkKind: (i.linkKind as VisitItemView["linkKind"]) ?? null, linkId: i.linkId, url: i.url, note: i.note, resolved };
  };
  const evidenceViews = evidence.map(item).sort((a, b) => a.criterion.localeCompare(b.criterion, "en", { numeric: true }));
  const criteria: readonly string[] = v.framework === "NAAC" ? VISIT_NAAC_CRITERIA : VISIT_NBA_CRITERIA;
  return {
    ...summaryOf(d, v, departments),
    team: readJson<{ name: string; role: string }[]>(v.teamJson, []).filter((m) => typeof m?.name === "string").map((m) => ({ name: m.name, role: typeof m.role === "string" ? m.role : "" })),
    schedule: v.items.filter((i) => i.kind === "SCHEDULE").map(item),
    evidence: evidenceViews,
    pack: {
      filings: pack.map((f) => ({ id: f.id, kind: f.kind, year: f.year, status: f.status, hash: f.hash, generatedAt: f.generatedAt.toISOString(), href: filingHref(f) })),
      missing,
      figure,
      coverage: criteria.map((c) => ({ criterion: c, lines: evidenceViews.filter((e) => criterionOf(e.criterion) === c).length, missing: evidenceViews.filter((e) => criterionOf(e.criterion) === c && e.resolved && !e.resolved.ok).length })),
    },
    options: {
      filings: allFilings.map((f) => ({ id: f.id, label: `${f.kind} ${f.year} · ${f.status}` })),
      files: allFiles.map((f) => ({ id: f.id, label: f.title })),
    },
  };
}

/** The evidence index and the schedule as CSV for the team's table (audited). */
export async function visitIndexCsv(ctx: ActiveContext, visitId: string): Promise<{ filename: string; rows: Record<string, unknown>[]; headers: string[] }> {
  const v = await visitDetail(ctx, visitId);
  const d = await deskOf(ctx);
  const rows: Record<string, unknown>[] = [
    ...v.schedule.map((s) => ({ section: "schedule", day: s.dayKey ?? "", time: s.startMinute !== null && s.endMinute !== null ? `${hhmm(s.startMinute)}-${hhmm(s.endMinute)}` : "", criterion: "", title: s.activity, where_or_link: s.venue, who_or_state: s.ownerName })),
    ...v.evidence.map((e) => ({ section: "evidence", day: "", time: "", criterion: e.criterion, title: e.title, where_or_link: e.resolved?.href ?? e.url ?? "", who_or_state: e.resolved ? (e.resolved.ok ? e.resolved.label || "ok" : "MISSING") : "" })),
    ...v.pack.filings.map((f) => ({ section: "sar_pack", day: f.generatedAt.slice(0, 10), time: "", criterion: "", title: `${f.kind} ${f.year}`, where_or_link: f.href, who_or_state: `${f.status} sha256:${f.hash.slice(0, 12)}` })),
  ];
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "iqac.visit.export", targetType: "PeerTeamVisit", targetId: v.id, meta: { rows: rows.length } });
  return { filename: `visit-${v.framework.toLowerCase()}-${v.fromDate}.csv`, rows, headers: ["section", "day", "time", "criterion", "title", "where_or_link", "who_or_state"] };
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
