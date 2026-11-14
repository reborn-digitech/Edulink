/**
 * The scheduled jobs and their watch (testing analysis of 13 November 2026, operator-console batch).
 *
 * TA-171 (Medium, Ops): a job run with --now and no scope acted on every tenant with the simulated clock, and stamped
 *   a JobRun in the future that blinded the overdue watch. Now runJob refuses an unscoped run whose clock is more than
 *   five minutes from the wall clock, before anything is written, and stamps every JobRun with the wall clock.
 * TA-522 (Medium, Ops): a missed minute was never caught up. Now the scheduler, when it starts, runs once every job
 *   whose last success is overdue and that is not running (the probe of the jobs' health is in
 *   ta-operator-console-health.test.ts); a job that tells families, staff, experts or operators is caught up only
 *   inside its own scheduled hour, housekeeping at any hour.
 * TA-360 (Low, Ops): when the operator mail failed, the overdue watch threw before it wrote its alert row, so the
 *   twelve-hour mute never started and the notice repeated every quarter hour. Now each mail is tried on its own and
 *   the alert row is written whatever the mail did.
 *
 * The workers are this file's own stand-ins (notification-housekeeping and the operator mail are mocked), so no real
 * job runs and no real mail is sent; the JobRun and alert rows written here are removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { JOBS, runJob, type JobStatus } from "@/lib/jobs";
import { HOUSEKEEPING_JOBS, catchUpAllowed, overdueAtStart, startJobScheduler } from "@/lib/job-scheduler";
import { watchJobs } from "@/lib/job-health";

const db = new PrismaClient();
const STAMP = Date.now();
const started = new Date();
const calls: string[] = [];
let mailFails = false;

vi.mock("@/lib/notification-housekeeping", () => ({
  tidyAllNotifications: async () => {
    calls.push("tidy");
    return { autoRead: 0, expired: 0 };
  },
}));

vi.mock("@/lib/email", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/email")>();
  return {
    ...real,
    sendHealthDigestEmail: async (...args: Parameters<typeof real.sendHealthDigestEmail>) => {
      if (mailFails) throw new Error("smtp refused");
      return real.sendHealthDigestEmail(...args);
    },
  };
});

let operatorA = "";
let operatorB = "";

beforeAll(async () => {
  operatorA = (await db.user.create({ data: { name: "ZZ TA OPC Watch A", email: `zz-taopc-jw-a-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
  operatorB = (await db.user.create({ data: { name: "ZZ TA OPC Watch B", email: `zz-taopc-jw-b-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.jobRun.deleteMany({ where: { job: "notifications:tidy", startedAt: { gte: started } } });
  await db.jobRun.deleteMany({ where: { job: "notifications:tidy", startedAt: { gte: new Date(Date.now() + 86_400_000) } } });
  await db.jobRun.deleteMany({ where: { job: { startsWith: "alert:" }, startedAt: { gte: started } } });
  await db.notification.deleteMany({ where: { userId: { in: [operatorA, operatorB] } } });
  await db.outboundEmail.deleteMany({ where: { to: { startsWith: "zz-taopc-jw-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { id: { in: [operatorA, operatorB] } } });
  await db.$disconnect();
});

function status(name: JobStatus["name"], over: Partial<JobStatus> = {}): JobStatus {
  const spec = JOBS[name];
  return { name, schedule: spec.schedule, describeKey: spec.describeKey, lastRun: null, lastSuccessAt: new Date(started.getTime() - 3_600_000), overdue: false, lastFailed: false, running: false, ...over };
}

describe.sequential("TA-171: a simulated clock never runs for every tenant", () => {
  it("TA-171: an unscoped run two hundred days ahead is refused before the worker runs or a JobRun is written", async () => {
    const before = calls.length;
    const future = new Date(Date.now() + 200 * 86_400_000);
    await expect(runJob("notifications:tidy", future)).rejects.toThrow(/clock/);
    expect(calls.length).toBe(before);
    expect(await db.jobRun.count({ where: { job: "notifications:tidy", startedAt: { gte: new Date(Date.now() + 86_400_000) } } })).toBe(0);
  });

  it("TA-171: a scoped run of a narrowable job may still take the simulated clock", async () => {
    const before = calls.length;
    const out = await runJob("notifications:tidy", new Date(Date.now() + 200 * 86_400_000), { userIds: [operatorA] });
    expect(out.status).toBe("done");
    expect(calls.length).toBe(before + 1);
  });

  it("TA-171: a run's JobRun row is stamped with the wall clock, not the clock it was handed", async () => {
    const handed = new Date(Date.now() + 2 * 60_000);
    const out = await runJob("notifications:tidy", handed);
    expect(out.status).toBe("done");
    if (out.status !== "done") return;
    const row = await db.jobRun.findUniqueOrThrow({ where: { id: out.runId }, select: { startedAt: true } });
    expect(row.startedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe("TA-522: the scheduler catches up what it missed", () => {
  it("TA-522: the jobs overdue and not running are the ones run at start", () => {
    const statuses = [
      status("notifications:tidy", { overdue: true }),
      status("retention:sweep", { overdue: true, running: true }),
      status("digest:weekly"),
    ];
    expect(overdueAtStart(statuses)).toEqual(["notifications:tidy"]);
  });

  it("TA-522: a scheduler started after a missed run fires that job once at start", async () => {
    const previous = process.env.JOBS_RUNNER;
    process.env.JOBS_RUNNER = "1";
    const ran: string[] = [];
    const handle = startJobScheduler({
      run: async (name) => {
        ran.push(name);
      },
      now: () => new Date("2026-11-14T03:31:00+05:30"),
      log: () => {},
      overdue: async () => ["notifications:tidy"],
    });
    try {
      expect(handle).not.toBeNull();
      await vi.waitFor(() => expect(ran).toEqual(["notifications:tidy"]));
    } finally {
      handle?.stop();
      if (previous === undefined) delete process.env.JOBS_RUNNER;
      else process.env.JOBS_RUNNER = previous;
    }
  });

  // A local wall-clock moment, so the hours read below do not depend on the machine's zone.
  const local = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo, d, h, mi);

  it("TA-522: a job that tells people is caught up only inside its own hour; housekeeping at any hour", () => {
    const threeAm = local(2026, 10, 13, 3, 5); // a Friday
    expect(catchUpAllowed("notifications:tidy", threeAm)).toBe(true);
    expect(catchUpAllowed("retention:sweep", local(2026, 10, 13, 14, 0))).toBe(true);
    expect(catchUpAllowed("fees:remind", threeAm)).toBe(false);
    expect(catchUpAllowed("fees:remind", local(2026, 10, 13, 9, 40))).toBe(true);
    expect(catchUpAllowed("library:remind", threeAm)).toBe(false);
    expect(catchUpAllowed("library:remind", local(2026, 10, 13, 17, 20))).toBe(true);
    expect(catchUpAllowed("digest:weekly", local(2026, 10, 12, 16, 10))).toBe(false); // Thursday at four
    expect(catchUpAllowed("digest:weekly", local(2026, 10, 13, 16, 10))).toBe(true); // Friday at four
    expect(catchUpAllowed("health:digest", threeAm)).toBe(false);
    expect(catchUpAllowed("pass:expiring", threeAm)).toBe(false);
    // Every job outside the housekeeping list counts as one that tells people.
    for (const name of Object.keys(JOBS) as JobStatus["name"][]) {
      // Hourly and every-minute jobs match every hour by their schedule, so only the jobs of one fixed hour are asked.
      if (!HOUSEKEEPING_JOBS.has(name) && !/^\S+ \*/.test(JOBS[name].schedule)) {
        expect(catchUpAllowed(name, local(2026, 10, 15, 23, 59)), name).toBe(false);
      }
    }
  });

  it("TA-522: a scheduler restarted at three in the morning runs the overdue tidy but leaves fees:remind, library:remind and digest:weekly for their slots", async () => {
    const previous = process.env.JOBS_RUNNER;
    process.env.JOBS_RUNNER = "1";
    const ran: string[] = [];
    const lines: string[] = [];
    const handle = startJobScheduler({
      run: async (name) => {
        ran.push(name);
      },
      now: () => local(2026, 10, 13, 3, 5),
      log: (line) => lines.push(line),
      overdue: async () => ["notifications:tidy", "fees:remind", "library:remind", "digest:weekly"],
    });
    try {
      expect(handle).not.toBeNull();
      await vi.waitFor(() => expect(ran).toEqual(["notifications:tidy"]));
      await vi.waitFor(() => expect(lines.filter((l) => l.includes('"catchUp":false')).length).toBe(3));
      expect(ran).toEqual(["notifications:tidy"]);
    } finally {
      handle?.stop();
      if (previous === undefined) delete process.env.JOBS_RUNNER;
      else process.env.JOBS_RUNNER = previous;
    }
  });

  it("TA-522: started inside its own hour, an overdue fees:remind is caught up", async () => {
    const previous = process.env.JOBS_RUNNER;
    process.env.JOBS_RUNNER = "1";
    const ran: string[] = [];
    const handle = startJobScheduler({
      run: async (name) => {
        ran.push(name);
      },
      now: () => local(2026, 10, 13, 9, 40),
      log: () => {},
      overdue: async () => ["fees:remind", "library:remind"],
    });
    try {
      await vi.waitFor(() => expect(ran).toEqual(["fees:remind"]));
    } finally {
      handle?.stop();
      if (previous === undefined) delete process.env.JOBS_RUNNER;
      else process.env.JOBS_RUNNER = previous;
    }
  });
});

describe.sequential("TA-360: a failed operator mail does not undo the watch", () => {
  it("TA-360: with the mail refused, every operator is told once, the alert row is written, and the next run is muted", async () => {
    mailFails = true;
    try {
      const statuses = [status("digest:weekly", { overdue: true, lastSuccessAt: new Date("2026-09-20T16:00:00Z") })];
      const first = await watchJobs({ now: started, statuses, operatorIds: [operatorA, operatorB] });
      expect(first).toMatchObject({ overdue: 1, alerted: 1, emailed: 0 });
      expect(await db.notification.count({ where: { userId: { in: [operatorA, operatorB] }, titleKey: "notifTitle.jobOverdue" } })).toBe(2);
      expect(await db.jobRun.count({ where: { job: "alert:digest:weekly", startedAt: started } })).toBe(1);

      const again = await watchJobs({ now: new Date(started.getTime() + 15 * 60_000), statuses, operatorIds: [operatorA, operatorB] });
      expect(again).toMatchObject({ alerted: 0, muted: 1 });
      expect(await db.notification.count({ where: { userId: { in: [operatorA, operatorB] }, titleKey: "notifTitle.jobOverdue" } })).toBe(2);
    } finally {
      mailFails = false;
    }
  });
});
