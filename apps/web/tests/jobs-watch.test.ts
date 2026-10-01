/**
 * The overdue-job watch (jobs:watch): an overdue job alerts every operator
 * once — an in-app notification and the operator email — and not again
 * within twelve hours; a healthy job alerts nobody; the watch never alerts
 * on itself; the alert's record is a JobRun row the operator's page reads
 * back as "Alerted at". The statuses and the operators are this file's own,
 * so no real operator is told and no real run is read.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { JOB_ALERT_REPEAT_MS, lastJobAlerts, watchJobs } from "@/lib/job-health";
import { JOBS, type JobStatus } from "@/lib/jobs";

const db = new PrismaClient();
const STAMP = Date.now();
const EMAIL = `zz-jobswatch-op-${STAMP}@test.invalid`;
let operatorId = "";
let muteId = "";
const started = new Date();

function status(name: JobStatus["name"], over: Partial<JobStatus> = {}): JobStatus {
  const spec = JOBS[name];
  return { name, schedule: spec.schedule, describeKey: spec.describeKey, lastRun: null, lastSuccessAt: new Date(started.getTime() - 3_600_000), overdue: false, lastFailed: false, running: false, ...over };
}

beforeAll(async () => {
  operatorId = (await db.user.create({ data: { name: "ZZ JobsWatch Operator", email: EMAIL, isSuperuser: true }, select: { id: true } })).id;
  muteId = (await db.user.create({ data: { name: "ZZ JobsWatch Muted", email: null, isSuperuser: true, disabledAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.jobRun.deleteMany({ where: { job: { startsWith: "alert:" }, startedAt: { gte: started } } });
  await db.outboundEmail.deleteMany({ where: { to: EMAIL } });
  await db.notification.deleteMany({ where: { userId: { in: [operatorId, muteId] } } });
  await db.user.deleteMany({ where: { id: { in: [operatorId, muteId] } } });
  await db.$disconnect();
});

describe("jobs:watch", () => {
  it("a healthy table alerts nobody and writes nothing", async () => {
    const out = await watchJobs({ now: started, statuses: [status("digest:weekly"), status("files:reclaim")], operatorIds: [operatorId] });
    expect(out).toEqual({ overdue: 0, alerted: 0, muted: 0, operators: 0, emailed: 0 });
    expect(await db.notification.count({ where: { userId: operatorId } })).toBe(0);
  });

  it("an overdue job alerts once, by notification and by email, then not again within twelve hours", async () => {
    const statuses = [status("digest:weekly", { overdue: true, lastSuccessAt: new Date("2026-09-20T16:00:00Z") }), status("files:reclaim")];
    const first = await watchJobs({ now: started, statuses, operatorIds: [operatorId, muteId] });
    expect(first).toEqual({ overdue: 1, alerted: 1, muted: 0, operators: 1, emailed: 1 });

    const note = await db.notification.findFirstOrThrow({ where: { userId: operatorId, titleKey: "notifTitle.jobOverdue" } });
    expect(note.title).toBe("A scheduled job is overdue: digest:weekly");
    expect(note.body).toContain("digest:weekly last succeeded at 2026-09-20 16:00 UTC and is expected every 192 hours.");
    expect(note.url).toBe("/root/jobs?state=overdue");
    expect(note.kind).toBe("SYSTEM");
    const mail = await db.outboundEmail.findFirstOrThrow({ where: { to: EMAIL } });
    expect(mail.subject).toBe("Shalaghar: A scheduled job is overdue: digest:weekly");
    expect(mail.text).toBe("digest:weekly last succeeded at 2026-09-20 16:00 UTC and is expected every 192 hours. Open the jobs page to see what is waiting.");

    // Ten minutes on, still overdue: muted. Twelve hours on: alerted again.
    const again = await watchJobs({ now: new Date(started.getTime() + 10 * 60_000), statuses, operatorIds: [operatorId] });
    expect(again).toEqual({ overdue: 1, alerted: 0, muted: 1, operators: 0, emailed: 0 });
    expect(await db.notification.count({ where: { userId: operatorId, titleKey: "notifTitle.jobOverdue" } })).toBe(1);
    expect(await db.outboundEmail.count({ where: { to: EMAIL } })).toBe(1);

    const later = new Date(started.getTime() + JOB_ALERT_REPEAT_MS + 1_000);
    const third = await watchJobs({ now: later, statuses, operatorIds: [operatorId] });
    expect(third).toEqual({ overdue: 1, alerted: 1, muted: 0, operators: 1, emailed: 1 });
    expect(await db.notification.count({ where: { userId: operatorId, titleKey: "notifTitle.jobOverdue" } })).toBe(2);

    // The record the operator's page reads: the latest alert per job.
    const alerts = await lastJobAlerts();
    expect(alerts.get("digest:weekly")?.getTime()).toBe(later.getTime());
    expect(alerts.has("files:reclaim")).toBe(false);
  });

  it("a job that never ran says so, and the watch never alerts on itself", async () => {
    const statuses = [status("jobs:watch", { overdue: true, lastSuccessAt: null }), status("accounts:tidy", { overdue: true, lastSuccessAt: null })];
    const out = await watchJobs({ now: started, statuses, operatorIds: [operatorId] });
    expect(out).toEqual({ overdue: 1, alerted: 1, muted: 0, operators: 1, emailed: 1 });
    const note = await db.notification.findFirstOrThrow({ where: { userId: operatorId, title: "A scheduled job is overdue: accounts:tidy" } });
    expect(note.body).toContain("accounts:tidy has never succeeded and is expected every 48 hours.");
    expect(await db.jobRun.count({ where: { job: "alert:jobs:watch" } })).toBe(0);
  });
});
