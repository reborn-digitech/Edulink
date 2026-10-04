/**
 * LIFECYCLE-10 (campaign of 4 October 2026): the jobs registry hands every
 * job the clock and, for a dry run, a scope. Before, `runJob` passed neither
 * — every worker read the wall clock and every tenant — so a job could not be
 * run on a simulated day or on a test's own schools, `expireInvites` had no
 * scope at all and the departures job had no future-clock guard.
 *
 * What holds here: a scoped run reaches the worker with the given `now`
 * (an invitation two days from expiry expires on a clock three days on) and
 * only in the named school; it writes no JobRun row, so it never reads as the
 * job's last success; a scope naming a key the job cannot honour is refused
 * before anything runs; and the departures worker refuses a far-future clock
 * with no scope.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { JOBS, runJob } from "@/lib/jobs";
import { runDueDepartures } from "@/lib/school-record";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { a: "", b: "", inviteA: "", inviteB: "" };

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ Jobs Scope ${tag} ${STAMP}`, slug: `zz-jobs-scope-${tag.toLowerCase()}-${STAMP}`, code: `ZJS${tag}${String(STAMP).slice(-5)}`, contactEmail: `zz-jobs-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.a = (await mk("A")).id;
  ids.b = (await mk("B")).id;
  const invite = (schoolId: string, tag: string) => db.invite.create({ data: { schoolId, role: "TEACHER", email: `zz-jobs-invite-${tag}-${STAMP}@test.invalid`, tokenHash: `zz-jobs-${tag}-${STAMP}`, expiresAt: new Date(Date.now() + 2 * 86_400_000) }, select: { id: true } });
  ids.inviteA = (await invite(ids.a, "a")).id;
  ids.inviteB = (await invite(ids.b, "b")).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.$disconnect();
});

describe("a scoped run", () => {
  it("hands the worker the clock and the scope, and records no run of the job", async () => {
    const runsBefore = await db.jobRun.count({ where: { job: "accounts:tidy" } });
    const out = await runJob("accounts:tidy", new Date(Date.now() + 3 * 86_400_000), { schoolIds: [ids.a] });
    expect(out.status).toBe("done");
    // Expired on the clock it was handed — the old registry called expireInvites() on the wall clock.
    expect((await db.invite.findUniqueOrThrow({ where: { id: ids.inviteA } })).status).toBe("EXPIRED");
    // And only in the school it named.
    expect((await db.invite.findUniqueOrThrow({ where: { id: ids.inviteB } })).status).toBe("PENDING");
    expect(await db.jobRun.count({ where: { job: "accounts:tidy" } })).toBe(runsBefore);
  });

  it("is refused for a job that cannot narrow to the key it names, before anything runs", async () => {
    expect(JOBS["fees:remind"].narrows).toEqual([]);
    await expect(runJob("fees:remind", new Date(), { schoolIds: [ids.a] })).rejects.toThrow(/cannot be narrowed/);
    await expect(runJob("digest:weekly", new Date(), { schoolIds: [ids.a] })).rejects.toThrow(/cannot be narrowed/);
    await expect(runJob("departures:run", new Date(), {})).rejects.toThrow(/cannot be narrowed/);
  });

  it("names, for every job, what it can be narrowed by", () => {
    for (const spec of Object.values(JOBS)) expect(Array.isArray(spec.narrows)).toBe(true);
  });
});

describe("the departures job", () => {
  it("refuses a far-future clock with no scope, as the retention sweep does", async () => {
    await expect(runDueDepartures(new Date("2999-04-01T02:00:00Z"))).rejects.toThrow(/refusing an unscoped run/);
    // Scoped to a school of its own, the same clock runs (nothing is scheduled there).
    expect((await runDueDepartures(new Date("2999-04-01T02:00:00Z"), { schoolIds: [ids.a] })).executed).toBe(0);
  });
});
