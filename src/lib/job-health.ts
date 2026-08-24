import "server-only";
import { db } from "./db";
import { JOB_NAMES, type JobName } from "./jobs";
import { assertSuperuser } from "./superuser";
import { AccessError } from "./tenancy";
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
