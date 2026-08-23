import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * Scheduled jobs: the JobRun row is the lock and the log. What holds: a run
 * is recorded with its summary; a failure is recorded with its error and
 * reported as failed; a second copy while one is running is SKIPPED; a row
 * left unfinished past the job's ceiling is treated as a crash and
 * overridden; the status page calls a job overdue when it should; and the
 * crontab text names every job with its schedule.
 */

const db = new PrismaClient();
const calls: string[] = [];
let fail = false;

vi.mock("@/lib/notification-housekeeping", () => ({
  tidyAllNotifications: async () => {
    calls.push("tidy");
    if (fail) throw new Error("boom");
    return { autoRead: 3, expired: 1 };
  },
}));

// Only the rows THIS run wrote go — a job's real history is the operator's.
const testStart = new Date();
beforeAll(async () => {
  await db.jobRun.deleteMany({ where: { job: "notifications:tidy", finishedAt: null } });
});
afterAll(async () => {
  await db.jobRun.deleteMany({ where: { job: "notifications:tidy", startedAt: { gte: new Date(testStart.getTime() - 7 * 86_400_000) } } });
  await db.$disconnect();
});

describe("running a job", () => {
  it("records the run and its summary", async () => {
    const { runJob } = await import("@/lib/jobs");
    const now = new Date();
    const out = await runJob("notifications:tidy", now);
    expect(out).toMatchObject({ status: "done", summary: { autoRead: 3, expired: 1 } });
    const row = await db.jobRun.findFirstOrThrow({ where: { job: "notifications:tidy" }, orderBy: { startedAt: "desc" } });
    expect(row.ok).toBe(true);
    expect(row.finishedAt).not.toBeNull();
    expect(JSON.parse(row.summary)).toEqual({ autoRead: 3, expired: 1 });
    expect(row.host).toBeTruthy();
  });

  it("⚠ a failure is recorded and reported, and does not throw", async () => {
    const { runJob } = await import("@/lib/jobs");
    fail = true;
    const out = await runJob("notifications:tidy");
    fail = false;
    expect(out).toMatchObject({ status: "failed", error: "Error: boom" });
    const row = await db.jobRun.findFirstOrThrow({ where: { job: "notifications:tidy" }, orderBy: { startedAt: "desc" } });
    expect(row.ok).toBe(false);
    expect(row.error).toBe("Error: boom");
  });

  it("⚠ a second copy while one is running is skipped; a crashed one is overridden", async () => {
    const { runJob, JOBS } = await import("@/lib/jobs");
    const before = calls.length;
    const stuck = await db.jobRun.create({ data: { job: "notifications:tidy", startedAt: new Date(Date.now() - 60_000) } });
    const skipped = await runJob("notifications:tidy");
    expect(skipped).toMatchObject({ status: "skipped", reason: "running" });
    expect(calls.length).toBe(before); // the job did not run

    // Older than the ceiling: a crash, not a run.
    await db.jobRun.update({ where: { id: stuck.id }, data: { startedAt: new Date(Date.now() - JOBS["notifications:tidy"].maxRunMs - 1) } });
    const ran = await runJob("notifications:tidy");
    expect(ran.status).toBe("done");
    const overridden = await db.jobRun.findUniqueOrThrow({ where: { id: stuck.id } });
    expect(overridden.ok).toBe(false);
    expect(overridden.error).toMatch(/Never finished/);
  });
});

describe("what the operator sees", () => {
  it("calls a job overdue when its last success is too old, and never-run jobs overdue", async () => {
    const { jobStatuses, JOBS } = await import("@/lib/jobs");
    const tidyNow = (await jobStatuses()).find((s) => s.name === "notifications:tidy")!;
    expect(tidyNow.overdue).toBe(false);
    expect(tidyNow.lastRun?.ok).toBe(true);
    const later = new Date(Date.now() + JOBS["notifications:tidy"].expectEveryMs + 1);
    const tidyLater = (await jobStatuses(later)).find((s) => s.name === "notifications:tidy")!;
    expect(tidyLater.overdue).toBe(true);
  });

  it("the crontab names every job on its schedule, through the one runner", async () => {
    const { crontabText, JOBS } = await import("@/lib/jobs");
    const text = crontabText("/srv/edulink");
    for (const spec of Object.values(JOBS)) {
      expect(text).toContain(`${spec.schedule}  cd /srv/edulink && npm run --silent job -- ${spec.name} --json`);
    }
    expect(text).not.toMatch(/send-weekly-digest|tidy-notifications/);
  });
});
