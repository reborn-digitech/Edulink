import { afterEach, describe, expect, it, vi } from "vitest";
import { matchesCron, startJobScheduler } from "@/lib/job-scheduler";
import { JOBS } from "@/lib/jobs";

/**
 * The in-process scheduler the container's jobs runner uses. The registry's
 * own schedules are what it reads, so the assertions here run them through
 * the matcher rather than invented ones — if a schedule in jobs.ts ever stops
 * parsing, this is where it shows.
 */
const local = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo - 1, d, h, mi);

describe("matchesCron", () => {
  it("reads every schedule in the registry", () => {
    for (const spec of Object.values(JOBS)) expect(() => matchesCron(spec.schedule, new Date())).not.toThrow();
  });
  it("matches a daily time on its minute and not the minute after", () => {
    expect(matchesCron("30 3 * * *", local(2026, 9, 15, 3, 30))).toBe(true);
    expect(matchesCron("30 3 * * *", local(2026, 9, 15, 3, 31))).toBe(false);
    expect(matchesCron("30 3 * * *", local(2026, 9, 15, 4, 30))).toBe(false);
  });
  it("matches a weekly job on its weekday only (Friday 16:00)", () => {
    expect(matchesCron("0 16 * * 5", local(2026, 9, 18, 16, 0))).toBe(true); // a Friday
    expect(matchesCron("0 16 * * 5", local(2026, 9, 17, 16, 0))).toBe(false); // Thursday
    expect(matchesCron("0 16 * * 7", local(2026, 9, 20, 16, 0))).toBe(true); // 7 is Sunday too
  });
  it("understands lists, ranges and steps", () => {
    expect(matchesCron("*/15 * * * *", local(2026, 9, 15, 10, 45))).toBe(true);
    expect(matchesCron("*/15 * * * *", local(2026, 9, 15, 10, 50))).toBe(false);
    expect(matchesCron("0 9-17 * * 1-5", local(2026, 9, 15, 13, 0))).toBe(true); // Tuesday
    expect(matchesCron("0 9-17 * * 1-5", local(2026, 9, 19, 13, 0))).toBe(false); // Saturday
    expect(matchesCron("0 0 1,15 * *", local(2026, 9, 15, 0, 0))).toBe(true);
    expect(matchesCron("0 0 1,15 * *", local(2026, 9, 16, 0, 0))).toBe(false);
  });
  it("uses cron's either-or rule when both day fields are set", () => {
    // The 1st of the month OR a Monday.
    expect(matchesCron("0 0 1 * 1", local(2026, 9, 14, 0, 0))).toBe(true); // Monday the 14th
    expect(matchesCron("0 0 1 * 1", local(2026, 9, 1, 0, 0))).toBe(true); // the 1st, a Tuesday
    expect(matchesCron("0 0 1 * 1", local(2026, 9, 15, 0, 0))).toBe(false);
  });
  it("refuses a schedule that is not five fields or is out of range", () => {
    expect(() => matchesCron("0 3 * *", new Date())).toThrow(/five-field/);
    expect(() => matchesCron("60 3 * * *", new Date())).toThrow(/bad field/);
  });
});

describe("startJobScheduler", () => {
  const saved = process.env.JOBS_RUNNER;
  afterEach(() => {
    if (saved === undefined) delete process.env.JOBS_RUNNER;
    else process.env.JOBS_RUNNER = saved;
  });

  it("does nothing at all unless JOBS_RUNNER is 1 — the web process must not schedule", () => {
    delete process.env.JOBS_RUNNER;
    const log = vi.fn();
    expect(startJobScheduler({ log, run: async () => ({}) })).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });

  it("fires the jobs whose schedule matches the minute, once per minute, and logs each outcome", async () => {
    process.env.JOBS_RUNNER = "1";
    const ran: string[] = [];
    const log = vi.fn();
    const at = local(2026, 9, 15, 3, 30); // notifications:tidy is "30 3 * * *"
    const handle = startJobScheduler({ run: async (name) => { ran.push(name); return { status: "done" }; }, now: () => at, log });
    expect(handle).not.toBeNull();
    // messages:send is "* * * * *" and fires every minute by design; the
    // lists below look past it so the once-per-minute rule is read on a
    // job with a real schedule.
    const daily = (jobs: string[]) => jobs.filter((j) => j !== "messages:send");
    try {
      expect(daily(await handle!.tick(at))).toEqual(["notifications:tidy"]);
      expect(await handle!.tick(at)).toEqual([]); // same minute: not again, messages:send included
      expect(daily(await handle!.tick(local(2026, 9, 15, 3, 31)))).toEqual([]);
      expect(daily(await handle!.tick(local(2026, 9, 16, 3, 30)))).toEqual(["notifications:tidy"]); // next day: again
      await new Promise((r) => setTimeout(r, 0));
      expect(daily(ran)).toEqual(["notifications:tidy", "notifications:tidy"]);
      expect(ran.filter((j) => j === "messages:send")).toHaveLength(3); // three distinct minutes
      const lines = log.mock.calls.map(([l]) => JSON.parse(l as string));
      expect(lines[0]).toMatchObject({ scheduler: "in-process", started: true });
      expect(lines.filter((l) => l.job === "notifications:tidy" && l.outcome)).toHaveLength(2);
    } finally {
      handle!.stop();
    }
  });

  it("a job that throws is one error line, and the other jobs still fire", async () => {
    process.env.JOBS_RUNNER = "1";
    const log = vi.fn();
    const at = local(2026, 9, 18, 16, 0); // digest:weekly is "0 16 * * 5" (Friday)
    const handle = startJobScheduler({ run: async (name) => { if (name === "digest:weekly") throw new Error("mail is down"); return { status: "done" }; }, now: () => at, log });
    try {
      expect((await handle!.tick(at)).filter((j) => j !== "messages:send")).toEqual(["digest:weekly"]);
      await new Promise((r) => setTimeout(r, 0));
      const errors = log.mock.calls.map(([l]) => JSON.parse(l as string)).filter((l) => l.level === "error");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({ job: "digest:weekly", error: "mail is down" });
    } finally {
      handle!.stop();
    }
  });
});
