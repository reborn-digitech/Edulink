/**
 * FIFTEEN YEARS OF A SCHOOL AND A COLLEGE, EVERY ROLE (test campaign 2, 4 Oct 2026).
 *
 *   npm run zz:lifecycle -- [--years 15] [--no-audit] [--out <dir>] [--teardown]
 *
 * Builds ZZ Lifecycle School (the shape of Sunrise: grades 5–10, eight pupils a
 * class, a driver, a librarian and a warden, every school module on) and ZZ
 * Lifecycle College (the shape of Saraswati Arts and Science College: two
 * departments, two three-year programmes, every college module and role), both
 * flagged isTestFixture, then walks the academic years 2026–27 onward through
 * the application's own LIBRARY functions under hand-built role contexts — the
 * functions the pages and the API call — never HTTP.
 *
 * THE CLOCK. The process's `Date` is replaced by a pinned clock (setClock): a
 * library function that reads `new Date()`/`Date.now()` internally sees the
 * simulated day, and every function that takes a `now` is handed it. What the
 * shim cannot reach is listed in the report as "cannot be clock-driven": the
 * database's own `now()` defaults (createdAt, joinedAt, …) and @updatedAt,
 * which Prisma's engine stamps with the real time. After every phase the
 * rows the phase wrote in the two tenants are re-dated to the simulated time
 * (`redate`), so the retention sweep, the year archive and the audit read a
 * history that happened when the simulation says it did.
 *
 * WHAT IT NEVER TOUCHES. Only the two slugs below, the users who belong to
 * nothing else, and users whose email starts `zzlc.` on @zz.test. Every job it
 * runs is called with a scope naming them (retention with a scope on EVERY key
 * — a scope of schoolIds alone deletes every session in the database, see the
 * report — departures, minority, subscriptions, regulators); nothing global
 * runs on the simulated clock. Accounts carry unknowable password hashes;
 * actors are hand-built contexts on Session rows with userAgent "zz-walk".
 *
 * IDEMPOTENT. A second run finds the years already walked (the college's and
 * the school's closed academic years) and walks only what is missing; with
 * every year walked it writes nothing and prints the stored counts. A year
 * left half-walked by a crash is refused, by name, with the teardown to run.
 * `--teardown` deletes child tables first (the foreign-key graph read from
 * Postgres), never a cascade from School, and proves no row is left.
 *
 * `--college engineering` (5 Oct 2026, the streams batch) walks a third tenant
 * ON ITS OWN: ZZ Lifecycle Engineering College (slug zz-lifecycle-engineering,
 * kind AUTONOMOUS_COLLEGE, streams ["ENGINEERING"], accounts zzlc.e.*@zz.test),
 * and neither the school nor the arts college. The same college year runs
 * (collegeYear, runTerm, capAdmissions… are parameterised by the world's
 * CollegeSpec) with two four-year BE programmes (Computer Engineering BECOMP,
 * Mechanical Engineering BEMECH, AICTE, eight semesters), so the first
 * graduation is in the fourth year (2029–30). Beside the arts college's year it
 * walks what the stream brings: lab batches split each term after registration
 * (size 4 for an intake of six or seven, so two batches a division), one course
 * per semester per programme with practical credits and a LAB hour per batch
 * whose lectures are marked for the batch only (and one negative check that a
 * mark for a student outside the batch is refused), the practical record
 * written by the offering's teacher and signed by the department's
 * LAB_INCHARGE, the autonomous exam session's own conduct (date sheet, setters,
 * sealed papers, moderation, one opening by the controller, halls, seating, hall
 * tickets, printing lists, assessment bundles, external marks by double entry
 * of the controller and the registrar instead of the university's file), and
 * each year's NBA SAR for the Computer Engineering department (generated,
 * self-assessed by its HOD, regenerated, submitted, signed off, filed).
 * Without the flag the walk is exactly as before. `--college engineering
 * --teardown` tears down the engineering tenant only; the plain `--teardown`
 * leaves zzlc.e.* accounts alone.
 */
import Module from "node:module";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { ActiveContext } from "@/lib/session";

/* -------------------------------------------------------------------------- */
/* next/headers outside a request                                              */
/* -------------------------------------------------------------------------- */

// Several library functions reach getT() → cookies(), which throws outside a
// Next request (exam-cell submitForm/importMarks, library returnCopy, IQAC
// readers…). The tests alias next/headers to tests/stubs; a tsx script has
// only scripts/tsconfig.json, which stubs server-only. So the resolution is
// redirected here, BEFORE any library is loaded (every library is imported
// dynamically below for exactly this reason).
{
  const stub = join(process.cwd(), "tests/stubs/next-headers.ts");
  const M = Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string };
  const original = M._resolveFilename;
  M._resolveFilename = function (request: string, ...rest: unknown[]) {
    return original.call(this, request === "next/headers" ? stub : request, ...rest);
  };
}

/* -------------------------------------------------------------------------- */
/* the pinned clock                                                            */
/* -------------------------------------------------------------------------- */

const RealDate = Date;
let offsetMs = 0;
class SimDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) super(RealDate.now() + offsetMs);
    else super(...(args as [string]));
  }
  static override now(): number {
    return RealDate.now() + offsetMs;
  }
}
(globalThis as { Date: DateConstructor }).Date = SimDate as unknown as DateConstructor;
const realNow = () => RealDate.now();

/** IST wall time on a day, as an instant. */
function ist(dateKey: string, hh = 10, mm = 0): Date {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new RealDate(RealDate.UTC(y, m - 1, d, hh, mm) - 330 * 60_000);
}
let simKey = "";
function setClock(dateKey: string, hh = 10, mm = 0) {
  offsetMs = ist(dateKey, hh, mm).getTime() - RealDate.now();
  simKey = dateKey;
}
const now = () => new Date();

/* -------------------------------------------------------------------------- */
/* arguments                                                                   */
/* -------------------------------------------------------------------------- */

const argv = process.argv.slice(2);
const argOf = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const YEARS = Number(argOf("--years") ?? 15);
const FIRST_YEAR = 2026;
const RUN_AUDIT = !argv.includes("--no-audit");
const OUT = resolve(argOf("--out") ?? join(tmpdir(), "zz-lifecycle"));
const SCHOOL_SLUG = "zz-lifecycle-school";
const COLLEGE_SLUG = "zz-lifecycle-college";
const ENGINEERING_SLUG = "zz-lifecycle-engineering";
const COLLEGE_MODE = argOf("--college") ?? "arts";
if (COLLEGE_MODE !== "arts" && COLLEGE_MODE !== "engineering") throw new Error(`--college takes "engineering" (or "arts", the default), not "${COLLEGE_MODE}"`);
/** The engineering walk: its college alone, no school, no arts college. */
const ENGINEERING = COLLEGE_MODE === "engineering";
const SLUGS = ENGINEERING ? [ENGINEERING_SLUG] : [SCHOOL_SLUG, COLLEGE_SLUG];
/** Every account the walk makes: zzlc.* for the school and the arts college, zzlc.e.* for the engineering college. */
const MAIL_PREFIX = ENGINEERING ? "zzlc.e." : "zzlc.";
const MAIL = (local: string) => `${MAIL_PREFIX}${local}@zz.test`;

/* -------------------------------------------------------------------------- */
/* libraries, loaded after the redirection                                     */
/* -------------------------------------------------------------------------- */

async function loadLibs() {
  return {
    db: (await import("@/lib/db")).db,
    fx: await import("./zz-fixtures"),
    contracts: await import("@edulink/contracts"),
    dates: await import("@/lib/dates"),
    ay: await import("@/lib/academic-year"),
    terms: await import("@/lib/terms"),
    holidays: await import("@/lib/holidays"),
    cohort: await import("@/lib/cohort"),
    intake: await import("@/lib/intake"),
    attendance: await import("@/lib/attendance"),
    grading: await import("@/lib/grading"),
    exams: await import("@/lib/exams"),
    cards: await import("@/lib/report-cards"),
    promotion: await import("@/lib/promotion"),
    record: await import("@/lib/school-record"),
    admissions: await import("@/lib/admissions"),
    certs: await import("@/lib/certificates"),
    certRules: await import("@/lib/certificate-rules"),
    filings: await import("@/lib/filings"),
    fees: await import("@/lib/fees"),
    payments: await import("@/lib/fees-payments"),
    payroll: await import("@/lib/payroll"),
    payrollRules: await import("@/lib/payroll-rules"),
    library: await import("@/lib/library"),
    hostel: await import("@/lib/hostel"),
    transport: await import("@/lib/transport"),
    leave: await import("@/lib/leave"),
    subs: await import("@/lib/subscriptions"),
    gigs: await import("@/lib/gig-sessions"),
    alumni: await import("@/lib/alumni"),
    conv: await import("@/lib/conversations"),
    consent: await import("@/lib/student-consent"),
    birthdate: await import("@/lib/birthdate"),
    retention: await import("@/lib/retention"),
    env: await import("@/lib/env"),
    archive: await import("@/lib/year-archive"),
    academics: await import("@/lib/academics"),
    registration: await import("@/lib/academics-registration"),
    lectures: await import("@/lib/academics-attendance"),
    assessment: await import("@/lib/academics-assessment"),
    timetable: await import("@/lib/timetable"),
    cadm: await import("@/lib/college-admissions"),
    cfees: await import("@/lib/college-fees"),
    scholarships: await import("@/lib/scholarships"),
    noDues: await import("@/lib/no-dues"),
    crecords: await import("@/lib/college-records"),
    cell: await import("@/lib/exam-cell"),
    cellMarks: await import("@/lib/exam-cell-marks"),
    cellAfter: await import("@/lib/exam-cell-after"),
    cellRules: await import("@/lib/exam-cell-rules"),
    iqac: await import("@/lib/iqac"),
    iqacFilings: await import("@/lib/iqac-filings"),
    placement: await import("@/lib/placement"),
    internships: await import("@/lib/placement-internships"),
    placementAnalytics: await import("@/lib/placement-analytics"),
    operatorCollege: await import("@/lib/operator-college"),
    streamRecords: await import("@/lib/stream-records"),
    duties: await import("@/lib/duties"),
    councilFilings: await import("@/lib/council-filings"),
    secretBox: await import("@/lib/secret-box"),
  };
}
type Libs = Awaited<ReturnType<typeof loadLibs>>;
let L!: Libs;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
let dbx!: Any; // the owner-connected client, untyped for raw table work

/* -------------------------------------------------------------------------- */
/* bookkeeping: breaks, timings, the year table                                */
/* -------------------------------------------------------------------------- */

type Break = { year: string; tenant: string; role: string; step: string; error: string; count: number; firstOn: string };
const BREAKS = new Map<string, Break>();
const OPS = new Map<string, { n: number; ms: number; max: number }>();
const NOTES: string[] = [];
let YEAR = "setup";
let TENANT = "setup";

function errorText(e: unknown): string {
  const x = e as { key?: string; errorKey?: string; code?: string; message?: string; status?: number; constructor?: { name?: string } };
  const name = x?.constructor?.name ?? "Error";
  const key = x?.key ?? x?.errorKey;
  const msg = (x?.message ?? String(e)).split("\n").filter(Boolean).slice(-3).join(" | ").slice(0, 400);
  return key ? `${name}(${key}${x.status ? ` ${x.status}` : ""})${msg && msg !== key ? `: ${msg}` : ""}` : `${name}: ${msg}`;
}
function noteBreak(role: string, step: string, error: string) {
  const k = `${YEAR}|${TENANT}|${role}|${step}|${error}`;
  const b = BREAKS.get(k);
  if (b) b.count += 1;
  else BREAKS.set(k, { year: YEAR, tenant: TENANT, role, step, error, count: 1, firstOn: simKey });
  if (!b) console.log(`  ✗ ${YEAR} ${TENANT} ${role} ${step} [${simKey}]: ${error}`);
}
function note(text: string) {
  NOTES.push(`${YEAR} ${TENANT} [${simKey}] ${text}`);
  console.log(`  · ${text}`);
}
function record(op: string, ms: number) {
  const e = OPS.get(op) ?? { n: 0, ms: 0, max: 0 };
  e.n += 1;
  e.ms += ms;
  e.max = Math.max(e.max, ms);
  OPS.set(op, e);
}
/** One library call by one role: timed, and a throw is a break for the report, not the end of the year. */
async function step<T>(role: string, op: string, fn: () => Promise<T>): Promise<T | null> {
  const t0 = performance.now();
  try {
    const out = await fn();
    const refused = out && typeof out === "object" && "ok" in (out as object) && (out as unknown as { ok: unknown }).ok === false;
    if (refused) noteBreak(role, op, `refused ${JSON.stringify(out).slice(0, 300)}`);
    return out;
  } catch (e) {
    noteBreak(role, op, errorText(e));
    return null;
  } finally {
    record(op, performance.now() - t0);
  }
}

/* -------------------------------------------------------------------------- */
/* people and contexts                                                         */
/* -------------------------------------------------------------------------- */

type Actor = { ctx: ActiveContext; userId: string; membershipId: string | null; email: string; name: string };
const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const sessionIds = new Map<string, string>();

async function sessionFor(userId: string, schoolId: string | null, role: string | null): Promise<string> {
  const key = `${userId}|${schoolId}|${role}`;
  const have = sessionIds.get(key);
  if (have) return have;
  const row = await dbx.session.create({ data: { userId, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: schoolId, activeRole: role, userAgent: "zz-walk", expiresAt: new RealDate(realNow() + 6 * 3_600_000) }, select: { id: true } });
  sessionIds.set(key, row.id);
  return row.id;
}
async function actorOf(userId: string, schoolId: string | null, role: string | null, membershipId: string | null): Promise<Actor> {
  const u = await dbx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } });
  const ctx: ActiveContext = {
    sessionId: await sessionFor(userId, schoolId, role),
    membershipId,
    schoolId,
    role: role as ActiveContext["role"],
    user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: PREFS as unknown as ActiveContext["user"]["prefs"] },
  };
  return { ctx, userId, membershipId, email: u.email ?? "", name: u.name };
}
async function asMember(membershipId: string): Promise<Actor> {
  const m = await dbx.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { id: true, userId: true, schoolId: true, role: true } });
  return actorOf(m.userId, m.schoolId, m.role, m.id);
}
const UNKNOWABLE = () => `$argon2id$unknowable$${randomBytes(18).toString("base64url")}`;
async function person(email: string, name: string, extra: { birthdate?: Date; isMinor?: boolean; isSuperuser?: boolean; penNumber?: string } = {}) {
  return dbx.user.upsert({
    where: { email },
    update: {},
    create: { email, name, isTestFixture: true, passwordHash: UNKNOWABLE(), emailVerifiedAt: now(), prefs: JSON.stringify({ theme: "system", channels: { push: false, email: false } }), isMinor: extra.isMinor ?? false, birthdate: extra.birthdate ?? null, isSuperuser: extra.isSuperuser ?? false, penNumber: extra.penNumber ?? null },
    select: { id: true, name: true },
  });
}
async function member(userId: string, schoolId: string, role: string, extra: { title?: string; joinedAt?: Date; gradeLevel?: string; subjects?: string } = {}) {
  const have = await dbx.membership.findUnique({ where: { userId_schoolId_role: { userId, schoolId, role } }, select: { id: true } });
  if (have) return have.id as string;
  return (await dbx.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } })).id as string;
}
async function staff(schoolId: string, local: string, name: string, role: string, title: string, extra: { subjects?: string[] } = {}): Promise<Actor> {
  const u = await person(MAIL(local), name);
  const id = await member(u.id, schoolId, role, { title, joinedAt: ist("2020-06-01"), subjects: extra.subjects ? JSON.stringify(extra.subjects) : undefined });
  return actorOf(u.id, schoolId, role, id);
}

/* -------------------------------------------------------------------------- */
/* re-dating what the database stamped                                         */
/* -------------------------------------------------------------------------- */

let REDATE_COLUMNS: { table: string; column: string }[] = [];
/** table.column → rows the database stamped with the real time and the walk moved to the simulated one: the "cannot be clock-driven" list, measured. */
const REDATED = new Map<string, number>();
let phaseStartReal = 0;
let schoolIdsMine: string[] = [];

async function loadRedateColumns() {
  const rows = await dbx.$queryRawUnsafe(`
    SELECT c.table_name AS "table", c.column_name AS "column"
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.data_type LIKE 'timestamp%'
      AND (c.column_default ILIKE '%current_timestamp%' OR c.column_default ILIKE '%now()%' OR c.column_name = 'updatedAt')
      AND EXISTS (SELECT 1 FROM information_schema.columns s WHERE s.table_schema = 'public' AND s.table_name = c.table_name AND s.column_name = 'schoolId')`);
  REDATE_COLUMNS = rows as { table: string; column: string }[];
}
function beginPhase() {
  phaseStartReal = realNow();
}
/** Every database-stamped time the phase wrote in the two tenants, moved to the simulated instant. */
async function redate() {
  const t0 = performance.now();
  const from = new RealDate(phaseStartReal - 2000);
  const to = new RealDate(realNow() + 2000);
  const at = now();
  for (const { table, column } of REDATE_COLUMNS) {
    const key = `${table}.${column}`;
    // The columns are timestamp WITHOUT time zone holding UTC; the parameters go in as UTC text, or a session in Asia/Kolkata shifts them by 5:30.
    const n = await dbx.$executeRawUnsafe(`UPDATE "${table}" SET "${column}" = $1::timestamp WHERE "schoolId" = ANY($2::text[]) AND "${column}" BETWEEN $3::timestamp AND $4::timestamp`, at.toISOString(), schoolIdsMine, from.toISOString(), to.toISOString());
    if (n) REDATED.set(key, (REDATED.get(key) ?? 0) + n);
  }
  record("(redate pass)", performance.now() - t0);
  beginPhase();
}

/* -------------------------------------------------------------------------- */
/* calendar helpers                                                            */
/* -------------------------------------------------------------------------- */

const yearName = (y: number) => `${y}–${String((y + 1) % 100).padStart(2, "0")}`;
const yearKey = (y: number) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
const addDays = (k: string, n: number) => L.dates.addDaysToKey(k, n);
const weekday = (k: string) => new RealDate(`${k}T00:00:00Z`).getUTCDay();
function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}
/** The first weekday `wd` on or after the key. */
function firstOn(k: string, wd: number): string {
  let d = k;
  while (weekday(d) !== wd) d = addDays(d, 1);
  return d;
}
async function closedSet(schoolId: string): Promise<Set<string>> {
  return L.fx.closedDays(schoolId);
}
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const FIRST = ["Aarav", "Bhavna", "Chetan", "Divya", "Eshan", "Falguni", "Gaurav", "Harini", "Ishaan", "Jyoti", "Kabir", "Lalita", "Manav", "Nandini", "Omkar", "Pallavi", "Rahul", "Sneha", "Tanvi", "Uday", "Vaishali", "Yash", "Zoya", "Arjun"];
const LAST = ["Apte", "Bhatt", "Chavan", "Desai", "Gokhale", "Hegde", "Joshi", "Kulkarni", "Limaye", "Mhatre", "Naik", "Patil", "Rane", "Shinde"];
const nameOf = (seed: number) => `ZZ ${FIRST[seed % FIRST.length]} ${LAST[(seed * 7) % LAST.length]}`;

/* ========================================================================== */
/* THE SCHOOL                                                                  */
/* ========================================================================== */

const GRADES = ["5", "6", "7", "8", "9", "10"];
const PER_CLASS = 8;
const SUBJECTS = ["English", "Mathematics", "Science", "Social Science"];

type SchoolWorld = {
  id: string;
  name: string;
  admin: Actor;
  principal: Actor;
  form: Record<string, Actor>; // grade → form teacher
  subjectTeachers: Actor[];
  driver: Actor;
  librarian: Actor;
  warden: Actor;
  heads: Record<string, string>;
  rejoiner: { userId: string; membershipId: string; birthKey: string; pen: string } | null;
};

async function setupSchool(): Promise<SchoolWorld> {
  TENANT = "school";
  setClock(`${FIRST_YEAR}-05-20`);
  const school = await L.fx.upsertSchool({ name: "ZZ Lifecycle School", slug: SCHOOL_SLUG, city: "Pune", contactEmail: MAIL("s.office"), gradeLow: "5", gradeHigh: "10", brandPrimary: "#0f766e" });
  await dbx.school.update({ where: { id: school.id }, data: { isTestFixture: true, feeReceiptPrefix: "LCS" } });
  await L.fx.switchModulesOn(school, L.contracts.SCHOOL_MODULES);
  schoolIdsMine = [...new Set([...schoolIdsMine, school.id])];
  const admin = await staff(school.id, "s.admin", "ZZ Meera Kale", "ADMIN", "School administrator");
  const principal = await staff(school.id, "s.principal", "ZZ Dr Anand Rao", "PRINCIPAL", "Principal");
  const form: Record<string, Actor> = {};
  for (const [i, g] of GRADES.entries()) form[g] = await staff(school.id, `s.teacher${i + 1}`, nameOf(100 + i), "TEACHER", `Class teacher, Grade ${g}`, { subjects: [SUBJECTS[i % 4]!] });
  const subjectTeachers = [await staff(school.id, "s.subject1", nameOf(120), "TEACHER", "English teacher", { subjects: ["English"] }), await staff(school.id, "s.subject2", nameOf(121), "TEACHER", "Science teacher", { subjects: ["Science"] })];
  const driver = await staff(school.id, "s.driver", "ZZ Raju Pawar", "DRIVER", "Bus driver");
  const librarian = await staff(school.id, "s.librarian", "ZZ Sunanda Joshi", "LIBRARIAN", "Librarian");
  const warden = await staff(school.id, "s.warden", "ZZ Mahesh Kadam", "WARDEN", "Hostel warden");
  const W: SchoolWorld = { id: school.id, name: school.name, admin, principal, form, subjectTeachers, driver, librarian, warden, heads: {}, rejoiner: null };

  const existingClasses = await dbx.class.count({ where: { schoolId: school.id } });
  if (existingClasses === 0) {
    // The roster the office brings on the first day, through the intake list (intake.admitPupils), class by class.
    for (const [gi, g] of GRADES.entries()) {
      const cls = await L.fx.upsertClass(school.id, `Grade ${g} · A`, { subject: "Form group", gradeLevel: g, section: "A", color: L.fx.CLASS_COLOURS[gi]! });
      await step("ADMIN", "cohort.assignTeacher", () => L.cohort.assignTeacher(admin.ctx, cls.id, form[g]!.membershipId!, { role: "LEAD" } as never));
      const rows = Array.from({ length: PER_CLASS }, (_, s) => ({
        line: s + 1,
        name: nameOf(gi * 10 + s),
        birthdateKey: `${FIRST_YEAR - (Number(g) + 5)}-${pad(((s * 2 + gi) % 12) + 1)}-${pad(3 + s * 3)}`,
        className: `Grade ${g} · A`,
        pupilEmail: MAIL(`s.p${FIRST_YEAR}g${g}n${s + 1}`),
        guardianEmail: null,
        guardianName: null,
        relation: "PARENT" as const,
        studentCode: null,
        pen: null,
      }));
      await step("ADMIN", "intake.admitPupils", () => L.intake.admitPupils(admin.ctx, rows, { locale: "en" }));
    }
    await redate();
    // Pupils joined over earlier years: a grade-G pupil joined in grade 5 (G−5 years ago), as the record says.
    const pupils = await dbx.membership.findMany({ where: { schoolId: school.id, role: "STUDENT" }, select: { id: true, gradeLevel: true, userId: true, user: { select: { email: true } } } });
    for (const p of pupils) {
      const g = Number(p.gradeLevel ?? 5);
      await dbx.membership.update({ where: { id: p.id }, data: { joinedAt: ist(`${FIRST_YEAR - (g - 5)}-06-01`, 9) } });
    }
    // Parents for five pupils of eight, linked as a claim leaves them (no library function links in bulk).
    let k = 0;
    for (const p of pupils) {
      k += 1;
      if (k % 8 >= 5) continue;
      const parent = await person(MAIL(`s.parent.${p.user.email.split("@")[0].replace("zzlc.s.", "")}`), `${nameOf(k + 300)} (parent)`);
      await L.fx.link(parent.id, p.id, school.id);
    }
    // The pupil who leaves in year 3 and comes back in year 5 has a PEN (rejoining is by PEN and birthday).
    const r = await dbx.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", user: { email: MAIL(`s.p${FIRST_YEAR}g5n2`) } }, select: { id: true, userId: true, user: { select: { birthdate: true } } } });
    if (r) await dbx.user.update({ where: { id: r.userId }, data: { penNumber: L.fx.fakePen(r.id) } });
  }
  const r = await dbx.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", user: { email: MAIL(`s.p${FIRST_YEAR}g5n2`) } }, select: { id: true, userId: true, user: { select: { birthdate: true, penNumber: true } } } });
  if (r) W.rejoiner = { userId: r.userId, membershipId: r.id, birthKey: (r.user.birthdate as Date).toISOString().slice(0, 10), pen: r.user.penNumber };

  // Fee heads (once).
  for (const [code, name, kind] of [["TUI", "Tuition", "TUITION"], ["TRN", "Transport", "TRANSPORT"], ["EXM", "Examination", "EXAM"]] as const) {
    const have = await dbx.feeHead.findFirst({ where: { schoolId: school.id, code }, select: { id: true } });
    W.heads[code] = have?.id ?? (await step("ADMIN", "fees.saveHead", () => L.fees.saveHead(admin.ctx, { name, code, kind, sortOrder: 0 } as never))) ?? "";
  }
  // Payroll: settings, a structure, every staff salary (once).
  if (!(await dbx.salaryStructure.findFirst({ where: { schoolId: school.id } }))) await setupPayroll(admin, [admin, principal, ...Object.values(form), ...subjectTeachers, driver, librarian, warden]);
  // Library: settings and three titles with copies (once).
  if (!(await dbx.libraryTitle.findFirst({ where: { schoolId: school.id } }))) {
    await step("ADMIN", "library.saveLibrarySettings", () => L.library.saveLibrarySettings(admin.ctx, { pupilLimit: 2, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 1, finePerDayPaise: 100, fineHeadId: null } as never));
    for (const [i, t] of ["Wings of Fire", "Malgudi Days", "The Story of My Experiments with Truth"].entries()) {
      await step("LIBRARIAN", "library.createTitle", () => L.library.createTitle(librarian.ctx, { isbn: null, title: t, author: "ZZ Author", publisher: "ZZ Press", year: 2001 + i, subject: "General", language: "EN", category: "GENERAL", copies: Array.from({ length: 4 }, (_, c) => ({ accession: `LCS-${i + 1}${c + 1}`, rack: `R${i + 1}` })) } as never));
    }
  }
  // Hostel: one hostel, two rooms (once).
  if (!(await dbx.hostel.findFirst({ where: { schoolId: school.id } }))) {
    await step("ADMIN", "hostel.saveHostel", () => L.hostel.saveHostel(admin.ctx, { name: "ZZ Lifecycle Boys' Hostel", kind: "BOYS", capacity: 20, wardenMembershipId: warden.membershipId, messAttendance: false } as never));
    const h = await dbx.hostel.findFirst({ where: { schoolId: school.id }, select: { id: true } });
    for (const n of ["101", "102"]) await step("WARDEN", "hostel.saveRoom", () => L.hostel.saveRoom(warden.ctx, { hostelId: h.id, number: n, floor: "1", beds: 4, kind: "SHARED" } as never));
  }
  // Transport: a route, a bus, the driver on it (once).
  if (!(await dbx.transportRoute.findFirst({ where: { schoolId: school.id } }))) {
    const stops = [{ name: "ZZ LC Corner", lat: 18.5, lng: 73.8, morningMinute: 430, eveningMinute: 960, radiusM: 150 }, { name: "ZZ LC Gate", lat: 18.52, lng: 73.82, morningMinute: 455, eveningMinute: 930, radiusM: 150 }];
    const route = await step("ADMIN", "transport.saveRoute", () => L.transport.saveRoute(admin.ctx, null, { name: "ZZ LC Route 1", direction: "BOTH", active: true, note: "", stops } as never));
    const bus = await step("ADMIN", "transport.saveBus", () => L.transport.saveBus(admin.ctx, null, { registration: "MH 12 ZZ 7701", capacity: 30, note: "", active: true } as never));
    if (route && bus) await step("ADMIN", "transport.createAssignment", () => L.transport.createAssignment(admin.ctx, { busId: bus.id, routeId: route.id, driverMembershipId: driver.membershipId!, attendantMembershipId: null, fromDateKey: `${FIRST_YEAR}-06-01` } as never));
  }
  // Certificate templates: bonafide and TC, English presets (once).
  for (const key of ["BONAFIDE-en", "TC-en"]) {
    const preset = L.certRules.allPresets().find((p) => p.key === key);
    if (!preset) continue;
    const { key: _k, ...rest } = preset;
    void _k;
    const have = await dbx.certificateTemplate.findFirst({ where: { schoolId: school.id, kind: rest.kind } });
    if (!have) await step("ADMIN", "certificates.saveTemplate", () => L.certs.saveTemplate(admin.ctx, { ...rest, active: true } as never));
  }
  await redate();
  return W;
}

async function setupPayroll(office: Actor, people: Actor[]) {
  await step(office.ctx.role!, "payroll.savePayrollSettings", () => L.payroll.savePayrollSettings(office.ctx, { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "ZZ Lifecycle Trust", pfEstablishmentCode: "MHBAN0000001000", esiEmployerCode: "31000000000000001" } as never));
  const st = await step(office.ctx.role!, "payroll.saveStructure", () =>
    L.payroll.saveStructure(office.ctx, {
      name: "ZZ Staff",
      components: [
        { code: "BASIC", label: "", formula: "FIXED", value: 0 },
        { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 4000 },
        { code: "PF_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
        { code: "PF_EMPLOYER", label: "", formula: "FIXED", value: 0 },
        { code: "ESI_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
        { code: "ESI_EMPLOYER", label: "", formula: "FIXED", value: 0 },
        { code: "PT", label: "", formula: "FIXED", value: 0 },
      ],
    } as never),
  );
  if (!st) return;
  for (const [i, p] of people.entries()) {
    // Two of every five under the ESI ceiling, so the ESI export has rows.
    const basic = i % 5 < 2 ? 1_200_000 : 2_500_000 + i * 50_000;
    await step(office.ctx.role!, "payroll.saveSalary", () => L.payroll.saveSalary(office.ctx, { membershipId: p.membershipId!, structureId: (st as { id: string }).id, effectiveFrom: `${FIRST_YEAR}-04-01`, basicPaise: basic, overrides: {}, pfUan: `1002003${pad(i, 5)}`, esiNumber: `31001${pad(i, 5)}`, pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" } as never));
  }
}

const lockedDigests = new Map<string, string>(); // runId → digest at lock
async function payrollMonth(office: Actor, month: string) {
  const role = office.ctx.role!;
  const run = await step(role, "payroll.draftRun", () => L.payroll.draftRun(office.ctx, month));
  if (!run) return;
  const locked = await step(role, "payroll.lockRun", () => L.payroll.lockRun(office.ctx, month));
  if (!locked) return;
  for (const kind of ["PF_ECR", "ESI"] as const) await step(role, `payroll.export ${kind}`, () => L.payroll.payrollExport(office.ctx, month, kind));
  const row = await dbx.payrollRun.findFirst({ where: { schoolId: office.ctx.schoolId, month }, select: { id: true, lockDigest: true } });
  if (row?.lockDigest) lockedDigests.set(row.id, row.lockDigest);
}

/** The school's classes this year: live, by grade. */
async function liveClasses(schoolId: string) {
  return dbx.class.findMany({ where: { schoolId, archivedAt: null }, select: { id: true, name: true, gradeLevel: true, enrollments: { where: { status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true } } }, orderBy: { gradeLevel: "asc" } });
}

async function schoolYear(W: SchoolWorld, y: number, idx: number) {
  TENANT = "school";
  const A = W.admin;
  const P = W.principal;
  const s = W.id;
  const yn = yearName(y);
  const start = `${y}-06-01`;
  const end = `${y + 1}-04-30`;

  /* --------------------------------------------------- the office opens the year */
  setClock(`${y}-05-26`);
  let year = await dbx.academicYear.findFirst({ where: { schoolId: s, name: yn }, select: { id: true, isCurrent: true } });
  if (!year) {
    const id = await step("ADMIN", "academicYear.create", () => L.ay.createAcademicYear(A.ctx, { name: yn, startDate: ist(start, 5, 30), endDate: ist(end, 5, 30) }));
    year = id ? { id, isCurrent: idx === 0 } : null;
  }
  if (!year) return;
  const yearId = year.id as string;
  const t1 = await step("ADMIN", "terms.createTerm", () => L.terms.createTerm(A.ctx, yearId, { name: "Term 1", startDateKey: start, endDateKey: `${y}-10-31` }));
  const t2 = await step("ADMIN", "terms.createTerm", () => L.terms.createTerm(A.ctx, yearId, { name: "Term 2", startDateKey: `${y}-11-01`, endDateKey: end }));
  const term1 = t1 && "termId" in t1 ? (t1.termId as string) : null;
  const term2 = t2 && "termId" in t2 ? (t2.termId as string) : null;
  await step("ADMIN", "holidays.createHoliday", () => L.holidays.createHoliday(A.ctx, { name: "Diwali break", startDateKey: `${y}-11-09`, endDateKey: `${y}-11-13`, kind: "HOLIDAY", academicYearId: yearId } as never));
  await step("ADMIN", "holidays.createHoliday", () => L.holidays.createHoliday(A.ctx, { name: "Winter break", startDateKey: `${y}-12-25`, endDateKey: `${y}-12-31`, kind: "HOLIDAY", academicYearId: yearId } as never));
  const closed = await closedSet(s);

  // Fees: a structure per grade for the year, published, every class on its plan.
  let classes = await liveClasses(s);
  for (const c of classes) {
    const g = c.gradeLevel as string;
    const sid = await step("ADMIN", "fees.createStructure", () => L.fees.createStructure(A.ctx, { name: `Grade ${g} fees ${yn}`, gradeLevel: g, academicYearId: yearId, instalments: [{ label: "Term 1", dueDateKey: `${y}-07-15`, lines: [{ headId: W.heads.TUI!, amountPaise: 1_200_000 + Number(g) * 50_000 }, { headId: W.heads.EXM!, amountPaise: 50_000 }] }, { label: "Term 2", dueDateKey: `${y}-12-15`, lines: [{ headId: W.heads.TUI!, amountPaise: 1_200_000 + Number(g) * 50_000 }] }] } as never));
    if (!sid) continue;
    await step("ADMIN", "fees.publishStructure", () => L.fees.publishStructure(A.ctx, sid));
    await step("ADMIN", "fees.assignPlans", () => L.fees.assignPlans(A.ctx, { structureId: sid, classId: c.id }));
  }
  // A sibling concession, 25 % of tuition, for the first pupil of grade 7.
  const g7 = classes.find((c: Any) => c.gradeLevel === "7");
  if (g7?.enrollments[0]) await step("ADMIN", "fees.grantConcession", () => L.fees.grantConcession(A.ctx, { studentMembershipId: g7.enrollments[0].studentMembershipId, academicYearId: yearId, headId: W.heads.TUI!, kind: "PERCENT", value: 2500, reason: "Sibling concession" } as never));
  // Hostel: two grade-9 pupils board for the year; transport: four pupils of grades 5–6 ride.
  const hostelRow = await dbx.hostel.findFirst({ where: { schoolId: s }, select: { id: true, rooms: { select: { id: true }, orderBy: { number: "asc" } } } });
  const g9 = classes.find((c: Any) => c.gradeLevel === "9");
  const boarders: string[] = [];
  if (hostelRow && g9) {
    for (const [i, e] of g9.enrollments.slice(0, 2).entries()) {
      const b = await step("WARDEN", "hostel.allotBed", () => L.hostel.allotBed(W.warden.ctx, { membershipId: e.studentMembershipId, roomId: hostelRow.rooms[0].id, bed: i + 1, fromDate: start, feeDemandId: null } as never));
      if (b) boarders.push(b.allotmentId);
    }
  }
  const route = await dbx.transportRoute.findFirst({ where: { schoolId: s }, select: { id: true, stops: { select: { id: true }, orderBy: { order: "asc" } } } });
  const riders = classes.filter((c: Any) => c.gradeLevel === "5" || c.gradeLevel === "6").flatMap((c: Any) => c.enrollments.slice(0, 2).map((e: Any) => e.studentMembershipId));
  if (route && riders.length) await step("ADMIN", "transport.allotPupils", () => L.transport.allotPupils(A.ctx, { studentMembershipIds: riders, routeId: route.id, stopId: route.stops[0].id, boards: true, alights: true, feeHeadId: null, fromDateKey: start } as never));
  await redate();

  /* --------------------------------------------------- the months of the year */
  const months: string[] = [];
  for (let m = 6; m <= 16; m += 1) months.push(`${m <= 12 ? y : y + 1}-${pad(((m - 1) % 12) + 1)}`);
  const examPlan = [
    { name: `Term 1 examination ${yn}`, kind: "MID_TERM", termId: term1, from: `${y}-10-05`, marks: `${y}-10-12`, cards: `${y}-10-20` },
    { name: `Term 2 examination ${yn}`, kind: "FINAL", termId: term2, from: `${y + 1}-03-09`, marks: `${y + 1}-03-16`, cards: `${y + 1}-03-24` },
  ];
  const seriesBy = new Map<string, { seriesId: string; slots: { id: string }[] }>();

  for (const month of months) {
    const days = daysBetween(`${month}-01`, `${month}-31`).filter((k) => k.slice(0, 7) === month && k >= start && k <= end);
    for (const day of days) {
      const wd = weekday(day);
      const open = wd !== 0 && !closed.has(day);

      // Registers, Tuesdays and Thursdays (two days a week, every term).
      if (open && (wd === 2 || wd === 4)) {
        setClock(day, 9, 15);
        classes = await liveClasses(s);
        for (const c of classes) {
          const teacher = W.form[c.gradeLevel as string];
          if (!teacher || c.enrollments.length === 0) continue;
          const marks = c.enrollments.map((e: Any, k: number) => {
            const r = (k * 7 + Number(day.slice(8)) * 3) % 17;
            return { studentMembershipId: e.studentMembershipId, status: r === 0 ? "ABSENT" : r === 1 ? "LATE" : "PRESENT", clientId: `${c.id}:${day}:${e.studentMembershipId}`, markedAt: now().toISOString() };
          });
          const res = await step("TEACHER", "attendance.saveAttendanceBatch", () => L.attendance.saveAttendanceBatch({ schoolId: s, classId: c.id, dateKey: day, marks: marks as never, takenByMembershipId: teacher.membershipId!, actorUserId: teacher.userId, notify: false }));
          if (res && res.rejected.length) noteBreak("TEACHER", "attendance.saveAttendanceBatch rejected", JSON.stringify(res.rejected[0]));
        }
      }

      // Homework: one a month per class on the first open Tuesday, graded that Thursday.
      if (open && wd === 2 && Number(day.slice(8)) <= 7) {
        setClock(day, 13);
        for (const c of classes) {
          const teacher = W.form[c.gradeLevel as string];
          if (!teacher || !c.enrollments.length) continue;
          const tctx = { schoolId: s, membershipId: teacher.membershipId!, role: "TEACHER" as const, userId: teacher.userId };
          const a = await step("TEACHER", "grading.createAssignment", () => L.grading.createAssignment(tctx, { classId: c.id, title: `Homework ${month}`, body: "Questions from the chapter.", category: "Homework", points: 20, dueAt: `${addDays(day, 2)}T10:00:00Z`, publish: true } as never));
          if (!a) continue;
          // Assignment.createdAt is the database's now() and decides the teacher's grading lock (finishedYearContaining): it is set to the simulated day.
          await dbx.assignment.update({ where: { id: a.assignmentId }, data: { createdAt: now() } });
          setClock(addDays(day, 2), 16);
          await step("TEACHER", "grading.saveGrades", () => L.grading.saveGrades(tctx, a.assignmentId, c.enrollments.map((e: Any, k: number) => ({ studentMembershipId: e.studentMembershipId, score: 10 + ((k * 3 + Number(month.slice(5))) % 11) })), { notifyStudents: false }));
          setClock(day, 13);
        }
      }

      // Exams: the series set a fortnight before, papers on four days, marks after, cards after that.
      for (const ex of examPlan) {
        if (day === addDays(ex.from, -14)) {
          setClock(day, 11);
          for (const c of classes) {
            const g = c.gradeLevel as string;
            const seriesId = await step("ADMIN", "exams.createSeries", () => L.exams.createSeries(A.ctx, { name: ex.name, gradeLevel: g, kind: ex.kind, termId: ex.termId }));
            if (!seriesId) continue;
            let k = addDays(ex.from, -1);
            for (const subject of SUBJECTS) {
              k = addDays(k, 1);
              while (weekday(k) === 0 || closed.has(k)) k = addDays(k, 1);
              await step("ADMIN", "exams.addSlot", () => L.exams.addSlot(A.ctx, seriesId, { subject, dateKey: k, maxMarks: 100, startMinute: 600, endMinute: 720 }));
            }
            await step("ADMIN", "exams.publishSeries", () => L.exams.publishSeries(A.ctx, seriesId));
            const slots = await dbx.examSlot.findMany({ where: { seriesId }, select: { id: true } });
            seriesBy.set(`${c.id}|${ex.kind}`, { seriesId, slots });
          }
        }
        if (day === ex.marks) {
          setClock(day, 15);
          for (const c of classes) {
            const plan = seriesBy.get(`${c.id}|${ex.kind}`);
            const teacher = W.form[c.gradeLevel as string];
            if (!plan || !teacher) continue;
            for (const slot of plan.slots) {
              await step("TEACHER", "exams.saveMarks", () => L.exams.saveMarks(teacher.ctx, slot.id, c.id, c.enrollments.map((e: Any, k: number) => ({ membershipId: e.studentMembershipId, marks: 38 + ((k * 13 + slot.id.charCodeAt(slot.id.length - 1)) % 60) }))));
            }
          }
        }
        if (day === ex.cards) {
          setClock(day, 16);
          for (const c of classes) {
            const plan = seriesBy.get(`${c.id}|${ex.kind}`);
            const teacher = W.form[c.gradeLevel as string];
            if (!plan || !teacher) continue;
            const sittings = await dbx.assignment.findMany({ where: { classId: c.id, examSlotId: { in: plan.slots.map((x) => x.id) } }, select: { id: true } });
            const title = `${ex.name} report`;
            const gen = await step("TEACHER", "reportCards.generateCards (term)", () => L.cards.generateCards(teacher.ctx, c.id, { title, assignmentIds: sittings.map((x: Any) => x.id) }));
            if (gen && gen.ok) await step("TEACHER", "reportCards.publishCards", () => L.cards.publishCards(teacher.ctx, c.id, title));
          }
        }
      }

      // Fees at the counter: Term 1 in July (nine in ten pay), Term 2 in December (eight in ten).
      if (day === `${y}-07-10` || day === `${y}-12-18`) {
        setClock(day, 11);
        const second = day.endsWith("12-18");
        let k = 0;
        for (const c of classes) {
          for (const e of c.enrollments) {
            k += 1;
            if (k % 10 === (second ? 3 : 7) || (second && k % 10 === 8)) continue;
            const due = await dbx.feeDemand.findFirst({ where: { studentMembershipId: e.studentMembershipId, academicYearId: yearId, status: { in: ["OPEN", "PART"] }, label: second ? "Term 2" : "Term 1" }, select: { id: true, netPaise: true, paidPaise: true } });
            if (!due || due.netPaise - due.paidPaise < 100) continue;
            await step("ADMIN", "fees.recordCounterPayment", () => L.payments.recordCounterPayment(A.ctx, { studentMembershipId: e.studentMembershipId, amountPaise: due.netPaise - due.paidPaise, method: k % 3 === 0 ? "UPI" : "CASH", reference: k % 3 === 0 ? `UPI${y}${k}` : null, note: null, demandIds: [due.id], clientId: `lcs-${due.id}`, paidAtKey: null } as never, now()));
          }
        }
      }

      // The library: two books out in August, one back on time and one a week late (a fine the office settles).
      if (day === `${y}-08-03`) {
        setClock(day, 12);
        const g8 = classes.find((c: Any) => c.gradeLevel === "8");
        for (const [i, e] of (g8?.enrollments ?? []).slice(0, 2).entries()) await step("LIBRARIAN", "library.issueCopy", () => L.library.issueCopy(W.librarian.ctx, { accession: `LCS-${i + 1}1`, membershipId: e.studentMembershipId }));
      }
      if (day === `${y}-08-12`) {
        setClock(day, 12);
        await step("LIBRARIAN", "library.returnCopy", () => L.library.returnCopy(W.librarian.ctx, { accession: "LCS-11" }));
      }
      if (day === `${y}-08-24`) {
        setClock(day, 12);
        const back = await step("LIBRARIAN", "library.returnCopy (late)", () => L.library.returnCopy(W.librarian.ctx, { accession: "LCS-21" }));
        const fine = (back as { fine?: { id: string } | null } | null)?.fine;
        if (back && !fine) note("a return 7 days late raised no fine");
        if (fine) await step("ADMIN", "library.settleFine", () => L.library.settleFine(A.ctx, fine.id));
      }

      // The hostel: roll calls in July and January, a home leave in October.
      if ((day === firstOn(`${y}-07-14`, 2) || day === firstOn(`${y + 1}-01-12`, 2)) && hostelRow) {
        setClock(day, 6, 30);
        const sheet = await step("WARDEN", "hostel.rollCallSheet", () => L.hostel.rollCallSheet(W.warden.ctx, hostelRow.id, "MORNING", day));
        const entries = ((sheet as Any)?.rows ?? (sheet as Any)?.entries ?? (sheet as Any)?.boarders ?? []).map((r: Any) => ({ allotmentId: r.allotmentId, status: "PRESENT" }));
        await step("WARDEN", "hostel.takeRollCall", () => L.hostel.takeRollCall(W.warden.ctx, { hostelId: hostelRow.id, dateKey: day, slot: "MORNING", clientId: `lcs-roll-${day}`, entries } as never));
      }
      if (day === `${y}-10-15` && boarders.length && g9) {
        setClock(day, 18);
        const child = g9.enrollments[0].studentMembershipId;
        const g = await dbx.guardianship.findFirst({ where: { studentMembershipId: child, status: "ACTIVE" }, select: { parentUserId: true } });
        if (g) {
          const parent = await actorOf(g.parentUserId, null, "PARENT", null);
          const lv = await step("PARENT", "hostel.requestLeave", () => L.hostel.requestLeave(parent.ctx, { childId: child, kind: "HOME", fromAt: ist(`${y}-10-17`, 16).toISOString(), toAt: ist(`${y}-10-19`, 18).toISOString(), destination: "Home, Pune", reason: "Family function" } as never, now()));
          if (lv) {
            const leaveId = (lv as { id: string }).id;
            await step("WARDEN", "hostel.decideLeave", () => L.hostel.decideLeave(W.warden.ctx, leaveId, true, "Approved"));
            setClock(`${y}-10-17`, 16, 5);
            await step("WARDEN", "hostel.gateOut", () => L.hostel.gateOut(W.warden.ctx, leaveId));
            setClock(`${y}-10-19`, 17, 30);
            await step("WARDEN", "hostel.gateIn", () => L.hostel.gateIn(W.warden.ctx, leaveId, now()));
            setClock(day, 18);
          }
        } else note("the grade-9 boarder has no guardian; the home leave was skipped");
      }

      // Transport: the driver runs the morning trip on the first open Tuesday of five months.
      if (open && wd === 2 && Number(day.slice(8)) <= 7 && ["07", "09", "11", "01", "03"].includes(day.slice(5, 7))) {
        setClock(day, 7, 5);
        const today = await step("DRIVER", "transport.driverToday", () => L.transport.driverToday(W.driver.ctx));
        const trip = ((today as Any)?.trips ?? []).find((t: Any) => t.direction === "MORNING");
        if (!trip) noteBreak("DRIVER", "transport.driverToday", `no morning trip on ${day}: ${JSON.stringify(today).slice(0, 200)}`);
        else {
          await step("DRIVER", "transport.consentToLocation", () => L.transport.consentToLocation(W.driver.ctx));
          setClock(day, 7, 8);
          await step("DRIVER", "transport.startTrip", () => L.transport.startTrip(W.driver.ctx, trip.id, { lat: 18.5, lng: 73.8, accuracy: 10 } as never));
          setClock(day, 7, 30);
          const positions = Array.from({ length: 20 }, (_, k) => ({ at: new Date(now().getTime() - (20 - k) * 60_000).toISOString(), lat: 18.5 + k * 0.001, lng: 73.8 + k * 0.001, speed: 6, accuracy: 10 }));
          await step("DRIVER", "transport.recordPositions", () => L.transport.recordPositions(W.driver.ctx, trip.id, { positions } as never));
          setClock(day, 7, 36);
          await step("DRIVER", "transport.endTrip", () => L.transport.endTrip(W.driver.ctx, trip.id));
        }
      }

      // Leave: a teacher in August and February, the principal decides.
      if (day === `${y}-08-18` || day === `${y + 1}-02-09`) {
        setClock(day, 8);
        const t = Object.values(W.form)[(idx + (day.endsWith("02-09") ? 1 : 0)) % GRADES.length]!;
        const applied = await step("TEACHER", "leave.applyForLeave", () => L.leave.applyForLeave(t.ctx, { fromDateKey: addDays(day, 2), toDateKey: addDays(day, 3), kind: "SICK", reason: "Unwell" }));
        if (applied && applied.ok && applied.id) await step("PRINCIPAL", "leave.decideLeave", () => L.leave.decideLeave(P.ctx, applied.id!, "APPROVED", { coverMembershipId: W.subjectTeachers[0]!.membershipId }));
      }

      // Certificates: two bonafides in September; the UDISE+ sheet at the end of the month.
      if (day === `${y}-09-10`) {
        setClock(day, 11);
        const tpl = await dbx.certificateTemplate.findFirst({ where: { schoolId: s, kind: "BONAFIDE" }, select: { id: true } });
        const kids = classes.flatMap((c: Any) => c.enrollments).slice(idx % 5, (idx % 5) + 2);
        for (const e of kids) if (tpl) await step("ADMIN", "certificates.issue BONAFIDE", () => L.certs.issueCertificate(A.ctx, { templateId: tpl.id, studentMembershipId: e.studentMembershipId, purpose: "a bank account" } as never));
      }
      if (day === `${y}-09-30`) {
        setClock(day, 11);
        const sheet = await step("ADMIN", "filings.udiseStudentsExport", () => L.filings.udiseStudentsExport(A.ctx));
        const roll = (await liveClasses(s)).reduce((n: number, c: Any) => n + c.enrollments.length, 0);
        if (sheet && (sheet as { rows: number }).rows !== roll) noteBreak("ADMIN", "filings.udiseStudentsExport rows", `sheet ${(sheet as { rows: number }).rows} rows, roll ${roll}`);
      }

      // The pupil who leaves in year 3 (a transfer, by hand) and comes back in year 5 (admissions, by PEN and birthday).
      if (idx === 2 && day === `${y}-08-20` && W.rejoiner) {
        setClock(day, 12);
        const left = await step("ADMIN", "record.recordDeparture (transfer)", () => L.record.recordDeparture(A.ctx, W.rejoiner!.membershipId, { reason: "TRANSFERRED", destination: "ZZ Kendriya Vidyalaya, Nagpur", note: "Father transferred.", leftOn: now() }));
        if (left && left.ok) {
          const tc = await dbx.certificateTemplate.findFirst({ where: { schoolId: s, kind: "TC" }, select: { id: true } });
          if (tc) await step("ADMIN", "certificates.issue TC", () => L.certs.issueCertificate(A.ctx, { templateId: tc.id, studentMembershipId: W.rejoiner!.membershipId, purpose: "admission elsewhere", leftOn: day } as never));
        }
      }
      if (idx === 4 && day === `${y}-06-05` && W.rejoiner) {
        setClock(day, 11);
        await rejoin(W, yearId, y);
      }

      // A departure scheduled in December for the end of January, executed by the departures job (years 2, 6, 10, 14).
      if (idx % 4 === 1 && day === `${y}-12-01`) {
        setClock(day, 11);
        const g7c = classes.find((c: Any) => c.gradeLevel === "7");
        const who = g7c?.enrollments.at(-1)?.studentMembershipId;
        if (who) await step("ADMIN", "record.scheduleDeparture", () => L.record.scheduleDeparture(A.ctx, who, { reason: "TRANSFERRED", destination: "ZZ School, Bengaluru", note: "Family moving.", leaveOnKey: `${y + 1}-01-31` } as never));
      }
      if (idx % 4 === 1 && day === `${y + 1}-02-02`) {
        setClock(day, 1);
        const r = await step("SYSTEM", "record.runDueDepartures", () => L.record.runDueDepartures(now(), { schoolIds: [s] }));
        if (r && r.executed !== 1) noteBreak("SYSTEM", "record.runDueDepartures", `executed ${r.executed}, stale ${r.skippedStale}, stuck ${r.stuck}`);
      }

      // Admissions for next year's grade 5: the cycle and its applications in January, offers accepted.
      if (day === `${y + 1}-01-10`) {
        setClock(day, 11);
        await admissionsForNext(W, y + 1);
      }

      // An expert's free workshop each February: the expert offers, a pupil's seat is booked and consented, delivered.
      if (day === `${y + 1}-02-01`) await workshop(W, y);

      // Alumni: last year's leavers opt into the directory, the office sends a note, one writes to their old teacher.
      if (day === `${y}-09-01` && idx > 0) {
        setClock(day, 18);
        await alumniYear(W.id, A, Object.values(W.form)[0]!);
      }
    }
    // Payroll for the month, on its last day.
    setClock(`${month}-28`, 17);
    await payrollMonth(A, month);
    // The stored minority flag refreshed for the school's pupils and alumni, as accounts:tidy does each night (scoped: never the whole database on a simulated clock).
    const kids = (await dbx.membership.findMany({ where: { schoolId: s, role: { in: ["STUDENT", "ALUMNUS"] } }, select: { userId: true } })).map((m: Any) => m.userId);
    await step("SYSTEM", "birthdate.refreshMinority", () => L.birthdate.refreshMinority(now(), { userIds: kids }));
    await redate();
  }

  /* --------------------------------------------------- the year's end */
  setClock(`${y + 1}-04-25`, 15);
  classes = await liveClasses(s);
  for (const c of classes) {
    const teacher = W.form[c.gradeLevel as string];
    if (!teacher || !c.enrollments.length) continue;
    const title = `Annual report ${yn}`;
    const gen = await step("TEACHER", "reportCards.generateCards (annual)", () => L.cards.generateCards(teacher.ctx, c.id, { title, academicYearId: yearId }));
    if (gen && gen.ok) await step("TEACHER", "reportCards.publishCards", () => L.cards.publishCards(teacher.ctx, c.id, title));
  }
  // The boarders go home; their beds end with the year.
  for (const id of boarders) await step("WARDEN", "hostel.endAllotment", () => L.hostel.endAllotment(W.warden.ctx, id, end));
  // A TC certificate for one of the graduating class, then close, promote, graduate.
  const g10 = classes.find((c: Any) => c.gradeLevel === "10");
  const tc = await dbx.certificateTemplate.findFirst({ where: { schoolId: s, kind: "TC" }, select: { id: true } });
  if (g10?.enrollments[0] && tc) await step("ADMIN", "certificates.issue TC", () => L.certs.issueCertificate(A.ctx, { templateId: tc.id, studentMembershipId: g10.enrollments[0].studentMembershipId, purpose: "admission to junior college", leftOn: end } as never));
  await redate();

  setClock(end, 15);
  let next = await dbx.academicYear.findFirst({ where: { schoolId: s, name: yearName(y + 1) }, select: { id: true } });
  if (!next) {
    const id = await step("ADMIN", "academicYear.create", () => L.ay.createAcademicYear(A.ctx, { name: yearName(y + 1), startDate: ist(`${y + 1}-06-01`, 5, 30), endDate: ist(`${y + 2}-04-30`, 5, 30) }));
    next = id ? { id } : null;
  }
  if (next) await step("ADMIN", "academicYear.close", () => L.ay.closeAcademicYear(A.ctx, yearId, next!.id));
  const plan = await step("ADMIN", "promotion.promotionPlan", () => L.promotion.promotionPlan(A.ctx));
  if (plan) {
    const moves = plan.map((row: Any) => ({ fromClassId: row.id, to: row.suggested, holdBack: [] }));
    const tenth = plan.find((row: Any) => row.gradeLevel === "10");
    if (tenth && tenth.suggested.kind !== "LEAVE") noteBreak("ADMIN", "promotion.promotionPlan", `grade 10 suggested ${tenth.suggested.kind}, not LEAVE`);
    const res = await step("ADMIN", "promotion.promoteSchool", () => L.promotion.promoteSchool(A.ctx, moves, { lastDayKey: end }));
    if (res) note(`promoted: moved ${res.moved}, left ${res.left}, created ${res.created}, archived ${res.archived}`);
  }
  await redate();
  // The new grade 5 (no library function makes a class: the office's server action writes the row) and the form teachers on next year's classes.
  setClock(`${y + 1}-05-02`, 11);
  if (!(await dbx.class.findFirst({ where: { schoolId: s, archivedAt: null, gradeLevel: "5" } }))) {
    await dbx.class.create({ data: { schoolId: s, name: "Grade 5 · A", gradeLevel: "5", section: "A", subject: "Form group", color: L.fx.CLASS_COLOURS[0]!, joinCode: (await import("@/lib/codes")).classCode() } });
  }
  for (const c of await liveClasses(s)) {
    const t = W.form[c.gradeLevel as string];
    if (t && !(await dbx.classTeacher.findFirst({ where: { classId: c.id, teacherMembershipId: t.membershipId } }))) await step("ADMIN", "cohort.assignTeacher", () => L.cohort.assignTeacher(A.ctx, c.id, t.membershipId!, { role: "LEAD" } as never));
  }
  // The accepted applicants into the new grade 5.
  const g5 = await dbx.class.findFirst({ where: { schoolId: s, archivedAt: null, gradeLevel: "5" }, select: { id: true } });
  const accepted = await dbx.application.findMany({ where: { schoolId: s, status: "ACCEPTED", cycle: { academicYear: { name: yearName(y + 1) } } }, select: { id: true } });
  for (const app of accepted) await step("ADMIN", "admissions.admit", () => L.admissions.admit(A.ctx, app.id, { classId: g5?.id ?? null }));
  await redate();
  // May's payroll, the twelfth run of the year.
  setClock(`${y + 1}-05-28`, 17);
  await payrollMonth(A, `${y + 1}-05`);
  await redate();
}

async function admissionsForNext(W: SchoolWorld, ny: number) {
  const A = W.admin;
  const s = W.id;
  let next = await dbx.academicYear.findFirst({ where: { schoolId: s, name: yearName(ny) }, select: { id: true } });
  if (!next) {
    const id = await step("ADMIN", "academicYear.create (next)", () => L.ay.createAcademicYear(A.ctx, { name: yearName(ny), startDate: ist(`${ny}-06-01`, 5, 30), endDate: ist(`${ny + 1}-04-30`, 5, 30) }));
    next = id ? { id } : null;
  }
  if (!next) return;
  const cycle = await step("ADMIN", "admissions.createCycle", () => L.admissions.createCycle(A.ctx, { academicYearId: next!.id, name: `Grade 5 admissions ${yearName(ny)}`, grades: [{ grade: "5", seats: PER_CLASS }], documents: [{ key: "birth", name: "Birth certificate", required: true }], testRequired: false, notice: "Admissions open.", feeStructureId: null, opensAt: L.dates.todayKey("Asia/Kolkata"), closesAt: addDays(L.dates.todayKey("Asia/Kolkata"), 60) } as never));
  const cycleId = (cycle as Any)?.id ?? (typeof cycle === "string" ? cycle : null);
  if (!cycleId) return;
  await step("ADMIN", "admissions.setCycleStatus", () => L.admissions.setCycleStatus(A.ctx, cycleId, "OPEN" as never));
  for (let n = 1; n <= PER_CLASS + 1; n += 1) {
    const childName = nameOf(ny * 10 + n);
    const app = await step("ADMIN", "admissions.officeApply", () => L.admissions.officeApply(A.ctx, { cycleId, childName, childBirthdate: `${ny - 10}-${pad(((n * 5) % 12) + 1)}-${pad(2 + n)}`, gradeApplied: "5", applicantName: `${childName} (parent)`, applicantPhone: `+9198220${pad(ny % 100)}${pad(n, 3)}`, relation: "PARENT", city: "Pune" } as never));
    const appId = (app as Any)?.id;
    if (!appId || n > PER_CLASS) continue; // the ninth waits on the list
    await step("ADMIN", "admissions.offer", () => L.admissions.offer(A.ctx, appId, { expiresOn: null }));
    await step("ADMIN", "admissions.respond", () => L.admissions.respond(A.ctx, appId, { answer: "ACCEPT" } as never));
  }
}

async function rejoin(W: SchoolWorld, yearId: string, y: number) {
  const A = W.admin;
  const r = W.rejoiner!;
  const before = await dbx.membership.findFirst({ where: { schoolId: W.id, userId: r.userId, role: "ALUMNUS" }, select: { id: true, leftAt: true } });
  if (!before || before.leftAt) noteBreak("ADMIN", "rejoin precondition", `the leaver's ALUMNUS row is ${before ? "already closed" : "missing"}`);
  const cycle = await step("ADMIN", "admissions.createCycle (rejoin)", () => L.admissions.createCycle(A.ctx, { academicYearId: yearId, name: `Mid-year admissions ${yearName(y)}`, grades: [{ grade: "7", seats: 2 }, { grade: "8", seats: 2 }], documents: [], testRequired: false, notice: "Mid-year.", feeStructureId: null, opensAt: null, closesAt: null } as never));
  const cycleId = (cycle as Any)?.id ?? (typeof cycle === "string" ? cycle : null);
  if (!cycleId) return;
  await step("ADMIN", "admissions.setCycleStatus", () => L.admissions.setCycleStatus(A.ctx, cycleId, "OPEN" as never));
  // Five years after joining grade 5 in 2026, the child is in grade 8 (2 years away from the roll changes nothing about the age).
  const u = await dbx.user.findUnique({ where: { id: r.userId }, select: { name: true } });
  const app = await step("ADMIN", "admissions.officeApply (rejoin)", () => L.admissions.officeApply(A.ctx, { cycleId, childName: u.name, childBirthdate: r.birthKey, gradeApplied: "8", applicantName: `${u.name} (parent)`, applicantPhone: "+919822099001", relation: "PARENT", penNumber: r.pen, previousSchool: "ZZ Kendriya Vidyalaya, Nagpur" } as never));
  const appId = (app as Any)?.id;
  if (!appId) return;
  await step("ADMIN", "admissions.offer", () => L.admissions.offer(A.ctx, appId, { expiresOn: null }));
  await step("ADMIN", "admissions.respond", () => L.admissions.respond(A.ctx, appId, { answer: "ACCEPT" } as never));
  const g8 = await dbx.class.findFirst({ where: { schoolId: W.id, archivedAt: null, gradeLevel: "8" }, select: { id: true } });
  const admitted = await step("ADMIN", "admissions.admit (rejoin by PEN)", () => L.admissions.admit(A.ctx, appId, { classId: g8?.id ?? null }));
  if (!admitted) return;
  const after = await dbx.membership.findMany({ where: { schoolId: W.id, userId: r.userId }, select: { id: true, role: true, leftAt: true, status: true } });
  const student = after.find((m: Any) => m.role === "STUDENT");
  const alumnus = after.find((m: Any) => m.role === "ALUMNUS");
  if (!student || student.leftAt || student.id !== r.membershipId) noteBreak("ADMIN", "rejoin: the old STUDENT membership", JSON.stringify(after));
  if (!alumnus || !alumnus.leftAt) noteBreak("ADMIN", "rejoin: the ALUMNUS row closes", JSON.stringify(after));
  else note(`rejoined by PEN: STUDENT ${student?.id === r.membershipId ? "reused" : "new"}, ALUMNUS closed ${alumnus.leftAt.toISOString().slice(0, 10)}`);
}

async function workshop(W: SchoolWorld, y: number) {
  const day = `${y + 1}-02-01`;
  setClock(day, 10);
  const expert = await expertActor();
  const slot = await step("EXPERT", "gigs.offerSlot", () => L.gigs.offerSlot(expert.ctx, { kind: "WORKSHOP", title: `ZZ Careers in science ${y + 1}`, startsAt: ist(`${y + 1}-02-10`, 16).toISOString(), minutes: 60, meetingUrl: "https://meet.example.test/zzlc", seats: 10 } as never, now()));
  if (!slot || !(slot as Any).ok) return;
  const slotId = (slot as Any).slotId;
  const cls = (await liveClasses(W.id)).find((c: Any) => c.gradeLevel === "9");
  const pupil = cls?.enrollments[1]?.studentMembershipId;
  if (!pupil) return;
  const pa = await asMember(pupil);
  setClock(`${y + 1}-02-02`, 18);
  const booked = await step("STUDENT", "gigs.bookSeat", () => L.gigs.bookSeat(pa.ctx, { slotId, studentMembershipId: pupil, purpose: "I want to learn about careers in science" }, now()));
  const bookingId = (booked as Any)?.bookingId ?? (booked as Any)?.id;
  if ((booked as Any)?.status === "PENDING_CONSENT" && bookingId) {
    const g = await dbx.guardianship.findFirst({ where: { studentMembershipId: pupil, status: "ACTIVE" }, select: { parentUserId: true } });
    if (g) {
      const parent = await actorOf(g.parentUserId, null, "PARENT", null);
      await step("PARENT", "gigs.consentToBooking", () => L.gigs.consentToBooking(parent.ctx, bookingId, true, now()));
    } else note("the workshop pupil has no guardian to consent");
  }
  if (bookingId) {
    setClock(`${y + 1}-02-10`, 17, 30);
    await step("EXPERT", "gigs.closeBooking", () => L.gigs.closeBooking(expert.ctx, bookingId, "DELIVERED", now()));
  }
}

let expertCache: Actor | null = null;
async function expertActor(): Promise<Actor> {
  if (expertCache) return expertCache;
  const u = await person(MAIL("expert"), "ZZ Dr Kavita Menon");
  await dbx.expertProfile.upsert({ where: { userId: u.id }, create: { userId: u.id, headline: "ZZ Careers counsellor", offering: "BOTH", publishedAt: now() }, update: {} });
  expertCache = await actorOf(u.id, null, "EXPERT", null);
  return expertCache;
}

/** Last year's leavers at a school or college: two opt into the directory, the office sends the batch a note, one writes to staff and is answered. */
async function alumniYear(schoolId: string, office: Actor, teacher: Actor) {
  // The directory refuses a minor (alumni.refuseMinor): a school's grade-10 leavers are fifteen, so the two who join are the most recent leavers who are adults now.
  const all = await dbx.membership.count({ where: { schoolId, role: "ALUMNUS" } });
  if (!all) {
    note("no alumni yet");
    return;
  }
  const fresh = await dbx.membership.findMany({ where: { schoolId, role: "ALUMNUS", leftAt: null, user: { isMinor: false }, alumniProfile: { is: null } }, select: { id: true, userId: true, joinedAt: true }, orderBy: { joinedAt: "desc" }, take: 2 });
  if (!fresh.length) {
    note(`${all} alumni, none of them an adult yet: nobody can join the directory`);
    return;
  }
  for (const a of fresh) {
    const al = await asMember(a.id);
    await step("ALUMNUS", "alumni.joinAlumniDirectory", () => L.alumni.joinAlumniDirectory(al.ctx, { city: "Pune", occupation: "Student", contactPref: "OFFICE" } as never));
  }
  const batch = fresh[0].joinedAt.getUTCFullYear();
  await step(office.ctx.role!, "alumni.sendAlumniNote", () => L.alumni.sendAlumniNote(office.ctx, { batchYear: batch, title: `Hello, batch of ${batch}`, body: "The school remembers you. Write to us." } as never));
  const al = await asMember(fresh[0].id);
  const room = await step("ALUMNUS", "conversations.openConversation", () => L.conv.openConversation(al.ctx, schoolId, teacher.userId));
  const roomId = (room as Any)?.id ?? (room as Any)?.conversationId ?? (typeof room === "string" ? room : null);
  if (!roomId) return;
  await step("ALUMNUS", "conversations.sendConversationMessage", () => L.conv.sendConversationMessage(al.ctx, roomId, "Thank you for everything — I am in junior college now."));
  await step(teacher.ctx.role!, "conversations.sendConversationMessage (reply)", () => L.conv.sendConversationMessage(teacher.ctx, roomId, "Lovely to hear from you. Keep writing."));
}

/* ========================================================================== */
/* THE COLLEGE                                                                 */
/* ========================================================================== */

type ProgrammeSpec = { code: string; name: string; short: string; dept: string; deptName: string; prefix: string; regulator: string; stream: string | null };
type PersonSpec = { local: string; name: string; title: string };
/** What differs between the walk's two colleges; everything else is the one college year. */
type CollegeSpec = {
  slug: string;
  name: string;
  codeSeed: string;
  kind: "COLLEGE" | "AUTONOMOUS_COLLEGE";
  streams: string[] | null;
  aisheCode: string;
  nirfCategory: string;
  brand: string;
  receiptPrefix: string;
  /** CAP application ids and PRNs: LC2026PHY001 / LE2026COMP001. */
  idPrefix: string;
  /** Applicants' phones: one base per college, so two walked colleges never share a number. */
  phoneBase: string;
  accession: string;
  durationYears: number;
  /** Division names by year of study. */
  yearNames: string[];
  scheme: string;
  exitPoints: { afterYear: number; award: string; credits: number }[];
  totalCredits: number;
  programmes: [ProgrammeSpec, ProgrammeSpec];
  hods: [PersonSpec, PersonSpec];
  faculty: [PersonSpec, PersonSpec, PersonSpec];
  library: { title: string; author: string; publisher: string; year: number; subject: string };
  company: { name: string; first14: string };
  /** The stream's records: lab batches, a practical course a semester, the practical record. */
  labs: boolean;
  /** An autonomous college conducts its own examinations: papers, seating, double entry. */
  autonomous: boolean;
  /** Each year's NBA SAR for the first programme's department. */
  nba: boolean;
};

const ARTS_COLLEGE: CollegeSpec = {
  slug: COLLEGE_SLUG,
  name: "ZZ Lifecycle College",
  codeSeed: "Lifecycle College",
  kind: "COLLEGE",
  streams: null,
  aisheCode: "C-99071",
  nirfCategory: "COLLEGE",
  brand: "#7c3aed",
  receiptPrefix: "LCC",
  idPrefix: "LC",
  phoneBase: "+91982207",
  accession: "LCC",
  durationYears: 3,
  yearNames: ["FY", "SY", "TY"],
  scheme: "SPPU NEP 2024",
  exitPoints: [{ afterYear: 1, award: "CERTIFICATE", credits: 16 }, { afterYear: 2, award: "DIPLOMA", credits: 32 }, { afterYear: 3, award: "DEGREE", credits: 48 }],
  totalCredits: 48,
  programmes: [
    { code: "BSCPHY", name: "BSc Physics", short: "BSc Phy", dept: "PHY", deptName: "Department of Physics", prefix: "PHY", regulator: "UGC", stream: null },
    { code: "BCOM", name: "BCom", short: "BCom", dept: "COM", deptName: "Department of Commerce", prefix: "COM", regulator: "UGC", stream: null },
  ],
  hods: [
    { local: "c.hod.phy", name: "ZZ Dr Asha Paranjpe", title: "Head, Physics" },
    { local: "c.hod.com", name: "ZZ Dr Mohan Bhide", title: "Head, Commerce" },
  ],
  faculty: [
    { local: "c.faculty1", name: "ZZ Dr Neelam Gadgil", title: "Assistant professor, Physics" },
    { local: "c.faculty2", name: "ZZ Prof Rahul Shirole", title: "Assistant professor, Physics" },
    { local: "c.faculty3", name: "ZZ Prof Ashwini Mane", title: "Assistant professor, Commerce" },
  ],
  library: { title: "Concepts of Physics", author: "ZZ H C Verma", publisher: "ZZ Bharati", year: 2010, subject: "Physics" },
  company: { name: "ZZ Lifecycle Analytics Pvt Ltd", first14: "27AAZCL1234C1Z" },
  labs: false,
  autonomous: false,
  nba: false,
};

const ENGINEERING_COLLEGE: CollegeSpec = {
  slug: ENGINEERING_SLUG,
  name: "ZZ Lifecycle Engineering College",
  codeSeed: "Lifecycle Engineering College",
  kind: "AUTONOMOUS_COLLEGE",
  streams: ["ENGINEERING"],
  aisheCode: "C-99072",
  nirfCategory: "ENGINEERING",
  brand: "#b45309",
  receiptPrefix: "LCE",
  idPrefix: "LE",
  phoneBase: "+91982208",
  accession: "LCE",
  durationYears: 4,
  yearNames: ["FE", "SE", "TE", "BE"],
  scheme: "Autonomous BE 2024",
  exitPoints: [{ afterYear: 1, award: "CERTIFICATE", credits: 18 }, { afterYear: 2, award: "DIPLOMA", credits: 36 }, { afterYear: 4, award: "DEGREE", credits: 72 }],
  // Eight semesters of two courses (4 credits each, one of them with a practical credit): 9 a semester.
  totalCredits: 72,
  programmes: [
    { code: "BECOMP", name: "BE Computer Engineering", short: "BE Comp", dept: "COMP", deptName: "Department of Computer Engineering", prefix: "CE", regulator: "AICTE", stream: "ENGINEERING" },
    { code: "BEMECH", name: "BE Mechanical Engineering", short: "BE Mech", dept: "MECH", deptName: "Department of Mechanical Engineering", prefix: "ME", regulator: "AICTE", stream: "ENGINEERING" },
  ],
  hods: [
    { local: "c.hod.comp", name: "ZZ Dr Sameer Deshpande", title: "Head, Computer Engineering" },
    { local: "c.hod.mech", name: "ZZ Dr Rekha Kulkarni", title: "Head, Mechanical Engineering" },
  ],
  faculty: [
    { local: "c.faculty1", name: "ZZ Prof Amol Inamdar", title: "Assistant professor, Computer Engineering" },
    { local: "c.faculty2", name: "ZZ Prof Swati Gore", title: "Assistant professor, Computer Engineering" },
    { local: "c.faculty3", name: "ZZ Prof Vikram Salunke", title: "Assistant professor, Mechanical Engineering" },
  ],
  library: { title: "Data Structures Using C", author: "ZZ Reema Thareja", publisher: "ZZ OUP", year: 2014, subject: "Computer Engineering" },
  company: { name: "ZZ Lifecycle Engineering Systems Pvt Ltd", first14: "27AAZCE5678C1Z" },
  labs: true,
  autonomous: true,
  nba: true,
};

/** The college this run walks. */
const SPEC: CollegeSpec = ENGINEERING ? ENGINEERING_COLLEGE : ARTS_COLLEGE;
const PROGRAMMES = SPEC.programmes;
/** The years of study, 1..duration. */
const YEARS_OF_STUDY = Array.from({ length: SPEC.durationYears }, (_, i) => i + 1);
const FINAL_YEAR = SPEC.durationYears;

type ProgrammeRow = { id: string; schemeId: string; deptId: string; dept: string; name: string; short: string };
type CollegeWorld = {
  id: string;
  registrar: Actor;
  principal: Actor;
  hod: Record<string, Actor>; // department code → head
  faculty: Actor[]; // f1, f2 (the first programme's department), f3 (the second's)
  controller: Actor;
  iqac: Actor;
  tpo: Actor;
  accounts: Actor;
  librarian: Actor;
  programmes: Record<string, ProgrammeRow>;
  courses: Map<string, { id: string; code: string; programme: string; semester: number; slot: 0 | 1 }>;
  heads: Record<string, string>;
  periods: string[];
  guardianUserId: string | null;
  minorEmail: string;
  /** Department code → its LAB room (engineering only). */
  labRooms: Record<string, string>;
};

const GRADING = [
  { grade: "O", points: 10, minPercent: 90 }, { grade: "A+", points: 9, minPercent: 80 }, { grade: "A", points: 8, minPercent: 70 }, { grade: "B+", points: 7, minPercent: 60 },
  { grade: "B", points: 6, minPercent: 50 }, { grade: "C", points: 5, minPercent: 45 }, { grade: "P", points: 4, minPercent: 40 }, { grade: "F", points: 0, minPercent: 0 },
];
const RULES = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: SPEC.totalCredits, internalMax: 40, externalMax: 60, minTermCredits: 4, maxTermCredits: 26 };
const INTAKE = 6;
/** Lab batches of at most four: an intake of six or seven gives two batches a division. */
const LAB_BATCH_SIZE = 4;
/** The course of a semester that carries the practical credit (engineering): the second one, code …02. */
const LAB_SLOT = 1 as const;
/** The weekday of each batch's LAB hour: batch A on Monday, B on Friday, a third on Wednesday. */
const LAB_WEEKDAYS = [1, 5, 3];

async function setupCollege(): Promise<CollegeWorld> {
  TENANT = "college";
  setClock(`${FIRST_YEAR}-05-20`);
  const existing = await dbx.school.findUnique({ where: { slug: SPEC.slug }, select: { id: true } });
  const college =
    existing ??
    (await dbx.school.create({
      data: { name: SPEC.name, slug: SPEC.slug, kind: SPEC.kind, isTestFixture: true, code: (await import("@/lib/codes")).schoolCode(SPEC.codeSeed), city: "Pune", region: "Maharashtra", country: "India", contactEmail: MAIL("c.office"), timezone: "Asia/Kolkata", locale: "en", brandPrimary: SPEC.brand, verifiedAt: now(), affiliatingUniversity: "Savitribai Phule Pune University", aisheCode: SPEC.aisheCode, naacGrade: "B+", naacValidUntil: ist("2030-12-31"), nirfCategory: SPEC.nirfCategory, feeReceiptPrefix: SPEC.receiptPrefix, ...(SPEC.streams ? { streamsJson: JSON.stringify(SPEC.streams) } : {}) },
      select: { id: true },
    }));
  schoolIdsMine = [...new Set([...schoolIdsMine, college.id])];
  await dbx.schoolModule.createMany({ data: L.contracts.modulesForKind(SPEC.kind).map((module: string) => ({ schoolId: college.id, module })), skipDuplicates: true });
  const s = college.id;
  const [P0, P1] = PROGRAMMES;
  const registrar = await staff(s, "c.registrar", "ZZ Smita Gadre", "ADMIN", "Registrar");
  const principal = await staff(s, "c.principal", "ZZ Dr Vinay Bapat", "PRINCIPAL", "Principal");
  const hod: Record<string, Actor> = {};
  for (const [i, h] of SPEC.hods.entries()) hod[PROGRAMMES[i]!.dept] = await staff(s, h.local, h.name, "HOD", h.title);
  const faculty: Actor[] = [];
  for (const f of SPEC.faculty) faculty.push(await staff(s, f.local, f.name, "FACULTY", f.title));
  const controller = await staff(s, "c.exams", "ZZ Prakash Joglekar", "EXAM_CONTROLLER", "Controller of examinations");
  const iqac = await staff(s, "c.iqac", "ZZ Dr Meghana Phadke", "IQAC", "IQAC coordinator");
  const tpo = await staff(s, "c.tpo", "ZZ Nitin Sathe", "TPO", "Training and placement officer");
  const accounts = await staff(s, "c.accounts", "ZZ Sushma Rane", "ACCOUNTS", "Accounts officer");
  const librarian = await staff(s, "c.librarian", "ZZ Vidya Kher", "LIBRARIAN", "Librarian");
  await staff(s, "c.warden", "ZZ Sanjay More", "WARDEN", "Warden");
  await staff(s, "c.driver", "ZZ Ganesh Shelar", "DRIVER", "Driver");
  const W: CollegeWorld = { id: s, registrar, principal, hod, faculty, controller, iqac, tpo, accounts, librarian, programmes: {}, courses: new Map(), heads: {}, periods: [], guardianUserId: null, minorEmail: "", labRooms: {} };
  const A = registrar.ctx;

  if (!(await dbx.department.findFirst({ where: { schoolId: s } }))) {
    for (const p of PROGRAMMES) {
      const dept = await step("ADMIN", "academics.saveDepartment", () => L.academics.saveDepartment(A, { code: p.dept, name: p.deptName, hodMembershipId: hod[p.dept]!.membershipId, condoneFloorPercent: 65 } as never));
      const deptId = (dept as Any)?.id;
      const prog = await step("ADMIN", "academics.saveProgramme", () => L.academics.saveProgramme(A, { departmentId: deptId, code: p.code, name: p.name, level: "UG", durationYears: SPEC.durationYears, intake: INTAKE, regulator: p.regulator, ...(p.stream ? { stream: p.stream } : {}), attendanceThreshold: 75, exitPoints: SPEC.exitPoints } as never));
      const progId = (prog as Any)?.id;
      const scheme = await step("ADMIN", "academics.saveScheme", () => L.academics.saveScheme(A, { programmeId: progId, name: SPEC.scheme, effectiveYear: 2024, gradingTable: GRADING, passingRules: RULES } as never));
      const schemeId = (scheme as Any)?.id;
      for (let sem = 1; sem <= SPEC.durationYears * 2; sem += 1) {
        for (const k of [1, 2]) {
          // At an engineering college the semester's second course carries the practical credit (a LAB hour a batch).
          const practical = SPEC.labs && k === LAB_SLOT + 1 ? 1 : 0;
          await step("ADMIN", "academics.saveCourse", () => L.academics.saveCourse(A, { schemeId, code: `${p.prefix}${sem}0${k}`, name: `${p.name} ${sem}.${k}`, semester: sem, creditsL: 3, creditsT: 1, creditsP: practical, kind: "CORE", outcomes: [{ code: "CO1", text: "Explain the course's ideas." }, { code: "CO2", text: "Apply them to problems." }] } as never));
        }
      }
    }
    // Faculty in their departments.
    const depts = await dbx.department.findMany({ where: { schoolId: s }, select: { id: true, code: true } });
    const dep = (code: string) => depts.find((d: Any) => d.code === code)?.id;
    for (const [f, code] of [[faculty[0]!, P0.dept], [faculty[1]!, P0.dept], [faculty[2]!, P1.dept]] as const) await step("ADMIN", "academics.setFacultyDepartment", () => L.academics.setFacultyDepartment(A, { membershipId: f.membershipId!, departmentId: dep(code)! } as never));
    // The college day: the suggested bells.
    await step("ADMIN", "timetable.applySuggestedDay", () => L.timetable.applySuggestedDay(A));
    // Fee heads.
    for (const [code, name, kind] of [["TUI", "Tuition", "TUITION"], ["DEV", "Development", "DEVELOPMENT"], ["EXM", "Examination", "EXAM"]] as const) await step("ACCOUNTS", "fees.saveHead", () => L.fees.saveHead(accounts.ctx, { name, code, kind, sortOrder: 0 } as never));
    // Payroll, the library and placement's company, once.
    await setupPayroll(accounts, [registrar, principal, hod[P0.dept]!, hod[P1.dept]!, ...faculty, controller, iqac, tpo, accounts, librarian]);
    await step("ADMIN", "library.saveLibrarySettings", () => L.library.saveLibrarySettings(A, { pupilLimit: 3, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 1, finePerDayPaise: 200, fineHeadId: null } as never));
    await step("LIBRARIAN", "library.createTitle", () => L.library.createTitle(librarian.ctx, { isbn: null, title: SPEC.library.title, author: SPEC.library.author, publisher: SPEC.library.publisher, year: SPEC.library.year, subject: SPEC.library.subject, language: "EN", category: "GENERAL", copies: Array.from({ length: 6 }, (_, c) => ({ accession: `${SPEC.accession}-${c + 1}`, rack: "P1" })) } as never));
    if (SPEC.labs) {
      // A lab per department, and one FACULTY of each department holds LAB_INCHARGE (set by the registrar, as /admin/people does).
      for (const [p, name] of [[P0, "ZZ Computer Lab"], [P1, "ZZ Workshop Lab"]] as const) await step("ADMIN", "academics.saveRoom (lab)", () => L.academics.saveRoom(A, { name: `${name} (${p.dept})`, capacity: 30, kind: "LAB" } as never));
      for (const f of [faculty[0]!, faculty[2]!]) await step("ADMIN", "duties.setDuties LAB_INCHARGE", () => L.duties.setDuties(A, f.membershipId!, ["LAB_INCHARGE"]));
    }
    await redate();
  }
  for (const p of PROGRAMMES) {
    const prog = await dbx.programme.findFirst({ where: { schoolId: s, code: p.code }, select: { id: true, departmentId: true, schemes: { select: { id: true } } } });
    if (!prog) continue;
    W.programmes[p.code] = { id: prog.id, schemeId: prog.schemes[0]?.id, deptId: prog.departmentId, dept: p.dept, name: p.name, short: p.short };
    const cs = await dbx.course.findMany({ where: { schemeId: prog.schemes[0]?.id }, select: { id: true, code: true, semester: true } });
    for (const c of cs) W.courses.set(c.code, { id: c.id, code: c.code, programme: p.code, semester: c.semester, slot: c.code.endsWith("1") ? 0 : 1 });
    if (SPEC.labs) W.labRooms[p.dept] = (await dbx.room.findFirst({ where: { schoolId: s, name: { endsWith: `(${p.dept})` }, kind: "LAB" }, select: { id: true } }))?.id;
  }
  W.periods = (await dbx.timetablePeriod.findMany({ where: { schoolId: s, kind: "LESSON", archivedAt: null }, orderBy: { position: "asc" }, select: { id: true } })).map((p: Any) => p.id);
  for (const [code] of [["TUI"], ["DEV"], ["EXM"]]) W.heads[code!] = (await dbx.feeHead.findFirst({ where: { schoolId: s, code }, select: { id: true } }))?.id;
  W.minorEmail = MAIL("c.parent.minor");
  W.guardianUserId = (await dbx.user.findUnique({ where: { email: W.minorEmail }, select: { id: true } }))?.id ?? null;
  return W;
}

/** Who teaches a course, and who countersigns their marks: a colleague of the department who neither teaches it nor entered its marks. */
function teachersOf(W: CollegeWorld, programme: string, slot: 0 | 1): { teacher: Actor; moderator: Actor; hod: Actor } {
  const [P0, P1] = PROGRAMMES;
  if (programme === P0.code) return slot === 0 ? { teacher: W.faculty[0]!, moderator: W.faculty[1]!, hod: W.hod[P0.dept]! } : { teacher: W.faculty[1]!, moderator: W.faculty[0]!, hod: W.hod[P0.dept]! };
  const head = W.hod[P1.dept]!;
  return slot === 0 ? { teacher: W.faculty[2]!, moderator: head, hod: head } : { teacher: head, moderator: W.faculty[2]!, hod: head };
}

type Seat = { membershipId: string; programme: string; yearOfStudy: number; prn: string; userId: string };
async function seatsOf(W: CollegeWorld): Promise<Seat[]> {
  const rows = await dbx.studentProgramme.findMany({ where: { schoolId: W.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true, programmeId: true, yearOfStudy: true, prn: true, student: { select: { userId: true } } } });
  const codeOf = (pid: string) => Object.entries(W.programmes).find(([, p]) => p.id === pid)?.[0] ?? PROGRAMMES[1].code;
  return rows.map((r: Any) => ({ membershipId: r.studentMembershipId, programme: codeOf(r.programmeId), yearOfStudy: r.yearOfStudy, prn: r.prn, userId: r.student.userId }));
}

async function collegeYear(W: CollegeWorld, y: number, idx: number) {
  TENANT = "college";
  const s = W.id;
  const A = W.registrar;
  const yn = yearName(y);
  const yk = yearKey(y);

  /* --------------------------------------------------- the year opens */
  setClock(`${y}-05-28`);
  let year = await dbx.academicYear.findFirst({ where: { schoolId: s, name: yn }, select: { id: true } });
  if (!year) {
    const id = await step("ADMIN", "academicYear.create", () => L.ay.createAcademicYear(A.ctx, { name: yn, startDate: ist(`${y}-06-01`, 5, 30), endDate: ist(`${y + 1}-05-31`, 5, 30) }));
    year = id ? { id } : null;
  }
  if (!year) return;
  const yearId = year.id as string;
  const odd = await step("ADMIN", "academics.saveTerm (odd)", () => L.academics.saveTerm(A.ctx, { name: `Odd term ${yn}`, academicYear: yk, startsOn: `${y}-07-01`, endsOn: `${y}-11-30`, registrationOpensOn: `${y}-06-20`, registrationClosesOn: `${y}-07-15` } as never));
  const even = await step("ADMIN", "academics.saveTerm (even)", () => L.academics.saveTerm(A.ctx, { name: `Even term ${yn}`, academicYear: yk, startsOn: `${y}-12-01`, endsOn: `${y + 1}-04-30`, registrationOpensOn: `${y}-11-20`, registrationClosesOn: `${y}-12-10` } as never));
  if (!odd || !even) return;
  // Fee structures for every programme, year of study and category, approved by the authority.
  for (const p of PROGRAMMES) {
    for (const yos of YEARS_OF_STUDY) {
      for (const category of ["OPEN", "OBC"] as const) {
        const tui = (category === "OPEN" ? 1_600_000 : 800_000) + (p.code === PROGRAMMES[0].code ? 400_000 : 0);
        await step("ACCOUNTS", "collegeFees.createCollegeStructure", () => L.cfees.createCollegeStructure(W.accounts.ctx, { academicYearId: yearId, programmeId: W.programmes[p.code]!.id, yearOfStudy: yos, category, approvalRef: `FRA/${yk}/${p.code}/${yos}/${category}`, name: `${p.short} Y${yos} ${category} ${yn}`, terms: [{ label: "Odd semester", dueDateKey: `${y}-07-15`, lines: [{ headId: W.heads.TUI, amountPaise: tui / 2 }, { headId: W.heads.DEV, amountPaise: 200_000 }] }, { label: "Even semester", dueDateKey: `${y}-12-15`, lines: [{ headId: W.heads.TUI, amountPaise: tui / 2 }, { headId: W.heads.DEV, amountPaise: 200_000 }] }], lateFeeSlabs: [] } as never));
      }
    }
  }
  // This year's divisions, one per programme and year of study.
  const divisions = new Map<string, { id: string; classId: string }>();
  for (const p of PROGRAMMES) {
    for (const yos of YEARS_OF_STUDY) {
      const d = await step("ADMIN", "academics.createDivision", () => L.academics.createDivision(A.ctx, { programmeId: W.programmes[p.code]!.id, yearOfStudy: yos, name: `${SPEC.yearNames[yos - 1]} ${p.short} A ${yn}`, academicYear: yk } as never));
      if (d) divisions.set(`${p.code}|${yos}`, d);
    }
  }
  await redate();

  /* --------------------------------------------------- admissions from the CAP round */
  setClock(`${y}-06-05`);
  await capAdmissions(W, y, idx, divisions);
  // Continuing students move up a year into this year's division (no library function promotes: the office re-seats each one).
  const seats = await seatsOf(W);
  for (const st of seats) {
    const fresh = await dbx.studentProgramme.findUnique({ where: { studentMembershipId: st.membershipId }, select: { entryYear: true, yearOfStudy: true, divisionId: true } });
    const yos = y - fresh.entryYear + 1;
    if (yos > FINAL_YEAR) continue;
    const div = divisions.get(`${st.programme}|${yos}`);
    if (!div || fresh.divisionId === div.id) continue;
    const roll = (await dbx.studentProgramme.count({ where: { divisionId: div.id } })) + 1;
    await step("ADMIN", "academics.saveSeat (new year)", () => L.academics.saveSeat(A.ctx, { studentMembershipId: st.membershipId, programmeId: W.programmes[st.programme]!.id, schemeId: W.programmes[st.programme]!.schemeId, entryYear: fresh.entryYear, yearOfStudy: yos, semester: yos * 2 - 1, divisionId: div.id, rollNumber: roll, prn: null } as never));
  }
  await redate();

  /* --------------------------------------------------- the accounts desk */
  setClock(`${y}-06-10`);
  await step("ACCOUNTS", "collegeFees.raiseDemands", () => L.cfees.raiseDemands(W.accounts.ctx, { academicYearId: yearId }));
  // A concession above the office's limit: pending until the principal approves (an FY OPEN student).
  const fy = (await seatsOf(W)).filter((x) => x.yearOfStudy === 1);
  const concessionFor = fy[0];
  if (concessionFor) {
    const c = await step("ACCOUNTS", "collegeFees.grantCollegeConcession", () => L.cfees.grantCollegeConcession(W.accounts.ctx, { studentMembershipId: concessionFor.membershipId, headId: W.heads.TUI, kind: "AMOUNT", value: 600_000, reason: "Merit concession", authority: "ZZ Governing body" } as never));
    if (c && (c as Any).approvalStatus === "PENDING") await step("PRINCIPAL", "collegeFees.decideConcession", () => L.cfees.decideConcession(W.principal.ctx, (c as Any).id, { approve: true, note: "Approved." } as never));
    else if (c) noteBreak("ACCOUNTS", "collegeFees.grantCollegeConcession", `a ₹6,000 concession was ${(c as Any).approvalStatus}, expected PENDING above the ₹5,000 limit`);
  }
  // A scholarship claim for one OBC student of the second year: OBC post-matric, sanctioned in September, disbursed in January.
  const sy = (await seatsOf(W)).filter((x) => x.yearOfStudy === 2);
  let claimant: Seat | null = null;
  for (const x of sy) {
    const rec = await dbx.pupilRecord.findUnique({ where: { studentMembershipId: x.membershipId }, select: { admissionCategory: true } });
    if (rec?.admissionCategory === "OBC") {
      claimant = x;
      break;
    }
  }
  let claimId: string | null = null;
  if (claimant) {
    await dbx.pupilRecord.update({ where: { studentMembershipId: claimant.membershipId }, data: { annualIncome: 90_000 } });
    const claim = await step("ACCOUNTS", "scholarships.createClaim", () => L.scholarships.createClaim(W.accounts.ctx, { studentMembershipId: claimant!.membershipId, scheme: "OBC_POST_MATRIC", academicYear: yk, portalApplicationId: `MDBT${y}LC${claimant!.prn}`.slice(0, 30), appliedOn: `${y}-06-10` } as never));
    claimId = (claim as Any)?.id ?? null;
  } else note("no OBC student in the second year: no scholarship claim this year");
  await redate();
  // Fees paid by bank: each student pays what is due net of the state's share (the claimant leaves the receivable).
  setClock(`${y}-06-12`, 11);
  await payCollegeFees(W, yearId, "Odd semester");

  /* --------------------------------------------------- the two terms */
  const oddId = (odd as Any).id as string;
  const evenId = (even as Any).id as string;
  await runTerm(W, y, idx, oddId, "odd", divisions, yearId, claimId);
  await runTerm(W, y, idx, evenId, "even", divisions, yearId, claimId);

  /* --------------------------------------------------- the year's end */
  // The IQAC: the cycle recomputed with this year's rows, the AQAR built, sent for sign-off, signed, filed.
  setClock(`${y + 1}-05-25`, 11);
  await iqacYear(W, y, idx);
  if (SPEC.nba) await nbaYear(W, y);
  // Placement's season for the graduating batch.
  setClock(`${y + 1}-05-20`, 11);
  await step("TPO", "placement.publishSeason", () => L.placementAnalytics.publishSeason(W.tpo.ctx, y + 1));
  // Graduation: the final year leaves with no dues and opens the alumnus row.
  setClock(`${y + 1}-05-24`, 12);
  for (const st of (await seatsOf(W)).filter((x) => x.yearOfStudy === FINAL_YEAR)) {
    const nd = await L.noDues.noDuesFor(st.membershipId, "LEAVING");
    if (!nd.completed) {
      for (const line of nd.lines ?? []) {
        if ((line as Any).cleared || (line as Any).done) continue;
        const desk = (line as Any).desk as string;
        const who = desk === "LIBRARY" ? W.librarian : desk === "ACCOUNTS" ? W.accounts : A;
        await step(who.ctx.role!, `noDues.clearLine ${desk}`, () => L.noDues.clearLine(who.ctx, st.membershipId, { event: "LEAVING", desk, note: "Cleared at graduation." } as never));
      }
    }
    const left = await step("ADMIN", "collegeRecords.leaveCollege", () => L.crecords.leaveCollege(A.ctx, st.membershipId, { leftOn: `${y + 1}-05-24`, reason: "GRADUATED" } as never));
    if (left && !(left as Any).alumnus) noteBreak("ADMIN", "collegeRecords.leaveCollege", "no alumnus row reported");
  }
  await redate();
  // Alumni of the college: last year's graduates.
  if (idx > 0) {
    setClock(`${y}-09-02`, 18);
    await alumniYear(s, A, W.faculty[0]!);
  }
  // The year closes on 31 May.
  setClock(`${y + 1}-05-30`, 15);
  let next = await dbx.academicYear.findFirst({ where: { schoolId: s, name: yearName(y + 1) }, select: { id: true } });
  if (!next) {
    const id = await step("ADMIN", "academicYear.create", () => L.ay.createAcademicYear(A.ctx, { name: yearName(y + 1), startDate: ist(`${y + 1}-06-01`, 5, 30), endDate: ist(`${y + 2}-05-31`, 5, 30) }));
    next = id ? { id } : null;
  }
  if (next) await step("ADMIN", "academicYear.close", () => L.ay.closeAcademicYear(A.ctx, yearId, next!.id));
  await redate();
  // Twelve payroll runs, June to May, each on the 28th by the accounts officer.
  for (let m = 6; m <= 17; m += 1) {
    const month = `${m <= 12 ? y : y + 1}-${pad(((m - 1) % 12) + 1)}`;
    setClock(`${month}-28`, 17);
    await payrollMonth(W.accounts, month);
  }
  await redate();
}

/** What the family owes on the ledger the student and the office read (net of the state's receivable), demand by demand. */
async function netDue(studentMembershipId: string, yearId: string, filter: (t: { label: string; dueDateKey: string }) => boolean) {
  const ledger = (await L.cfees.ledgerFor(studentMembershipId, yearId)) as Any;
  const terms = (ledger.terms as { demandId: string; label: string; dueDateKey: string; netDuePaise: number }[]).filter((t) => t.netDuePaise > 0 && filter(t));
  return { ids: terms.map((t) => t.demandId), amount: terms.reduce((a, t) => a + t.netDuePaise, 0) };
}
async function payCollegeFees(W: CollegeWorld, yearId: string, label: string) {
  for (const st of await seatsOf(W)) {
    // The state's receivable is left owing: the claim pays it.
    const due = await netDue(st.membershipId, yearId, (t) => t.label === label);
    if (due.amount < 100) continue;
    await step("ACCOUNTS", "fees.recordCounterPayment (college)", () => L.payments.recordCounterPayment(W.accounts.ctx, { studentMembershipId: st.membershipId, amountPaise: due.amount, method: "BANK", reference: `UTR${simKey.replace(/-/g, "")}${st.prn ?? ""}`.slice(0, 30), note: null, demandIds: due.ids, clientId: `lcc-${label}-${st.membershipId}-${yearId}`, paidAtKey: null } as never, now()));
  }
}

async function capAdmissions(W: CollegeWorld, y: number, idx: number, divisions: Map<string, { id: string; classId: string }>) {
  const A = W.registrar;
  for (const p of PROGRAMMES) {
    // Year 1, the second programme (BCom; BE Mechanical): the CET Cell allots seven where the round has six seats and the programme an intake of six (does anything stop the seventh?).
    const second = p.code === PROGRAMMES[1].code;
    const rows = idx === 0 && second ? INTAKE + 1 : INTAKE;
    const round = await step("ADMIN", "collegeAdmissions.saveRound", () => L.cadm.saveRound(A.ctx, { programmeId: W.programmes[p.code]!.id, intakeYear: y, kind: "CAP_1", name: `CAP 1 ${y} ${p.short}`, opensOn: `${y}-06-01`, closesOn: `${y}-06-20`, seats: { OPEN: 4, OBC: 2 } }));
    if (!round) continue;
    const sheet = ["Sr. No.,Application ID,Name,Gender,Category,Seat Type,Choice Code,Merit No"];
    for (let n = 1; n <= rows; n += 1) {
      const cat = n % 3 === 0 ? "OBC" : "OPEN";
      sheet.push(`${n},${SPEC.idPrefix}${y}${p.dept}${pad(n, 3)},${nameOf(y * 3 + n + (second ? 50 : 0))},${n % 2 ? "M" : "F"},${cat},G${cat}S,${p.code},${100 + n}`);
    }
    const imported = await step("ADMIN", "collegeAdmissions.importAllotments", () => L.cadm.importAllotments(A.ctx, round.id, sheet.join("\n")));
    if (imported && imported.refused.length) noteBreak("ADMIN", "collegeAdmissions.importAllotments", JSON.stringify(imported.refused[0]));
    const allotments = await dbx.capAllotment.findMany({ where: { roundId: round.id }, orderBy: [{ meritNumber: "asc" }, { id: "asc" }], select: { id: true } });
    let n = 0;
    for (const al of allotments) {
      n += 1;
      // The first first-year student of the first programme in year 1 is seventeen, with a guardian: 18 on 15 January of the first year.
      const minor = idx === 0 && p.code === PROGRAMMES[0].code && n === 1;
      const birth = minor ? `${y - 18 + 1}-01-15` : `${y - 18}-${pad((n % 12) + 1)}-${pad(5 + n)}`;
      const app = await step("ADMIN", "collegeAdmissions.createApplication", () => L.cadm.createApplication(A.ctx, { roundId: round.id, capAllotmentId: al.id, birthdateKey: birth, gender: n % 2 ? "M" : "F", phone: `${SPEC.phoneBase}${pad(y % 100)}${pad(n, 2)}` } as never));
      if (!app) continue;
      const appId = (app as Any).id;
      for (const d of (app as Any).documents ?? []) {
        // A scan is the desk's own upload (campaign S-12): the walk files the ticket an upload would have written.
        const fileId = `zzlc-scan-${appId}-${d.doc}`;
        await dbx.uploadTicket.upsert({ where: { fileId }, create: { userId: A.userId, fileId, mime: "application/pdf", size: 10 }, update: {} });
        await step("ADMIN", "collegeAdmissions.setDocument", () => L.cadm.setDocument(A.ctx, appId, { doc: d.doc, fileId, status: "VERIFIED" } as never));
      }
      await step("ADMIN", "collegeAdmissions.recordUndertaking", () => L.cadm.recordUndertaking(A.ctx, appId, "STUDENT"));
      await step("ADMIN", "collegeAdmissions.recordUndertaking", () => L.cadm.recordUndertaking(A.ctx, appId, "PARENT"));
      // The seats are limits since LIFECYCLE-4: a seat past the round's category seats or the intake is refused
      // 409 at the offer. Year 1's seventh BCom candidate is then given the seat by the principal as supernumerary.
      let offered: Any = null;
      try {
        offered = await L.cadm.offerSeat(A.ctx, appId);
      } catch (e) {
        const key = (e as { key?: string }).key ?? "";
        if (key !== "collegeOffice.refuseSeatsFull" && key !== "collegeOffice.refuseIntakeFull") {
          noteBreak("ADMIN", "collegeAdmissions.offerSeat", errorText(e));
          continue;
        }
        note(`seat refused at the offer as the limits say (${key})`);
        if (!(idx === 0 && second)) continue;
        await step("PRINCIPAL", "collegeAdmissions.approveSupernumerary", () => L.cadm.approveSupernumerary(W.principal.ctx, appId, { reason: "ZZ ward of a serviceman" }));
        offered = await step("ADMIN", "collegeAdmissions.offerSeat (supernumerary)", () => L.cadm.offerSeat(A.ctx, appId));
        if (!offered) continue;
      }
      const fee = (offered as Any)?.admissionFeePaise ?? 0;
      if (fee > 0) await step("ADMIN", "collegeAdmissions.recordAdmissionFee", () => L.cadm.recordAdmissionFee(A.ctx, appId, { amountPaise: fee, method: "BANK", reference: `UTRADM${y}${p.dept}${n}` }));
      const prn = `${SPEC.idPrefix}${y}${p.dept}${pad(n, 3)}`;
      const admitted = await step("ADMIN", "collegeAdmissions.admitStudent", () => L.cadm.admitStudent(A.ctx, appId, { prn }));
      if (!admitted) continue;
      await redate();
      const div = divisions.get(`${p.code}|1`);
      if (div) await step("ADMIN", "academics.saveSeat (FY)", () => L.academics.saveSeat(A.ctx, { studentMembershipId: admitted.studentMembershipId, programmeId: W.programmes[p.code]!.id, schemeId: W.programmes[p.code]!.schemeId, entryYear: y, yearOfStudy: 1, semester: 1, divisionId: div.id, rollNumber: n, prn: null } as never));
      if (minor) {
        const parent = await person(W.minorEmail, "ZZ Ravindra Bhosale (guardian)");
        await L.fx.link(parent.id, admitted.studentMembershipId, W.id);
        W.guardianUserId = parent.id;
        const u = await dbx.membership.findUnique({ where: { id: admitted.studentMembershipId }, select: { userId: true, user: { select: { isMinor: true } } } });
        if (!u.user.isMinor) noteBreak("ADMIN", "collegeAdmissions.admitStudent", "a seventeen-year-old was admitted as an adult (isMinor false)");
        await dbx.user.update({ where: { id: u.userId }, data: { email: MAIL(`c.minor${y}`) } });
      }
    }
    if (idx === 0 && second) {
      const admittedCount = await dbx.collegeApplication.count({ where: { roundId: round.id, status: "ADMITTED", supernumeraryAt: null } });
      const extra = await dbx.collegeApplication.count({ where: { roundId: round.id, status: "ADMITTED", supernumeraryAt: { not: null } } });
      note(`${p.short} year 1: ${admittedCount} admitted within the limits and ${extra} supernumerary`);
      if (admittedCount > INTAKE) noteBreak("ADMIN", "collegeAdmissions.admitStudent (intake)", `OVERBOOKING: ${admittedCount} admitted to ${p.short} in a round of 6 seats and an intake of ${INTAKE}; neither limit refused the seventh`);
    }
  }
}

/* ------------------------------------------------ engineering: labs, practicals, conduct, the SAR */

type Offering = { id: string; code: string; programme: string; yos: number; slot: 0 | 1; divisionId: string; period: string; lab: boolean };

/**
 * After registration, the registrar splits each division that has a practical
 * course into batches of LAB_BATCH_SIZE (re-splitting in the even term keeps
 * the batches' ids), and gives the practical offering a LAB hour per batch in
 * the department's lab: batch A on Monday, B on Friday, at the division's own
 * period (so a teacher's divisions never share an hour).
 */
async function labBatchesForTerm(W: CollegeWorld, offerings: Offering[]) {
  const A = W.registrar;
  for (const o of offerings.filter((x) => x.lab)) {
    const split = await step("ADMIN", "streamRecords.splitLabBatches", () => L.streamRecords.splitLabBatches(A.ctx, { divisionId: o.divisionId, size: LAB_BATCH_SIZE }));
    if (!split) continue;
    const batches = (split.divisions.find((d) => d.divisionId === o.divisionId)?.batches ?? []) as { id: string; name: string; members: unknown[] }[];
    if (batches.length !== 2) note(`${o.code}: ${batches.length} lab batch(es) of ${batches.map((b) => b.members.length).join("+")} (two expected for an intake of six or seven)`);
    const dept = PROGRAMMES.find((p) => p.code === o.programme)!.dept;
    for (const [b, batch] of batches.entries()) {
      await step("ADMIN", "academics.saveTimetableSlot (LAB, batch)", () => L.academics.saveTimetableSlot(A.ctx, { offeringId: o.id, weekday: LAB_WEEKDAYS[b % LAB_WEEKDAYS.length]!, periodId: o.period, kind: "LAB", roomId: W.labRooms[dept] ?? null, labBatchId: batch.id } as never));
    }
  }
}

/** The one negative check of the batches: a mark for a student outside the lecture's batch is refused (422 streamRecords.refuseNotInBatch). */
let batchRefusalChecked = false;
async function outsideBatchCheck(teacher: Actor, lectureId: string, outsider: string | null) {
  if (!outsider) return;
  batchRefusalChecked = true;
  try {
    await L.lectures.markLecture(teacher.ctx, lectureId, { clientId: `lce-outside-${lectureId}`, entries: [{ studentMembershipId: outsider, status: "PRESENT" }] } as never);
    noteBreak(teacher.ctx.role!, "lectures.markLecture (a student outside the batch)", "a mark for a student outside the lecture's lab batch was accepted");
  } catch (e) {
    const key = (e as { key?: string }).key;
    if (key === "streamRecords.refuseNotInBatch") note(`negative check, as intended: markLecture refused a student outside the lab batch (${errorText(e)})`);
    else noteBreak(teacher.ctx.role!, "lectures.markLecture (a student outside the batch)", `refused, but not for the batch: ${errorText(e)}`);
  }
}

/** Two experiments a term for every registered student of the practical course, by its teacher; then signed by the department's LAB_INCHARGE (a colleague who does not teach it). */
async function practicalRecords(W: CollegeWorld, y: number, which: "odd" | "even", offerings: Offering[]) {
  const labs = offerings.filter((o) => o.lab);
  if (!labs.length) return;
  const days = which === "odd" ? [`${y}-08-14`, `${y}-09-18`] : [`${y + 1}-01-16`, `${y + 1}-02-19`];
  setClock(which === "odd" ? `${y}-10-05` : `${y + 1}-03-05`, 16);
  for (const o of labs) {
    const { teacher } = teachersOf(W, o.programme, o.slot);
    const regs: string[] = (await dbx.courseRegistration.findMany({ where: { offeringId: o.id, status: "REGISTERED" }, orderBy: { studentMembershipId: "asc" }, select: { studentMembershipId: true } })).map((r: Any) => r.studentMembershipId as string);
    if (!regs.length) continue;
    for (const [e, day] of days.entries()) {
      await step(teacher.ctx.role!, "streamRecords.savePracticals", () => L.streamRecords.savePracticals(teacher.ctx, { offeringId: o.id, experimentNo: e + 1, title: `Experiment ${e + 1}: ${o.code}`, performedOn: day, entries: regs.map((id, j) => ({ studentMembershipId: id, marks: 6 + ((j + e + y) % 5) })) }));
    }
  }
  await redate();
  setClock(which === "odd" ? `${y}-10-08` : `${y + 1}-03-08`, 12);
  for (const o of labs) {
    const incharge = o.programme === PROGRAMMES[0].code ? W.faculty[0]! : W.faculty[2]!;
    const ids = (await dbx.practicalRecord.findMany({ where: { offeringId: o.id, signedAt: null }, select: { id: true } })).map((r: Any) => r.id as string);
    if (!ids.length) continue;
    const signed = await step("FACULTY", "streamRecords.signPracticals (lab in-charge)", () => L.streamRecords.signPracticals(incharge.ctx, ids));
    if (signed && signed.count !== ids.length) noteBreak("FACULTY", "streamRecords.signPracticals (lab in-charge)", `${signed.count} of ${ids.length} rows signed`);
  }
  await redate();
}

/** A small, valid one-page PDF that says what it is: the sealed paper's contents (as scripts/zz-exams.ts makes it). */
function fixturePdf(): Buffer {
  const text = "ZZ lifecycle question paper: Q1 (CO1, 30 marks) Q2 (CO2, 30 marks).";
  const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
const PAPER_PDF = fixturePdf();
let sealingNoted = false;

/** The exam days of a session: two papers a day (10:00 and 14:30 IST), Sundays skipped. */
function examSlots(firstDay: string, n: number): Date[] {
  const out: Date[] = [];
  let d = firstDay;
  while (out.length < n) {
    if (weekday(d) !== 0) {
      out.push(ist(d, 10));
      if (out.length < n) out.push(ist(d, 14, 30));
    }
    d = addDays(d, 1);
  }
  return out;
}
const dayOf = (at: Date) => new RealDate(at.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/**
 * THE AUTONOMOUS COLLEGE'S OWN CONDUCT, before the sitting: the date sheet
 * (every course on an approved form, regular and backlog), a setter for each
 * paper (its teacher), the paper submitted SEALED by the setter, moderated by
 * the controller, a hall per paper, the seating, the hall tickets and the
 * printing lists.
 */
async function conductBefore(W: CollegeWorld, y: number, which: "odd" | "even", sessionId: string) {
  const C = W.controller;
  setClock(which === "odd" ? `${y}-10-30` : `${y + 1}-03-20`, 11);
  const approved = await dbx.examForm.findMany({ where: { sessionId, status: "APPROVED" }, select: { coursesJson: true } });
  const ids = [...new Set(approved.flatMap((f: Any) => (JSON.parse(f.coursesJson) as { courseId: string }[]).map((c) => c.courseId)))];
  const courses = [...W.courses.values()].filter((c) => ids.includes(c.id)).sort((a, b) => a.code.localeCompare(b.code));
  const slots = examSlots(which === "odd" ? `${y}-11-21` : `${y + 1}-04-21`, courses.length);
  for (const [i, c] of courses.entries()) await step("EXAM_CONTROLLER", "examCell.saveSchedule", () => L.cell.saveSchedule(C.ctx, sessionId, { courseId: c.id, at: slots[i]!.toISOString(), durationMin: 180 }));
  const schedules = await dbx.examSchedule.findMany({ where: { sessionId }, orderBy: { at: "asc" }, select: { id: true, courseId: true, courseCode: true } });
  const papers: { id: string; setter: Actor; code: string }[] = [];
  for (const sch of schedules) {
    const course = [...W.courses.values()].find((c) => c.id === sch.courseId);
    if (!course) continue;
    const { teacher } = teachersOf(W, course.programme, course.slot);
    const a = await step("EXAM_CONTROLLER", "examCellAfter.assignPaper", () => L.cellAfter.assignPaper(C.ctx, sessionId, { scheduleId: sch.id, setterMembershipId: teacher.membershipId! }));
    if (a?.id) papers.push({ id: a.id, setter: teacher, code: sch.courseCode });
    await step("EXAM_CONTROLLER", "examCell.saveRoom", () => L.cell.saveRoom(C.ctx, sessionId, { scheduleId: sch.id, name: "ZZ Exam Hall 1", capacity: 40 }));
  }
  await redate();
  // The setters' papers, sealed at once (secret-box under FEES_SECRET_KEY, which with-admin-db loads from .env).
  setClock(which === "odd" ? `${y}-11-04` : `${y + 1}-03-25`, 17);
  if (!L.secretBox.sealingAvailable()) {
    if (!sealingNoted) note("sealing is not available (FEES_SECRET_KEY unset): no paper was submitted, so none is moderated or opened");
    sealingNoted = true;
  } else {
    for (const p of papers) {
      await step(p.setter.ctx.role!, "examCellAfter.submitPaper (sealed)", () => L.cellAfter.submitPaper(p.setter.ctx, p.id, { fileName: `${p.code}-${which}-${y}.pdf`, mime: "application/pdf", dataBase64: PAPER_PDF.toString("base64"), coMap: [{ question: "Q1", co: "CO1", marks: 30 }, { question: "Q2", co: "CO2", marks: 30 }] }));
    }
    await redate();
    setClock(which === "odd" ? `${y}-11-09` : `${y + 1}-03-30`, 12);
    for (const p of papers) await step("EXAM_CONTROLLER", "examCellAfter.moderatePaper", () => L.cellAfter.moderatePaper(C.ctx, p.id, "Moderated: the questions cover CO1 and CO2 evenly."));
  }
  // Halls, seats, tickets, the printing lists.
  setClock(which === "odd" ? `${y}-11-12` : `${y + 1}-04-02`, 11);
  const seated = await step("EXAM_CONTROLLER", "examCell.buildSeating", () => L.cell.buildSeating(C.ctx, sessionId));
  if (seated && seated.count) noteBreak("EXAM_CONTROLLER", "examCell.buildSeating", `${seated.count} candidate(s) found no seat in a hall of 40`);
  await step("EXAM_CONTROLLER", "examCell.issueHallTickets", () => L.cell.issueHallTickets(C.ctx, sessionId));
  await step("EXAM_CONTROLLER", "examCellAfter.buildPrintingLists", () => L.cellAfter.buildPrintingLists(C.ctx, sessionId, 2));
  await redate();
}

/** The sitting: each paper opened once by the controller on its morning (and checked against what the setter sealed); then the answer books in bundles to an assessor, returned. */
async function conductDuring(W: CollegeWorld, sessionId: string) {
  const C = W.controller;
  const schedules = await dbx.examSchedule.findMany({ where: { sessionId }, orderBy: { at: "asc" }, select: { id: true, at: true, courseId: true, courseCode: true, papers: { select: { id: true, sealedBody: true } }, _count: { select: { seats: true } } } });
  for (const sch of schedules) {
    const at = sch.at instanceof RealDate ? sch.at : new RealDate(sch.at);
    const istHour = new RealDate(at.getTime() + 330 * 60_000).getUTCHours();
    setClock(dayOf(at), istHour >= 14 ? 14 : 9, 0);
    for (const p of sch.papers) {
      if (!p.sealedBody) continue;
      const opened = await step("EXAM_CONTROLLER", "examCellAfter.openPaper", () => L.cellAfter.openPaper(C.ctx, p.id));
      if (opened && !opened.bytes.equals(PAPER_PDF)) noteBreak("EXAM_CONTROLLER", "examCellAfter.openPaper", `${sch.courseCode}: the opened paper is not what the setter sealed`);
    }
  }
  await redate();
  const last = schedules.at(-1);
  if (!last) return;
  const lastDay = dayOf(last.at instanceof RealDate ? last.at : new RealDate(last.at));
  setClock(addDays(lastDay, 1), 11);
  await step("EXAM_CONTROLLER", "examCell.setSessionStatus ASSESSMENT", () => L.cell.setSessionStatus(C.ctx, sessionId, "ASSESSMENT" as never));
  const allotted: string[] = [];
  for (const sch of schedules) {
    const course = [...W.courses.values()].find((c) => c.id === sch.courseId);
    if (!course) continue;
    const { moderator } = teachersOf(W, course.programme, course.slot);
    const a = await step("EXAM_CONTROLLER", "examCellAfter.saveAllocation", () => L.cellAfter.saveAllocation(C.ctx, sessionId, { scheduleId: sch.id, assessorMembershipId: moderator.membershipId!, bundle: `${sch.courseCode}-B1`, count: Math.max(1, sch._count.seats) }));
    if (a?.id) allotted.push(a.id);
  }
  await redate();
  setClock(addDays(lastDay, 4), 16);
  for (const id of allotted) await step("EXAM_CONTROLLER", "examCellAfter.returnAllocation", () => L.cellAfter.returnAllocation(C.ctx, id));
  await redate();
}

/** The year's NBA SAR for the first programme's department: generated by the IQAC, self-assessed by its HOD, regenerated, submitted, signed off by the principal, filed. */
const SAR_MARKS: { year: string; computed: number; self: number; total: number; status: string }[] = [];
async function nbaYear(W: CollegeWorld, y: number) {
  const Q = W.iqac;
  const P0 = PROGRAMMES[0];
  const departmentId = W.programmes[P0.code]?.deptId;
  const hod = W.hod[P0.dept];
  if (!departmentId || !hod) return;
  const made = await step("IQAC", "iqacFilings.generateFiling NBA_SAR", () => L.iqacFilings.generateFiling(Q.ctx, { kind: "NBA_SAR", year: y, cycleId: null, departmentId }));
  if (!made) return;
  const items = L.contracts.NBA_SAR_ITEMS.filter((i) => !i.computed).map((i, j) => ({ code: i.code, answer: null, score: Math.round(i.marks * (0.55 + ((j + y) % 4) * 0.05)), note: `ZZ ${P0.short}, ${yearName(y)}: the department's account of ${i.text.toLowerCase()}.` }));
  await step("HOD", "councilFilings.saveWorksheet NBA_SAR", () => L.councilFilings.saveWorksheet(hod.ctx, "NBA_SAR", { year: y, departmentId, items }));
  await step("IQAC", "iqacFilings.generateFiling NBA_SAR (regenerated)", () => L.iqacFilings.generateFiling(Q.ctx, { kind: "NBA_SAR", year: y, cycleId: null, departmentId }));
  const f = await dbx.collegeFiling.findFirst({ where: { schoolId: W.id, kind: "NBA_SAR", year: y, departmentId }, orderBy: { generatedAt: "desc" }, select: { id: true, figuresJson: true } });
  if (!f) return noteBreak("IQAC", "iqacFilings.generateFiling NBA_SAR", "no filing row after generating");
  await step("IQAC", "iqacFilings.submitFiling NBA_SAR", () => L.iqacFilings.submitFiling(Q.ctx, f.id));
  await step("PRINCIPAL", "iqacFilings.signOffFiling NBA_SAR", () => L.iqacFilings.signOffFiling(W.principal.ctx, f.id, { decision: "SIGN", note: "Signed." } as never));
  await step("IQAC", "iqacFilings.markFiled NBA_SAR", () => L.iqacFilings.markFiled(Q.ctx, f.id, null));
  const fig = JSON.parse(f.figuresJson ?? "{}") as { computedMarks?: number; selfMarks?: number };
  const status = (await dbx.collegeFiling.findUnique({ where: { id: f.id }, select: { status: true } }))?.status ?? "?";
  const hundredths = (x: number) => Math.round(x * 100) / 100;
  const row = { year: yearName(y), computed: hundredths(fig.computedMarks ?? 0), self: hundredths(fig.selfMarks ?? 0), total: hundredths((fig.computedMarks ?? 0) + (fig.selfMarks ?? 0)), status };
  SAR_MARKS.push(row);
  note(`NBA SAR ${P0.dept} ${row.year}: ${row.computed} computed + ${row.self} self-assessed = ${row.total} of 1000, ${status}`);
  writeFileSync(join(OUT, "sar.json"), JSON.stringify(SAR_MARKS, null, 2));
}

async function runTerm(W: CollegeWorld, y: number, idx: number, termId: string, which: "odd" | "even", divisions: Map<string, { id: string; classId: string }>, yearId: string, claimId: string | null) {
  const s = W.id;
  const A = W.registrar;
  const termStart = which === "odd" ? `${y}-07-01` : `${y}-12-01`;
  const lectureEnd = which === "odd" ? `${y}-11-14` : `${y + 1}-04-10`;

  /* offerings and the timetable, before registration */
  setClock(which === "odd" ? `${y}-06-18` : `${y}-11-18`, 11);
  const offerings: Offering[] = [];
  let di = 0;
  for (const p of PROGRAMMES) {
    for (const yos of YEARS_OF_STUDY) {
      const div = divisions.get(`${p.code}|${yos}`);
      const sem = which === "odd" ? yos * 2 - 1 : yos * 2;
      di += 1;
      if (!div) continue;
      // A division nobody sits in this year (the college fills up over its first three years) gets no offerings.
      if (!(await dbx.studentProgramme.count({ where: { divisionId: div.id, status: "ACTIVE" } }))) continue;
      for (const slot of [0, 1] as const) {
        const code = `${p.prefix}${sem}0${slot + 1}`;
        const course = W.courses.get(code);
        if (!course) continue;
        const { teacher } = teachersOf(W, p.code, slot);
        // The practical course (engineering): two practical hours a week, a LAB hour for each batch (set after registration, below).
        const lab = SPEC.labs && slot === LAB_SLOT;
        const o = await step("ADMIN", "academics.saveOffering", () => L.academics.saveOffering(A.ctx, { termId, courseId: course.id, divisionId: div.id, facultyMembershipId: teacher.membershipId, lectureHours: 3, tutorialHours: 1, practicalHours: lab ? 2 : 0, roomId: null, capacity: null } as never));
        if (!o) continue;
        offerings.push({ id: (o as Any).id, code, programme: p.code, yos, slot, divisionId: div.id, period: W.periods[(di - 1) % W.periods.length]!, lab });
        // Tuesday for the first course, Thursday for the second, in the division's own bell.
        await step("ADMIN", "academics.saveTimetableSlot", () => L.academics.saveTimetableSlot(A.ctx, { offeringId: (o as Any).id, weekday: slot === 0 ? 2 : 4, periodId: W.periods[(di - 1) % W.periods.length]!, kind: "LECTURE", roomId: null } as never));
      }
    }
  }
  /* seats for the even semester, then registration inside the window */
  if (which === "even") {
    setClock(`${y}-11-21`, 11);
    for (const st of await seatsOf(W)) {
      const sp = await dbx.studentProgramme.findUnique({ where: { studentMembershipId: st.membershipId }, select: { entryYear: true, yearOfStudy: true, semester: true, divisionId: true } });
      if (sp.semester === sp.yearOfStudy * 2) continue;
      // saveSeat writes the roll it is given, null included. The arts walk has always sent null here (its rolls go blank in the even term,
      // which nothing there reads); at an engineering college the even term's re-split of the lab batches goes by roll, so the roll is kept.
      const roll = SPEC.labs ? ((await dbx.enrollment.findFirst({ where: { studentMembershipId: st.membershipId, status: "ACTIVE", class: { division: { is: { id: sp.divisionId } } } }, select: { rollNumber: true } }))?.rollNumber ?? null) : null;
      await step("ADMIN", "academics.saveSeat (even semester)", () => L.academics.saveSeat(A.ctx, { studentMembershipId: st.membershipId, programmeId: W.programmes[st.programme]!.id, schemeId: W.programmes[st.programme]!.schemeId, entryYear: sp.entryYear, yearOfStudy: sp.yearOfStudy, semester: sp.yearOfStudy * 2, divisionId: sp.divisionId, rollNumber: roll, prn: null } as never));
    }
  }
  setClock(which === "odd" ? `${y}-06-25` : `${y}-11-25`, 11);
  const seats = await seatsOf(W);
  for (const st of seats) {
    const mine = offerings.filter((o) => o.programme === st.programme && o.yos === st.yearOfStudy).map((o) => o.id);
    if (!mine.length) continue;
    await step("ADMIN", "registration.saveRegistration", () => L.registration.saveRegistration(A.ctx, { termId, offeringIds: mine, studentMembershipId: st.membershipId }));
  }
  await redate();
  /* engineering: the divisions split into lab batches, and the practical course's LAB hour for each batch */
  if (SPEC.labs) await labBatchesForTerm(W, offerings);

  /* leave: a faculty member in August or January */
  setClock(which === "odd" ? `${y}-08-10` : `${y + 1}-01-08`, 9);
  {
    const f = W.faculty[(idx + (which === "even" ? 1 : 0)) % 3]!;
    const applied = await step(f.ctx.role!, "leave.applyForLeave", () => L.leave.applyForLeave(f.ctx, { fromDateKey: addDays(simKey, 3), toDateKey: addDays(simKey, 3), kind: "CASUAL", reason: "Family function" }));
    if (applied && applied.ok && applied.id) await step("PRINCIPAL", "leave.decideLeave", () => L.leave.decideLeave(W.principal.ctx, applied.id!, "APPROVED", {}));
  }

  /* lectures: Tuesdays and Thursdays, every one marked by its teacher (and at engineering, the batches' LAB hours on Mondays and Fridays) */
  const lowAttendance = which === "even" ? seats.find((x) => x.yearOfStudy === 2 && x.programme === PROGRAMMES[1].code) : undefined;
  const lectureDays = SPEC.labs ? [2, 4, ...LAB_WEEKDAYS] : [2, 4];
  let k = 0;
  for (const day of daysBetween(termStart, lectureEnd)) {
    const wd = weekday(day);
    if (!lectureDays.includes(wd)) continue;
    setClock(day, 9, 5);
    const ensured = await step("SYSTEM", "academics.ensureLecturesForDay", () => L.academics.ensureLecturesForDay(s, day));
    if (!ensured || ensured.closed) continue;
    const lectures = await dbx.lecture.findMany({ where: { schoolId: s, dateKey: day, offering: { termId } }, select: { id: true, offeringId: true, labBatchId: true } });
    setClock(day, 15, 30);
    for (const lec of lectures) {
      const o = offerings.find((x) => x.id === lec.offeringId);
      if (!o) continue;
      const { teacher } = teachersOf(W, o.programme, o.slot);
      let regs = await dbx.courseRegistration.findMany({ where: { offeringId: o.id, status: "REGISTERED" }, select: { studentMembershipId: true } });
      if (lec.labBatchId) {
        // A batch's LAB hour: the batch's students only (markLecture refuses anyone else — checked once, below).
        // The batch on the lecture's own day (S4B-0: membership is dated).
        const members = new Set((await dbx.labBatchMember.findMany({ where: { batchId: lec.labBatchId, fromKey: { lte: day }, OR: [{ untilKey: null }, { untilKey: { gte: day } }] }, select: { studentMembershipId: true } })).map((m: Any) => m.studentMembershipId));
        if (!batchRefusalChecked) await outsideBatchCheck(teacher, lec.id, regs.map((r: Any) => r.studentMembershipId).find((id: string) => !members.has(id)) ?? null);
        regs = regs.filter((r: Any) => members.has(r.studentMembershipId));
      }
      if (!regs.length) continue;
      k += 1;
      const entries = regs.map((r: Any, j: number) => {
        const absent = lowAttendance && r.studentMembershipId === lowAttendance.membershipId && o.slot === 0 ? k % 3 !== 0 && k % 5 !== 0 : (j * 7 + k * 3) % 13 === 0;
        return { studentMembershipId: r.studentMembershipId, status: absent ? "ABSENT" : "PRESENT" };
      });
      await step(teacher.ctx.role!, "lectures.markLecture", () => L.lectures.markLecture(teacher.ctx, lec.id, { clientId: `lcc-${lec.id}`, entries } as never));
    }
  }
  await redate();

  /* the internal assessment: two components, marks, a colleague countersigns, the head releases and locks */
  setClock(which === "odd" ? `${y}-09-15` : `${y + 1}-02-10`, 12);
  const comps = new Map<string, string[]>();
  for (const o of offerings) {
    const { teacher } = teachersOf(W, o.programme, o.slot);
    const ids: string[] = [];
    for (const [name, kind, co] of [["Unit test", "UNIT_TEST", "CO1"], ["Assignment", "ASSIGNMENT", "CO2"]] as const) {
      const c = await step(teacher.ctx.role!, "assessment.saveComponent", () => L.assessment.saveComponent(teacher.ctx, o.id, { name, kind, maxMarks: 20, weight: 20, coCodes: [co] } as never));
      if (c) ids.push(c.id);
    }
    comps.set(o.id, ids);
  }
  setClock(which === "odd" ? `${y}-10-20` : `${y + 1}-03-20`, 12);
  for (const o of offerings) {
    const { teacher } = teachersOf(W, o.programme, o.slot);
    const regs = await dbx.courseRegistration.findMany({ where: { offeringId: o.id, status: "REGISTERED" }, select: { studentMembershipId: true } });
    for (const [ci, componentId] of (comps.get(o.id) ?? []).entries()) {
      await step(teacher.ctx.role!, "assessment.saveInternalMarks", () => L.assessment.saveInternalMarks(teacher.ctx, o.id, { componentId, entries: regs.map((r: Any, j: number) => ({ studentMembershipId: r.studentMembershipId, marks: 10 + ((j * 5 + ci * 3 + y) % 11) })) } as never));
    }
  }
  setClock(which === "odd" ? `${y}-11-10` : `${y + 1}-04-12`, 12);
  for (const o of offerings) {
    const { moderator, hod } = teachersOf(W, o.programme, o.slot);
    for (const componentId of comps.get(o.id) ?? []) {
      await step(moderator.ctx.role!, "assessment.moderateComponent", () => L.assessment.moderateComponent(moderator.ctx, componentId));
      await step("HOD", "assessment.releaseComponent", () => L.assessment.releaseComponent(hod.ctx, componentId));
    }
    await step("HOD", "assessment.lockInternal", () => L.assessment.lockInternal(hod.ctx, o.id));
  }
  await redate();

  /* a condonation, in the even term, for the student kept away from one course */
  if (lowAttendance) {
    setClock(`${y + 1}-03-02`, 11);
    const elig = (await L.lectures.eligibilityForTerm(termId, { studentMembershipId: lowAttendance.membershipId })).find((e: Any) => !e.eligible);
    if (!elig) note(`the low-attendance student is eligible everywhere; no condonation asked`);
    else {
      const stu = await asMember(lowAttendance.membershipId);
      const ask = await step("STUDENT", "lectures.askCondonation", () => L.lectures.askCondonation(stu.ctx, { termId, offeringId: elig.offeringId, ground: "MEDICAL", note: "Hospitalised in January.", documentFileId: null } as never));
      if (ask) {
        const askId = (ask as Any).id;
        const hodDecision = (elig.percent ?? 0) >= 65 ? "APPROVE" : "FORWARD";
        await step("HOD", "lectures.decideCondonation", () => L.lectures.decideCondonation(W.hod[PROGRAMMES[1].dept]!.ctx, askId, { decision: hodDecision, note: "Seen the certificate." } as never));
        if (hodDecision === "FORWARD") await step("PRINCIPAL", "lectures.decideCondonation", () => L.lectures.decideCondonation(W.principal.ctx, askId, { decision: "APPROVE", note: "Condoned on medical grounds." } as never));
      }
    }
  }

  /* the even term's fees, a placement drive and the library in the odd term; the scholarship's sanction and disbursement */
  if (which === "even") {
    setClock(`${y}-12-05`, 11);
    await payCollegeFees(W, yearId, "Even semester");
    if (claimId) {
      setClock(`${y + 1}-01-20`, 11);
      const c = await dbx.scholarshipClaim.findUnique({ where: { id: claimId }, select: { expectedPaise: true, status: true } });
      if (c?.status === "SANCTIONED") await step("ACCOUNTS", "scholarships.updateClaim DISBURSE", () => L.scholarships.updateClaim(W.accounts.ctx, claimId, { action: "DISBURSE", amountPaise: c.expectedPaise, on: simKey, reference: `PFMS${y}${claimId.slice(-6)}` } as never));
    }
    // The college library: a final-year student borrows in January and returns late in February.
    const ty = (await seatsOf(W)).find((x) => x.yearOfStudy === FINAL_YEAR);
    if (ty) {
      setClock(`${y + 1}-01-12`, 12);
      await step("LIBRARIAN", "library.issueCopy (college)", () => L.library.issueCopy(W.librarian.ctx, { accession: `${SPEC.accession}-1`, membershipId: ty.membershipId }));
      setClock(`${y + 1}-02-05`, 12);
      const back = await step("LIBRARIAN", "library.returnCopy (college, late)", () => L.library.returnCopy(W.librarian.ctx, { accession: `${SPEC.accession}-1` }));
      const fine = (back as Any)?.fine;
      if (fine) await step("ADMIN", "library.settleFine", () => L.library.settleFine(A.ctx, fine.id));
    }
  } else {
    if (claimId) {
      setClock(`${y}-09-18`, 11);
      const c = await dbx.scholarshipClaim.findUnique({ where: { id: claimId }, select: { expectedPaise: true } });
      await step("ACCOUNTS", "scholarships.updateClaim SANCTION", () => L.scholarships.updateClaim(W.accounts.ctx, claimId, { action: "SANCTION", amountPaise: c.expectedPaise, on: simKey } as never));
    }
    await placementYear(W, y);
  }

  /* engineering: the practical record of the term, written by the course's teacher and signed by the department's lab in-charge */
  if (SPEC.labs) await practicalRecords(W, y, which, offerings);

  /* the exam cell: forms, conduct (the university's file, or the autonomous college's own papers and double entry), the run, publication, grade cards */
  await examSession(W, y, idx, termId, which);
  await redate();

  /* the minor's eighteenth birthday, in year 1's even term, checked to the day */
  if (idx === 0 && which === "even") await birthdayCheck(W, y);
  // Every month the stored minority flag is refreshed for the college's students, as accounts:tidy does daily.
  const ids = (await dbx.membership.findMany({ where: { schoolId: s, role: "STUDENT" }, select: { userId: true } })).map((m: Any) => m.userId);
  await step("SYSTEM", "birthdate.refreshMinority", () => L.birthdate.refreshMinority(now(), { userIds: ids }));
}

async function examSession(W: CollegeWorld, y: number, idx: number, termId: string, which: "odd" | "even") {
  const C = W.controller;
  const name = which === "odd" ? `Winter ${y} (odd ${yearName(y)})` : `Summer ${y + 1} (even ${yearName(y)})`;
  setClock(which === "odd" ? `${y}-10-25` : `${y + 1}-03-15`, 11);
  const made = await step("EXAM_CONTROLLER", "examCell.createSession", () => L.cell.createSession(C.ctx, { name, kind: "REGULAR", termId, formOpensAt: null, formClosesAt: null, feePerCoursePaise: 10_000, feePerBacklogPaise: 15_000, photocopyFeePaise: 5_000, revalFeePaise: 20_000, lateFeeSlabs: [], feeHeadId: W.heads.EXM } as never));
  const sessionId = (made as Any)?.id;
  if (!sessionId) return;
  await step("EXAM_CONTROLLER", "examCell.setSessionStatus FORMS", () => L.cell.setSessionStatus(C.ctx, sessionId, "FORMS" as never));
  await step("EXAM_CONTROLLER", "examCell.generateForms", () => L.cell.generateForms(C.ctx, sessionId));
  const forms = await dbx.examForm.findMany({ where: { sessionId }, select: { id: true, studentMembershipId: true, status: true } });
  for (const f of forms) {
    const stu = await asMember(f.studentMembershipId);
    let sub = await step("STUDENT", "examCell.submitForm", () => L.cell.submitForm(stu.ctx, f.id));
    if (!sub) {
      // The ACCOUNTS line counts demands not yet due (next semester's): the family pays ahead and submits again.
      const cy = await dbx.academicYear.findFirst({ where: { schoolId: W.id, isCurrent: true }, select: { id: true } });
      const ahead = await netDue(f.studentMembershipId, cy.id, (t) => t.dueDateKey > simKey);
      if (ahead.amount >= 100) {
        await step("ACCOUNTS", "fees.recordCounterPayment (paid ahead for the form)", () => L.payments.recordCounterPayment(W.accounts.ctx, { studentMembershipId: f.studentMembershipId, amountPaise: ahead.amount, method: "BANK", reference: `UTRAHEAD${simKey.replace(/-/g, "")}`, note: null, demandIds: ahead.ids, clientId: `lcc-ahead-${sessionId}-${f.studentMembershipId}`, paidAtKey: null } as never, now()));
        sub = await step("STUDENT", "examCell.submitForm (after paying ahead)", () => L.cell.submitForm(stu.ctx, f.id));
      }
    }
    if (!sub) {
      // What stopped it: eligibility or no-dues, read from the libraries the form reads.
      const nd = await L.noDues.noDuesFor(f.studentMembershipId, "EXAM_FORM");
      if (!nd.completed) note(`exam form refused: no-dues ${JSON.stringify(nd.lines?.filter((l: Any) => !l.cleared).map((l: Any) => [l.desk, l.owedPaise ?? l.duePaise, l.itemsOut]) ?? []).slice(0, 200)}`);
      continue;
    }
    await step("EXAM_CONTROLLER", "examCell.decideForm", () => L.cell.decideForm(C.ctx, f.id, { approve: true, waiveFee: false }));
  }
  // The exam fee demands the forms raised, paid at the counter.
  setClock(which === "odd" ? `${y}-10-28` : `${y + 1}-03-18`, 11);
  for (const f of forms) {
    const due = await dbx.feeDemand.findMany({ where: { studentMembershipId: f.studentMembershipId, status: { in: ["OPEN", "PART"] }, schoolId: W.id }, select: { id: true, netPaise: true, paidPaise: true, label: true } });
    const examDue = due.filter((d: Any) => !/semester/i.test(d.label));
    const amount = examDue.reduce((a: number, d: Any) => a + d.netPaise - d.paidPaise, 0);
    if (amount >= 100) await step("ACCOUNTS", "fees.recordCounterPayment (exam fee)", () => L.payments.recordCounterPayment(W.accounts.ctx, { studentMembershipId: f.studentMembershipId, amountPaise: amount, method: "CASH", reference: null, note: null, demandIds: examDue.map((d: Any) => d.id), clientId: `lcc-exam-${sessionId}-${f.studentMembershipId}`, paidAtKey: null } as never, now()));
  }
  // An autonomous college sets, seals, moderates and seats its own papers before the sitting.
  if (SPEC.autonomous) await conductBefore(W, y, which, sessionId);
  setClock(which === "odd" ? `${y}-11-20` : `${y + 1}-04-20`, 9);
  await step("EXAM_CONTROLLER", "examCell.setSessionStatus CONDUCT", () => L.cell.setSessionStatus(C.ctx, sessionId, "CONDUCT" as never));
  if (SPEC.autonomous) await conductDuring(W, sessionId);

  // The university's result file: PRN, course, internal left blank (the HOD's lock is used), external. In even years one student fails one course in the odd session (an ATKT and a backlog).
  // An autonomous college enters the same external marks itself, twice: the controller, then the registrar (double entry).
  setClock(which === "odd" ? `${y}-12-10` : `${y + 1}-05-08`, 11);
  const approved = await dbx.examForm.findMany({ where: { sessionId, status: "APPROVED" }, select: { studentMembershipId: true, coursesJson: true } });
  const lines = ["PRN,SEAT_NO,COURSE_CODE,INTERNAL,EXTERNAL"];
  const byCourse = new Map<string, { studentMembershipId: string; marks: number; absent: boolean }[]>();
  let failer: string | null = null;
  for (const [j, f] of approved.entries()) {
    const rec = await dbx.pupilRecord.findUnique({ where: { studentMembershipId: f.studentMembershipId }, select: { prn: true } });
    for (const c of JSON.parse(f.coursesJson) as { courseId: string; kind: string }[]) {
      const code = [...W.courses.values()].find((x) => x.id === c.courseId)?.code ?? "?";
      const fail = which === "odd" && idx % 2 === 0 && j === 0 && c.kind === "REGULAR" && code.endsWith("01") && failer === null;
      if (fail) failer = f.studentMembershipId;
      const external = fail ? 12 : 30 + ((j * 7 + code.charCodeAt(4)) % 26);
      lines.push(`${rec?.prn ?? ""},,${code},,${external}`);
      byCourse.set(c.courseId, [...(byCourse.get(c.courseId) ?? []), { studentMembershipId: f.studentMembershipId, marks: external, absent: false }]);
    }
  }
  if (SPEC.autonomous) {
    for (const [courseId, entries] of byCourse) {
      await step("EXAM_CONTROLLER", "examCellMarks.enterMarks (first entry)", () => L.cellMarks.enterMarks(C.ctx, sessionId, { courseId, entries }));
      const second = await step("ADMIN", "examCellMarks.enterMarks (second entry)", () => L.cellMarks.enterMarks(W.registrar.ctx, sessionId, { courseId, entries }));
      if (second && (second.mismatched || second.pending)) noteBreak("ADMIN", "examCellMarks.enterMarks (second entry)", `the same marks entered twice left ${second.mismatched} mismatched and ${second.pending} pending of ${entries.length}`);
    }
  } else {
    const imp = await step("EXAM_CONTROLLER", "examCellMarks.importMarks", () => L.cellMarks.importMarks(C.ctx, sessionId, lines.join("\n")));
    if (imp && imp.unmatched.length) noteBreak("EXAM_CONTROLLER", "examCellMarks.importMarks unmatched", JSON.stringify(imp.unmatched.slice(0, 2)));
  }
  const run = await step("EXAM_CONTROLLER", "examCellMarks.runResults", () => L.cellMarks.runResults(C.ctx, sessionId));
  const draft = await dbx.resultRun.findFirst({ where: { sessionId, status: "DRAFT" }, select: { id: true } });
  if (run && draft) await step("EXAM_CONTROLLER", "examCellMarks.publishRun", () => L.cellMarks.publishRun(C.ctx, sessionId, draft.id));
  else if (run) noteBreak("EXAM_CONTROLLER", "examCellMarks.runResults", `no DRAFT run after ${JSON.stringify(run).slice(0, 200)}`);
  if (failer) {
    const bl = await dbx.backlog.findMany({ where: { studentMembershipId: failer, status: "OPEN" } }).catch(() => []);
    if (!bl.length) noteBreak("EXAM_CONTROLLER", "examCellMarks.publishRun backlog", "a failed course opened no backlog");
  }
  // Grade cards for everyone examined.
  setClock(which === "odd" ? `${y}-12-14` : `${y + 1}-05-12`, 11);
  for (const f of approved) await step("EXAM_CONTROLLER", "examCellAfter.issueDocument GRADE_CARD", () => L.cellAfter.issueDocument(C.ctx, { kind: "GRADE_CARD", studentMembershipId: f.studentMembershipId }));
  // A revaluation every other year (odd sessions of odd-indexed years): asked, changed, re-run, re-published.
  if (which === "odd" && idx % 2 === 1 && approved[1]) {
    setClock(`${y}-12-16`, 11);
    const who = approved[1].studentMembershipId;
    const courseId = (JSON.parse(approved[1].coursesJson) as { courseId: string }[])[0]!.courseId;
    const stu = await asMember(who);
    const ask = await step("STUDENT", "examCellAfter.askRevaluation", () => L.cellAfter.askRevaluation(stu.ctx, { sessionId, courseId, kind: "REVAL" } as never));
    const askId = (ask as Any)?.id ?? (await dbx.revaluation.findFirst({ where: { sessionId, studentMembershipId: who }, select: { id: true } }).catch(() => null))?.id;
    if (askId) {
      // The fee the ask raised, paid; then the controller's decision a few days later.
      const due = await dbx.feeDemand.findMany({ where: { studentMembershipId: who, status: { in: ["OPEN", "PART"] } }, select: { id: true, netPaise: true, paidPaise: true } });
      const amt = due.reduce((a: number, d: Any) => a + d.netPaise - d.paidPaise, 0);
      if (amt >= 100) await step("ACCOUNTS", "fees.recordCounterPayment (reval fee)", () => L.payments.recordCounterPayment(W.accounts.ctx, { studentMembershipId: who, amountPaise: amt, method: "CASH", reference: null, note: null, demandIds: due.map((d: Any) => d.id), clientId: `lcc-reval-${askId}`, paidAtKey: null } as never, now()));
      setClock(`${y}-12-20`, 11);
      const mark = await dbx.examMark.findFirst({ where: { sessionId, studentMembershipId: who, courseId }, orderBy: { version: "desc" }, select: { externalMilli: true } });
      const newExt = Math.min(60, Math.round((mark?.externalMilli ?? 30_000) / 1000) + 4);
      await step("EXAM_CONTROLLER", "examCellAfter.decideRevaluation", () => L.cellAfter.decideRevaluation(C.ctx, askId, { outcome: "CHANGED", marks: newExt, note: "Re-totalled." } as never));
      const rerun = await step("EXAM_CONTROLLER", "examCellMarks.runResults (after revaluation)", () => L.cellMarks.runResults(C.ctx, sessionId, "Revaluation changed a mark."));
      const d2 = await dbx.resultRun.findFirst({ where: { sessionId, status: "DRAFT" }, select: { id: true } });
      // A run after the first publication is the principal's to publish, the second signatory (campaign S-10).
      if (rerun && d2) await step("PRINCIPAL", "examCellMarks.publishRun (after revaluation)", () => L.cellMarks.publishRun(W.principal.ctx, sessionId, d2.id));
    }
  }
}

async function birthdayCheck(W: CollegeWorld, y: number) {
  // Year 1's seventeen-year-old: born 15 January, eighteen on 15 January of the first even term.
  const birthday = `${y + 1}-01-15`;
  const m = await dbx.membership.findFirst({ where: { schoolId: W.id, role: "STUDENT", user: { email: MAIL(`c.minor${y}`) } }, select: { id: true, userId: true, user: { select: { birthdate: true } } } });
  if (!m || !W.guardianUserId) {
    noteBreak("SYSTEM", "birthday check", "the minor or the guardian is missing");
    return;
  }
  const sees = () => L.consent.parentMaySee(m.id, "RESULTS" as never);
  const refresh = () => L.birthdate.refreshMinority(now(), { userIds: [m.userId] });
  const out: Record<string, boolean> = {};
  setClock(addDays(birthday, -1), 3, 45);
  await refresh();
  out.dayBefore = await sees();
  // accounts:tidy runs at 03:45 in the process's zone (TZ=Asia/Kolkata in fly.toml): the birthday's run.
  setClock(birthday, 3, 45);
  await refresh();
  out.birthday0345 = await sees();
  setClock(birthday, 23, 0);
  out.birthday2300 = await sees();
  setClock(addDays(birthday, 1), 3, 45);
  await refresh();
  out.nextDay0345 = await sees();
  note(`18th birthday ${birthday}: guardian may see RESULTS — day before ${out.dayBefore}, birthday 03:45 IST run ${out.birthday0345}, birthday 23:00 ${out.birthday2300}, next day 03:45 run ${out.nextDay0345}`);
  if (out.birthday0345 || out.birthday2300) noteBreak("PARENT", "student consent at the 18th birthday", `the guardian still sees the results on the birthday (03:45 IST tidy: ${out.birthday0345}, 23:00: ${out.birthday2300}); the view ends ${out.nextDay0345 ? "later still" : "only at the next day's 03:45 run"}`);
  if (!out.dayBefore) noteBreak("PARENT", "student consent the day before 18", "the guardian lost the view before the birthday");
  // The student grants RESULTS: the guardian sees results and still not money.
  setClock(addDays(birthday, 2), 12);
  const stu = await asMember(m.id);
  stu.ctx.user.isMinor = false;
  await step("STUDENT", "consent.setStudentConsent", () => L.consent.setStudentConsent(stu.ctx, "RESULTS" as never, true));
  const results = await sees();
  const money = await L.consent.parentMaySee(m.id, "MONEY" as never);
  if (!results || money) noteBreak("STUDENT", "consent.setStudentConsent", `after granting RESULTS: results ${results}, money ${money}`);
  else note("after the grant: the guardian sees RESULTS and not MONEY");
}

async function placementYear(W: CollegeWorld, y: number) {
  const T = W.tpo;
  setClock(`${y}-08-01`, 11);
  await step("TPO", "placement.savePlacementSettings", () => L.placement.savePlacementSettings(T.ctx, { seasonBatchYear: y + 1, dreamRatio: 1.5, allowGenderRule: false } as never));
  // The company, once: a GSTIN built with its check character.
  let company = await dbx.company.findFirst({ where: { name: SPEC.company.name }, select: { id: true, verifiedAt: true } }).catch(() => null);
  if (!company) {
    const first14 = SPEC.company.first14;
    const identifier = first14 + L.contracts.gstinCheckChar(first14);
    const made = await step("TPO", "placement.addCompany", () => L.placement.addCompany(T.ctx, { name: SPEC.company.name, identifier, sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ HR desk, hr@lifecycle.example.test" } as never));
    const id = (made as Any)?.id ?? (made as Any)?.companyId;
    if (id) await step("TPO", "placement.verifyCompany", () => L.placement.verifyCompany(T.ctx, id));
    company = id ? { id } : null;
  }
  if (!company) return;
  setClock(`${y}-09-01`, 11);
  if (!(await seatsOf(W)).some((x) => x.yearOfStudy === FINAL_YEAR)) {
    note(`no final-year students yet (the college's first intake was ${FIRST_YEAR}): no drive for batch ${y + 1}`);
    return internshipYear(W, y);
  }
  const drive = await step("TPO", "placement.openDrive", () => L.placement.openDrive(T.ctx, { companyId: company!.id, requirementId: null, kind: "ON_CAMPUS", title: `ZZ Graduate analyst ${y + 1}`, jd: "Analysts for the data team.", packageMinRupees: 400_000, packageMaxRupees: 600_000, bond: "", rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: null }], schedule: [], venues: "Seminar hall", rule: { cgpaMin: null, noLiveBacklogs: false, programmeIds: [], batchYear: y + 1, genders: [] }, poolSchoolIds: [] } as never));
  const driveId = (drive as Any)?.id;
  if (!driveId) return;
  await step("TPO", "placement.updateDrive OPEN", () => L.placement.updateDrive(T.ctx, driveId, { status: "OPEN" } as never));
  const invited = await step("TPO", "placement.inviteEligible", () => L.placement.inviteEligible(T.ctx, driveId));
  if (invited && (invited as Any).eligible === 0) noteBreak("TPO", "placement.inviteEligible", `no eligible student for batch ${y + 1}`);
  setClock(`${y}-09-05`, 11);
  const ty = (await seatsOf(W)).filter((x) => x.yearOfStudy === FINAL_YEAR);
  const applied: string[] = [];
  for (const st of ty.slice(0, 4)) {
    const stu = await asMember(st.membershipId);
    await step("STUDENT", "placement.saveMyProfile", () => L.placement.saveMyProfile(stu.ctx, { skills: ["Excel", "SQL"], certifications: [], projects: [], optedOut: false, higherStudies: false, entrepreneur: false } as never));
    const a = await step("STUDENT", "placement.applyToDrive", () => L.placement.applyToDrive(stu.ctx, driveId));
    if (a) applied.push(st.membershipId);
  }
  if (!applied.length) return;
  setClock(`${y}-09-20`, 11);
  const actor = await step("TPO", "placement.cellActor", () => L.placement.cellActor(T.ctx, driveId));
  if (!actor) return;
  await step("TPO", "placement.recordRoundResults r0", () => L.placement.recordRoundResults(actor, { round: 0, results: applied.map((id, j) => ({ studentMembershipId: id, outcome: j < 3 ? "PASSED" : "REJECTED", feedback: null, feedbackShared: false })) } as never));
  setClock(`${y}-10-01`, 11);
  await step("TPO", "placement.recordRoundResults r1", () => L.placement.recordRoundResults(actor, { round: 1, results: applied.slice(0, 3).map((id, j) => ({ studentMembershipId: id, outcome: j < 2 ? "PASSED" : "REJECTED", feedback: null, feedbackShared: false })) } as never));
  setClock(`${y}-10-05`, 11);
  for (const id of applied.slice(0, 2)) {
    const offer = await step("TPO", "placement.recordOffer", () => L.placement.recordOffer(actor, { studentMembershipId: id, packageRupees: 500_000, letterFileId: null } as never));
    const offerId = (offer as Any)?.id;
    if (!offerId) continue;
    const stu = await asMember(id);
    await step("STUDENT", "placement.answerOffer", () => L.placement.answerOffer(stu.ctx, offerId, true));
  }
  setClock(`${y}-10-15`, 11);
  await step("TPO", "placement.updateDrive CLOSED", () => L.placement.updateDrive(T.ctx, driveId, { status: "CLOSED" } as never));
  return internshipYear(W, y);
}

async function internshipYear(W: CollegeWorld, y: number) {
  // An internship for a second-year student after semester 4 (proposed and done inside this academic year's summer).
  const sy = (await seatsOf(W)).find((x) => x.yearOfStudy === 2);
  if (!sy) return;
  const stu = await asMember(sy.membershipId);
  setClock(`${y + 1}-04-20`, 11);
  const prop = await step("STUDENT", "internships.proposeInternship", () => L.internships.proposeInternship(stu.ctx, { companyName: "ZZ Lifecycle Analytics", kind: "INDUSTRY", from: `${y + 1}-05-02`, to: `${y + 1}-05-20`, hours: 120, windowSemester: 4, supervisorName: "ZZ Supervisor" } as never));
  const iid = (prop as Any)?.id;
  if (!iid) return;
  const hod = W.hod[W.programmes[sy.programme]!.dept]!;
  const fac = teachersOf(W, sy.programme, 0).teacher;
  await step("HOD", "internships.decideInternship", () => L.internships.decideInternship(hod.ctx, iid, { approve: true, facultyMembershipId: fac.membershipId, reason: "" } as never));
  setClock(`${y + 1}-05-10`, 18);
  await step("STUDENT", "internships.addDiaryEntry", () => L.internships.addDiaryEntry(stu.ctx, iid, { on: `${y + 1}-05-10`, hours: 8, text: "Cleaned a sales data set." } as never));
  setClock(`${y + 1}-05-21`, 11);
  await step("STUDENT", "internships.attachInternshipFile", () => L.internships.attachInternshipFile(stu.ctx, iid, { kind: "REPORT", fileId: null }, { storedFileId: `zzlc-report-${iid}` }));
  await step(fac.ctx.role!, "internships.evaluateInternship (grade)", () => L.internships.evaluateInternship(fac.ctx, iid, { industryGrade: "A", vivaMarks: 40, facultyVisitOn: `${y + 1}-05-15` } as never));
  await step("HOD", "internships.evaluateInternship (credits)", () => L.internships.evaluateInternship(hod.ctx, iid, { credits: 2 } as never));
}

async function iqacYear(W: CollegeWorld, y: number, idx: number) {
  const Q = W.iqac;
  // A five-year cycle, opened in year 1 and every five years after.
  let cycle = await dbx.accreditationCycle.findFirst({ where: { schoolId: W.id, status: "OPEN" }, select: { id: true, windowTo: true } });
  if (cycle && String(cycle.windowTo instanceof RealDate ? cycle.windowTo.toISOString() : cycle.windowTo).slice(0, 10) < `${y}-06-01`) {
    await step("IQAC", "iqac.closeCycle", () => L.iqac.closeCycle(Q.ctx, cycle!.id));
    cycle = null;
  }
  if (!cycle) {
    const from = `${FIRST_YEAR + Math.floor(idx / 5) * 5}-06-01`;
    const to = `${FIRST_YEAR + Math.floor(idx / 5) * 5 + 5}-05-31`;
    await step("IQAC", "iqac.openCycle", () => L.iqac.openCycle(Q.ctx, { windowFrom: from, windowTo: to }));
    cycle = await dbx.accreditationCycle.findFirst({ where: { schoolId: W.id, status: "OPEN" }, select: { id: true, windowTo: true } });
  }
  if (!cycle) return;
  await step("SYSTEM", "iqac.recomputeAsSystem", () => L.iqac.recomputeAsSystem(W.id, cycle!.id, Q.userId, now()));
  const listed = await step("IQAC", "iqacFilings.generateFiling AQAR", () => L.iqacFilings.generateFiling(Q.ctx, { kind: "AQAR", year: y, cycleId: cycle!.id } as never));
  if (!listed) return;
  const fid = (await dbx.collegeFiling.findFirst({ where: { schoolId: W.id, kind: "AQAR", year: y }, orderBy: { generatedAt: "desc" }, select: { id: true } }))?.id;
  if (!fid) return noteBreak("IQAC", "iqacFilings.generateFiling AQAR", "no filing row after generating");
  await step("IQAC", "iqacFilings.submitFiling", () => L.iqacFilings.submitFiling(Q.ctx, fid));
  await step("PRINCIPAL", "iqacFilings.signOffFiling", () => L.iqacFilings.signOffFiling(W.principal.ctx, fid, { decision: "SIGN", note: "Signed." } as never));
  await step("IQAC", "iqacFilings.markFiled", () => L.iqacFilings.markFiled(Q.ctx, fid, null));
}

/* ========================================================================== */
/* THE PLATFORM: the operator, retention                                       */
/* ========================================================================== */

let operatorCache: Actor | null = null;
async function operatorActor(): Promise<Actor> {
  if (operatorCache) return operatorCache;
  const u = await person(MAIL("operator"), "ZZ Lifecycle Operator", { isSuperuser: true });
  operatorCache = await actorOf(u.id, null, null, null);
  return operatorCache;
}

const sweepAuditIds: string[] = [];
async function platformYear(y: number, idx: number) {
  TENANT = "platform";
  const op = await operatorActor();
  // The reminder a week before the renewal falls due: fixture schools are never reminded (isTestFixture: false in the query),
  // so for the length of the call the two tenants are not fixtures, scoped to themselves and to this operator.
  if (idx > 0) {
    setClock(`${y}-05-27`, 3, 45);
    await dbx.school.updateMany({ where: { id: { in: schoolIdsMine } }, data: { isTestFixture: false } });
    try {
      const r = await step("SYSTEM", "subscriptions.remindSubscriptions", () => L.subs.remindSubscriptions(now(), { schoolIds: schoolIdsMine, operatorIds: [op.userId] }));
      if (r && (r as Any).reminded !== schoolIdsMine.length) noteBreak("SYSTEM", "subscriptions.remindSubscriptions", `reminded ${(r as Any).reminded} of ${schoolIdsMine.length} due: ${JSON.stringify(r).slice(0, 200)}`);
    } finally {
      await dbx.school.updateMany({ where: { id: { in: schoolIdsMine } }, data: { isTestFixture: true } });
    }
    // The regulators' calendar for the college, scoped.
    await step("SYSTEM", "operatorCollege.remindRegulatorDeadlines", () => L.operatorCollege.remindRegulatorDeadlines(now(), { schoolIds: schoolIdsMine }));
  }
  setClock(`${y}-06-01`, 10);
  for (const sid of schoolIdsMine) {
    await step("OPERATOR", "subscriptions.setSubscription (renew)", () => L.subs.setSubscription(op.ctx, sid, { status: "ACTIVE", startsAt: `${y}-06-01`, dueAt: `${y + 1}-06-01`, invoicedAt: `${y}-05-20`, invoiceRef: `INV-${y}-${sid.slice(-4)}`, paidAt: `${y}-06-01`, paidRef: `UTR${y}${sid.slice(-4)}`, reason: "Annual renewal" } as never));
  }
}

async function retentionYear(y: number, users: string[]) {
  TENANT = "platform";
  setClock(`${y + 1}-05-31`, 4);
  const cfg = L.env.readRetentionConfig().config;
  // A scope on EVERY key: schoolIds alone narrows only the audit log, health reads and trip positions.
  const scope = { schoolIds: schoolIdsMine, userIds: users, buckets: ["zzlc:none"], outboxTo: MAIL("none"), jobs: ["zzlc:none"] };
  // Evidence, read only: what a sweep scoped by schoolIds alone would take — the scope passes the future-clock guard but narrows only three keys.
  if (y === FIRST_YEAR || y === FIRST_YEAR + YEARS - 1) {
    const preview = await L.retention.retentionPreview(now(), cfg, { schoolIds: schoolIdsMine });
    const real = await L.retention.retentionPreview(new RealDate(realNow()) as Date, cfg, { schoolIds: schoolIdsMine });
    note(`retentionPreview(${simKey}, scope {schoolIds} only) would take ${JSON.stringify(preview.pending)}; the same preview at the real clock: ${JSON.stringify(real.pending)}; sessions in the database now: ${await dbx.session.count()}`);
  }
  const t0 = now().getTime();
  const r = await step("SYSTEM", "retention.sweepExpired", () => L.retention.sweepExpired(now(), cfg, scope));
  // audit() stamps createdAt from the (simulated) clock, so the sweep's own row is found at the simulated instant.
  const mine = await dbx.auditLog.findMany({ where: { schoolId: null, action: "retention.sweep", createdAt: { gte: new RealDate(t0 - 1000), lte: new RealDate(now().getTime() + 1000) } }, select: { id: true, meta: true } });
  for (const a of mine) sweepAuditIds.push(a.id);
  writeFileSync(join(OUT, "sweep-audit-ids.json"), JSON.stringify(sweepAuditIds));
  return r?.summary ?? null;
}

/* ========================================================================== */
/* INVARIANTS                                                                  */
/* ========================================================================== */

type Invariant = { name: string; ok: boolean; detail: string };

async function invariants(S: SchoolWorld | null, C: CollegeWorld, y: number): Promise<Invariant[]> {
  const out: Invariant[] = [];
  const add = (name: string, failures: string[], detail = "") => out.push({ name, ok: failures.length === 0, detail: failures.length ? failures.slice(0, 5).join("; ") + (failures.length > 5 ? ` … (${failures.length})` : "") : detail });

  // 1. Every pupil on the roll is in exactly one live class (school) / one ACTIVE enrolment (college).
  // The engineering walk has no school: its checks are the college's alone.
  const tenants = [...(S ? [["school", S.id, true] as const] : []), ["college", C.id, false] as const];
  for (const [label, sid, archivedMatters] of tenants) {
    const active = await dbx.membership.findMany({ where: { schoolId: sid, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true, enrollments: { where: { status: "ACTIVE", ...(archivedMatters ? { class: { archivedAt: null } } : {}) }, select: { classId: true } } } });
    const bad = active.filter((m: Any) => m.enrollments.length !== 1).map((m: Any) => `${m.id} in ${m.enrollments.length}`);
    add(`${label}: every pupil on the roll in exactly one class`, bad, `${active.length} pupils`);
    const left = await dbx.membership.findMany({ where: { schoolId: sid, role: "STUDENT", leftAt: { not: null } }, select: { id: true, enrollments: { where: { status: "ACTIVE" }, select: { id: true } } } });
    add(`${label}: a leaver holds no live enrolment`, left.filter((m: Any) => m.enrollments.length).map((m: Any) => m.id), `${left.length} leavers`);
    // 2. Alumnus rows = leavers.
    const leavers = await dbx.membership.findMany({ where: { schoolId: sid, role: "STUDENT", leftAt: { not: null } }, select: { userId: true } });
    const alumni = await dbx.membership.findMany({ where: { schoolId: sid, role: "ALUMNUS", leftAt: null }, select: { userId: true } });
    const a = new Set(alumni.map((m: Any) => m.userId));
    const l = new Set(leavers.map((m: Any) => m.userId));
    add(`${label}: open alumnus rows = leavers`, [...[...l].filter((u) => !a.has(u)).map((u) => `leaver ${u} without alumnus`), ...[...a].filter((u) => !l.has(u)).map((u) => `alumnus ${u} not a leaver`)], `${l.size} leavers, ${a.size} alumni`);
  }

  // 3. Serials: per (school, prefix, year) 1..n, no gap, increasing with issue time.
  const serialFail: string[] = [];
  const certs = await dbx.issuedCertificate.findMany({ where: { schoolId: { in: schoolIdsMine } }, select: { schoolId: true, serial: true, number: true, issuedAt: true }, orderBy: [{ issuedAt: "asc" }, { number: "asc" }] });
  const groups = new Map<string, number[]>();
  for (const c of certs) {
    const key = `${c.schoolId}|${c.serial.split("/").slice(0, -1).join("/")}`;
    groups.set(key, [...(groups.get(key) ?? []), c.number]);
  }
  // The TC series is one register shared by the leaving records and the TC certificates (LIFECYCLE-6): read it whole below.
  for (const [k, ns] of groups) {
    if (k.split("|")[1]!.startsWith("TC/")) continue;
    const sorted = [...ns].sort((a, b) => a - b);
    if (sorted.some((n, i) => n !== i + 1)) serialFail.push(`certificates ${k}: ${sorted.join(",")}`);
    if (ns.some((n, i) => i > 0 && n < ns[i - 1]!)) serialFail.push(`certificates ${k} not increasing in issue order: ${ns.join(",")}`);
  }
  // Closed records (readmission, an undone departure) keep their numbers (LIFECYCLE-7), so they are read too.
  const recs = await dbx.schoolRecord.findMany({ where: { schoolId: { in: schoolIdsMine }, serial: { not: null } }, select: { schoolId: true, serial: true, studentMembershipId: true, formerMembershipId: true } });
  const recGroups = new Map<string, Set<number>>();
  const holder = new Map<string, string>();
  for (const r of recs) {
    const parts = r.serial.split("/");
    const key = `${r.schoolId}|${parts.slice(0, -1).join("/")}`;
    recGroups.set(key, (recGroups.get(key) ?? new Set()).add(Number(parts.at(-1))));
    holder.set(`${r.schoolId}|${r.serial}`, r.studentMembershipId ?? r.formerMembershipId);
  }
  const tcCerts = await dbx.issuedCertificate.findMany({ where: { schoolId: { in: schoolIdsMine }, serial: { startsWith: "TC/" } }, select: { schoolId: true, serial: true, studentMembershipId: true } });
  for (const c of tcCerts) {
    const parts = c.serial.split("/");
    const key = `${c.schoolId}|${parts.slice(0, -1).join("/")}`;
    recGroups.set(key, (recGroups.get(key) ?? new Set()).add(Number(parts.at(-1))));
    const other = holder.get(`${c.schoolId}|${c.serial}`);
    if (other && other !== c.studentMembershipId) serialFail.push(`TC register: ${c.serial} on a leaving record and a certificate of two pupils`);
  }
  for (const [k, set] of recGroups) {
    const sorted = [...set].sort((a, b) => a - b);
    if (sorted.some((n, i) => n !== i + 1)) serialFail.push(`TC register ${k}: ${sorted.join(",")}`);
  }
  const docs = await dbx.examDocument.findMany({ where: { schoolId: C.id }, select: { kind: true, yearLabel: true, number: true } }).catch(() => []);
  const docGroups = new Map<string, number[]>();
  for (const d of docs) docGroups.set(`${d.kind}|${d.yearLabel}`, [...(docGroups.get(`${d.kind}|${d.yearLabel}`) ?? []), d.number]);
  for (const [k, ns] of docGroups) {
    const sorted = [...ns].sort((a, b) => a - b);
    if (sorted.some((n, i) => n !== i + 1)) serialFail.push(`exam documents ${k}: ${sorted.slice(0, 10).join(",")}…`);
  }
  const receipts = await dbx.feeReceipt.findMany({ where: { schoolId: { in: schoolIdsMine } }, select: { schoolId: true, academicYearId: true, number: true } });
  const rGroups = new Map<string, number[]>();
  for (const r of receipts) rGroups.set(`${r.schoolId}|${r.academicYearId}`, [...(rGroups.get(`${r.schoolId}|${r.academicYearId}`) ?? []), r.number]);
  for (const [k, ns] of rGroups) {
    const sorted = [...ns].sort((a, b) => a - b);
    if (sorted.some((n, i) => n !== i + 1)) serialFail.push(`fee receipts ${k}: gaps in ${sorted.length} numbers (first ${sorted.slice(0, 5).join(",")}, max ${sorted.at(-1)})`);
  }
  add("serials: certificates, leaving records, grade cards and receipts run 1..n per year with no gap", serialFail, `${certs.length} certificates, ${recs.length} leaving records, ${docs.length} exam documents, ${receipts.length} receipts`);

  // 4. Ledgers: demand net = gross − concession; paid = Σ allocations; payments = Σ allocations; the library's ledger agrees.
  const ledgerFail: string[] = [];
  const demands = await dbx.feeDemand.findMany({ where: { schoolId: { in: schoolIdsMine } }, select: { id: true, schoolId: true, studentMembershipId: true, academicYearId: true, grossPaise: true, concessionPaise: true, netPaise: true, paidPaise: true, status: true, allocations: { select: { amountPaise: true, payment: { select: { status: true } } } } } });
  for (const d of demands) {
    if (d.status === "CANCELLED" || d.status === "CARRIED") continue;
    if (d.netPaise !== d.grossPaise - d.concessionPaise) ledgerFail.push(`demand ${d.id}: net ${d.netPaise} ≠ gross ${d.grossPaise} − concession ${d.concessionPaise}`);
    const alloc = d.allocations.filter((a: Any) => a.payment.status === "PAID").reduce((a: number, x: Any) => a + x.amountPaise, 0);
    if (alloc !== d.paidPaise) ledgerFail.push(`demand ${d.id}: paid ${d.paidPaise} ≠ allocations ${alloc}`);
    const want = d.paidPaise >= d.netPaise ? "PAID" : d.paidPaise > 0 ? "PART" : "OPEN";
    if (d.status !== want && !(d.netPaise === 0 && d.status === "PAID")) ledgerFail.push(`demand ${d.id}: status ${d.status}, paid ${d.paidPaise} of ${d.netPaise}`);
  }
  const pays = await dbx.feePayment.findMany({ where: { schoolId: { in: schoolIdsMine }, status: "PAID" }, select: { id: true, amountPaise: true, allocations: { select: { amountPaise: true } } } });
  for (const p of pays) {
    const alloc = p.allocations.reduce((a: number, x: Any) => a + x.amountPaise, 0);
    if (alloc !== p.amountPaise) ledgerFail.push(`payment ${p.id}: ${p.amountPaise} paid, ${alloc} allocated`);
  }
  // The library function's figure against the rows, for every college student this year (demands − receipts − scholarship receivable).
  const cy = await dbx.academicYear.findFirst({ where: { schoolId: C.id, name: yearName(y) }, select: { id: true } });
  if (cy) {
    for (const st of await dbx.membership.findMany({ where: { schoolId: C.id, role: "STUDENT" }, select: { id: true } })) {
      const led = (await L.cfees.ledgerFor(st.id, cy.id)) as Any;
      const mine = demands.filter((d: Any) => d.studentMembershipId === st.id && d.academicYearId === cy.id && (d.status === "OPEN" || d.status === "PART"));
      const outstanding = mine.reduce((a: number, d: Any) => a + Math.max(0, d.netPaise - d.paidPaise), 0);
      // The state's share still to come: an applied claim's expected amount, a sanctioned claim's sanction less what was disbursed.
      const claims = await dbx.scholarshipClaim.findMany({ where: { studentMembershipId: st.id, academicYear: yearKey(y) }, select: { status: true, expectedPaise: true, sanctionedPaise: true, disbursedPaise: true } });
      const pool = claims.reduce((a: number, c: Any) => a + (c.status === "APPLIED" ? c.expectedPaise : c.status === "SANCTIONED" ? Math.max(0, (c.sanctionedPaise ?? 0) - (c.disbursedPaise ?? 0)) : 0), 0);
      const want = Math.max(0, outstanding - pool);
      if (led.totals.netDuePaise !== want) ledgerFail.push(`college ledger ${st.id}: ledgerFor netDue ${led.totals.netDuePaise}, rows ${outstanding} − receivable ${pool} = ${want}`);
    }
  }
  const sy = S ? await dbx.academicYear.findFirst({ where: { schoolId: S.id, name: yearName(y) }, select: { id: true } }) : null;
  if (S && sy) {
    const today = L.dates.todayKey("Asia/Kolkata");
    for (const st of await dbx.membership.findMany({ where: { schoolId: S.id, role: "STUDENT" }, select: { id: true } })) {
      const led = (await L.fees.pupilLedger(S.id, st.id, { academicYearId: sy.id, todayKey: today })) as Any;
      const mine = demands.filter((d: Any) => d.studentMembershipId === st.id && d.academicYearId === sy.id && (d.status === "OPEN" || d.status === "PART"));
      const outstanding = mine.reduce((a: number, d: Any) => a + Math.max(0, d.netPaise - d.paidPaise), 0);
      const got = led?.totals?.outstandingPaise;
      if (got !== undefined && got !== outstanding) ledgerFail.push(`school ledger ${st.id}: pupilLedger ${got}, rows ${outstanding}`);
    }
  }
  add("fee ledgers: net = gross − concession, paid = receipts allocated, the ledger functions agree with the rows", ledgerFail, `${demands.length} demands, ${pays.length} payments`);

  // 5. Payroll: every locked run's digest still matches its slips, and the digest taken at the lock.
  const runs = await dbx.payrollRun.findMany({ where: { schoolId: { in: schoolIdsMine }, status: "LOCKED" }, select: { id: true, month: true, lockDigest: true, slips: true } });
  const payFail: string[] = [];
  for (const r of runs) {
    const digest = L.payrollRules.slipDigest(r.slips);
    if (digest !== r.lockDigest) payFail.push(`${r.month}: stored ${String(r.lockDigest).slice(0, 8)} recomputed ${digest.slice(0, 8)}`);
    const atLock = lockedDigests.get(r.id);
    if (atLock && atLock !== r.lockDigest) payFail.push(`${r.month}: digest changed since the lock`);
  }
  add("payroll: locked runs unchanged by hash", payFail, `${runs.length} locked runs`);

  // 6. Internal locks: the stored totals are the marks × weights.
  const locks = await dbx.internalLock.findMany({ where: { schoolId: C.id }, select: { offeringId: true, totalsJson: true, offering: { select: { registrations: { where: { status: "REGISTERED" }, select: { studentMembershipId: true } } } } } });
  const lockFail: string[] = [];
  for (const l of locks) {
    const components = await dbx.internalComponent.findMany({ where: { offeringId: l.offeringId }, select: { id: true, maxMarks: true, weight: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
    const want = L.assessment.lockTotals(components, l.offering.registrations.map((r: Any) => r.studentMembershipId));
    const got = JSON.parse(l.totalsJson) as { studentMembershipId: string; totalHundredths: number }[];
    for (const w of want) {
      const g = got.find((x) => x.studentMembershipId === w.studentMembershipId);
      if (!g || g.totalHundredths !== w.totalHundredths) lockFail.push(`${l.offeringId}/${w.studentMembershipId}: stored ${g?.totalHundredths} marks give ${w.totalHundredths}`);
    }
  }
  add("internal locks: totals = marks", lockFail, `${locks.length} locks`);

  // 7. SGPA: every term result recomputed from its course results.
  const results = await dbx.termResult.findMany({ where: { schoolId: C.id }, select: { id: true, runId: true, studentMembershipId: true, sgpaHundredths: true } });
  const courseRows = await dbx.courseResult.findMany({ where: { schoolId: C.id }, select: { runId: true, studentMembershipId: true, kind: true, creditsTenths: true, pointsTenths: true } });
  const sgpaFail: string[] = [];
  for (const r of results) {
    const courses = courseRows.filter((c: Any) => c.runId === r.runId && c.studentMembershipId === r.studentMembershipId);
    const regular = courses.filter((c: Any) => c.kind === "REGULAR");
    const rows = regular.length ? regular : courses;
    const want = rows.length ? L.cellRules.sgpaHundredths(rows) : null;
    if (want !== null && want !== r.sgpaHundredths) sgpaFail.push(`${r.id}: stored ${r.sgpaHundredths}, courses give ${want}`);
  }
  add("term results: SGPA = recomputation", sgpaFail, `${results.length} term results`);

  // 8. No row of either tenant references the other (every single-column foreign key between tenant tables).
  const cross = await crossTenantRefs();
  add("tenancy: no row of either tenant references the other's rows", cross, "every FK between tenant tables checked");

  // 9. The register of year 1 is still readable through the year archive.
  const first = S ? await dbx.academicYear.findFirst({ where: { schoolId: S.id, name: yearName(FIRST_YEAR), closedAt: { not: null } }, select: { id: true } }) : null;
  if (S && first) {
    const arc = await L.archive.schoolYearArchive(S.admin.ctx, first.id);
    const raw = await dbx.attendanceRecord.count({ where: { schoolId: S.id, session: { dateKey: { gte: `${FIRST_YEAR}-06-01`, lte: `${FIRST_YEAR + 1}-04-30` } } } });
    baselineYear1 ??= raw;
    add("archive: year 1's register read in this year equals its rows (and the rows of year 1 never shrink)", arc.attendance.marked === raw && raw === baselineYear1 ? [] : [`archive ${arc.attendance.marked}, rows ${raw}, at year 1 ${baselineYear1}`], `${raw} marks`);
  }

  // 10. Engineering: a LAB hour's marks are its batch's students only; every practical row is signed; every paper sealed, moderated and opened once.
  if (SPEC.labs) {
    const stray = (await dbx.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "LectureAttendance" a JOIN "Lecture" l ON l.id = a."lectureId" WHERE l."schoolId" = $1 AND l."labBatchId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "LabBatchMember" m WHERE m."batchId" = l."labBatchId" AND m."studentMembershipId" = a."studentMembershipId")`, C.id)) as { n: number }[];
    const batchMarks = (await dbx.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "LectureAttendance" a JOIN "Lecture" l ON l.id = a."lectureId" WHERE l."schoolId" = $1 AND l."labBatchId" IS NOT NULL`, C.id)) as { n: number }[];
    add("labs: a batch's LAB hour holds marks of the batch's students only", stray[0]!.n ? [`${stray[0]!.n} mark(s) of students outside the lecture's batch`] : [], `${batchMarks[0]!.n} batch marks`);
    const unsigned = await dbx.practicalRecord.count({ where: { schoolId: C.id, signedAt: null } });
    const records = await dbx.practicalRecord.count({ where: { schoolId: C.id } });
    add("practical record: every row signed", unsigned ? [`${unsigned} of ${records} rows unsigned`] : [], `${records} rows`);
  }
  if (SPEC.autonomous) {
    const papers = await dbx.questionPaper.findMany({ where: { schoolId: C.id }, select: { status: true, sealedBody: true, accessLogJson: true, schedule: { select: { courseCode: true, session: { select: { name: true } } } } } });
    const bad = L.secretBox.sealingAvailable() ? papers.filter((p: Any) => p.status !== "MODERATED" || !p.sealedBody || JSON.parse(p.accessLogJson || "[]").length !== 1).map((p: Any) => `${p.schedule.session.name} ${p.schedule.courseCode}: ${p.status}, sealed ${Boolean(p.sealedBody)}, opened ${JSON.parse(p.accessLogJson || "[]").length}`) : [];
    add("papers: every paper sealed, moderated and opened exactly once", bad, `${papers.length} papers`);
  }
  return out;
}
let baselineYear1: number | null = null;

let FK_PAIRS: { child: string; column: string; parent: string }[] = [];
async function crossTenantRefs(): Promise<string[]> {
  if (!FK_PAIRS.length) {
    FK_PAIRS = (await dbx.$queryRawUnsafe(`
      SELECT tc.relname AS child, a.attname AS "column", pc.relname AS parent
      FROM pg_constraint c
      JOIN pg_class tc ON tc.oid = c.conrelid JOIN pg_class pc ON pc.oid = c.confrelid
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f' AND array_length(c.conkey, 1) = 1 AND c.connamespace = 'public'::regnamespace
        AND EXISTS (SELECT 1 FROM information_schema.columns x WHERE x.table_schema='public' AND x.table_name = tc.relname AND x.column_name = 'schoolId')
        AND EXISTS (SELECT 1 FROM information_schema.columns x WHERE x.table_schema='public' AND x.table_name = pc.relname AND x.column_name = 'schoolId')`)) as { child: string; column: string; parent: string }[];
  }
  const fails: string[] = [];
  for (const fk of FK_PAIRS) {
    if (fk.column === "schoolId") continue;
    const rows = (await dbx.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${fk.child}" c JOIN "${fk.parent}" p ON p.id = c."${fk.column}" WHERE (c."schoolId" = ANY($1::text[]) OR p."schoolId" = ANY($1::text[])) AND c."schoolId" IS DISTINCT FROM p."schoolId"`, schoolIdsMine)) as { n: number }[];
    if (rows[0]!.n > 0) fails.push(`${fk.child}.${fk.column} → ${fk.parent}: ${rows[0]!.n}`);
  }
  return fails;
}

/** Row counts of every tenant table for the two tenants. */
async function tableCounts(): Promise<Record<string, number>> {
  const tables = (await dbx.$queryRawUnsafe(`SELECT table_name AS t FROM information_schema.columns WHERE table_schema='public' AND column_name='schoolId' ORDER BY 1`)) as { t: string }[];
  const out: Record<string, number> = {};
  for (const { t } of tables) {
    const r = (await dbx.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${t}" WHERE "schoolId" = ANY($1::text[])`, schoolIdsMine)) as { n: number }[];
    if (r[0]!.n) out[t] = r[0]!.n;
  }
  return out;
}

/* ========================================================================== */
/* data:audit, scoped                                                          */
/* ========================================================================== */

function runAudit(label: string): { fail: number; warn: number; info: number; seconds: number; ok: boolean; file: string } {
  const docs = resolve(process.cwd(), "../../docs/data-audit");
  const t0 = realNow();
  let ok = true;
  try {
    execFileSync("npx", ["vitest", "run", "tests/data-audit.test.ts", "tests/data-audit-reports.test.ts"], { env: { ...process.env, DATA_AUDIT: "1", DATA_AUDIT_SCHOOLS: SLUGS.join(",") }, stdio: ["ignore", "pipe", "pipe"], timeout: 15 * 60_000 });
  } catch {
    ok = false;
  }
  const latest = existsSync(join(docs, "latest.md")) ? readFileSync(join(docs, "latest.md"), "utf8") : "";
  const m = /(\d+) FAIL · (\d+) WARN · (\d+) INFO/.exec(latest);
  const file = join(OUT, `audit-${label}.md`);
  writeFileSync(file, latest + "\n\n" + (existsSync(join(docs, "reports.md")) ? readFileSync(join(docs, "reports.md"), "utf8") : ""));
  return { fail: Number(m?.[1] ?? -1), warn: Number(m?.[2] ?? -1), info: Number(m?.[3] ?? -1), seconds: Math.round((realNow() - t0) / 1000), ok, file };
}

/* ========================================================================== */
/* TEARDOWN                                                                    */
/* ========================================================================== */

/** The walk's own accounts by email: zzlc.e.* for the engineering walk; zzlc.* but not zzlc.e.* for the school and the arts college. */
const WALK_ACCOUNTS = ENGINEERING ? { email: { startsWith: MAIL_PREFIX, endsWith: "@zz.test" } } : { email: { startsWith: MAIL_PREFIX, endsWith: "@zz.test" }, NOT: { email: { startsWith: "zzlc.e." } } };

async function teardown() {
  const schools = await dbx.school.findMany({ where: { slug: { in: SLUGS } }, select: { id: true, slug: true } });
  const ids = schools.map((s: Any) => s.id);
  // The people: anyone with a membership here and none elsewhere, the guardians of these pupils who have none elsewhere, and every zzlc. account.
  const members = await dbx.membership.findMany({ where: { schoolId: { in: ids } }, select: { userId: true } });
  const guardians = await dbx.guardianship.findMany({ where: { studentSchoolId: { in: ids } }, select: { parentUserId: true } });
  const named = await dbx.user.findMany({ where: WALK_ACCOUNTS, select: { id: true } });
  const candidates = [...new Set([...members.map((m: Any) => m.userId), ...guardians.map((g: Any) => g.parentUserId), ...named.map((u: Any) => u.id)])];
  const elsewhere = await dbx.membership.findMany({ where: { userId: { in: candidates }, schoolId: { notIn: ids } }, select: { userId: true } });
  const keep = new Set(elsewhere.map((m: Any) => m.userId));
  const users = candidates.filter((u) => !keep.has(u));
  const elsewhereGuard = await dbx.guardianship.findMany({ where: { parentUserId: { in: users }, studentSchoolId: { notIn: ids } }, select: { parentUserId: true } });
  for (const g of elsewhereGuard) keep.add(g.parentUserId);
  const doomed = users.filter((u) => !keep.has(u));
  if (keep.size) console.log(`  kept ${keep.size} account(s) that belong elsewhere too`);

  // Child tables first: the foreign-key graph among tenant tables, deepest first.
  const tables = ((await dbx.$queryRawUnsafe(`SELECT table_name AS t FROM information_schema.columns WHERE table_schema='public' AND column_name='schoolId'`)) as { t: string }[]).map((r) => r.t).filter((t) => t !== "School");
  const edges = (await dbx.$queryRawUnsafe(`SELECT tc.relname AS child, pc.relname AS parent FROM pg_constraint c JOIN pg_class tc ON tc.oid=c.conrelid JOIN pg_class pc ON pc.oid=c.confrelid WHERE c.contype='f' AND c.connamespace='public'::regnamespace AND tc.relname <> pc.relname`)) as { child: string; parent: string }[];
  const set = new Set(tables);
  const children = new Map<string, Set<string>>();
  for (const e of edges) if (set.has(e.child) && set.has(e.parent)) children.set(e.parent, new Set([...(children.get(e.parent) ?? []), e.child]));
  const order: string[] = [];
  const state = new Map<string, number>();
  const visit = (t: string) => {
    if (state.get(t) === 2) return;
    if (state.get(t) === 1) return; // a cycle: broken here
    state.set(t, 1);
    for (const c of children.get(t) ?? []) visit(c);
    state.set(t, 2);
    order.push(t);
  };
  for (const t of tables) visit(t);
  let deleted = 0;
  for (let pass = 0; pass < 3; pass += 1) {
    let left = 0;
    for (const t of order) {
      try {
        deleted += await dbx.$executeRawUnsafe(`DELETE FROM "${t}" WHERE "schoolId" = ANY($1::text[])`, ids);
      } catch (e) {
        left += 1;
        if (pass === 2) console.log(`  could not empty ${t}: ${errorText(e)}`);
      }
    }
    if (!left) break;
  }
  // Rows without a schoolId that point at these tenants or people.
  deleted += (await dbx.guardianship.deleteMany({ where: { OR: [{ studentSchoolId: { in: ids } }, { parentUserId: { in: doomed } }] } })).count;
  const company = await dbx.company.findMany({ where: { name: SPEC.company.name }, select: { id: true } }).catch(() => []);
  if (company.length) {
    await dbx.companyRecruiter.deleteMany({ where: { companyId: { in: company.map((c: Any) => c.id) } } }).catch(() => undefined);
    await dbx.requirement.deleteMany({ where: { companyId: { in: company.map((c: Any) => c.id) } } }).catch(() => undefined);
    deleted += (await dbx.company.deleteMany({ where: { id: { in: company.map((c: Any) => c.id) } } })).count;
  }
  if (doomed.length) {
    const emails = (await dbx.user.findMany({ where: { id: { in: doomed } }, select: { email: true } })).map((u: Any) => u.email).filter(Boolean);
    deleted += (await dbx.outboundEmail.deleteMany({ where: { to: { in: emails } } })).count;
    deleted += (await dbx.auditLog.deleteMany({ where: { schoolId: null, actorUserId: { in: doomed } } })).count;
    deleted += (await dbx.gigSlot.deleteMany({ where: { providerUserId: { in: doomed } } }).catch(() => ({ count: 0 }))).count;
  }
  // The platform's rows about these tenants that carry no schoolId: the operator's subscription changes and reminders, the regulators' reminders.
  deleted += await dbx.$executeRawUnsafe(`DELETE FROM "AuditLog" WHERE "schoolId" IS NULL AND ("targetId" = ANY($1::text[]) OR "actorUserId" = ANY($2::text[]) OR EXISTS (SELECT 1 FROM unnest($1::text[]) AS t(id) WHERE position(t.id in "meta") > 0))`, ids, doomed);
  // Rate-limit buckets keyed on these schools or people.
  deleted += await dbx.$executeRawUnsafe(`DELETE FROM "RateLimit" r WHERE EXISTS (SELECT 1 FROM unnest($1::text[]) AS t(id) WHERE position(t.id in r.bucket) > 0)`, [...ids, ...doomed]);
  // The retention sweep's own audit rows (schoolId null), by the ids the walk kept.
  const kept = existsSync(join(OUT, "sweep-audit-ids.json")) ? (JSON.parse(readFileSync(join(OUT, "sweep-audit-ids.json"), "utf8")) as string[]) : [];
  deleted += (await dbx.auditLog.deleteMany({ where: { id: { in: [...sweepAuditIds, ...kept] }, action: "retention.sweep" } })).count;
  // The people, then the schools: nothing hangs from either any more, so neither delete cascades.
  for (let i = 0; i < doomed.length; i += 200) deleted += (await dbx.user.deleteMany({ where: { id: { in: doomed.slice(i, i + 200) } } })).count;
  deleted += (await dbx.school.deleteMany({ where: { id: { in: ids } } })).count;

  // Proof: no row left in any tenant table, no zzlc. account.
  const left: string[] = [];
  for (const t of tables) {
    const r = (await dbx.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${t}" WHERE "schoolId" = ANY($1::text[])`, ids)) as { n: number }[];
    if (r[0]!.n) left.push(`${t}: ${r[0]!.n}`);
  }
  const users2 = await dbx.user.count({ where: { OR: [{ id: { in: doomed } }, WALK_ACCOUNTS] } });
  if (users2) left.push(`users: ${users2}`);
  const schoolsLeft = await dbx.school.count({ where: { slug: { in: SLUGS } } });
  if (schoolsLeft) left.push(`schools: ${schoolsLeft}`);
  console.log(`\n  Teardown: ${deleted} rows deleted over ${order.length} tenant tables (children first), ${doomed.length} accounts. ${left.length ? `LEFT: ${left.join(", ")}` : "No row left."}\n`);
  return { deleted, left };
}

/* ========================================================================== */
/* MAIN                                                                        */
/* ========================================================================== */

/** What the engineering walk holds of the stream's records and the autonomous conduct, read from the rows. */
async function engineeringCounts(schoolId: string) {
  const n = async (sql: string) => ((await dbx.$queryRawUnsafe(sql, schoolId)) as { n: number }[])[0]!.n;
  const papers = await dbx.questionPaper.findMany({ where: { schoolId }, select: { status: true, sealedBody: true, accessLogJson: true } });
  return {
    labBatches: await dbx.labBatch.count({ where: { schoolId } }),
    labBatchMembers: await dbx.labBatchMember.count({ where: { schoolId } }),
    labSlots: await dbx.offeringSlot.count({ where: { schoolId, kind: "LAB", labBatchId: { not: null } } }),
    batchLectures: await dbx.lecture.count({ where: { schoolId, labBatchId: { not: null } } }),
    batchMarks: await n(`SELECT count(*)::int AS n FROM "LectureAttendance" a JOIN "Lecture" l ON l.id = a."lectureId" WHERE l."schoolId" = $1 AND l."labBatchId" IS NOT NULL`),
    practicalRecords: await dbx.practicalRecord.count({ where: { schoolId } }),
    practicalSigned: await dbx.practicalRecord.count({ where: { schoolId, signedAt: { not: null } } }),
    labInchargeSigned: await n(`SELECT count(*)::int AS n FROM "PracticalRecord" r JOIN "CourseOffering" o ON o.id = r."offeringId" WHERE r."schoolId" = $1 AND r."signedByMembershipId" IS NOT NULL AND r."signedByMembershipId" IS DISTINCT FROM o."facultyMembershipId"`),
    examSchedules: await dbx.examSchedule.count({ where: { schoolId } }),
    papers: papers.length,
    papersSealed: papers.filter((p: Any) => p.sealedBody).length,
    papersModerated: papers.filter((p: Any) => p.status === "MODERATED").length,
    paperOpenings: papers.reduce((a: number, p: Any) => a + JSON.parse(p.accessLogJson || "[]").length, 0),
    seats: await dbx.seating.count({ where: { schoolId } }),
    hallTickets: await dbx.hallTicket.count({ where: { schoolId } }),
    printingLists: await dbx.printingList.count({ where: { schoolId } }),
    bundlesReturned: await dbx.assessmentAllocation.count({ where: { schoolId, status: "RETURNED" } }),
    doubleEntryMarks: await dbx.examMark.count({ where: { schoolId, source: "DOUBLE_ENTRY", matched: true } }),
    nbaSarFiled: await dbx.collegeFiling.count({ where: { schoolId, kind: "NBA_SAR", status: "FILED" } }),
    aqarFiled: await dbx.collegeFiling.count({ where: { schoolId, kind: "AQAR", status: "FILED" } }),
    graduates: await dbx.membership.count({ where: { schoolId, role: "ALUMNUS" } }),
  };
}

type YearRow = { year: string; seconds: number; rowsWritten: number; audit: string; invariantFailures: string[]; breaks: number; retention: Record<string, number> | null };

async function main() {
  L = await loadLibs();
  dbx = L.db as Any;
  await L.fx.refuseUnlessLocal("zz:lifecycle");
  mkdirSync(OUT, { recursive: true });
  if (argv.includes("--teardown")) {
    const r = await teardown();
    writeFileSync(join(OUT, "teardown.json"), JSON.stringify(r, null, 2));
    return;
  }
  await loadRedateColumns();
  beginPhase();

  // What is already walked: a year is done when both tenants have closed it.
  const done = new Set<number>();
  for (let y = FIRST_YEAR; y < FIRST_YEAR + YEARS; y += 1) {
    const closed = await dbx.academicYear.count({ where: { school: { slug: { in: SLUGS } }, name: yearName(y), closedAt: { not: null } } });
    if (closed === SLUGS.length) done.add(y);
  }
  const todo = Array.from({ length: YEARS }, (_, i) => FIRST_YEAR + i).filter((y) => !done.has(y));
  const firstTodo = todo[0];
  if (firstTodo !== undefined && done.size > 0 && todo.some((y) => y < Math.max(...done))) throw new Error("the walked years are not a prefix; run --teardown");
  if (firstTodo !== undefined) {
    // A year with anything in it but not closed by both is a crash's half-walk: refused, by name.
    const half = await dbx.academicTerm.count({ where: { school: { slug: SPEC.slug }, academicYear: yearName(firstTodo) } });
    const halfSchool = ENGINEERING ? 0 : await dbx.term.count({ where: { school: { slug: SCHOOL_SLUG }, academicYear: { name: yearName(firstTodo) } } });
    if (half || halfSchool) {
      console.error(`\n  ${yearName(firstTodo)} is half-walked (terms exist, the year is not closed by ${ENGINEERING ? "the tenant" : "both tenants"}). Run: npm run zz:lifecycle -- ${ENGINEERING ? "--college engineering " : ""}--teardown\n`);
      process.exitCode = 2;
      return;
    }
  }
  if (!todo.length) {
    const counts = await (async () => {
      schoolIdsMine = (await dbx.school.findMany({ where: { slug: { in: SLUGS } }, select: { id: true } })).map((s: Any) => s.id);
      return tableCounts();
    })();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n  Nothing to do: ${YEARS} years already walked for ${ENGINEERING ? SPEC.name : `ZZ Lifecycle School and ${SPEC.name}`} (${total} rows over ${Object.keys(counts).length} tables). Nothing was written.\n`);
    writeFileSync(join(OUT, "second-run.json"), JSON.stringify({ nothingToDo: true, rows: total, tables: Object.keys(counts).length }, null, 2));
    return;
  }

  // The audit report files are the repository's; they are put back as they were after the run.
  const docs = resolve(process.cwd(), "../../docs/data-audit");
  const backup = join(OUT, "data-audit-backup");
  mkdirSync(backup, { recursive: true });
  for (const f of ["latest.md", "reports.md"]) if (existsSync(join(docs, f)) && !existsSync(join(backup, f))) copyFileSync(join(docs, f), join(backup, f));

  YEAR = "setup";
  const t0 = realNow();
  const S = ENGINEERING ? null : await setupSchool();
  const C = await setupCollege();
  console.log(`  setup: ${Math.round((realNow() - t0) / 1000)} s`);
  const table: YearRow[] = existsSync(join(OUT, "years.json")) && done.size ? JSON.parse(readFileSync(join(OUT, "years.json"), "utf8")) : [];
  let before = await tableCounts();
  const users = async () => [...new Set([...(await dbx.membership.findMany({ where: { schoolId: { in: schoolIdsMine } }, select: { userId: true } })).map((m: Any) => m.userId), (await operatorActor()).userId, ...(S ? [(await expertActor()).userId] : [])])];

  for (const y of todo) {
    const idx = y - FIRST_YEAR;
    YEAR = yearName(y);
    const breaksBefore = BREAKS.size;
    const ty = realNow();
    console.log(`\n=== ${YEAR} ===`);
    TENANT = "platform";
    await platformYear(y, idx);
    if (S) await schoolYear(S, y, idx);
    await collegeYear(C, y, idx);
    const retention = await retentionYear(y, await users());
    await redate();
    const seconds = Math.round((realNow() - ty) / 1000);
    const after = await tableCounts();
    const rowsWritten = Object.entries(after).reduce((a, [t, n]) => a + Math.max(0, n - (before[t] ?? 0)), 0);
    const shrank = Object.entries(before).filter(([t, n]) => (after[t] ?? 0) < n).map(([t, n]) => `${t} ${n}→${after[t] ?? 0}`);
    if (shrank.length) note(`tables that shrank this year: ${shrank.join(", ")}`);
    before = after;
    setClock(`${y + 1}-05-31`, 23);
    const inv = await invariants(S, C, y);
    const fails = inv.filter((i) => !i.ok).map((i) => `${i.name}: ${i.detail}`);
    for (const f of fails) console.log(`  ✗ invariant ${f}`);
    let audit = "skipped";
    if (RUN_AUDIT) {
      const a = runAudit(yearName(y));
      audit = `${a.fail} FAIL · ${a.warn} WARN · ${a.info} INFO (${a.seconds} s${a.ok ? "" : ", suite exit ≠ 0"})`;
    }
    table.push({ year: YEAR, seconds, rowsWritten, audit, invariantFailures: fails, breaks: BREAKS.size - breaksBefore, retention: retention as Record<string, number> | null });
    console.log(`  ${YEAR}: ${seconds} s, ${rowsWritten} rows, audit ${audit}, ${fails.length} invariant failure(s), ${BREAKS.size - breaksBefore} new break(s)`);
    writeFileSync(join(OUT, "years.json"), JSON.stringify(table, null, 2));
    writeFileSync(join(OUT, "breaks.json"), JSON.stringify([...BREAKS.values()], null, 2));
    writeFileSync(join(OUT, "ops.json"), JSON.stringify([...OPS.entries()].map(([op, v]) => ({ op, n: v.n, totalS: +(v.ms / 1000).toFixed(1), avgMs: +(v.ms / v.n).toFixed(1), maxMs: Math.round(v.max) })).sort((a, b) => b.totalS - a.totalS), null, 2));
    writeFileSync(join(OUT, "notes.json"), JSON.stringify(NOTES, null, 2));
    writeFileSync(join(OUT, `invariants-${yearName(y)}.json`), JSON.stringify(inv, null, 2));
    writeFileSync(join(OUT, "counts.json"), JSON.stringify(after, null, 2));
    writeFileSync(join(OUT, "redated.json"), JSON.stringify([...REDATED.entries()].sort((a, b) => b[1] - a[1]), null, 2));
  }

  if (ENGINEERING) {
    const counts = await engineeringCounts(C.id);
    writeFileSync(join(OUT, "engineering.json"), JSON.stringify({ ...counts, sar: SAR_MARKS }, null, 2));
    console.log(`  Engineering: ${JSON.stringify(counts)}`);
  }
  // The repository's audit reports, put back.
  for (const f of ["latest.md", "reports.md"]) if (existsSync(join(backup, f))) copyFileSync(join(backup, f), join(docs, f));
  // The walk's sessions go; the accounts stay until --teardown.
  await dbx.session.deleteMany({ where: { userAgent: "zz-walk", userId: { in: await users() } } });
  console.log(`\n  Done: ${todo.length} year(s). Breaks ${BREAKS.size}. Reports in ${OUT}.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      writeFileSync(join(OUT, "breaks.json"), JSON.stringify([...BREAKS.values()], null, 2));
      writeFileSync(join(OUT, "notes.json"), JSON.stringify(NOTES, null, 2));
    } catch {
      /* the out dir may not exist on an early failure */
    }
    await (dbx as Any)?.$disconnect?.();
    await (L?.fx?.db as Any)?.$disconnect?.();
  });
