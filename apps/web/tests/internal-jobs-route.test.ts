import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/internal/jobs/route";
import { jobSchedulerRunning } from "@/lib/job-scheduler";

/** The kick the jobs runner sends itself: nothing for any other process, the schedule for the runner, once. */
describe("POST /api/internal/jobs", () => {
  const saved = process.env.JOBS_RUNNER;
  afterEach(() => {
    if (saved === undefined) delete process.env.JOBS_RUNNER;
    else process.env.JOBS_RUNNER = saved;
  });

  it("is a 404 in a process that is not the jobs runner", async () => {
    delete process.env.JOBS_RUNNER;
    expect((await POST()).status).toBe(404);
    expect(jobSchedulerRunning()).toBe(false);
  });

  it("starts the schedule in the runner, and a second kick reports it already running", async () => {
    process.env.JOBS_RUNNER = "1";
    const first = await (await POST()).json();
    expect(first.started).toBe(true);
    expect(first.already).toBe(false);
    expect(first.jobs.map((j: { name: string }) => j.name)).toContain("notifications:tidy");
    const second = await (await POST()).json();
    expect(second.already).toBe(true);
    expect(jobSchedulerRunning()).toBe(true);
  });
});
