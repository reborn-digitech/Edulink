import "server-only";
import { hostname } from "node:os";
import { db } from "./db";
import { tidyAllNotifications } from "./notification-housekeeping";
import { sendWeeklyDigests } from "./digest";
import { reclaimOrphans } from "./orphans";
import { runDueDepartures } from "./school-record";
import { translator, type TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The scheduled jobs, in one place.
 *
 * THREE SCRIPTS, ONE SHAPE. The weekly digest, the notification tidy and the
 * file sweep each had a header saying "cron-ready" and a recipe in the
 * README, and nothing in the repo installed any of them — so a deployment
 * that forgot one found out in September. Now every job is an entry here
 * with its schedule beside it; `ops/crontab` is GENERATED from this table,
 * `npm run cron:install` puts it in the operator's crontab, and /root/jobs
 * shows whether each one has actually been running.
 *
 * THE ROW IS THE LOCK. `runJob` writes a JobRun row before it starts and
 * finishes it after; a second copy that finds an unfinished row younger
 * than the job's own ceiling declines to start. Two instances behind a load
 * balancer both firing at 03:30 is the ordinary case, not an edge, and a
 * deletion pass must never race itself. A row left unfinished past the
 * ceiling is treated as a crash and overridden, and said so in the summary.
 *
 * EVERY JOB RUNS AS THE OWNER. A job is operator work by definition — it
 * reaches every tenant — so the `job` script goes through with-admin-db,
 * the same door migrations and seeds use.
 */

export type JobName = "notifications:tidy" | "digest:weekly" | "files:reclaim" | "departures:run";

export type JobSpec = {
  name: JobName;
  /** Five-field crontab schedule. */
  schedule: string;
  /** What the operator reads on /root/jobs — a key, rendered in their language. */
  describeKey: TranslationKey;
  /** A run older than this and still unfinished is a crash, not a run. */
  maxRunMs: number;
  /** The job is OVERDUE when the last success is older than this. */
  expectEveryMs: number;
  run: () => Promise<Record<string, number | string | boolean>>;
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const JOBS: Record<JobName, JobSpec> = {
  "notifications:tidy": {
    name: "notifications:tidy",
    schedule: "30 3 * * *",
    describeKey: "root.jobDescTidy",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    run: () => tidyAllNotifications(),
  },
  "digest:weekly": {
    name: "digest:weekly",
    schedule: "0 16 * * 5",
    describeKey: "root.jobDescDigest",
    maxRunMs: 2 * HOUR,
    expectEveryMs: 8 * DAY,
    run: () => sendWeeklyDigests(),
  },
  "departures:run": {
    name: "departures:run",
    schedule: "0 1 * * *",
    describeKey: "root.jobDescDepartures",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    run: () => runDueDepartures(),
  },
  "files:reclaim": {
    name: "files:reclaim",
    schedule: "0 3 * * *",
    describeKey: "root.jobDescReclaim",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    run: async () => {
      const report = await reclaimOrphans({ dryRun: false });
      // Counts only — the report lists keys, which are not for a log line.
      return Object.fromEntries(
        Object.entries(report).filter(([, v]) => typeof v === "number" || typeof v === "boolean"),
      ) as Record<string, number | boolean>;
    },
  },
};

export const JOB_NAMES = Object.keys(JOBS) as JobName[];

export function isJobName(value: string): value is JobName {
  return (JOB_NAMES as string[]).includes(value);
}

export type RunOutcome =
  | { status: "done"; runId: string; ms: number; summary: Record<string, unknown> }
  | { status: "failed"; runId: string; ms: number; error: string }
  | { status: "skipped"; reason: "running"; since: Date };

export async function runJob(name: JobName, now: Date = new Date()): Promise<RunOutcome> {
  const spec = JOBS[name];

  const live = await db.jobRun.findFirst({
    where: { job: name, finishedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true },
  });
  if (live) {
    if (now.getTime() - live.startedAt.getTime() < spec.maxRunMs) {
      return { status: "skipped", reason: "running", since: live.startedAt };
    }
    // Past the ceiling: whatever held this row is not coming back.
    await db.jobRun.update({
      where: { id: live.id },
      data: { finishedAt: now, ok: false, error: `Never finished; overridden after ${Math.round(spec.maxRunMs / 60_000)} min` },
    });
  }

  const run = await db.jobRun.create({
    data: { job: name, startedAt: now, host: hostname() },
    select: { id: true },
  });
  const started = Date.now();
  try {
    const summary = await spec.run();
    const ms = Date.now() - started;
    await db.jobRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), ok: true, summary: JSON.stringify(summary) },
    });
    return { status: "done", runId: run.id, ms, summary };
  } catch (error) {
    const ms = Date.now() - started;
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    await db.jobRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), ok: false, error: message.slice(0, 2000) },
    });
    return { status: "failed", runId: run.id, ms, error: message };
  }
}

/** What /root/jobs shows: per job, the last run and whether it is overdue. */
export type JobStatus = {
  name: JobName;
  schedule: string;
  describeKey: TranslationKey;
  lastRun: { startedAt: Date; finishedAt: Date | null; ok: boolean | null; summary: string; error: string | null; host: string | null } | null;
  lastSuccessAt: Date | null;
  /** Never run, or last success older than the job expects. */
  overdue: boolean;
  /** The most recent finished run did not succeed — on time or not, somebody should look. */
  lastFailed: boolean;
  running: boolean;
};

export async function jobStatuses(now: Date = new Date()): Promise<JobStatus[]> {
  const out: JobStatus[] = [];
  for (const spec of Object.values(JOBS)) {
    const [last, lastOk] = await Promise.all([
      db.jobRun.findFirst({ where: { job: spec.name }, orderBy: { startedAt: "desc" } }),
      db.jobRun.findFirst({ where: { job: spec.name, ok: true }, orderBy: { startedAt: "desc" }, select: { startedAt: true } }),
    ]);
    const running = !!last && last.finishedAt === null && now.getTime() - last.startedAt.getTime() < spec.maxRunMs;
    out.push({
      name: spec.name,
      schedule: spec.schedule,
      describeKey: spec.describeKey,
      lastRun: last
        ? { startedAt: last.startedAt, finishedAt: last.finishedAt, ok: last.ok, summary: last.summary, error: last.error, host: last.host }
        : null,
      lastSuccessAt: lastOk?.startedAt ?? null,
      overdue: !lastOk || now.getTime() - lastOk.startedAt.getTime() > spec.expectEveryMs,
      lastFailed: !!last && last.ok === false,
      running,
    });
  }
  return out;
}

/**
 * The crontab block, generated from the table above so the schedule can
 * never disagree with it. The installer writes it into the crontab and
 * `cron:show` compares what is installed against this, so a schedule edited
 * here and not reinstalled is reported rather than silently ignored.
 */
export function crontabText(appDir: string): string {
  const lines = [
    "# EduLink scheduled jobs — generated from src/lib/jobs.ts; do not edit by hand.",
    "# Install with `npm run cron:install`, inspect with `npm run cron:show`.",
    "SHELL=/bin/sh",
    "PATH=/usr/local/bin:/usr/bin:/bin",
  ];
  // A crontab is read by whoever runs the server, in the language stored
  // artefacts keep — English, the notify()/email precedent.
  const tEn = translator("en");
  for (const spec of Object.values(JOBS)) {
    lines.push(`# ${tEn(spec.describeKey)}`);
    lines.push(`${spec.schedule}  cd ${appDir} && npm run --silent job -- ${spec.name} --json >> ${appDir}/logs/jobs.log 2>&1`);
  }
  return lines.join("\n") + "\n";
}
