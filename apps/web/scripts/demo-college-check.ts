/**
 * THE CHECK OF THE DEMO COLLEGES FOR EVERY STREAM (6 October 2026), kept
 * beside scripts/demo-college-stream.ts so a rebuilt demo is checked the same
 * way every time, never by hand.
 *
 *   npm run demo:college-check -- --slug=saraswati-law            facts, then the page walk
 *   npm run demo:college-check -- --all                           every built tenant
 *   npm run demo:college-check -- --slug=… --facts                facts only (no server needed)
 *   npm run demo:college-check -- … --out=<dir>                   also write <dir>/<slug>.json
 *   npm run demo:college-check -- --purge                         remove the walk's sessions (tag "ds")
 *
 * 1. THE FACTS, read from the rows (ok / GAP lines): one membership per role
 *    the roster names, the duties set as planned (and the registrar's audit
 *    row), every module the stream's preset asks for on, the year's filings
 *    generated (and their audit rows), the stream's records present, the fee
 *    plan of every student and the scholarship sanctioned, last term's grade
 *    cards published, this term's sitting in conduct, no register without a
 *    mark, the adult child's consents, the cycle computed, the visit file.
 * 2. THE PAGE WALK against the running dev server (BASE, default
 *    http://localhost:3000): a session minted for each person with
 *    `npm run zz:token -- ROLE email --tag=ds`, the person's home read, the
 *    nav entries the home's shell actually draws (NAV[role] ∩ the links in
 *    the HTML) read one by one, each judged by its HTTP status and the
 *    streamed digest (scripts/streamed-status.ts): a 200 is expected; a 404,
 *    a 500, a redirect (to /switch or anywhere) is a finding; an empty state
 *    (data-empty-state) is listed with its title, for the reader to judge
 *    against the data the build wrote; a raw dictionary key in the page's
 *    text is a finding. Then the Marathi pass: the home and the stream's own
 *    pages again with the session as a bearer and `X-Language: mr`,
 *    recording any sentence of the English dictionary (four words or more,
 *    translated differently in Marathi) found on the page.
 * 3. The phone's contract suite is NOT run here.
 *
 * Reads only. The sessions it mints are purged at the end of each tenant's walk.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { DUTY_BUILT, STREAM_PRESETS, type DutyCode } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { mr } from "@edulink/i18n/mr";
import { NAV } from "../src/lib/nav";
import type { Role } from "../src/lib/constants";
import { streamedStatus } from "./streamed-status";
import { STREAM_SPECS, specOf, type StreamSpec } from "./demo-college-stream-specs";
import { CHILDREN, CONSENTS, alumnusEmail, boardersOf, dutiesOffered, dutyPage, dutyPlan, filingsPlanned, homeOf, inventoryOn, labStream, parentEmail, placementOn, recruiterEmail, staffOf, studentEmail, studentsOf } from "./demo-college-stream";
import { demoCalendar } from "./demo-calendar";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const BASE = process.env.BASE ?? "http://localhost:3000";
const CAL = demoCalendar();
const TAG = "ds";
const argv = process.argv.slice(2);
const flag = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

/* -------------------------------------------------------------------------- */
/* 1. the facts                                                                */
/* -------------------------------------------------------------------------- */

type Line = { ok: boolean; what: string; detail: string };

async function facts(spec: StreamSpec): Promise<Line[]> {
  const out: Line[] = [];
  const check = (what: string, ok: boolean, detail = "") => out.push({ ok, what, detail });
  const school = await db.school.findUnique({ where: { slug: spec.slug }, select: { id: true, kind: true, streamsJson: true, affiliatingUniversity: true } });
  if (!school) return [{ ok: false, what: "the college exists", detail: `no school with slug ${spec.slug}` }];
  const s = school.id;
  check("kind, stream and affiliation", school.kind === spec.kind && school.streamsJson === JSON.stringify([spec.stream]) && school.affiliatingUniversity === spec.university, `${school.kind} ${school.streamsJson} ${school.affiliatingUniversity}`);

  // One membership per role the roster names, each the named person's.
  for (const p of staffOf(spec)) {
    const n = await db.membership.count({ where: { schoolId: s, role: p.role, status: "ACTIVE", leftAt: null, user: { email: p.email } } });
    check(`${p.role} ${p.email}`, n === 1, `${n} active membership(s)`);
  }
  for (const st of studentsOf(spec)) {
    const m = await db.membership.findFirst({ where: { schoolId: s, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: studentEmail(spec, st.n) } }, select: { id: true, user: { select: { isMinor: true } } } });
    check(`STUDENT ${studentEmail(spec, st.n)}${st.minor ? " (minor)" : ""}`, Boolean(m) && m!.user.isMinor === st.minor, m ? `isMinor ${m.user.isMinor}` : "no membership");
  }
  const guardianships = await db.guardianship.count({ where: { studentSchoolId: s, status: "ACTIVE", parent: { email: parentEmail(spec) } } });
  check(`PARENT ${parentEmail(spec)} guards ${CHILDREN.length}`, guardianships === CHILDREN.length, `${guardianships}`);
  const alum = await db.membership.count({ where: { schoolId: s, role: "ALUMNUS", status: "ACTIVE", user: { email: alumnusEmail(spec) } } });
  check(`ALUMNUS ${alumnusEmail(spec)}`, alum === 1, `${alum}`);
  if (placementOn(spec) && spec.recruiter) {
    const r = await db.recruiterProfile.findFirst({ where: { user: { email: recruiterEmail(spec) }, disabledAt: null }, select: { userId: true } });
    const bound = r ? await db.companyRecruiter.count({ where: { userId: r.userId, removedAt: null, company: { verifiedAt: { not: null } } } }) : 0;
    const open = await db.drive.count({ where: { schoolId: s, status: "OPEN" } });
    check(`RECRUITER ${recruiterEmail(spec)}: verified company, an OPEN drive`, Boolean(r) && bound === 1 && open >= 1, `profile ${Boolean(r)}, bound ${bound}, open drives ${open}`);
  }

  // The duties, as planned, given through setDuties (its audit row).
  const plan = dutyPlan(spec);
  for (const key of ["f1", "f2", "f3", "f4"] as const) {
    const email = staffOf(spec).find((p) => p.key === key)!.email;
    const m = await db.membership.findFirst({ where: { schoolId: s, role: "FACULTY", user: { email } }, select: { id: true, dutiesJson: true } });
    const held = m ? (JSON.parse(m.dutiesJson) as string[]).sort().join(",") : "";
    const audited = m && plan[key].length ? await db.auditLog.count({ where: { schoolId: s, action: "people.duties.set", targetId: m.id } }) : 1;
    check(`duties of ${email}`, held === [...plan[key]].sort().join(",") && audited > 0, `${held || "none"}; audit rows ${audited}`);
  }
  const all = (await db.membership.findMany({ where: { schoolId: s, role: { in: ["FACULTY", "HOD"] } }, select: { dutiesJson: true } })).flatMap((m) => JSON.parse(m.dutiesJson) as string[]);
  const offered = dutiesOffered(spec);
  check("every offered duty held", offered.every((d) => all.includes(d)), `offered ${offered.join(",")}`);
  // A duty whose desk is not built is given to nobody (DUTY_BUILT; the clinical desk is built since 10 Oct 2026, R-56).
  check("no unbuilt duty", !all.some((d) => !DUTY_BUILT[d as DutyCode]), all.join(","));

  // The modules: the preset's, and the campus four.
  const on = (await db.schoolModule.findMany({ where: { schoolId: s }, select: { module: true } })).map((m) => m.module);
  const want = [...STREAM_PRESETS[spec.stream].modulesOn, "LIBRARY", "HOSTEL", "TRANSPORT", "PAYROLL"];
  const missing = want.filter((m) => !on.includes(m));
  check("the preset's modules and the campus four on", missing.length === 0, missing.length ? `missing ${missing.join(",")}` : on.sort().join(","));

  // The filings.
  for (const f of filingsPlanned(spec)) {
    const row = await db.collegeFiling.findFirst({ where: { schoolId: s, kind: f.kind, year: f.year }, select: { id: true, figuresJson: true } });
    const audited = row ? await db.auditLog.count({ where: { schoolId: s, action: "iqac.filing.generate", targetId: row.id } }) : 0;
    check(`filing ${f.kind} ${f.year} generated`, Boolean(row) && audited > 0, row ? `figures ${row.figuresJson.slice(0, 160)}` : "missing");
  }
  if (filingsPlanned(spec).some((f) => f.kind === "AICTE_DISCLOSURE")) check("AICTE disclosure published", (await db.disclosurePage.count({ where: { schoolId: s, publishedAt: { not: null } } })) === 1);

  // The stream's records.
  if (spec.stream === "LAW") {
    check("two moots", (await db.mootCourt.count({ where: { schoolId: s } })) >= 2);
    check("law internships (court, legal aid)", (await db.internship.count({ where: { schoolId: s, kind: { in: ["COURT", "FIRM", "LEGAL_AID"] } } })) >= 2);
  }
  if (spec.stream === "MANAGEMENT") check("a summer internship", (await db.internship.count({ where: { schoolId: s, kind: "SUMMER" } })) >= 1);
  if (spec.stream === "HEALTH_SCIENCES" || spec.stream === "PHARMACY") {
    // The clinical desk (R-56, the clinical half; 10 Oct 2026).
    check("a clinical site with two departments", (await db.clinicalSite.count({ where: { schoolId: s } })) >= 1 && (await db.clinicalDepartment.count({ where: { schoolId: s } })) >= 2);
    check("a rotation of two postings", (await db.clinicalPosting.count({ where: { schoolId: s } })) >= 2);
    const states = (await db.logbookEntry.groupBy({ by: ["state"], where: { schoolId: s } })).map((g) => g.state).sort();
    check("a logbook entry in each state", ["DRAFT", "RETURNED", "SIGNED", "SUBMITTED"].every((x) => states.includes(x)), states.join(","));
    check("no identifier in any logbook note", !(await db.logbookEntry.findMany({ where: { schoolId: s }, select: { note: true } })).some((e) => /\d{6,}|@/.test(e.note)));
  }
  if (spec.stream === "EDUCATION") {
    check("practice schools", (await db.practiceSchool.count({ where: { schoolId: s } })) >= 2);
    check("practice postings", (await db.teachingPracticePosting.count({ where: { schoolId: s } })) >= 3);
    check("lessons observed", (await db.lessonObservation.count({ where: { schoolId: s } })) >= 3);
  }
  if (labStream(spec)) {
    check("lab batches", (await db.labBatch.count({ where: { schoolId: s } })) >= 3);
    const pr = await db.practicalRecord.count({ where: { schoolId: s } });
    const signed = await db.practicalRecord.count({ where: { schoolId: s, signedAt: { not: null } } });
    check("practical records, signed and waiting", pr > 0 && signed > 0 && signed < pr, `${pr} records, ${signed} signed`);
  } else check("no lab batches at a stream without labs", (await db.labBatch.count({ where: { schoolId: s } })) === 0);
  if (inventoryOn(spec)) check("lab stock and assets", (await db.inventoryStock.count({ where: { schoolId: s, quantity: { gt: 0 } } })) > 0 && (await db.asset.count({ where: { schoolId: s } })) > 0);
  for (const corps of ["NSS", "NCC"] as const) {
    if (!offered.includes(`${corps}_OFFICER` as never)) continue;
    check(`${corps} enrolments and an activity`, (await db.corpsEnrolment.count({ where: { schoolId: s, corps } })) > 0 && (await db.activity.count({ where: { schoolId: s, kind: corps } })) > 0);
  }
  check("research items for the dean", (await db.researchItem.count({ where: { schoolId: s } })) >= 3);
  check("an exam-squad visit", (await db.examSquadVisit.count({ where: { schoolId: s } })) >= 1);

  // Money: every student's fee plan for the year, a scholarship sanctioned.
  const year = await db.academicYear.findFirst({ where: { schoolId: s, isCurrent: true }, select: { id: true, name: true } });
  const plans = year ? await db.studentFeePlan.count({ where: { schoolId: s, academicYearId: year.id } }) : 0;
  check(`a fee plan for each of the 8 students (${year?.name ?? "no current year"})`, plans === 8, `${plans}`);
  check("a scholarship sanctioned", (await db.scholarshipClaim.count({ where: { schoolId: s, status: "SANCTIONED" } })) >= 1);

  // Exams.
  const run = await db.resultRun.findFirst({ where: { schoolId: s, status: "PUBLISHED" }, select: { id: true } });
  const cards = run ? await db.examDocument.count({ where: { schoolId: s, kind: "GRADE_CARD", runId: run.id } }) : 0;
  const sat = run ? await db.termResult.count({ where: { runId: run.id } }) : 0;
  check("last term published, a grade card for each who sat", Boolean(run) && cards === sat && sat > 0, `${cards} cards, ${sat} sat`);
  check("this term's sitting in conduct", (await db.examSession.count({ where: { schoolId: s, status: "CONDUCT" } })) === 1);
  if (spec.kind === "AUTONOMOUS_COLLEGE") check("an autonomous paper sealed", (await db.questionPaper.count({ where: { schoolId: s, sealedBody: { not: null } } })) >= 1);

  // Registers: none without a mark; the term's register window covered.
  const lectures = await db.lecture.findMany({ where: { schoolId: s }, select: { id: true, dateKey: true, _count: { select: { attendance: true } } } });
  // A teacher's page opens today's lectures as it is read (they are then due, not empty): only the days before today must carry marks.
  const empty = lectures.filter((l) => l._count.attendance === 0 && l.dateKey < CAL.today);
  const dueToday = lectures.filter((l) => l._count.attendance === 0 && l.dateKey >= CAL.today).length;
  check("no register without a mark before today", lectures.length > 0 && empty.length === 0, `${lectures.length} registers, ${empty.length} empty, ${dueToday} opened for today and due`);
  const last = lectures.map((l) => l.dateKey).sort().pop();
  check(`registers up to the week before the run (${CAL.registerTo})`, Boolean(last && last >= CAL.registerTo.slice(0, 8)), `last ${last}`);

  // The adult child's consents; the cycle; the visit; the campus.
  const elder = await db.membership.findFirst({ where: { schoolId: s, role: "STUDENT", user: { email: studentEmail(spec, 1) } }, select: { id: true } });
  const grants = elder ? (await db.studentConsent.findMany({ where: { studentMembershipId: elder.id, revokedAt: null }, select: { grant: true } })).map((g) => g.grant) : [];
  check(`student 1 granted ${CONSENTS.join(", ")}`, CONSENTS.every((c) => grants.includes(c)), grants.join(","));
  const cycle = await db.accreditationCycle.findFirst({ where: { schoolId: s }, select: { id: true } });
  const scores = cycle ? await db.metricScore.count({ where: { cycleId: cycle.id } }) : 0;
  check("a NAAC cycle computed", scores > 0, `${scores} metric scores`);
  check("the peer-team visit file", (await db.peerVisitItem.count({ where: { schoolId: s } })) >= 4);
  check("the library: a book out", (await db.libraryIssue.count({ where: { schoolId: s, returnedAt: null } })) >= 1);
  check(`the hostel: ${boardersOf(spec).length} boarders`, (await db.hostelAllotment.count({ where: { schoolId: s, status: "ACTIVE" } })) === boardersOf(spec).length);
  check("transport: three riders", (await db.transportAllotment.count({ where: { schoolId: s } })) === 3);
  check("payroll: September locked", (await db.payrollRun.count({ where: { schoolId: s, status: "LOCKED" } })) >= 1);
  return out;
}

/* -------------------------------------------------------------------------- */
/* 2. the page walk                                                            */
/* -------------------------------------------------------------------------- */

type Person = { role: Role; email: string; label: string; full: boolean };
type PageResult = { person: string; role: string; path: string; status: number; loc: string | null; streamed: boolean; empty: string[]; rawKeys: string[]; english: string[]; locale: "en" | "mr"; ms: number };

function flatten(obj: unknown, prefix = "", out: Map<string, string> = new Map()): Map<string, string> {
  if (typeof obj === "string") out.set(prefix, obj);
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}
const EN = flatten(en);
const MR = flatten(mr);
const KEYS = new Set(EN.keys());
/** English dictionary sentences of four words or more, with no placeholder, that Marathi says otherwise. */
const EN_SENTENCES = [...EN.entries()].filter(([k, v]) => !v.includes("{") && v.split(/\s+/).length >= 4 && v.length >= 20 && MR.get(k) && MR.get(k) !== v).map(([, v]) => v);

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}
function emptyStates(html: string): string[] {
  const out: string[] = [];
  const re = /data-empty-state="true"[^>]*>([\s\S]*?)<\/h[12]>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(visibleText(m[1]!).trim().slice(0, 120));
  return out;
}
function rawKeys(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\b[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+){1,5}\b/g)) if (KEYS.has(m[0])) found.add(m[0]);
  return [...found];
}

function mint(role: string, email: string): string {
  const out = execFileSync("npm", ["run", "-s", "zz:token", "--", role, email, `--tag=${TAG}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const token = out.trim().split("\n").pop()!.trim();
  if (!/^[A-Za-z0-9_-]{30,}$/.test(token)) throw new Error(`zz:token ${role} ${email}: ${out}`);
  return token;
}
function purge() {
  const res = execFileSync("npm", ["run", "-s", "zz:token", "--", "--purge", `--tag=${TAG}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return res.trim();
}

async function fetchPage(path: string, token: string, locale: "en" | "mr"): Promise<{ status: number; loc: string | null; body: string; ms: number }> {
  const started = Date.now();
  const headers: Record<string, string> = locale === "en" ? { cookie: `edulink_session=${token}; __Host-edulink_session=${token}` } : { authorization: `Bearer ${token}`, "x-language": "mr" };
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(`${BASE}${path}`, { headers, redirect: "manual", signal: AbortSignal.timeout(120_000) });
      const body = await res.text();
      return { status: res.status, loc: res.headers.get("location"), body, ms: Date.now() - started };
    } catch (e) {
      if (attempt >= 1) return { status: 0, loc: String((e as Error).message), body: "", ms: Date.now() - started };
    }
  }
}

function people(spec: StreamSpec): Person[] {
  const list: Person[] = staffOf(spec).map((p) => ({ role: p.role as Role, email: p.email, label: `${p.role}${p.key.startsWith("f") ? ` ${p.key}` : ""}`, full: true }));
  for (const st of studentsOf(spec)) list.push({ role: "STUDENT" as Role, email: studentEmail(spec, st.n), label: `STUDENT ${st.n}`, full: st.n === 1 || st.n === 4 || st.n === 7 });
  list.push({ role: "PARENT" as Role, email: parentEmail(spec), label: "PARENT", full: true });
  list.push({ role: "ALUMNUS" as Role, email: alumnusEmail(spec), label: "ALUMNUS", full: true });
  if (placementOn(spec) && spec.recruiter) list.push({ role: "RECRUITER" as Role, email: recruiterEmail(spec), label: "RECRUITER", full: true });
  return list;
}

const STREAM_PAGE = /\/(duties|stream-records|moot|practicals|teaching-practice|visits|council|documents|nba)\b/;

async function walk(spec: StreamSpec): Promise<PageResult[]> {
  const results: PageResult[] = [];
  const plan = dutyPlan(spec);
  for (const p of people(spec)) {
    const token = mint(p.role, p.email);
    const home = homeOf(p.role);
    const judge = (path: string, r: { status: number; loc: string | null; body: string; ms: number }, locale: "en" | "mr") => {
      const st = streamedStatus(r.status, r.body, r.loc);
      const text = visibleText(r.body);
      results.push({ person: p.email, role: p.label, path, status: st.status, loc: st.loc, streamed: st.streamed, empty: st.status === 200 ? emptyStates(r.body) : [], rawKeys: st.status === 200 ? rawKeys(text) : [], english: locale === "mr" && st.status === 200 ? EN_SENTENCES.filter((x) => text.includes(x)).slice(0, 8) : [], locale, ms: r.ms });
    };
    // A home that sends its role on to its own page (the principal's to /principal/college) is followed once;
    // a redirect to /switch or /login is not, and is the finding.
    let first = await fetchPage(home, token, "en");
    const firstSt = streamedStatus(first.status, first.body, first.loc);
    judge(home, first, "en");
    if (firstSt.status >= 300 && firstSt.status < 400 && firstSt.loc && firstSt.loc.startsWith("/") && !/^\/(switch|login)/.test(firstSt.loc)) {
      first = await fetchPage(firstSt.loc, token, "en");
      judge(firstSt.loc, first, "en");
    }
    // The nav the shell draws: NAV[role] entries whose link is in the home's HTML.
    const links = new Set([...first.body.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]!));
    const nav = (NAV[p.role] ?? []).map((i) => i.href).filter((h) => h !== home && links.has(h));
    // A duty holder's desks, whether or not the home links them, so a hidden one is seen.
    const key = staffOf(spec).find((x) => x.email === p.email)?.key;
    const duties = key === "f1" || key === "f2" || key === "f3" || key === "f4" ? plan[key].map(dutyPage) : [];
    const pages = p.full ? [...new Set([...nav, ...duties])] : [];
    for (const path of pages) judge(path, await fetchPage(path, token, "en"), "en");
    // The Marathi pass: the home and the stream's own pages.
    for (const path of [home, ...pages.filter((x) => STREAM_PAGE.test(x))]) judge(path, await fetchPage(path, token, "mr"), "mr");
    process.stderr.write(`    ${p.label.padEnd(18)} ${p.email.padEnd(36)} ${pages.length + 1} page(s)\n`);
  }
  return results;
}

/* -------------------------------------------------------------------------- */

async function main() {
  if (argv.includes("--purge")) return void console.log(purge());
  const specs = argv.includes("--all") ? STREAM_SPECS : [specOf(flag("slug") ?? flag("stream") ?? "")].filter((x): x is StreamSpec => Boolean(x));
  if (!specs.length) throw new Error("usage: demo:college-check -- --slug=<slug> | --all [--facts] [--out=<dir>] | --purge");
  const out = flag("out");
  let gaps = 0;
  for (const spec of specs) {
    const school = await db.school.findUnique({ where: { slug: spec.slug }, select: { id: true } });
    if (!school) {
      console.log(`\n== ${spec.slug}: not built`);
      continue;
    }
    console.log(`\n== ${spec.name} (${spec.slug}, ${spec.stream})\n-- facts`);
    const lines = await facts(spec);
    for (const l of lines) console.log(`  ${l.ok ? "ok " : "GAP"} ${l.what}${l.detail ? ` — ${l.detail}` : ""}`);
    gaps += lines.filter((l) => !l.ok).length;
    let pages: PageResult[] = [];
    if (!argv.includes("--facts")) {
      const health = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(30_000) }).then((r) => r.status).catch(() => 0);
      if (health !== 200) {
        console.log(`-- page walk: NOT WALKED (${BASE}/api/health answered ${health || "nothing"})`);
      } else {
        console.log(`-- page walk (${BASE})`);
        try {
          pages = await walk(spec);
        } finally {
          process.stderr.write(`    ${purge()}\n`);
        }
        const bad = pages.filter((r) => r.status !== 200);
        const empties = pages.filter((r) => r.empty.length && r.locale === "en");
        const keys = pages.filter((r) => r.rawKeys.length);
        const english = pages.filter((r) => r.english.length);
        console.log(`  ${pages.filter((r) => r.locale === "en").length} pages read in English, ${pages.filter((r) => r.locale === "mr").length} in Marathi; ${bad.length} not 200, ${empties.length} with an empty state, ${keys.length} with a raw key, ${english.length} Marathi pages with English`);
        for (const r of bad) console.log(`  NOT-200 ${r.role.padEnd(16)} ${r.path} → ${r.status}${r.loc ? ` ${r.loc}` : ""}${r.streamed ? " (streamed)" : ""} [${r.locale}]`);
        for (const r of empties) console.log(`  EMPTY   ${r.role.padEnd(16)} ${r.path}: ${r.empty.join(" | ")}`);
        for (const r of keys) console.log(`  KEY     ${r.role.padEnd(16)} ${r.path} [${r.locale}]: ${r.rawKeys.join(", ")}`);
        for (const r of english) console.log(`  ENGLISH ${r.role.padEnd(16)} ${r.path}: ${r.english.map((x) => `"${x.slice(0, 80)}"`).join("; ")}`);
      }
    }
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, `${spec.slug}.json`), JSON.stringify({ slug: spec.slug, facts: lines, pages }, null, 1));
    }
  }
  console.log(`\n${gaps} fact gap(s). The phone's contract suite was not run.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
