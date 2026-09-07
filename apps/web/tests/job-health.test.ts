import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { composeHealthDigest, crossSchoolJobHealth, schoolJobStory, sendOperatorHealthDigest } from "@/lib/job-health";
import type { JobStatus } from "@/lib/jobs";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * The operator's cross-school view of job health. What holds: it reads each
 * job's LATEST successful run only, groups that run's per-school story by
 * school, names the schools, turns `stuck` into attention and sorts it
 * first, counts the schools no run had anything for as quiet, and is for
 * whoever runs the server alone. The jobs' side of the contract — that they
 * write `perSchool` truthfully — is each job's own test, not this file's.
 */

const db = new PrismaClient();

function session(isSuperuser: boolean, over: Partial<ActiveContext> = {}): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: "job-health-test-user",
      name: "Op",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

// The view reads the LATEST successful run per job, so these fixture runs
// must be the newest in the table for the run to be deterministic. Far
// future, deleted in afterAll; `mine` tracks every row this file writes.
const mine: string[] = [];
const FUTURE = new Date("2999-06-01T03:30:00Z");
const EARLIER = new Date("2999-05-31T03:30:00Z");

let schoolAId: string;
let schoolBId: string;
let schoolCId: string;

async function seedRun(job: string, startedAt: Date, summary: Record<string, unknown>, ok = true) {
  const row = await db.jobRun.create({
    data: { job, startedAt, finishedAt: new Date(startedAt.getTime() + 60_000), ok, summary: JSON.stringify(summary) },
    select: { id: true },
  });
  mine.push(row.id);
}

beforeAll(async () => {
  const suffix = Math.random().toString(16).slice(2, 10);
  const a = await db.school.create({
    data: { name: "ZZ Job Health A", slug: `zz-jobhealth-a-${suffix}`, code: `ZJA${suffix.slice(0, 5).toUpperCase()}`, contactEmail: `a-${suffix}@zz-jobhealth.test` },
  });
  const b = await db.school.create({
    data: { name: "ZZ Job Health B", slug: `zz-jobhealth-b-${suffix}`, code: `ZJB${suffix.slice(0, 5).toUpperCase()}`, contactEmail: `b-${suffix}@zz-jobhealth.test` },
  });
  const c = await db.school.create({
    data: { name: "ZZ Job Health C", slug: `zz-jobhealth-c-${suffix}`, code: `ZJC${suffix.slice(0, 5).toUpperCase()}`, contactEmail: `c-${suffix}@zz-jobhealth.test` },
  });
  schoolAId = a.id;
  schoolBId = b.id;
  schoolCId = c.id;

  // NOT notifications:tidy — jobs.test writes real JobRun rows for that job
  // in a parallel file and asserts on its recency; these two jobs get JobRun
  // rows from no other test file, so the fixtures cannot race anybody.
  // An older departures run with a story that must NOT show (latest wins)…
  await seedRun("departures:run", EARLIER, { executed: 9, skippedStale: 0, stuck: 0, perSchool: { [schoolAId]: { executed: 9 } } });
  // …the latest successful one: A executed, B STUCK — and a failed run after
  // it that must not displace it.
  await seedRun("departures:run", FUTURE, { executed: 1, skippedStale: 0, stuck: 1, perSchool: { [schoolAId]: { executed: 1 }, [schoolBId]: { stuck: 1 } } });
  await seedRun("departures:run", new Date(FUTURE.getTime() + 3_600_000), {}, false);
  // The latest digest run: coverage for A, so A wears two jobs' chips.
  await seedRun("digest:weekly", FUTURE, { sent: 1, skipped: 0, quiet: 0, perSchool: { [schoolAId]: { digests: 1, children: 2 } } });
  // The latest reclaim run: C's records point at bytes that are gone — the
  // other attention count, on a school with no other story at all.
  await seedRun("files:reclaim", FUTURE, { scanned: 40, referenced: 12, missing: 3, perSchool: { [schoolCId]: { missing: 3 } } });
});

afterAll(async () => {
  await db.outboundEmail.deleteMany({ where: { purpose: "HEALTH" } });
  await db.jobRun.deleteMany({ where: { id: { in: mine } } });
  await db.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId, schoolCId] } } });
  await db.$disconnect();
});

describe("the operator's cross-school view", () => {
  it("⚠ belongs to whoever runs the server alone", async () => {
    await expect(crossSchoolJobHealth(session(false))).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ reads each job's latest successful run, names the schools, and puts the stuck one first", async () => {
    const view = await crossSchoolJobHealth(session(true));

    const a = view.schools.find((s) => s.schoolId === schoolAId)!;
    const b = view.schools.find((s) => s.schoolId === schoolBId)!;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a.name).toBe("ZZ Job Health A");

    // Latest wins: the 9s from the earlier run are nowhere.
    const aDep = a.jobs.find((j) => j.job === "departures:run")!;
    expect(aDep.counts).toEqual({ executed: 1 });
    const aDigest = a.jobs.find((j) => j.job === "digest:weekly")!;
    expect(aDigest.counts).toEqual({ digests: 1, children: 2 });

    // The failed later run did not displace the successful one it followed.
    expect(b.jobs).toEqual([expect.objectContaining({ job: "departures:run", counts: { stuck: 1 } })]);

    // stuck → attention, and attention sorts first.
    expect(b.attention).toBe(true);
    expect(a.attention).toBe(false);
    expect(view.schools.indexOf(b)).toBeLessThan(view.schools.indexOf(a));

    // missing → attention too: a record whose bytes are gone needs a person.
    const c = view.schools.find((s) => s.schoolId === schoolCId)!;
    expect(c.attention).toBe(true);
    expect(c.jobs).toEqual([expect.objectContaining({ job: "files:reclaim", counts: { missing: 3 } })]);
    expect(view.schools.indexOf(c)).toBeLessThan(view.schools.indexOf(a));

    // The context line knows when each job last succeeded.
    const depRun = view.runs.find((r) => r.job === "departures:run")!;
    expect(depRun.at?.toISOString()).toBe(FUTURE.toISOString());
  });

  it("⚠ the school's own card shows exactly its own story and nobody else's", async () => {
    // A teacher is refused: the story is the office's reading.
    await expect(
      schoolJobStory(session(false, { role: "TEACHER", schoolId: schoolAId, membershipId: "m" })),
    ).rejects.toBeInstanceOf(AccessError);

    const a = await schoolJobStory(session(false, { role: "ADMIN", schoolId: schoolAId, membershipId: "m" }));
    expect(a.attention).toBe(false);
    expect(a.entries.find((e) => e.job === "departures:run")!.counts).toEqual({ executed: 1 });
    expect(a.entries.find((e) => e.job === "digest:weekly")!.counts).toEqual({ digests: 1, children: 2 });
    // B's stuck leaks nowhere into A's story.
    expect(JSON.stringify(a.entries)).not.toContain("stuck");

    const b = await schoolJobStory(session(false, { role: "ADMIN", schoolId: schoolBId, membershipId: "m" }));
    expect(b.attention).toBe(true);
    expect(b.entries).toEqual([expect.objectContaining({ job: "departures:run", counts: { stuck: 1 } })]);

    // A school whose only trouble is missing bytes still gets the flag.
    const cStory = await schoolJobStory(session(false, { role: "ADMIN", schoolId: schoolCId, membershipId: "m" }));
    expect(cStory.attention).toBe(true);
    expect(cStory.entries).toEqual([expect.objectContaining({ counts: { missing: 3 } })]);

    // A school the runs had nothing for gets a quiet, honest empty.
    const quiet = await schoolJobStory(session(false, { role: "ADMIN", schoolId: "no-such-school-id", membershipId: "m" }));
    expect(quiet).toEqual({ entries: [], attention: false });
  });

  it("a school no latest run had work for is quiet, not listed", async () => {
    const view = await crossSchoolJobHealth(session(true));
    // Neither fixture school is quiet; the server's other schools are.
    expect(view.schools.map((s) => s.schoolId)).toContain(schoolAId);
    expect(view.quiet).toBeGreaterThan(0);
    // And nothing listed is empty: every school shown has at least one count.
    for (const school of view.schools) {
      expect(school.jobs.length).toBeGreaterThan(0);
      for (const entry of school.jobs) expect(Object.keys(entry.counts).length).toBeGreaterThan(0);
    }
  });
});

/** A minimal healthy status; override what a case needs. */
function status(over: Partial<JobStatus> & { name: JobStatus["name"] }): JobStatus {
  return {
    schedule: "0 0 * * *",
    describeKey: "root.jobDescTidy",
    lastRun: null,
    lastSuccessAt: new Date(),
    overdue: false,
    lastFailed: false,
    running: false,
    ...over,
  };
}

describe("the operator's health digest", () => {
  it("⚠ says nothing at all when all is well — and does not report on itself", () => {
    const green = [status({ name: "notifications:tidy" }), status({ name: "departures:run" })];
    expect(composeHealthDigest(green, [])).toBeNull();
    // The messenger's own overdue is not news the messenger can carry.
    expect(composeHealthDigest([...green, status({ name: "health:digest", overdue: true })], [])).toBeNull();
  });

  it("names the overdue job, the failure, and the school — with the counts in words", () => {
    const digest = composeHealthDigest(
      [
        status({ name: "digest:weekly", overdue: true, lastSuccessAt: null }),
        status({
          name: "files:reclaim",
          lastFailed: true,
          lastRun: { startedAt: new Date(), finishedAt: new Date(), ok: false, summary: "", error: "disk fell off", host: null },
        }),
      ],
      [{ schoolId: "s1", name: "ZZ Digest School", jobs: [{ job: "departures:run", at: new Date(), counts: { stuck: 2 } }] }],
    )!;
    expect(digest.subject).toBe("EduLink health: 1 job overdue · 1 failed · 1 school needs attention");
    expect(digest.text).toContain("digest:weekly: overdue (last success never)");
    expect(digest.text).toContain("files:reclaim: last run failed — disk fell off");
    expect(digest.text).toContain("ZZ Digest School: 2 stuck");
    expect(digest.bodyHtml).toContain("ZZ Digest School");
  });

  it("⚠ the real gatherer emails every operator when the fixtures hold trouble, counts honest", async () => {
    await db.outboundEmail.deleteMany({ where: { purpose: "HEALTH" } });
    const out = await sendOperatorHealthDigest();
    // Schools B (stuck) and C (missing) are this file's own seeded trouble.
    expect(out.attention).toBeGreaterThanOrEqual(2);
    expect(out.quiet).toBe(false);
    expect(out.emailed).toBeGreaterThanOrEqual(1);
    const sent = await db.outboundEmail.findMany({ where: { purpose: "HEALTH" }, select: { to: true, subject: true, text: true } });
    expect(sent.length).toBe(out.emailed);
    expect(sent[0]!.subject).toMatch(/EduLink health:/);
    expect(sent[0]!.text).toContain("ZZ Job Health B: 1 stuck");
    expect(sent[0]!.text).toContain("ZZ Job Health C: 3 files on record, gone from disk");
  });
});
