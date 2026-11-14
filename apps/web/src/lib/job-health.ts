import "server-only";
import { db } from "./db";
// A deliberate import cycle with jobs.ts: the registry's health:digest job
// calls sendOperatorHealthDigest below, and this file reads jobStatuses from
// the registry. Both sides touch the other only inside function bodies, never
// at module init, so the live bindings are settled by the time either runs.
import { JOBS, JOB_NAMES, jobStatuses, type JobName, type JobStatus } from "./jobs";
import { assertSuperuser } from "./superuser";
import { AccessError } from "./tenancy";
import { sendHealthDigestEmail } from "./email";
import { notify } from "./notify";
import { relativeTime } from "./dates";
import { translator } from "./i18n/dictionary";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The operator's cross-school view of job health.
 *
 * THE JOBS WRITE, THIS READS. Every scheduled job already reaches every
 * tenant — it runs as the owner, through with-admin-db — so the per-school
 * story of a run is recorded BY THE RUN, under `perSchool` in its JobRun
 * summary, and this file only reads that record back. No new cross-tenant
 * read path exists for the app user: JobRun is a whole-server table by
 * declaration, School is superuser-readable by policy, and the fence
 * around everything else stays exactly where it was.
 *
 * LATEST SUCCESSFUL RUN, PER JOB. Health is "what the machinery last did",
 * not an archive: each job contributes its most recent successful run, so a
 * school that was stuck on Monday and clean on Tuesday shows clean — and a
 * school absent from every map had nothing waiting, which is what health
 * looks like. Whether the runs themselves are HAPPENING is /root/jobs'
 * question (OVERDUE), deliberately not repeated here.
 *
 * ATTENTION MEANS SOMEBODY SHOULD ACT, not that work happened. A hundred
 * notices tidied is Tuesday; one departure with no admin to execute it is a
 * leaver silently accumulating, so `stuck` is the count that turns a row
 * red. New count keys default to unremarkable until listed here.
 */

/**
 * Counts that mean somebody should look, not just that work happened —
 * `stuck` is a leaver nobody can execute, `missing` a record whose bytes are
 * gone from disk. Exported so the two pages colour exactly these red.
 */
export const JOB_ATTENTION_KEYS = new Set(["stuck", "missing"]);

const needsAttention = (counts: Record<string, number>) =>
  Object.entries(counts).some(([key, value]) => JOB_ATTENTION_KEYS.has(key) && value > 0);

/**
 * What each count key is called on a page — one map, used by the operator's
 * view and the school's card alike, so a count never wears two names.
 * A key not listed renders as itself: future jobs stay legible, just plain.
 */
export const JOB_COUNT_LABELS: Record<string, TranslationKey> = {
  executed: "root.jobCountExecuted",
  stale: "root.jobCountStale",
  stuck: "root.jobCountStuck",
  autoRead: "root.jobCountAutoRead",
  expired: "root.jobCountExpired",
  digests: "root.jobCountDigests",
  children: "root.jobCountChildren",
  quiet: "root.jobCountQuietFams",
  skipped: "root.jobCountSkippedFams",
  missing: "root.jobCountMissing",
  sessions: "root.jobCountSessions",
  tokens: "root.jobCountTokens",
  rateLimits: "root.jobCountRateLimits",
  uploadTickets: "root.jobCountUploadTickets",
  outbox: "root.jobCountOutbox",
  jobRuns: "root.jobCountJobRuns",
  auditRows: "root.jobCountAuditRows",
  healthReads: "root.jobCountHealthReads",
  tripPositions: "root.jobCountTripPositions",
};

export type SchoolJobCounts = { job: JobName; at: Date; counts: Record<string, number> };

export type SchoolJobHealth = {
  schoolId: string;
  /** Null when the School row itself is gone — the record outlives the school. */
  name: string | null;
  removedAt: Date | null;
  jobs: SchoolJobCounts[];
  attention: boolean;
};

export type CrossSchoolJobHealth = {
  /** Only schools some run had work for — attention first, then by name. */
  schools: SchoolJobHealth[];
  /** Schools on the server (not removed) that no latest run had anything for. */
  quiet: number;
  /** When each job's latest successful run was, for the page's context line. */
  runs: { job: JobName; at: Date | null }[];
};

/**
 * Each job's latest successful run, parsed into per-school stories. Shared by
 * the operator's view and the school's own — the two must never disagree,
 * so there is one reader.
 */
async function latestRunStories(): Promise<{
  runs: { job: JobName; at: Date | null }[];
  bySchool: Map<string, SchoolJobCounts[]>;
}> {
  const bySchool = new Map<string, SchoolJobCounts[]>();
  const runs: { job: JobName; at: Date | null }[] = [];

  for (const job of JOB_NAMES) {
    const last = await db.jobRun.findFirst({
      where: { job, ok: true },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true, summary: true },
    });
    runs.push({ job, at: last?.startedAt ?? null });
    if (!last) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(last.summary);
    } catch {
      continue; // an old or hand-touched row; the totals line still has it on /root/jobs
    }
    const perSchool =
      parsed && typeof parsed === "object" && "perSchool" in parsed
        ? (parsed as { perSchool: unknown }).perSchool
        : null;
    if (!perSchool || typeof perSchool !== "object") continue;

    for (const [schoolId, rawCounts] of Object.entries(perSchool as Record<string, unknown>)) {
      if (!rawCounts || typeof rawCounts !== "object") continue;
      const counts = Object.fromEntries(
        Object.entries(rawCounts as Record<string, unknown>).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0,
        ),
      );
      if (Object.keys(counts).length === 0) continue;
      const list = bySchool.get(schoolId) ?? [];
      list.push({ job, at: last.startedAt, counts });
      bySchool.set(schoolId, list);
    }
  }
  return { runs, bySchool };
}

export async function crossSchoolJobHealth(session: ActiveContext): Promise<CrossSchoolJobHealth> {
  assertSuperuser(session);

  const { runs, bySchool } = await latestRunStories();

  // Superuser sight of the School table is the same policy /root's school list
  // stands on; nothing else is read.
  const allSchools = await db.school.findMany({ select: { id: true, name: true, removedAt: true } });
  const schoolById = new Map(allSchools.map((s) => [s.id, s]));

  const schools: SchoolJobHealth[] = [...bySchool.entries()].map(([schoolId, jobs]) => {
    const school = schoolById.get(schoolId);
    return {
      schoolId,
      name: school?.name ?? null,
      removedAt: school?.removedAt ?? null,
      jobs,
      attention: jobs.some((j) => needsAttention(j.counts)),
    };
  });
  schools.sort(
    (a, b) => Number(b.attention) - Number(a.attention) || (a.name ?? "￿").localeCompare(b.name ?? "￿"),
  );

  const quiet = allSchools.filter((s) => !bySchool.has(s.id) && !s.removedAt).length;
  return { schools, quiet, runs };
}

/** What the platform's machinery did for ONE school, told to that school. */
export type SchoolJobStory = {
  /** Jobs whose latest successful run had work for this school; empty = quiet. */
  entries: SchoolJobCounts[];
  /** A scheduled leaving could not run — the school should know first. */
  attention: boolean;
};

/**
 * The school's own side of the same record.
 *
 * JobRun deliberately has no tenant policy — it is a whole-server row holding
 * counts and nothing else — so THE FILTER HERE IS THE PROMISE: only the
 * calling admin's own school's story leaves this function, the way review
 * reads aggregate in their lib. The counts shown are exactly the operator's,
 * because both views come from `latestRunStories` and cannot drift apart.
 */
export async function schoolJobStory(ctx: ActiveContext): Promise<SchoolJobStory> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminReadsTheJobStory");
  }
  const { bySchool } = await latestRunStories();
  const entries = bySchool.get(ctx.schoolId) ?? [];
  return {
    entries,
    attention: entries.some((e) => needsAttention(e.counts)),
  };
}

/* -------------------------------------------------------------------------- */
/* The operator's health digest email                                          */
/* -------------------------------------------------------------------------- */

type AttentionSchool = { schoolId: string; name: string | null; jobs: SchoolJobCounts[] };

/**
 * The email's words, from the numbers — pure, so a test can hold it still.
 *
 * NULL WHEN ALL IS WELL, and then no email goes: an all-green message every
 * morning teaches the operator to ignore the red one, the same rule that
 * keeps an empty family digest unsent and a quiet school's card absent.
 * /root/jobs remains the standing view; this is the alarm.
 */
export function composeHealthDigest(
  statuses: JobStatus[],
  attentionSchools: AttentionSchool[],
): { subject: string; text: string; bodyHtml: string } | null {
  // The messenger does not report on itself: if health:digest is broken, no
  // email comes, and no email it could send would say so.
  const jobs = statuses.filter((s) => s.name !== "health:digest");
  const overdue = jobs.filter((s) => s.overdue);
  const failed = jobs.filter((s) => !s.overdue && s.lastFailed);
  if (overdue.length === 0 && failed.length === 0 && attentionSchools.length === 0) return null;

  const tEn = translator("en");
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const parts: string[] = [];
  if (overdue.length > 0) parts.push(`${overdue.length} job${overdue.length === 1 ? "" : "s"} overdue`);
  if (failed.length > 0) parts.push(`${failed.length} failed`);
  if (attentionSchools.length > 0) {
    parts.push(`${attentionSchools.length} school${attentionSchools.length === 1 ? "" : "s"} need${attentionSchools.length === 1 ? "s" : ""} attention`);
  }
  const subject = `Shalaghar health: ${parts.join(" · ")}`;

  const jobLine = (s: JobStatus): string =>
    s.overdue
      ? `${s.name}: overdue (last success ${s.lastSuccessAt ? relativeTime(s.lastSuccessAt, new Date(), "en") : "never"})`
      : `${s.name}: last run failed${s.lastRun?.error ? ` — ${s.lastRun.error}` : ""}`;
  const schoolLine = (school: AttentionSchool): string => {
    const bits = school.jobs.flatMap((j) =>
      Object.entries(j.counts)
        .filter(([key]) => JOB_ATTENTION_KEYS.has(key))
        .map(([key, value]) => `${value} ${JOB_COUNT_LABELS[key] ? tEn(JOB_COUNT_LABELS[key]) : key}`),
    );
    return `${school.name ?? school.schoolId}: ${bits.join(", ")}`;
  };

  const jobLines = [...overdue, ...failed].map(jobLine);
  const schoolLines = attentionSchools.map(schoolLine);

  const text = [
    "The overnight machinery needs a person.",
    ...(jobLines.length > 0 ? ["", "Jobs:", ...jobLines.map((l) => `- ${l}`)] : []),
    ...(schoolLines.length > 0 ? ["", "Schools:", ...schoolLines.map((l) => `- ${l}`)] : []),
    "",
    "This email is sent only when something needs attention — a quiet platform sends nothing.",
  ].join("\n");

  const section = (title: string, lines: string[]) =>
    lines.length === 0
      ? ""
      : `<p style="margin:16px 0 4px"><strong>${title}</strong></p><ul style="margin:0;padding-left:20px">${lines
          .map((l) => `<li>${esc(l)}</li>`)
          .join("")}</ul>`;
  const bodyHtml =
    `<p>The overnight machinery needs a person.</p>` +
    section("Jobs", jobLines) +
    section("Schools", schoolLines) +
    `<p style="margin-top:16px;font-size:13px">This email is sent only when something needs attention — a quiet platform sends nothing.</p>`;

  return { subject, text, bodyHtml };
}

/**
 * Gathers the platform's health and emails every operator — or, on a quiet
 * day, deliberately nobody. Runs from the health:digest job, as the owner,
 * which is why it reads schools directly rather than through a session door.
 */
export async function sendOperatorHealthDigest(now: Date = new Date()): Promise<{
  emailed: number;
  overdue: number;
  failed: number;
  attention: number;
  quiet: boolean;
}> {
  const statuses = await jobStatuses(now);
  const { bySchool } = await latestRunStories();
  const schoolRows = await db.school.findMany({ select: { id: true, name: true } });
  const nameById = new Map(schoolRows.map((s) => [s.id, s.name]));

  const attentionSchools: AttentionSchool[] = [...bySchool.entries()]
    .filter(([, jobs]) => jobs.some((j) => needsAttention(j.counts)))
    .map(([schoolId, jobs]) => ({
      schoolId,
      name: nameById.get(schoolId) ?? null,
      jobs: jobs.filter((j) => needsAttention(j.counts)),
    }))
    .sort((a, b) => (a.name ?? "￿").localeCompare(b.name ?? "￿"));

  const digest = composeHealthDigest(statuses, attentionSchools);
  const jobs = statuses.filter((s) => s.name !== "health:digest");
  const counts = {
    overdue: jobs.filter((s) => s.overdue).length,
    failed: jobs.filter((s) => !s.overdue && s.lastFailed).length,
    attention: attentionSchools.length,
  };
  if (!digest) return { emailed: 0, ...counts, quiet: true };

  const operators = await db.user.findMany({
    where: { isSuperuser: true, email: { not: null }, disabledAt: null },
    select: { email: true },
  });
  let emailed = 0;
  let mailFailed = 0;
  for (const op of operators) {
    // Composed in English, the operator mail's language (see the overdue watch below), so the frame is too.
    // TA-360: one refused mail does not keep the digest from the operators after it; the run fails only if none went.
    try {
      await sendHealthDigestEmail(op.email!, digest.subject, digest.text, digest.bodyHtml, "en");
      emailed++;
    } catch (error) {
      mailFailed++;
      console.error("[health:digest] mail", error instanceof Error ? error.message : error);
    }
  }
  if (mailFailed > 0 && emailed === 0) throw new Error(`the health digest reached none of ${mailFailed} operator addresses`);
  return { emailed, ...counts, quiet: false };
}

/* -------------------------------------------------------------------------- */
/* The overdue-job watch                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The health digest is one email a morning; this is the alarm between
 * mornings. The jobs:watch job runs every quarter hour and, when any job is
 * overdue by its own `expectEveryMs`, tells every operator twice over — an
 * in-app notification and the operator email — and then holds its tongue
 * about that job for twelve hours, so a broken crontab is one alert per job
 * per half day and not one every fifteen minutes.
 *
 * THE RECORD OF AN ALERT IS A JobRun ROW named `alert:<job>`, one per alert,
 * written here and read by nobody else: jobStatuses walks the registry's
 * names only, so these rows never appear as runs, and the retention sweep
 * prunes them by age with the rest. No new table, no new column, one
 * writer. The watch never alerts on itself: if it is the thing that is
 * broken, nothing it could send would say so — the digest covers that.
 */
export const JOB_ALERT_REPEAT_MS = 12 * 3_600_000;
const alertRowName = (job: JobName) => `alert:${job}`;

/** When each job was last alerted on, for /root/jobs' "Alerted at …" line. */
export async function lastJobAlerts(): Promise<Map<JobName, Date>> {
  const rows = await db.jobRun.findMany({
    where: { job: { in: JOB_NAMES.map(alertRowName) } },
    orderBy: { startedAt: "desc" },
    distinct: ["job"],
    select: { job: true, startedAt: true },
  });
  return new Map(rows.map((r) => [r.job.slice("alert:".length) as JobName, r.startedAt]));
}

export type WatchOutcome = { overdue: number; alerted: number; muted: number; operators: number; emailed: number };

export async function watchJobs(opts: { now?: Date; statuses?: JobStatus[]; operatorIds?: string[] } = {}): Promise<WatchOutcome> {
  const now = opts.now ?? new Date();
  const statuses = opts.statuses ?? (await jobStatuses(now));
  const overdue = statuses.filter((s) => s.overdue && s.name !== "jobs:watch");
  const out: WatchOutcome = { overdue: overdue.length, alerted: 0, muted: 0, operators: 0, emailed: 0 };
  if (overdue.length === 0) return out;

  // Operators are read once, after the first job that needs them: a run with
  // every job muted reads nothing.
  let operators: { id: string; email: string | null }[] | null = null;
  const loadOperators = async () => {
    if (operators) return operators;
    operators = opts.operatorIds
      ? await db.user.findMany({ where: { id: { in: opts.operatorIds }, disabledAt: null }, select: { id: true, email: true } })
      : await db.user.findMany({ where: { isSuperuser: true, disabledAt: null }, select: { id: true, email: true } });
    out.operators = operators.length;
    return operators;
  };
  for (const job of overdue) {
    const last = await db.jobRun.findFirst({ where: { job: alertRowName(job.name) }, orderBy: { startedAt: "desc" }, select: { startedAt: true } });
    if (last && now.getTime() - last.startedAt.getTime() < JOB_ALERT_REPEAT_MS) {
      out.muted++;
      continue;
    }
    const ops = await loadOperators();
    const hours = Math.max(1, Math.round(JOBS[job.name].expectEveryMs / 3_600_000));
    const when = job.lastSuccessAt ? job.lastSuccessAt.toISOString().slice(0, 16).replace("T", " ") : null;
    let emailed = 0;
    let mailFailed = 0;
    for (const op of ops) {
      await notify({
        userId: op.id,
        schoolId: null,
        kind: "SYSTEM",
        titleKey: "notifTitle.jobOverdue",
        titleVars: { job: job.name },
        bodyKey: when ? "notifBody.jobOverdue" : "notifBody.jobOverdueNever",
        bodyVars: when ? { job: job.name, when, hours } : { job: job.name, hours },
        url: "/root/jobs?state=overdue",
        meta: { event: "job.overdue", job: job.name },
      }).catch((error) => console.error("[jobs:watch] notify", error instanceof Error ? error.message : error));
      if (op.email) {
        // The same words as the notification, in English — the language the
        // operator email and the crontab keep (see crontabText).
        const tEn = translator("en");
        const subject = `Shalaghar: ${tEn("notifTitle.jobOverdue", { job: job.name })}`;
        const text = when ? tEn("notifBody.jobOverdue", { job: job.name, when, hours }) : tEn("notifBody.jobOverdueNever", { job: job.name, hours });
        const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // TA-360: one refused mail (SMTP down, one bad address) must not stop the operators after it hearing, nor stop
        // the alert row below being written: without it the mute never starts and the notice repeats every quarter hour.
        try {
          await sendHealthDigestEmail(op.email, subject, text, `<p>${esc(text)}</p>`, "en");
          emailed++;
        } catch (error) {
          mailFailed++;
          console.error("[jobs:watch] mail", error instanceof Error ? error.message : error);
        }
      }
    }
    out.emailed += emailed;
    await db.jobRun.create({
      data: { job: alertRowName(job.name), startedAt: now, finishedAt: now, ok: true, summary: JSON.stringify({ operators: ops.length, emailed, ...(mailFailed > 0 ? { mailFailed } : {}) }) },
      select: { id: true },
    });
    out.alerted++;
  }
  return out;
}
