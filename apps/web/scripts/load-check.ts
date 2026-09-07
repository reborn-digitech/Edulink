/**
 * A load check without k6: the plan's first two scenarios driven with plain
 * fetch against a PRODUCTION build, from sessions minted the way the sweep
 * mints them. Prints p50 / p95 / p99 and the error count per scenario, so a
 * laptop run gives a number the Phase 1 report can quote and a staging run
 * gives one the targets can be held to.
 *
 *   npm run load:check -- --base http://localhost:3100 --teachers 30 --parents 200 --seconds 60
 *   npm run load:check -- --emit-cookies ../../ops/load/cookies.json   # for k6
 *
 * ONLY THE ZZ FIXTURE IS TOUCHED. Registers are marked at ZZ Northgate, all
 * PRESENT (no absence notices fan out), on today's date; the records the run
 * created are deleted at the end, and records that were already there stay.
 * Every session minted here carries userAgent "load-check" and is deleted.
 * Concurrency is the load: the fixture has eight classes and a few dozen
 * guardians, so workers cycle over them — the server does the same work per
 * request as it would for eight hundred different pupils, the database holds
 * fewer rows than a real school would. Say so when quoting the numbers.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}
const BASE = arg("base", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
const TEACHERS = Number(arg("teachers", "30"));
const PARENTS = Number(arg("parents", "200"));
const SECONDS = Number(arg("seconds", "60"));
const EMIT = arg("emit-cookies", "");
const TODAY = new Date().toISOString().slice(0, 10);

type Session = { cookie: string; id: string };
const minted: string[] = [];

async function mint(userId: string, role: string, schoolId: string | null): Promise<Session> {
  const token = randomBytes(32).toString("base64url");
  const s = await db.session.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      activeSchoolId: schoolId,
      activeRole: role,
      userAgent: "load-check",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  minted.push(s.id);
  return { cookie: `edulink_session=${token}`, id: s.id };
}

type Sample = { ms: number; status: number };
function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}
function report(name: string, samples: Sample[], target: string) {
  const ms = samples.map((s) => s.ms);
  const errors = samples.filter((s) => s.status !== 200).length;
  const line = `${name.padEnd(22)} n=${String(samples.length).padStart(5)}  p50=${percentile(ms, 50).toFixed(0).padStart(5)}ms  p95=${percentile(ms, 95).toFixed(0).padStart(5)}ms  p99=${percentile(ms, 99).toFixed(0).padStart(5)}ms  max=${Math.max(0, ...ms).toFixed(0).padStart(5)}ms  errors=${errors}  (target ${target})`;
  console.log(line);
  return { name, n: samples.length, p50: percentile(ms, 50), p95: percentile(ms, 95), p99: percentile(ms, 99), errors };
}

async function worker(seconds: number, pause: number, one: () => Promise<Sample>, out: Sample[]) {
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    out.push(await one());
    await new Promise((r) => setTimeout(r, pause));
  }
}

async function main() {
  const school = await db.school.findUnique({ where: { slug: "zz-northgate-school" } });
  if (!school) throw new Error("ZZ Northgate missing — run npm run zz:fixtures first");

  // Every lead teacher with a class that has pupils, and those pupils.
  const leads = await db.classTeacher.findMany({
    where: { schoolId: school.id, role: "LEAD", canTakeAttendance: true, class: { archivedAt: null } },
    include: {
      teacher: { select: { userId: true } },
      class: { include: { enrollments: { where: { status: "ACTIVE" }, select: { studentMembershipId: true } } } },
    },
  });
  const registers = leads.filter((l) => l.class.enrollments.length > 0);
  if (registers.length === 0) throw new Error("no ZZ class with pupils");

  // A guardian is a User bound to a pupil, not a membership at the school; the
  // session carries the PARENT role with no active school, as a real sign-in does.
  const guardians = await db.guardianship.findMany({
    where: { studentSchoolId: school.id, status: "ACTIVE" },
    distinct: ["parentUserId"],
    select: { parentUserId: true },
  });
  if (guardians.length === 0) throw new Error("no ZZ guardians");

  // What was already marked today, so the cleanup deletes only what this run made.
  const before = new Set(
    (
      await db.attendanceRecord.findMany({
        where: { schoolId: school.id, session: { dateKey: TODAY } },
        select: { id: true },
      })
    ).map((r) => r.id),
  );

  const teachers = await Promise.all(
    registers.map(async (r) => ({
      cookie: (await mint(r.teacher.userId, "TEACHER", school.id)).cookie,
      classId: r.classId,
      marks: r.class.enrollments.map((e) => ({ studentMembershipId: e.studentMembershipId, status: "PRESENT" as const, clientId: randomUUID() })),
    })),
  );
  const parents = await Promise.all(guardians.map(async (g) => ({ cookie: (await mint(g.parentUserId, "PARENT", null)).cookie })));

  if (EMIT) {
    writeFileSync(EMIT, JSON.stringify({ teachers, parents }, null, 2));
    console.log(`wrote ${teachers.length} teacher and ${parents.length} parent sessions to ${EMIT} (they expire in an hour; sessions NOT deleted so k6 can use them)`);
    minted.length = 0;
    return;
  }

  console.log(`${BASE} · ${registers.length} registers over ${TEACHERS} workers · ${parents.length} guardians over ${PARENTS} workers · ${SECONDS}s`);
  const health = await fetch(`${BASE}/api/health`);
  if (health.status !== 200) throw new Error(`health answered ${health.status}`);

  const attendance: Sample[] = [];
  const overview: Sample[] = [];
  const timed = async (run: () => Promise<Response>): Promise<Sample> => {
    const t0 = performance.now();
    try {
      const res = await run();
      await res.arrayBuffer();
      return { ms: performance.now() - t0, status: res.status };
    } catch {
      return { ms: performance.now() - t0, status: 0 };
    }
  };

  const jobs: Promise<void>[] = [];
  for (let i = 0; i < TEACHERS; i++) {
    const t = teachers[i % teachers.length]!;
    jobs.push(
      worker(SECONDS, 2000, () =>
        timed(() =>
          fetch(`${BASE}/api/attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: t.cookie },
            body: JSON.stringify({ classId: t.classId, dateKey: TODAY, marks: t.marks.map((m) => ({ ...m, clientId: randomUUID() })) }),
          }),
        ), attendance),
    );
  }
  for (let i = 0; i < PARENTS; i++) {
    const p = parents[i % parents.length]!;
    jobs.push(worker(SECONDS, 1000, () => timed(() => fetch(`${BASE}/parent`, { headers: { Cookie: p.cookie }, redirect: "manual" })), overview));
  }
  await Promise.all(jobs);

  const a = report("attendance POST", attendance, "p95 < 300ms");
  const o = report("parent overview GET", overview, "p95 < 800ms");
  console.log(a.p95 < 300 && o.p95 < 800 && a.errors + o.errors === 0 ? "targets met" : "targets NOT met");

  // Leave the fixture as it was found.
  const made = await db.attendanceRecord.deleteMany({
    where: { schoolId: school.id, session: { dateKey: TODAY }, id: { notIn: [...before] } },
  });
  console.log(`cleanup: ${made.count} attendance records from this run deleted, ${before.size} that existed before kept`);
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
