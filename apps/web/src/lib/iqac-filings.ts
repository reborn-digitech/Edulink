import "server-only";
import {
  COUNCIL_FILINGS,
  FILING_TEXT as L,
  FILING_TITLE,
  SIGNED_FILINGS,
  NAAC_CRITERIA,
  STREAM_PRESETS,
  type CollegeFilingKind,
  type StreamCode,
} from "@edulink/contracts";
import { streamsOf } from "./streams";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { toCsvValue } from "./csv";
import { readJsonArray } from "./json";
import { gatherFacts, nirfFacts, readEntered, WINDOW_SUM_INPUTS, type Entered } from "./iqac-facts";
import { evaluate, nirfSubs, round2 } from "./iqac-rules";
import { frameworkOf, iqacActor, iqacHash, spendFile, type Desk } from "./iqac";
import { SEATED_NOW } from "./academics";
import type { ActiveContext } from "./session";

/**
 * THE FILINGS (the IQAC module, 4 October 2026): the SSR's data, the yearly
 * AQAR, the IIQA, NIRF's data capture, AISHE's, the AICTE mandatory
 * disclosure and the university's affiliation return — each CUT FROM THE
 * LIVE ROWS at the moment it is generated and frozen in CollegeFiling.
 *
 * WHAT THE HASH IS OF. `body` is the file's source — the CSV text itself, or
 * the canonical JSON the PDF is drawn from — and `hash` is its SHA-256. A
 * PDF's own bytes carry its render time, so hashing them would make two
 * downloads of one filing disagree; the JSON is what the document says.
 * data:audit regenerates each filing from the rows and compares its figures
 * (drift since the filing is a WARN — the college's records moved on — and a
 * body that no longer matches its hash is a FAIL).
 *
 * BY STREAM (5 Oct 2026): which of them a college files is read from its
 * streams (council-filings.ts `assertFilingApplies`), and the councils'
 * returns — PCI, BCI, NCTE and NBA's SAR — are built there and frozen here
 * the same way.
 *
 * WHAT IS UNTESTED: every one of these against its portal. The AISHE and
 * NIRF sheets follow the data each format asks for, not a template the
 * portal accepts as an upload; the coordinator types them in.
 */

export type FilingSection = { heading: string; rows?: [string, string][]; table?: { head: string[]; rows: (string | number)[][]; wide?: number }; paragraphs?: string[] };
export type FilingDocument = { title: string; subtitle: string; school: string; sections: FilingSection[]; footer: string };
export type BuiltFiling = { format: "PDF" | "CSV"; body: string; figures: Record<string, number>; /** A council's return only (R-21): the no-history values it read, JSON, for the generator to store. */ snapshot?: string };

export const yearLabel = (y: number) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
export const windowOf = (y: number) => ({ from: `${y}-06-01`, to: `${y + 1}-05-31` });
const or = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? L.notRecorded : String(v));

export async function schoolProfile(schoolId: string) {
  return db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, slug: true, kind: true, affiliatingUniversity: true, aisheCode: true, aicteApprovalRef: true, ugcApprovalRef: true, naacGrade: true, naacValidUntil: true, nirfCategory: true } });
}

export function profileRows(p: Awaited<ReturnType<typeof schoolProfile>>): [string, string][] {
  return [
    [L.name, p.name],
    [L.kind, p.kind],
    [L.university, or(p.affiliatingUniversity)],
    [L.aishe, or(p.aisheCode)],
    [L.aicte, or(p.aicteApprovalRef)],
    [L.ugc, or(p.ugcApprovalRef)],
    [L.naacGrade, or(p.naacGrade)],
    [L.naacValid, or(p.naacValidUntil?.toISOString().slice(0, 10))],
    [L.nirfCategory, or(p.nirfCategory)],
  ];
}

/** Programmes with intake, students on them, and results — what several filings share. */
async function programmeTable(schoolId: string, year: number) {
  const [programmes, seats, enrolments, records] = await Promise.all([
    db.programme.findMany({ where: { schoolId, archivedAt: null }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true, level: true, durationYears: true, intake: true, departmentId: true, regulator: true, stream: true } }),
    db.studentProgramme.findMany({ where: { schoolId, ...SEATED_NOW }, select: { programmeId: true, studentMembershipId: true, entryYear: true } }),
    db.programmeEnrolment.findMany({ where: { schoolId }, select: { studentMembershipId: true, category: true } }),
    db.pupilRecord.findMany({ where: { schoolId }, select: { studentMembershipId: true, gender: true } }),
  ]);
  const gender = new Map(records.map((r) => [r.studentMembershipId, r.gender]));
  const category = new Map(enrolments.map((e) => [e.studentMembershipId, e.category]));
  return programmes.map((p) => {
    const on = seats.filter((s) => s.programmeId === p.id);
    const cat = (c: string) => on.filter((s) => category.get(s.studentMembershipId) === c).length;
    return { ...p, enrolled: on.length, admitted: on.filter((s) => s.entryYear === year).length, male: on.filter((s) => gender.get(s.studentMembershipId) === "M").length, female: on.filter((s) => gender.get(s.studentMembershipId) === "F").length, sc: cat("SC"), st: cat("ST"), obc: cat("OBC"), ews: cat("EWS"), open: cat("OPEN") };
  });
}

/** Faculty as they stood at `asOf`: experience is counted to that instant, so a past year's filing reads the same every time it is built. */
async function facultyTable(schoolId: string, asOf: Date = new Date()) {
  const [people, records] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: { in: ["FACULTY", "HOD", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, orderBy: { user: { name: "asc" } }, select: { id: true, role: true, joinedAt: true, user: { select: { name: true } } } }),
    db.facultyRecord.findMany({ where: { schoolId } }),
  ]);
  const rec = new Map(records.map((r) => [r.membershipId, r]));
  const now = asOf.getTime();
  return people.map((p) => {
    const r = rec.get(p.id);
    const joined = r?.joinedOn ? Date.parse(`${r.joinedOn}T00:00:00Z`) : p.joinedAt.getTime();
    return { name: p.user.name, designation: r?.designation ?? p.role, qualification: r?.highestQualification ?? "", experience: round2((r?.experienceBeforeYears ?? 0) + Math.max(0, (now - joined) / (365.25 * 86_400_000))), appointment: r?.appointment ?? "" };
  });
}

/** Results of a year: the latest published run of every session whose result came out in it. */
async function resultsOf(schoolId: string, year: number) {
  const w = windowOf(year);
  const runs = await db.resultRun.findMany({ where: { schoolId, status: "PUBLISHED", publishedAt: { gte: new Date(`${w.from}T00:00:00Z`), lte: new Date(`${w.to}T23:59:59Z`) } }, orderBy: [{ sessionId: "asc" }, { number: "desc" }], select: { id: true, sessionId: true } });
  const latest = new Map<string, string>();
  for (const r of runs) if (!latest.has(r.sessionId)) latest.set(r.sessionId, r.id);
  const terms = latest.size ? await db.termResult.findMany({ where: { runId: { in: [...latest.values()] } }, select: { status: true } }) : [];
  return { appeared: terms.length, passed: terms.filter((t) => t.status === "PASS").length };
}

function evidenceCount(raw: string): number {
  try {
    const v = JSON.parse(raw) as { rows?: unknown[]; files?: unknown[] };
    return (v.rows?.length ?? 0) + (v.files?.length ?? 0);
  } catch {
    return 0;
  }
}

const csvOf = (head: string[], rows: (string | number)[][]) => [head, ...rows].map((r) => r.map(toCsvValue).join(",")).join("\r\n") + "\r\n";

/**
 * Build a filing from the rows as they stand: the one function the generator
 * and the data audit share, so "regenerate and compare" compares like with like.
 */
export async function buildFiling(schoolId: string, kind: CollegeFilingKind, year: number, cycleId: string | null, departmentId: string | null = null, opts: { snapshot?: "stored" | "live" } = {}): Promise<BuiltFiling> {
  // The councils' returns (5 Oct 2026): PCI, BCI, NCTE and an engineering department's NBA SAR (council-filings.ts).
  // A rebuild reads the no-history fields the year's filing froze; the generator reads them live and stores them (R-21).
  if ((COUNCIL_FILINGS as readonly string[]).includes(kind)) {
    const { councilDocument } = await import("./council-filings");
    const built = await councilDocument(schoolId, kind, year, departmentId, opts);
    return { format: "PDF", body: JSON.stringify(built.document), figures: built.figures, snapshot: JSON.stringify(built.snapshot ?? {}) };
  }
  const p = await schoolProfile(schoolId);
  const w = windowOf(year);
  const cycle = cycleId ? await db.accreditationCycle.findFirst({ where: { id: cycleId, schoolId }, select: { id: true, framework: true, windowFrom: true, windowTo: true, enteredJson: true } }) : await db.accreditationCycle.findFirst({ where: { schoolId }, orderBy: { createdAt: "desc" }, select: { id: true, framework: true, windowFrom: true, windowTo: true, enteredJson: true } });
  const entered = readEntered(cycle?.enteredJson);
  const footer = `${p.name} · ${L.generatedFrom}`;
  // THE FILING'S OWN CLOCK (LIFECYCLE-8): every fact reader is handed the end of
  // the window the filing covers, never the day it is built, so an AQAR built in
  // May and rebuilt by the data audit years later reads the same figures — the
  // teachers' experience, the latest year counted, which surveys had closed.
  const asOf = new Date(`${kind === "SSR" && cycle ? cycle.windowTo : w.to}T23:59:59.999Z`);

  if (kind === "SSR" || kind === "AQAR") {
    const fw = frameworkOf(cycle?.framework ?? (p.kind === "AUTONOMOUS_COLLEGE" ? "AUTONOMOUS" : "AFFILIATED_UG"));
    // The SSR reads the cycle's five years; the AQAR the one academic year.
    const from = kind === "SSR" && cycle ? cycle.windowFrom : w.from;
    const to = kind === "SSR" && cycle ? cycle.windowTo : w.to;
    // A yearly AQAR takes from the cycle only the figures that are not five-year sums, and only from a cycle whose
    // window holds its year (TA-076); the year's own rows give the rest.
    const yearly: Entered = kind === "AQAR" ? (cycle && cycle.windowFrom <= w.from && cycle.windowTo >= w.to ? Object.fromEntries(Object.entries(entered).filter(([k]) => !(WINDOW_SUM_INPUTS as readonly string[]).includes(k))) as Entered : {}) : entered;
    const gathered = await gatherFacts(schoolId, from, to, yearly, asOf);
    const qls = cycle ? await db.metricScore.findMany({ where: { cycleId: cycle.id, kind: "QL" }, orderBy: { computedAt: "asc" }, select: { metricCode: true, score: true, note: true, evidenceJson: true } }) : [];
    const ql = new Map(qls.map((q) => [q.metricCode, q]));
    const figures: Record<string, number> = {};
    const sections: FilingSection[] = [{ heading: L.institution, rows: [...profileRows(p), [kind === "SSR" ? L.window : L.year, kind === "SSR" ? `${from} – ${to}` : yearLabel(year)], [L.framework, fw.code]] }];
    for (const c of NAAC_CRITERIA) {
      const rows: (string | number)[][] = [];
      for (const m of fw.metrics.filter((x) => x.ki.split(".")[0] === c.code)) {
        if (m.kind === "QN" && m.formula) {
          const ev = evaluate(m.formula, gathered.facts);
          figures[m.code] = ev.value ?? 0;
          rows.push([m.code, m.text, "QnM", m.weight, ev.value === null ? L.notRecorded : ev.value]);
        } else {
          const q = ql.get(m.code);
          rows.push([m.code, m.text, "QlM", m.weight, q ? q.note || `${evidenceCount(q.evidenceJson)} ${L.evidence}` : L.notRecorded]);
        }
      }
      sections.push({ heading: `${L.criterion} ${c.code}: ${c.name}`, table: { head: [L.metric, L.metric, L.type, L.weight, L.value], rows, wide: 1 } });
    }
    if (kind === "AQAR") {
      const meetings = await db.committeeMeeting.count({ where: { schoolId, at: { gte: w.from, lte: w.to }, committee: { kind: "IQAC" } } });
      figures.iqacMeetings = meetings;
      sections.splice(1, 0, { heading: L.iqacMeetings, rows: [[L.iqacMeetings, String(meetings)]] });
    }
    sections.push({ heading: L.note, paragraphs: [L.notAScore] });
    const doc: FilingDocument = { title: FILING_TITLE[kind], subtitle: `${p.name} · ${kind === "SSR" ? `${from} – ${to}` : yearLabel(year)}`, school: p.name, sections, footer };
    return { format: "PDF", body: JSON.stringify(doc), figures };
  }

  if (kind === "AICTE_DISCLOSURE") {
    const doc = await disclosureDocument(schoolId, year, asOf);
    return { format: "PDF", body: JSON.stringify(doc.document), figures: doc.figures };
  }

  if (kind === "IIQA") {
    const gathered = await gatherFacts(schoolId, `${year - 4}-06-01`, w.to, entered, asOf);
    const aqars = await db.collegeFiling.findMany({ where: { schoolId, kind: "AQAR" }, select: { year: true }, distinct: ["year"] });
    const figures = { students: gathered.facts.studentsLatest ?? 0, fullTimeTeachers: gathered.facts.fullTimeTeachers ?? 0, programmes: gathered.facts.programmes ?? 0, aqarsFiled: aqars.length };
    const rows: (string | number)[][] = [...profileRows(p).map(([k, v]) => [L.institution, k, v]), [L.programmes, L.programmes, figures.programmes], [L.students, L.students, figures.students], [L.faculty, L.fullTimeTeachers, figures.fullTimeTeachers], [FILING_TITLE.AQAR, L.year, aqars.map((a) => yearLabel(a.year)).join("; ") || L.notRecorded], [L.sssMean, L.sssMean, gathered.facts.sssMean ?? L.notRecorded]];
    return { format: "CSV", body: csvOf([L.section, L.field, L.value], rows), figures };
  }

  if (kind === "NIRF") {
    const gathered = await gatherFacts(schoolId, `${year - 2}-06-01`, w.to, entered, asOf);
    const nf = await nirfFacts(schoolId, gathered, asOf);
    const subs = nirfSubs(nf);
    const seasons = await db.placementSeason.findMany({ where: { schoolId, batchYear: { gte: year - 2, lte: year + 1 } }, orderBy: { batchYear: "asc" }, select: { batchYear: true, finalYear: true, placed: true, higherStudies: true, medianSalaryRupees: true } });
    const rows: (string | number)[][] = [
      ["TLR", "SS", L.intake, nf.intake ?? L.notRecorded],
      ["TLR", "SS", L.enrolled, gathered.facts.studentsLatest ?? L.notRecorded],
      ["TLR", "FSR", L.fullTimeTeachers, nf.faculty ?? L.notRecorded],
      ["TLR", "FSR", L.score, subs.FSR ?? L.notRecorded],
      ["TLR", "FQE", L.phdPct, nf.phdPct === null ? L.notRecorded : round2(nf.phdPct)],
      ["TLR", "FQE", L.score, subs.FQE ?? L.notRecorded],
      ["GO", "GUE", L.passPct, nf.passInTimePct === null ? L.notRecorded : round2(nf.passInTimePct)],
      ["GO", "GUE", L.score, subs.GUE ?? L.notRecorded],
      ["GO", "GPH", L.score, subs.GPH ?? L.notRecorded],
      ...seasons.map((s) => ["GO", "GPH", `${L.batch} ${s.batchYear}: ${L.outgoing} / ${L.placed} / ${L.higher} / ${L.median}`, `${s.finalYear} / ${s.placed} / ${s.higherStudies} / ${s.medianSalaryRupees ?? L.notRecorded}`]),
      ["OI", "WD", L.womenStudents, nf.womenStudentsPct === null ? L.notRecorded : round2(nf.womenStudentsPct)],
      ["OI", "WD", L.womenFaculty, nf.womenFacultyPct === null ? L.notRecorded : round2(nf.womenFacultyPct)],
      ["OI", "WD", L.score, subs.WD ?? L.notRecorded],
    ];
    const figures = { faculty: nf.faculty ?? 0, students: gathered.facts.studentsLatest ?? 0, FSR: subs.FSR ?? 0, FQE: subs.FQE ?? 0, GUE: subs.GUE ?? 0, GPH: subs.GPH ?? 0, WD: subs.WD ?? 0 };
    return { format: "CSV", body: csvOf([L.parameter, L.sub, L.fact, L.value], rows), figures };
  }

  if (kind === "AISHE") {
    const programmes = await programmeTable(schoolId, year);
    const faculty = await facultyTable(schoolId, asOf);
    const nonTeaching = await db.membership.count({ where: { schoolId, role: { in: ["ADMIN", "ACCOUNTS", "LIBRARIAN", "WARDEN", "DRIVER", "EXAM_CONTROLLER", "TPO", "SUPPORT"] }, status: "ACTIVE", leftAt: null } });
    const yl = yearLabel(year);
    const claims = await db.scholarshipClaim.groupBy({ by: ["scheme"], where: { schoolId, academicYear: yl, status: { in: ["SANCTIONED", "DISBURSED"] } }, _count: { _all: true } });
    const rows: (string | number)[][] = [
      ...profileRows(p).map(([k, v]) => [L.institution, k, "", v]),
      ...programmes.map((x) => [L.programmes, `${x.code} ${x.name} (${x.level}, ${x.durationYears})`, `${L.intake} / ${L.enrolled} / ${L.male} / ${L.female} / SC / ST / OBC / EWS / OPEN`, `${x.intake} / ${x.enrolled} / ${x.male} / ${x.female} / ${x.sc} / ${x.st} / ${x.obc} / ${x.ews} / ${x.open}`]),
      ...Object.entries(faculty.reduce<Record<string, number>>((a, f) => ({ ...a, [f.designation]: (a[f.designation] ?? 0) + 1 }), {})).map(([d, n]) => [L.faculty, d, L.count, n]),
      [L.nonTeaching, L.nonTeaching, L.count, nonTeaching],
      ...claims.map((c) => [L.scholarships, c.scheme, L.count, c._count._all]),
    ];
    const figures = { programmes: programmes.length, enrolled: programmes.reduce((a, x) => a + x.enrolled, 0), teachers: faculty.length, nonTeaching, scholarships: claims.reduce((a, c) => a + c._count._all, 0) };
    return { format: "CSV", body: csvOf([L.section, L.field, L.fact, L.value], rows), figures };
  }

  // AFFILIATION_RETURN
  const programmes = await programmeTable(schoolId, year);
  const faculty = await db.departmentFaculty.groupBy({ by: ["departmentId"], where: { schoolId }, _count: { _all: true } });
  const fac = new Map(faculty.map((f) => [f.departmentId, f._count._all]));
  const res = await resultsOf(schoolId, year);
  const rows = programmes.map((x) => [x.code, x.name, x.intake, x.admitted, x.enrolled, fac.get(x.departmentId) ?? 0]);
  rows.push([L.results, `${L.appeared} / ${L.passed}`, "", "", `${res.appeared} / ${res.passed}`, ""]);
  const figures = { programmes: programmes.length, intake: programmes.reduce((a, x) => a + x.intake, 0), admitted: programmes.reduce((a, x) => a + x.admitted, 0), appeared: res.appeared, passed: res.passed };
  return { format: "CSV", body: csvOf([L.programmeCode, L.programmeName, L.intake, L.admitted, L.enrolled, L.faculty], rows), figures };
}

/**
 * Whether a programme is the AICTE's to disclose (TA-272): one approved by the AICTE, or one of a stream that brings
 * the disclosure under its own council (a PCI pharmacy programme); never one the college files under the UGC (the
 * management stream's BBA) or under a council whose stream does not bring the disclosure (a BCI law degree).
 */
function underAicte(p: { regulator: string; stream: string | null }, streams: readonly StreamCode[]): boolean {
  if (p.regulator === "AICTE") return true;
  if (p.regulator === "UGC") return false;
  const stream = p.stream ?? (streams.length === 1 ? streams[0]! : null);
  return !!stream && stream in STREAM_PRESETS && (STREAM_PRESETS[stream as StreamCode].filings as readonly string[]).includes("AICTE_DISCLOSURE");
}

/** The AICTE disclosure, for the filing and the public page: no student, no PAN, no contact detail. */
export async function disclosureDocument(schoolId: string, year: number, asOf: Date = new Date()): Promise<{ document: FilingDocument; figures: Record<string, number> }> {
  const p = await schoolProfile(schoolId);
  const streams = await streamsOf(schoolId);
  const [programmes, faculty, committees, seasons] = await Promise.all([
    programmeTable(schoolId, year).then((rows) => rows.filter((x) => underAicte(x, streams))),
    facultyTable(schoolId, asOf),
    db.committee.findMany({ where: { schoolId, kind: { in: ["GRIEVANCE", "ANTI_RAGGING", "ICC", "IQAC", "GOVERNING_BODY", "CDC"] } }, orderBy: { kind: "asc" }, select: { kind: true, name: true, membersJson: true } }),
    db.placementSeason.findMany({ where: { schoolId, batchYear: { gte: year - 2, lte: year + 1 } }, orderBy: { batchYear: "asc" }, select: { batchYear: true, finalYear: true, placed: true, higherStudies: true, medianSalaryRupees: true } }),
  ]);
  const results = await Promise.all([year - 2, year - 1, year].map(async (y) => ({ y, ...(await resultsOf(schoolId, y)) })));
  const document: FilingDocument = {
    title: FILING_TITLE.AICTE_DISCLOSURE,
    subtitle: `${p.name} · ${yearLabel(year)}`,
    school: p.name,
    footer: `${p.name} · ${L.generatedFrom}`,
    sections: [
      { heading: L.institution, rows: profileRows(p) },
      { heading: L.programmes, table: { head: [L.programmeCode, L.programmeName, L.level, L.duration, L.intake, L.enrolled], rows: programmes.map((x) => [x.code, x.name, x.level, x.durationYears, x.intake, x.enrolled]), wide: 1 } },
      { heading: L.faculty, table: { head: [L.facultyName, L.designation, L.qualification, L.experience, L.appointment], rows: faculty.map((f) => [f.name, f.designation, f.qualification || L.notRecorded, f.experience, f.appointment || L.notRecorded]), wide: 0 } },
      { heading: L.results, table: { head: [L.year, L.appeared, L.passed, L.passPct], rows: results.map((r) => [yearLabel(r.y), r.appeared, r.passed, r.appeared ? round2((r.passed / r.appeared) * 100) : L.notRecorded]) } },
      { heading: L.placement, table: { head: [L.batch, L.outgoing, L.placed, L.higher, L.median], rows: seasons.map((s) => [s.batchYear, s.finalYear, s.placed, s.higherStudies, s.medianSalaryRupees ?? L.notRecorded]) } },
      { heading: L.committees, table: { head: [L.committee, L.members], rows: committees.map((c) => [c.name, readJsonArray<{ name: string; role: string }>(c.membersJson).map((m) => (m.role ? `${m.name} (${m.role})` : m.name)).join("; ")]), wide: 1 } },
      { heading: L.finance, paragraphs: [L.notRecorded] },
    ],
  };
  const figures = { programmes: programmes.length, intake: programmes.reduce((a, x) => a + x.intake, 0), faculty: faculty.length, committees: committees.length, appeared: results.reduce((a, r) => a + r.appeared, 0), passed: results.reduce((a, r) => a + r.passed, 0) };
  return { document, figures };
}

/* -------------------------------------------------------------------------- */
/* The desk's doors                                                            */
/* -------------------------------------------------------------------------- */

const FILING_SELECT = { id: true, kind: true, year: true, format: true, generatedAt: true, hash: true, status: true, checked: true, principalNote: true, signedOffAt: true, figuresJson: true, departmentId: true } as const;
type FilingRow = { id: string; kind: string; year: number; format: string; generatedAt: Date; hash: string; status: string; checked: boolean; principalNote: string; signedOffAt: Date | null; figuresJson: string; departmentId: string | null };
const filingView = (f: FilingRow) => ({ id: f.id, kind: f.kind as CollegeFilingKind, year: f.year, format: f.format as "PDF" | "CSV", generatedAt: f.generatedAt.toISOString(), hash: f.hash, status: f.status as never, checked: f.checked, principalNote: f.principalNote, signedOffAt: f.signedOffAt?.toISOString() ?? null, figures: JSON.parse(f.figuresJson) as Record<string, number>, departmentId: f.departmentId });

export async function listFilings(ctx: ActiveContext) {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN", "PRINCIPAL"]);
  const rows = await db.collegeFiling.findMany({ where: { schoolId: desk.schoolId }, orderBy: { generatedAt: "desc" }, take: 200, select: FILING_SELECT });
  return { items: rows.map(filingView), canGenerate: desk.role === "IQAC" || desk.role === "ADMIN", canSignOff: desk.role === "PRINCIPAL" };
}

export async function generateFiling(ctx: ActiveContext, input: { kind: CollegeFilingKind; year: number; cycleId: string | null; departmentId?: string | null; again?: boolean }) {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN"]);
  await generateFilingAs(desk, input);
  return listFilings(ctx);
}

/**
 * Generate one filing. The college's streams must bring the kind (5 Oct 2026:
 * a law college is answered 404 for the AICTE disclosure). An NBA SAR is one
 * per engineering department and year: a draft or a returned one is rebuilt
 * in place (its id kept), and one with the principal, signed off or filed is
 * not made again (409).
 */
export async function generateFilingAs(desk: Desk, input: { kind: CollegeFilingKind; year: number; cycleId: string | null; departmentId?: string | null; again?: boolean }): Promise<string> {
  const { assertFilingApplies, nbaDepartments } = await import("./council-filings");
  await assertFilingApplies(desk.schoolId, input.kind);
  if (input.cycleId && !(await db.accreditationCycle.findFirst({ where: { id: input.cycleId, schoolId: desk.schoolId }, select: { id: true } }))) throw new AccessError("iqac.refuseNoCycle", "NOT_FOUND");
  const departmentId = input.kind === "NBA_SAR" ? (input.departmentId ?? null) : null;
  if (input.kind === "NBA_SAR" && (!departmentId || !(await nbaDepartments(desk.schoolId)).some((d) => d.id === departmentId))) throw new RuleRefusal("councilFilings.refuseDepartment", 422, undefined, "departmentId");
  // A year already filed is not made again by accident (A3-journeys-35): a second draft beside the filed one only when asked.
  if (!departmentId && !input.again && (await db.collegeFiling.findFirst({ where: { schoolId: desk.schoolId, kind: input.kind, year: input.year, status: "FILED" }, select: { id: true } }))) throw new RuleRefusal("iqac.refuseFiledAgain", 409, { year: yearLabel(input.year) }, "again");
  // Generated from the rows as they stand, with the no-history values it read frozen beside the body (R-21).
  const built = await buildFiling(desk.schoolId, input.kind, input.year, input.cycleId, departmentId, { snapshot: "live" });
  const data = { cycleId: input.cycleId, format: built.format, body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures), snapshotJson: built.snapshot ?? "{}", generatedByUserId: desk.userId };
  // ONE SAR PER DEPARTMENT AND YEAR, CHECKED WITH THE WRITE (TA-307): the find and the rebuild or insert under a lock of
  // that department's year, and the rebuild only while the SAR is still a draft or returned, so two generations at once
  // leave one row and a generation never rebuilds a SAR the principal signed in between.
  const row = departmentId
    ? await db.$tenantTransaction(async (raw) => {
        const tx = raw as typeof db;
        await tx.$queryRaw`SELECT 1 FROM PG_ADVISORY_XACT_LOCK(HASHTEXT(${`iqac-sar:${desk.schoolId}:${departmentId}:${input.year}`}))`;
        const sar = await tx.collegeFiling.findFirst({ where: { schoolId: desk.schoolId, kind: "NBA_SAR", year: input.year, departmentId }, orderBy: { generatedAt: "desc" }, select: { id: true, status: true } });
        if (!sar) return tx.collegeFiling.create({ data: { schoolId: desk.schoolId, kind: input.kind, year: input.year, departmentId, ...data }, select: { id: true } });
        const rebuilt = await tx.collegeFiling.updateMany({ where: { id: sar.id, status: { in: ["DRAFT", "RETURNED"] } }, data: { ...data, status: "DRAFT", generatedAt: new Date() } });
        if (rebuilt.count !== 1) throw new RuleRefusal("councilFilings.refuseSarTaken", 409);
        return { id: sar.id };
      })
    : await db.collegeFiling.create({ data: { schoolId: desk.schoolId, kind: input.kind, year: input.year, departmentId, ...data }, select: { id: true } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.filing.generate", targetType: "CollegeFiling", targetId: row.id, meta: { kind: input.kind, year: input.year, ...(departmentId ? { departmentId } : {}) } });
  return row.id;
}

/** The file: CSV text as stored, or the PDF drawn from the stored JSON. */
export async function filingFile(ctx: ActiveContext, filingId: string): Promise<{ filename: string; mime: string; bytes: Buffer }> {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN", "PRINCIPAL"]);
  const f = await db.collegeFiling.findFirst({ where: { id: filingId, schoolId: desk.schoolId }, select: { kind: true, year: true, format: true, body: true } });
  if (!f) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  const name = `${f.kind.toLowerCase()}-${yearLabel(f.year)}`;
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.filing.download", targetType: "CollegeFiling", targetId: filingId, meta: { kind: f.kind } });
  if (f.format === "CSV") return { filename: `${name}.csv`, mime: "text/csv; charset=utf-8", bytes: Buffer.from(f.body, "utf8") };
  const { renderFilingPdf } = await import("./iqac-pdf");
  return { filename: `${name}.pdf`, mime: "application/pdf", bytes: await renderFilingPdf(JSON.parse(f.body) as FilingDocument) };
}

/** The IQAC sends a NAAC document to the principal: the head-approval pattern's ask. */
export async function submitFiling(ctx: ActiveContext, filingId: string) {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN"]);
  const f = await db.collegeFiling.findFirst({ where: { id: filingId, schoolId: desk.schoolId }, select: { id: true, kind: true, status: true } });
  if (!f) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (!SIGNED_FILINGS.includes(f.kind as CollegeFilingKind)) throw new RuleRefusal("iqac.refuseNoSignoff", 422);
  if (f.status !== "DRAFT" && f.status !== "RETURNED") return listFilings(ctx);
  // Nobody to sign it off, nothing is sent (A3-journeys-36): it would wait in AWAITING_SIGNOFF for no one.
  const heads = await db.membership.findMany({ where: { schoolId: desk.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  if (heads.length === 0) throw new RuleRefusal("iqac.refuseNoPrincipal", 409);
  // Sent only while still a draft or returned (TA-307, as QA-34 made the sign-off): a second press landing after the
  // principal signed changes nothing.
  const sent = await db.collegeFiling.updateMany({ where: { id: f.id, schoolId: desk.schoolId, status: { in: ["DRAFT", "RETURNED"] } }, data: { status: "AWAITING_SIGNOFF", submittedAt: new Date() } });
  if (sent.count !== 1) return listFilings(ctx);
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.filing.submit", targetType: "CollegeFiling", targetId: f.id, meta: { kind: f.kind } });
  for (const h of heads) await notify({ userId: h.userId, schoolId: desk.schoolId, kind: "SYSTEM", titleKey: "iqac.notifySignoffTitle", bodyKey: "iqac.notifySignoffBody", bodyVars: { kind: f.kind }, url: "/principal/accreditation" });
  return listFilings(ctx);
}

/** The principal signs off or returns with a note; the decision is the audit row (the decision log reads it). */
export async function signOffFiling(ctx: ActiveContext, filingId: string, input: { decision: "SIGN" | "RETURN"; note: string }) {
  const desk = await iqacActor(ctx, ["PRINCIPAL"]);
  const f = await db.collegeFiling.findFirst({ where: { id: filingId, schoolId: desk.schoolId }, select: { id: true, kind: true, status: true, generatedByUserId: true } });
  if (!f) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (f.status !== "AWAITING_SIGNOFF") throw new RuleRefusal("iqac.refuseNotAwaiting", 409);
  if (input.decision === "RETURN" && !input.note) throw new RuleRefusal("iqac.refuseReturnNote", 422, undefined, "note");
  // One decision (QA-34): a SIGN and a RETURN sent at once both read AWAITING_SIGNOFF and both wrote, leaving a RETURNED
  // filing with signedOffAt set, two decisions in the log and the IQAC told both. The decision is now a conditional
  // update that matches only while the filing waits (the row's lock serialises the two); the loser is refused as not
  // waiting, and a return clears any sign-off.
  const decided = await db.collegeFiling.updateMany({ where: { id: f.id, schoolId: desk.schoolId, status: "AWAITING_SIGNOFF" }, data: input.decision === "SIGN" ? { status: "SIGNED_OFF", signedOffAt: new Date(), signedOffByUserId: desk.userId, principalNote: input.note } : { status: "RETURNED", signedOffAt: null, signedOffByUserId: null, principalNote: input.note } });
  if (decided.count !== 1) throw new RuleRefusal("iqac.refuseNotAwaiting", 409);
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: input.decision === "SIGN" ? "iqac.filing.signoff" : "iqac.filing.return", targetType: "CollegeFiling", targetId: f.id, meta: { kind: f.kind } });
  if (f.generatedByUserId) await notify({ userId: f.generatedByUserId, schoolId: desk.schoolId, kind: "SYSTEM", titleKey: input.decision === "SIGN" ? "iqac.notifySignedTitle" : "iqac.notifyReturnedTitle", bodyKey: "iqac.notifySignedBody", bodyVars: { kind: f.kind }, url: "/iqac/documents" });
  return listFilings(ctx);
}

/** The IQAC's mark that the filing went in on the portal, with the portal's acknowledgement if it has one. */
export async function markFiled(ctx: ActiveContext, filingId: string, fileId: string | null) {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN"]);
  const f = await db.collegeFiling.findFirst({ where: { id: filingId, schoolId: desk.schoolId }, select: { id: true, kind: true, status: true } });
  if (!f) throw new AccessError("iqac.refuseNoItem", "NOT_FOUND");
  if (SIGNED_FILINGS.includes(f.kind as CollegeFilingKind) && f.status !== "SIGNED_OFF" && f.status !== "FILED") throw new RuleRefusal("iqac.refuseNotSigned", 409);
  const ack = await spendFile(desk, fileId, "ACKNOWLEDGEMENT", f.kind);
  await db.collegeFiling.update({ where: { id: f.id }, data: { status: "FILED", checked: true, ...(ack ? { fileId: ack } : {}) } });
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.filing.filed", targetType: "CollegeFiling", targetId: f.id, meta: { kind: f.kind } });
  return listFilings(ctx);
}

/* -------------------------------------------------------------------------- */
/* The public disclosure                                                       */
/* -------------------------------------------------------------------------- */

/** Whether the college's streams bring the AICTE disclosure (5 Oct 2026): a page that draws the disclosure's card asks first. */
export async function disclosureApplies(schoolId: string): Promise<boolean> {
  const { filingsOf } = await import("./council-filings");
  return (await filingsOf(schoolId)).includes("AICTE_DISCLOSURE");
}

export async function disclosureState(ctx: ActiveContext) {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN", "PRINCIPAL"]);
  if (!(await disclosureApplies(desk.schoolId))) throw new AccessError("councilFilings.refuseNotApplicable", "NOT_FOUND");
  const [row, school] = await Promise.all([db.disclosurePage.findUnique({ where: { schoolId: desk.schoolId }, select: { publishedAt: true } }), db.school.findUniqueOrThrow({ where: { id: desk.schoolId }, select: { slug: true } })]);
  return { publishedAt: row?.publishedAt?.toISOString() ?? null, slug: school.slug, url: `/public/disclosure/${school.slug}` };
}

/** A page still published at a college whose streams no longer bring the disclosure (TA-265): the desk's card offers its take-down. */
export async function leftoverDisclosure(ctx: ActiveContext): Promise<{ publishedAt: string; slug: string; url: string } | null> {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN", "PRINCIPAL"]);
  const row = await db.disclosurePage.findUnique({ where: { schoolId: desk.schoolId }, select: { publishedAt: true, schoolSlug: true } });
  return row?.publishedAt ? { publishedAt: row.publishedAt.toISOString(), slug: row.schoolSlug, url: `/public/disclosure/${row.schoolSlug}` } : null;
}

/** Publish (a fresh snapshot from the rows) or take the page down. The office's and the IQAC's. */
export async function setDisclosure(ctx: ActiveContext, publish: boolean, now = new Date()) {
  const desk = await iqacActor(ctx, ["IQAC", "ADMIN"]);
  // The streams gate publishing only (TA-265): a page published before the streams stopped bringing the disclosure
  // can still be taken down, as publishedDisclosure's own comment promises.
  const applies = await disclosureApplies(desk.schoolId);
  if (publish && !applies) throw new AccessError("councilFilings.refuseNotApplicable", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: desk.schoolId }, select: { slug: true } });
  if (publish) {
    const year = now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
    const { document } = await disclosureDocument(desk.schoolId, year);
    const snapshotJson = JSON.stringify(document);
    await db.disclosurePage.upsert({ where: { schoolId: desk.schoolId }, create: { schoolId: desk.schoolId, schoolSlug: school.slug, publishedAt: now, snapshotJson, hash: iqacHash(snapshotJson) }, update: { schoolSlug: school.slug, publishedAt: now, snapshotJson, hash: iqacHash(snapshotJson) } });
  } else {
    await db.disclosurePage.updateMany({ where: { schoolId: desk.schoolId }, data: { publishedAt: null } });
  }
  await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: publish ? "iqac.disclosure.publish" : "iqac.disclosure.unpublish", targetType: "School", targetId: desk.schoolId, meta: {} });
  if (!applies) return { publishedAt: null, slug: school.slug, url: `/public/disclosure/${school.slug}` };
  return disclosureState(ctx);
}

/** For the signed-out page: the published snapshot by the college's slug, or null. Reads one row the policy opens to anyone. */
export async function publishedDisclosure(slug: string): Promise<FilingDocument | null> {
  // The gate by stream is on publishing (setDisclosure); a signed-out reader cannot read the college's row to
  // ask again, so a page published before a change of streams stands until the desk takes it down (5 Oct 2026).
  const row = await db.disclosurePage.findFirst({ where: { schoolSlug: slug, publishedAt: { not: null } }, select: { snapshotJson: true } });
  return row ? (JSON.parse(row.snapshotJson) as FilingDocument) : null;
}

