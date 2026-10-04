import "server-only";
import { hostname } from "node:os";
import { db } from "./db";
import { tidyAllNotifications } from "./notification-housekeeping";
import { sweepExpired } from "./retention";
import { sendWeeklyDigests } from "./digest";
import { reclaimOrphans } from "./orphans";
import { runDueDepartures } from "./school-record";
import { sendOperatorHealthDigest, watchJobs } from "./job-health";
import { sendFeeReminders } from "./fees-reports";
import { reconcileOnlinePayments } from "./fees-payments";
import { drainQueue } from "./messaging";
import { deliverQueuedCirculars } from "./circulars";
import { releaseSeatPayments, remindSessions } from "./gig-sessions";
import { expireOffers } from "./admissions";
import { expireInvites } from "./invites";
import { refreshMinority } from "./birthdate";
import { expireRequests } from "./request-expiry";
import { rebuildQuestionStats } from "./bank-tools";
import { sampleUsage } from "./plans";
import { remindSubscriptions } from "./subscriptions";
import { remindDueTomorrow } from "./library";
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

export type JobName = "notifications:tidy" | "digest:weekly" | "files:reclaim" | "departures:run" | "health:digest" | "fees:remind" | "fees:reconcile" | "messages:send" | "circulars:deliver" | "gigs:remind" | "gigs:release" | "retention:sweep" | "admissions:expire-offers" | "accounts:tidy" | "jobs:watch" | "usage:sample" | "bank:stats" | "library:remind";

/**
 * What one run of a job hands back: the log line, and — for jobs whose work
 * is per-tenant — the same work told school by school. `perSchool` is stored
 * inside the JobRun summary under its own key and read by /root/jobs/schools;
 * schools with nothing to do are absent, so absence is health. Counts only,
 * never names or content: a JobRun is a whole-server row outside the tenant
 * fence, and it must stay safe to be one.
 */
export type JobWork = {
  summary: Record<string, number | string | boolean>;
  perSchool?: Record<string, Record<string, number>>;
};

/**
 * WHAT A RUN IS HANDED (LIFECYCLE-10, 4 Oct 2026): the clock, and — for a
 * dry run on a test's own tenants or a simulated year — a scope. Every job is
 * given both; a job whose worker cannot narrow to a key says so in
 * `narrows`, and `runJob` refuses a scope naming a key it would ignore, so a
 * scoped run never quietly reaches every tenant (the retention sweep's
 * LIFECYCLE-1 lesson).
 */
export type JobScope = { schoolIds?: string[]; userIds?: string[] };
export type JobRunOptions = { now: Date; scope?: JobScope };

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
  /** The scope keys this job's worker honours; an empty list means it cannot be narrowed. */
  narrows: readonly (keyof JobScope)[];
  run: (opts: JobRunOptions) => Promise<JobWork>;
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
    narrows: ["userIds"],
    run: async ({ now, scope }) => {
      const { autoRead, expired, perSchool } = await tidyAllNotifications(now, scope?.userIds ? { onlyUserIds: scope.userIds } : {});
      return { summary: { autoRead, expired }, perSchool };
    },
  },
  "retention:sweep": {
    name: "retention:sweep",
    schedule: "0 4 * * *",
    describeKey: "root.jobDescRetention",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: ["schoolIds", "userIds"],
    run: async ({ now, scope }) => {
      // The sweep's own guard decides what a scope with a future clock may touch (retention.ts).
      const { summary, perSchool } = await sweepExpired(now, undefined, scope ?? {});
      return { summary, perSchool };
    },
  },
  "admissions:expire-offers": {
    name: "admissions:expire-offers",
    // Hourly, off the quarter fees:reconcile runs on: an offer's date is a
    // day, and the family should read "expired" within the hour of it.
    schedule: "45 * * * *",
    describeKey: "root.jobDescExpireOffers",
    maxRunMs: 30 * 60_000,
    expectEveryMs: 3 * HOUR,
    narrows: [],
    run: async ({ now }) => {
      const { summary, perSchool } = await expireOffers(now);
      return { summary, perSchool };
    },
  },
  "usage:sample": {
    name: "usage:sample",
    // Nightly, after the day's last texts and before the tidies: each live
    // school's month so far — pupils, texts, storage, people active — as one
    // UsageSample row, the table's one writer (src/lib/plans.ts).
    schedule: "10 2 * * *",
    describeKey: "root.jobDescUsage",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: ["schoolIds"],
    run: async ({ now, scope }) => {
      const { summary, perSchool } = await sampleUsage(now, scope?.schoolIds ? { schoolIds: scope.schoolIds } : {});
      return { summary, perSchool };
    },
  },
  "accounts:tidy": {
    name: "accounts:tidy",
    // Daily, between the notifications tidy and the retention sweep: the two
    // stored copies on accounts that go stale by the calendar alone — an
    // invitation past its date, a pupil past their eighteenth birthday.
    schedule: "45 3 * * *",
    describeKey: "root.jobDescAccountsTidy",
    maxRunMs: 30 * 60_000,
    expectEveryMs: 2 * DAY,
    narrows: ["schoolIds", "userIds"],
    run: async ({ now, scope }) => {
      const schools = scope?.schoolIds ? { schoolIds: scope.schoolIds } : {};
      // A scope by school narrows the minority refresh to the people of those schools, never to everybody.
      const userIds = scope?.userIds ?? (scope?.schoolIds ? [...new Set((await db.membership.findMany({ where: { schoolId: { in: scope.schoolIds } }, select: { userId: true } })).map((m) => m.userId))] : undefined);
      const invites = await expireInvites(now, schools);
      const minors = await refreshMinority(now, userIds ? { userIds } : {});
      // Joins and guardian claims nobody decided in thirty days: see lib/request-expiry.ts.
      const requests = await expireRequests(now, schools);
      // Subscriptions due within a week or past due, told to the operators
      // once per school per week (lib/subscriptions.ts): here rather than a
      // job of its own, which would cost a name on the jobs page and a line
      // in three dictionaries for one daily question.
      // A test-fixture tenant is never reminded (isTestFixture: false in the worker): a fixture
      // can exercise the reminder only by lifting its flag for the call, as zz-lifecycle.ts does (LIFECYCLE-9).
      const subscriptions = await remindSubscriptions(now, schools);
      // The regulators' windows opening within a fortnight, told to each college's IQAC and office once per window (lib/operator-college.ts), here for the same reason.
      const { remindRegulatorDeadlines } = await import("./operator-college");
      const regulators = await remindRegulatorDeadlines(now, schools);
      const perSchool: Record<string, Record<string, number>> = {};
      for (const [schoolId, counts] of [...Object.entries(invites.perSchool), ...Object.entries(requests.perSchool)]) {
        perSchool[schoolId] = { ...perSchool[schoolId], ...counts };
      }
      return { summary: { invitesExpired: invites.expired, adults: minors.adults, minors: minors.minors, joinsExpired: requests.joins, claimsExpired: requests.claims, subscriptionsDue: subscriptions.due, subscriptionsReminded: subscriptions.reminded, regulatorWindows: regulators.windows, regulatorReminded: regulators.reminded }, perSchool };
    },
  },
  "digest:weekly": {
    name: "digest:weekly",
    schedule: "0 16 * * 5",
    describeKey: "root.jobDescDigest",
    maxRunMs: 2 * HOUR,
    expectEveryMs: 8 * DAY,
    narrows: ["userIds"],
    run: async ({ scope }) => {
      const { sent, skipped, quiet, perSchool } = await sendWeeklyDigests(scope?.userIds ? { onlyParentUserIds: scope.userIds } : {});
      return { summary: { sent, skipped, quiet }, perSchool };
    },
  },
  "departures:run": {
    name: "departures:run",
    schedule: "0 1 * * *",
    describeKey: "root.jobDescDepartures",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: ["schoolIds"],
    run: async ({ now, scope }) => {
      const { executed, skippedStale, stuck, perSchool } = await runDueDepartures(now, scope?.schoolIds ? { schoolIds: scope.schoolIds } : {});
      return { summary: { executed, skippedStale, stuck }, perSchool };
    },
  },
  "health:digest": {
    name: "health:digest",
    // Morning, AFTER the overnight jobs (01:00, 03:00, 03:30) — so the email
    // reports on runs a few hours old, not yesterday's.
    schedule: "0 7 * * *",
    describeKey: "root.jobDescHealth",
    maxRunMs: 15 * 60_000,
    expectEveryMs: 2 * DAY,
    narrows: [],
    run: async ({ now }) => {
      const { emailed, overdue, failed, attention, quiet } = await sendOperatorHealthDigest(now);
      return { summary: { emailed, overdue, failed, attention, quiet } };
    },
  },
  "files:reclaim": {
    name: "files:reclaim",
    schedule: "0 3 * * *",
    describeKey: "root.jobDescReclaim",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: [],
    run: async () => {
      const report = await reclaimOrphans({ dryRun: false });
      // Counts only — the report lists keys, which are not for a log line.
      // The per-school story is MISSING files, not orphans: an orphan belongs
      // to nobody by definition, but a record whose bytes are gone has an
      // owner, and that owner's card should say so. See OrphanReport.
      const summary = Object.fromEntries(
        Object.entries(report).filter(([, v]) => typeof v === "number" || typeof v === "boolean"),
      ) as Record<string, number | boolean>;
      return { summary, perSchool: report.perSchool };
    },
  },
  "fees:remind": {
    name: "fees:remind",
    // 09:00 in the process's zone (Asia/Kolkata in fly.toml): a reminder
    // that lands at breakfast, not at three in the morning.
    schedule: "0 9 * * *",
    describeKey: "root.jobDescFeesRemind",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: [],
    run: async ({ now }) => {
      const { sent, perSchool } = await sendFeeReminders(now);
      return { summary: { sent }, perSchool };
    },
  },
  "fees:reconcile": {
    name: "fees:reconcile",
    schedule: "15 * * * *",
    describeKey: "root.jobDescFeesReconcile",
    maxRunMs: 30 * 60_000,
    expectEveryMs: 3 * HOUR,
    narrows: [],
    run: async ({ now }) => {
      const { checked, settled, expired, perSchool } = await reconcileOnlinePayments(now);
      return { summary: { checked, settled, expired }, perSchool };
    },
  },
  "circulars:deliver": {
    name: "circulars:deliver",
    // Every minute, like messages:send: a circular to a whole school is
    // queued at publish and told here, so the office's click never waits.
    schedule: "* * * * *",
    describeKey: "root.jobDescCirculars",
    maxRunMs: 10 * 60_000,
    expectEveryMs: 15 * 60_000,
    narrows: [],
    run: async () => {
      const { delivered, recipients, perSchool } = await deliverQueuedCirculars();
      return { summary: { delivered, recipients }, perSchool };
    },
  },
  "gigs:remind": {
    name: "gigs:remind",
    // Hourly: a confirmed seat in a session that starts within a day is told
    // to the family once and its provider once for the slot.
    schedule: "20 * * * *",
    describeKey: "root.jobDescGigsRemind",
    maxRunMs: 10 * 60_000,
    expectEveryMs: 3 * HOUR,
    narrows: [],
    run: async ({ now }) => {
      const { reminded, perSchool } = await remindSessions(now);
      return { summary: { reminded }, perSchool };
    },
  },
  "gigs:release": {
    name: "gigs:release",
    // Hourly, beside gigs:remind: a paid seat left unpaid for half an hour is
    // given back; a seat whose hold has run (delivered plus 48 hours) has its
    // transfer's hold taken off at Razorpay, which settles the expert, and the
    // run's released seats are invoiced per expert; a refund or a release the
    // gateway refused is tried again; linked accounts under review are asked
    // after (decision 0004, third amendment of 2 October 2026).
    schedule: "50 * * * *",
    describeKey: "root.jobDescGigsRelease",
    maxRunMs: 10 * 60_000,
    expectEveryMs: 3 * HOUR,
    narrows: [],
    run: async ({ now }) => {
      const { expired, released, releasedPaise, invoiced, due, duePaise, refunded, held, failed, payoutsOpened, linksChecked } = await releaseSeatPayments(now);
      return { summary: { expired, released, releasedPaise, invoiced, due, duePaise, refunded, held, failed, payoutsOpened, linksChecked } };
    },
  },
  "jobs:watch": {
    name: "jobs:watch",
    // Every quarter hour: the alarm between the morning digests. A job past
    // its own `expectEveryMs` is told to every operator, in the app and by
    // email, once per job per twelve hours (job-health.ts, watchJobs).
    schedule: "*/15 * * * *",
    describeKey: "root.jobDescWatch",
    maxRunMs: 5 * 60_000,
    expectEveryMs: HOUR,
    narrows: [],
    run: async ({ now }) => {
      const { overdue, alerted, muted, operators, emailed } = await watchJobs({ now });
      return { summary: { overdue, alerted, muted, operators, emailed } };
    },
  },
  "messages:send": {
    name: "messages:send",
    // Every minute: a broadcast to a thousand families is queued in the
    // request and drained here, three hundred a run.
    schedule: "* * * * *",
    describeKey: "root.jobDescMessages",
    maxRunMs: 10 * 60_000,
    expectEveryMs: 15 * 60_000,
    narrows: [],
    run: async () => {
      const { sent, failed, perSchool } = await drainQueue();
      return { summary: { sent, failed }, perSchool };
    },
  },
  "bank:stats": {
    name: "bank:stats",
    // Nightly, after the retention sweep has had its say on the answer rows:
    // the one writer of QuestionStat (bank-tools.ts, rebuildQuestionStats),
    // every (question, grade) bucket recomputed from every school's answers,
    // which only the owner connection a job runs on can read across schools.
    schedule: "20 4 * * *",
    describeKey: "root.jobDescBankStats",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: [],
    run: async () => {
      const { questions, buckets, removed } = await rebuildQuestionStats();
      return { summary: { questions, buckets, removed } };
    },
  },
  "library:remind": {
    name: "library:remind",
    // 17:00 in the process's zone: the library module's "due tomorrow" push
    // (3 Oct 2026), after school and before the bag is packed for the
    // morning. Once per loan per day (LibraryIssue.remindedOn), only at
    // schools with the library switched on.
    schedule: "0 17 * * *",
    describeKey: "root.jobDescLibraryRemind",
    maxRunMs: HOUR,
    expectEveryMs: 2 * DAY,
    narrows: ["schoolIds"],
    run: async ({ now, scope }) => {
      if (!scope?.schoolIds) {
        const { sent, perSchool } = await remindDueTomorrow(now);
        return { summary: { sent }, perSchool };
      }
      let sent = 0;
      const perSchool: Record<string, Record<string, number>> = {};
      for (const schoolId of scope.schoolIds) {
        const one = await remindDueTomorrow(now, { schoolId });
        sent += one.sent;
        Object.assign(perSchool, one.perSchool);
      }
      return { summary: { sent }, perSchool };
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

/**
 * One run of a job. `now` reaches the worker (LIFECYCLE-10), so a job can be
 * run on a simulated day. A `scope` narrows it to tenants or people: refused
 * when it names a key the job cannot honour, and run without the JobRun row
 * and its lock, because a dry run on a test's tenants is not the job having
 * run for the server and must not read as its last success on /root/jobs.
 */
export async function runJob(name: JobName, now: Date = new Date(), scope?: JobScope): Promise<RunOutcome> {
  const spec = JOBS[name];
  if (scope) {
    const named = (Object.keys(scope) as (keyof JobScope)[]).filter((k) => scope[k] !== undefined);
    const ignored = named.filter((k) => !spec.narrows.includes(k));
    if (named.length === 0 || ignored.length > 0) throw new Error(`${name} cannot be narrowed by ${ignored.join(", ") || "an empty scope"}; it would run for every tenant`);
    const started = Date.now();
    try {
      const work = await spec.run({ now, scope });
      const summary: Record<string, unknown> = work.perSchool && Object.keys(work.perSchool).length > 0 ? { ...work.summary, perSchool: work.perSchool } : { ...work.summary };
      return { status: "done", runId: "", ms: Date.now() - started, summary };
    } catch (error) {
      return { status: "failed", runId: "", ms: Date.now() - started, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
    }
  }

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
    const work = await spec.run({ now });
    // One stored object: the counts, with the per-school map under its own
    // key when there is one — so the record of a run is a single row, and a
    // reader that only wants the line can drop `perSchool` and have it.
    const summary: Record<string, unknown> =
      work.perSchool && Object.keys(work.perSchool).length > 0
        ? { ...work.summary, perSchool: work.perSchool }
        : { ...work.summary };
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
    "# Shalaghar scheduled jobs — generated from src/lib/jobs.ts; do not edit by hand.",
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
