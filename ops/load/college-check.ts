/**
 * The college's concurrent-user profile, without k6: faculty marking lectures
 * through the phone's door with clientId batches, students reading their
 * academics and exams, guardians reading the ledger, one TPO reading an open
 * drive's eligibility and one IQAC reading the predictor — all at once,
 * against a PRODUCTION build, from sessions minted straight from the database
 * the way apps/web/scripts/load-check.ts mints them.
 *
 *   cd apps/web && node scripts/with-admin-db.mjs npx tsx --tsconfig scripts/tsconfig.json \
 *     ../../ops/load/college-check.ts --faculty 10 --students 100 --parents 40 --seconds 60
 *   … --emit-cookies ../../ops/load/college-cookies.json      sessions for ops/load/college.js (k6)
 *
 * ONLY ZZ COLLEGES ARE TOUCHED (zz-vidya-college by default, --college to name
 * another zz- slug). Lecture marks are all PRESENT, so no defaulter notice can
 * fan out; only students whose marks are not frozen by the exam cell (a form
 * past DRAFT, or the term's regular session past FORMS) are sent. Every
 * LectureAttendance row the run touched is put back as it was found (status,
 * marker, time, clientId), rows it created are deleted, and the run's own
 * "academics.lecture.mark" audit rows are removed, all scoped to the college.
 * Every fifth mark resends the previous batch's clientId, as the phone's
 * outbox does after a lost answer, so the replay path is under load too.
 *
 * Concurrency is the load: the fixture college has a handful of faculty,
 * students and guardians, so workers cycle over them — the server does the
 * work per request a large college would ask of it, the database holds fewer
 * rows than a real one. Say so when quoting the numbers.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// ops/ has no node_modules of its own: the Prisma client is the web app's.
const requireWeb = createRequire(join(__dirname, "..", "..", "apps", "web", "package.json"));
const { PrismaClient } = requireWeb("@prisma/client") as typeof import("@prisma/client");
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}
const BASE = arg("base", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
const FACULTY = Number(arg("faculty", "10"));
const STUDENTS = Number(arg("students", "100"));
const PARENTS = Number(arg("parents", "40"));
const SECONDS = Number(arg("seconds", "60"));
const COLLEGE = arg("college", "zz-vidya-college");
const EMIT = arg("emit-cookies", "");
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;
const OPEN_DRIVE = arg("drive", pad("zzpldrive", 2));
const CYCLE = arg("cycle", pad("zziqaccycle", 1));

const minted: string[] = [];
async function mint(userId: string, role: string, schoolId: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const s = await db.session.create({
    data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: schoolId, activeRole: role, userAgent: "load-check", expiresAt: new Date(Date.now() + 3_600_000) },
  });
  minted.push(s.id);
  return token;
}

type Sample = { ms: number; status: number };
function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}
function report(name: string, samples: Sample[], target: string) {
  const ms = samples.map((s) => s.ms);
  const statuses = new Map<number, number>();
  for (const s of samples) statuses.set(s.status, (statuses.get(s.status) ?? 0) + 1);
  const errors = samples.filter((s) => s.status !== 200).length;
  const hist = [...statuses].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(" ");
  console.log(`${name.padEnd(30)} n=${String(samples.length).padStart(5)}  p50=${percentile(ms, 50).toFixed(0).padStart(5)}ms  p95=${percentile(ms, 95).toFixed(0).padStart(5)}ms  p99=${percentile(ms, 99).toFixed(0).padStart(5)}ms  max=${Math.max(0, ...ms).toFixed(0).padStart(5)}ms  errors=${errors}  [${hist}]  (target ${target})`);
  return { p95: percentile(ms, 95), errors };
}
async function worker(seconds: number, pause: number, one: () => Promise<void>) {
  const until = Date.now() + seconds * 1000;
  // Staggered starts, so a profile does not begin with every worker in the same millisecond.
  await new Promise((r) => setTimeout(r, Math.random() * pause));
  while (Date.now() < until) {
    await one();
    await new Promise((r) => setTimeout(r, pause));
  }
}

async function main() {
  if (!COLLEGE.startsWith("zz-")) throw new Error("only ZZ colleges may be load-tested");
  const college = await db.school.findUniqueOrThrow({ where: { slug: COLLEGE }, select: { id: true, timezone: true } });
  const schoolId = college.id;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: college.timezone || "Asia/Kolkata" }).format(new Date());

  // Lectures a faculty member may mark today: their own, held, not cancelled, no one standing in.
  const lectures = await db.lecture.findMany({
    where: { schoolId, cancelledAt: null, substituteMembershipId: null, dateKey: { lte: today }, offering: { facultyMembershipId: { not: null } } },
    select: { id: true, offeringId: true, offering: { select: { termId: true, facultyMembershipId: true } } },
    orderBy: { dateKey: "desc" },
  });
  // The exam cell's freeze (academics-attendance.ts markLecture): skip a term whose regular session is past forms, and a student whose form is past draft.
  const termIds = [...new Set(lectures.map((l) => l.offering.termId))];
  const frozenTerms = new Set((await db.examSession.findMany({ where: { schoolId, termId: { in: termIds }, kind: "REGULAR", status: { in: ["CONDUCT", "ASSESSMENT", "PUBLISHED", "CLOSED"] } }, select: { termId: true } })).map((s) => s.termId));
  const frozenStudents = new Set(
    (await db.examForm.findMany({ where: { schoolId, status: { not: "DRAFT" }, session: { termId: { in: termIds }, kind: "REGULAR" } }, select: { studentMembershipId: true, session: { select: { termId: true } } } })).map((f) => `${f.session.termId}:${f.studentMembershipId}`),
  );
  const regs = await db.courseRegistration.findMany({ where: { offeringId: { in: [...new Set(lectures.map((l) => l.offeringId))] }, status: "REGISTERED" }, select: { offeringId: true, studentMembershipId: true } });
  const markable = lectures
    .filter((l) => !frozenTerms.has(l.offering.termId))
    .map((l) => ({ ...l, students: regs.filter((r) => r.offeringId === l.offeringId && !frozenStudents.has(`${l.offering.termId}:${r.studentMembershipId}`)).map((r) => r.studentMembershipId) }))
    .filter((l) => l.students.length > 0);
  if (markable.length === 0) throw new Error("no lecture at the college can be marked (none held, or all frozen by the exam cell)");
  const byFaculty = new Map<string, typeof markable>();
  for (const l of markable) byFaculty.set(l.offering.facultyMembershipId!, [...(byFaculty.get(l.offering.facultyMembershipId!) ?? []), l]);
  const facultyMembers = await db.membership.findMany({ where: { id: { in: [...byFaculty.keys()] }, status: "ACTIVE" }, select: { id: true, userId: true, role: true } });

  const students = await db.membership.findMany({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  const guardians = await db.guardianship.findMany({ where: { studentSchoolId: schoolId, status: "ACTIVE" }, select: { parentUserId: true, studentMembershipId: true } });
  const tpo = await db.membership.findFirst({ where: { schoolId, role: "TPO", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  const iqac = await db.membership.findFirst({ where: { schoolId, role: "IQAC", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  if (!students.length || !facultyMembers.length) throw new Error("the college needs faculty with lectures and students — run npm run zz:fixtures");

  const faculty = await Promise.all(facultyMembers.map(async (m) => ({ token: await mint(m.userId, m.role, schoolId), lectures: byFaculty.get(m.id)! })));
  const studentTokens = await Promise.all(students.map((s) => mint(s.userId, "STUDENT", schoolId)));
  const parentTokens = await Promise.all(guardians.map(async (g) => ({ token: await mint(g.parentUserId, "PARENT", null), childId: g.studentMembershipId })));
  const tpoToken = tpo ? await mint(tpo.userId, "TPO", schoolId) : null;
  const iqacToken = iqac ? await mint(iqac.userId, "IQAC", schoolId) : null;

  if (EMIT) {
    writeFileSync(EMIT, JSON.stringify({ faculty, students: studentTokens, parents: parentTokens, tpo: tpoToken, iqac: iqacToken, drive: OPEN_DRIVE, cycle: CYCLE }, null, 2));
    console.log(`wrote ${faculty.length} faculty, ${studentTokens.length} student, ${parentTokens.length} guardian sessions to ${EMIT} (bearer tokens; they expire in an hour and are NOT deleted)`);
    minted.length = 0;
    return;
  }

  // What the marks will touch, so the cleanup puts it back exactly.
  const touched = [...new Set(markable.map((l) => l.id))];
  const snapshot = await db.lectureAttendance.findMany({ where: { schoolId, lectureId: { in: touched } }, select: { id: true, status: true, markedByMembershipId: true, markedAt: true, clientId: true } });
  const runStart = new Date();

  const get = (token: string, path: string) => fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const timed = async (out: Sample[], run: () => Promise<Response>, after?: (body: unknown) => void) => {
    const t0 = performance.now();
    try {
      const res = await run();
      const text = await res.text();
      out.push({ ms: performance.now() - t0, status: res.status });
      if (after && res.status === 200) after(JSON.parse(text));
    } catch {
      out.push({ ms: performance.now() - t0, status: 0 });
    }
  };

  // One read of each door first: what answers, so a refusal by design is named before the numbers.
  const probe = async (label: string, token: string | null, path: string) => {
    if (!token) return console.log(`preflight ${label}: no such member at the college, skipped`);
    const r = await get(token, path);
    const body = await r.text();
    const code = r.status === 200 ? "" : ` ${(/"code":"([A-Z_]+)"/.exec(body) ?? [])[1] ?? ""}`;
    console.log(`preflight ${label} ${path.replace(/[?].*/, "")}: ${r.status}${code}`);
    return r.status;
  };
  await probe("student", studentTokens[0]!, "/api/v1/academics/mine");
  await probe("student", studentTokens[0]!, "/api/v1/exam-cell/mine");
  // A guardian refused by design (an adult child who has not granted MONEY) is named and left out of the load.
  const refused = new Set<string>();
  for (const p of parentTokens) if ((await probe("guardian", p.token, `/api/v1/student/ledger?childId=${p.childId}`)) !== 200) refused.add(p.token);
  const readers = parentTokens.filter((p) => !refused.has(p.token));
  await probe("tpo", tpoToken, `/api/v1/placement/drives/${OPEN_DRIVE}/eligibility`);
  await probe("iqac", iqacToken, `/api/v1/iqac/cycles/${CYCLE}`);

  console.log(`${BASE} · ${COLLEGE} · ${faculty.length} faculty with ${markable.length} markable lectures over ${FACULTY} workers · ${studentTokens.length} students over ${STUDENTS} workers · ${readers.length} guardians (${refused.size} refused by design, left out) over ${PARENTS} workers · 1 TPO · 1 IQAC · ${SECONDS}s`);
  const health = await fetch(`${BASE}/api/health`);
  if (health.status !== 200) throw new Error(`health answered ${health.status}`);

  const marks: Sample[] = [];
  const mine: Sample[] = [];
  const exams: Sample[] = [];
  const ledger: Sample[] = [];
  const eligibility: Sample[] = [];
  const predictor: Sample[] = [];
  let replays = 0;
  let notices = 0;
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < FACULTY; i++) {
    const f = faculty[i % faculty.length]!;
    let n = i;
    let last: { lecture: (typeof f.lectures)[number]; clientId: string } | null = null;
    jobs.push(
      worker(SECONDS, 2000, async () => {
        // Every fifth batch is the phone's outbox sending the previous one again: same lecture, same clientId.
        const again = last !== null && ++n % 5 === 0;
        const lecture = again ? last!.lecture : f.lectures[n % f.lectures.length]!;
        const clientId = again ? last!.clientId : `zz-load-${randomUUID()}`;
        last = { lecture, clientId };
        await timed(marks, () => fetch(`${BASE}/api/v1/academics/lectures/${lecture.id}/attendance`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${f.token}` }, body: JSON.stringify({ clientId, entries: lecture.students.map((s) => ({ studentMembershipId: s, status: "PRESENT" })) }) }), (b) => {
          const r = b as { replay?: boolean; noticesSent?: number };
          if (r.replay) replays++;
          notices += r.noticesSent ?? 0;
        });
      }),
    );
  }
  for (let i = 0; i < STUDENTS; i++) {
    const t = studentTokens[i % studentTokens.length]!;
    let n = i;
    jobs.push(worker(SECONDS, 1000, () => (n++ % 2 === 0 ? timed(mine, () => get(t, "/api/v1/academics/mine")) : timed(exams, () => get(t, "/api/v1/exam-cell/mine")))));
  }
  for (let i = 0; i < PARENTS && readers.length; i++) {
    const p = readers[i % readers.length]!;
    jobs.push(worker(SECONDS, 1000, () => timed(ledger, () => get(p.token, `/api/v1/student/ledger?childId=${p.childId}`))));
  }
  if (tpoToken) jobs.push(worker(SECONDS, 2000, () => timed(eligibility, () => get(tpoToken, `/api/v1/placement/drives/${OPEN_DRIVE}/eligibility`))));
  if (iqacToken) jobs.push(worker(SECONDS, 2000, () => timed(predictor, () => get(iqacToken, `/api/v1/iqac/cycles/${CYCLE}`))));
  await Promise.all(jobs);

  const results = [
    report("lecture mark POST", marks, "p95 < 300ms"),
    report("student academics/mine GET", mine, "p95 < 800ms"),
    report("student exam-cell/mine GET", exams, "p95 < 800ms"),
    report("guardian student/ledger GET", ledger, "p95 < 800ms"),
    report("TPO drive eligibility GET", eligibility, "p95 < 2000ms"),
    report("IQAC predictor GET", predictor, "p95 < 2000ms"),
  ];
  console.log(`marks: ${replays} answered as replays, ${notices} defaulter notices sent (expected 0: every mark is PRESENT)`);
  console.log(results.every((r) => r.errors === 0) && results[0]!.p95 < 300 && results.slice(1, 4).every((r) => r.p95 < 800) ? "targets met" : "targets NOT met");

  // Leave the college as it was found.
  const keep = new Set(snapshot.map((s) => s.id));
  const made = await db.lectureAttendance.deleteMany({ where: { schoolId, lectureId: { in: touched }, id: { notIn: [...keep] } } });
  for (const s of snapshot) await db.lectureAttendance.update({ where: { id: s.id }, data: { status: s.status, markedByMembershipId: s.markedByMembershipId, markedAt: s.markedAt, clientId: s.clientId } });
  const audits = await db.auditLog.deleteMany({ where: { schoolId, action: "academics.lecture.mark", targetId: { in: touched }, createdAt: { gte: runStart } } });
  console.log(`cleanup: ${snapshot.length} lecture marks restored as found, ${made.count} created by the run deleted, ${audits.count} of the run's audit rows removed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (minted.length) await db.session.deleteMany({ where: { id: { in: minted } } });
    await db.$disconnect();
  });
