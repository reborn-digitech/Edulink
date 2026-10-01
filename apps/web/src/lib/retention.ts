import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { readRetentionConfig, type RetentionConfig } from "./env";

/**
 * Retention: the nightly sweep of the rows that stop mattering.
 *
 * Everything a school writes about a child is kept on purpose — a register,
 * a mark, a report card, a leaving certificate is the school's record and
 * the policy (docs/decisions/0002, rows 1–17) says so. This file touches
 * none of it. What it sweeps is the security context that accumulates
 * underneath: sessions long expired or revoked, sign-in tokens spent or
 * lapsed, rate-limit buckets whose window closed, upload tickets already
 * spent, the dev mailbox, a job's run history, the record of which staff
 * opened a pupil's health card (a year by default, RETENTION_HEALTH_READS_DAYS;
 * the guardian is shown ninety days of it), and — the one deliberate policy
 * change — audit rows past a horizon the operator sets, two years by default
 * and never when RETENTION_AUDIT_DAYS is 0.
 *
 * COUNTS, NOT ROWS. A JobRun summary is a whole-server row outside the
 * tenant fence, so this returns numbers per table and, for the audit log,
 * numbers per school, and nothing that names a person. Every delete is a
 * `deleteMany` on a cutoff, run under the jobs runner's owner connection
 * because every one of these tables is either school-less or spans every
 * school. The latest successful run of each job is never removed: the
 * health page reads "when did this last work" from it.
 *
 * REPEATABLE. Running twice on the same night deletes nothing the second
 * time, and a preview (`retentionPreview`) reports what a sweep would take
 * without taking it, for the operator's page.
 */

/**
 * For tests alone — the tidy job's `onlyUserIds` precedent: the cron sweeps
 * the whole server; a test sweeps its own fixtures and nothing beside them.
 * Every table is narrowed by the one column a test can own.
 */
export type RetentionScope = { userIds?: string[]; buckets?: string[]; outboxTo?: string; jobs?: string[]; schoolIds?: string[] };

export type RetentionKey = "sessions" | "tokens" | "rateLimits" | "uploadTickets" | "outbox" | "jobRuns" | "auditRows" | "healthReads";
export const RETENTION_KEYS: RetentionKey[] = ["sessions", "tokens", "rateLimits", "uploadTickets", "outbox", "jobRuns", "auditRows", "healthReads"];
export type RetentionCounts = Record<RetentionKey, number>;

const DAY = 86_400_000;
const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * DAY);

export function cutoffs(now: Date, cfg: RetentionConfig) {
  return {
    sessions: daysAgo(now, cfg.sessionDays),
    tokens: daysAgo(now, cfg.tokenDays),
    rateLimits: daysAgo(now, cfg.rateLimitDays),
    uploadTickets: daysAgo(now, cfg.uploadTicketDays),
    outbox: daysAgo(now, cfg.outboxDays),
    jobRuns: daysAgo(now, cfg.jobRunDays),
    /** Null when the audit log is kept forever. */
    auditRows: cfg.auditDays > 0 ? daysAgo(now, cfg.auditDays) : null,
    healthReads: daysAgo(now, cfg.healthReadDays),
  };
}

/** The JobRun rows a sweep may take: older than the cutoff, finished, and not the newest success of their job. */
async function staleJobRunIds(cutoff: Date, scope: RetentionScope): Promise<string[]> {
  const jobWhere = scope.jobs ? { job: { in: scope.jobs } } : {};
  const latest = await db.jobRun.groupBy({ by: ["job"], where: { ok: true, ...jobWhere }, _max: { startedAt: true } });
  const keep: string[] = [];
  for (const row of latest) {
    if (!row._max.startedAt) continue;
    const newest = await db.jobRun.findFirst({ where: { job: row.job, ok: true, startedAt: row._max.startedAt }, select: { id: true } });
    if (newest) keep.push(newest.id);
  }
  const stale = await db.jobRun.findMany({ where: { ...jobWhere, startedAt: { lt: cutoff }, finishedAt: { not: null }, id: { notIn: keep } }, select: { id: true } });
  return stale.map((r) => r.id);
}

const where = (at: ReturnType<typeof cutoffs>, scope: RetentionScope) => {
  const user = scope.userIds ? { userId: { in: scope.userIds } } : {};
  return {
    sessions: { ...user, OR: [{ expiresAt: { lt: at.sessions } }, { revokedAt: { lt: at.sessions } }] },
    tokens: { ...user, OR: [{ expiresAt: { lt: at.tokens } }, { consumedAt: { lt: at.tokens } }] },
    rateLimits: { ...(scope.buckets ? { bucket: { in: scope.buckets } } : {}), windowEndsAt: { lt: at.rateLimits } },
    uploadTickets: { ...user, consumedAt: { lt: at.uploadTickets } },
    outbox: { ...(scope.outboxTo ? { to: scope.outboxTo } : {}), createdAt: { lt: at.outbox } },
    auditRows: at.auditRows ? { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), createdAt: { lt: at.auditRows } } : null,
    // School rows: a scoped test narrows them to its own school and its own reader.
    healthReads: { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...(scope.userIds ? { readerUserId: { in: scope.userIds } } : {}), readAt: { lt: at.healthReads } },
  };
};

/** What a sweep tonight would take, table by table, and the day counts it would use. */
export async function retentionPreview(now: Date = new Date(), config: RetentionConfig = readRetentionConfig().config, scope: RetentionScope = {}): Promise<{ config: RetentionConfig; pending: RetentionCounts }> {
  const at = cutoffs(now, config);
  const w = where(at, scope);
  const [sessions, tokens, rateLimits, uploadTickets, outbox, jobRuns, auditRows, healthReads] = await Promise.all([
    db.session.count({ where: w.sessions }),
    db.authToken.count({ where: w.tokens }),
    db.rateLimit.count({ where: w.rateLimits }),
    db.uploadTicket.count({ where: w.uploadTickets }),
    db.outboundEmail.count({ where: w.outbox }),
    staleJobRunIds(at.jobRuns, scope).then((ids) => ids.length),
    w.auditRows ? db.auditLog.count({ where: w.auditRows }) : Promise.resolve(0),
    db.healthCardRead.count({ where: w.healthReads }),
  ]);
  return { config, pending: { sessions, tokens, rateLimits, uploadTickets, outbox, jobRuns, auditRows, healthReads } };
}

/**
 * The sweep. Returns the counts as the job's summary and, for the audit
 * log, the rows taken per school; writes one audit row of its own, bound
 * to no school, saying what it took.
 */
export async function sweepExpired(now: Date = new Date(), config: RetentionConfig = readRetentionConfig().config, scope: RetentionScope = {}): Promise<{ summary: RetentionCounts; perSchool: Record<string, Record<string, number>> }> {
  // A clock set in the future would take today's rows as if they were old.
  // Only a test does that, and a test sweeps its own fixtures: unscoped, it
  // is refused. This guard exists because its absence once emptied a
  // development database's audit log and sessions in a single test run.
  if (now.getTime() > Date.now() + DAY && Object.keys(scope).length === 0) {
    throw new Error(`retention: refusing an unscoped sweep with a clock ${Math.round((now.getTime() - Date.now()) / DAY)} days in the future`);
  }
  const at = cutoffs(now, config);
  const w = where(at, scope);
  const perSchool: Record<string, Record<string, number>> = {};
  if (w.auditRows) {
    const bySchool = await db.auditLog.groupBy({ by: ["schoolId"], where: w.auditRows, _count: { _all: true } });
    for (const row of bySchool) if (row.schoolId && row._count._all > 0) perSchool[row.schoolId] = { auditRows: row._count._all };
  }
  const readsBySchool = await db.healthCardRead.groupBy({ by: ["schoolId"], where: w.healthReads, _count: { _all: true } });
  for (const row of readsBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).healthReads = row._count._all;
  const summary: RetentionCounts = {
    sessions: (await db.session.deleteMany({ where: w.sessions })).count,
    tokens: (await db.authToken.deleteMany({ where: w.tokens })).count,
    rateLimits: (await db.rateLimit.deleteMany({ where: w.rateLimits })).count,
    uploadTickets: (await db.uploadTicket.deleteMany({ where: w.uploadTickets })).count,
    outbox: (await db.outboundEmail.deleteMany({ where: w.outbox })).count,
    jobRuns: 0,
    auditRows: 0,
    healthReads: (await db.healthCardRead.deleteMany({ where: w.healthReads })).count,
  };
  const stale = await staleJobRunIds(at.jobRuns, scope);
  if (stale.length > 0) summary.jobRuns = (await db.jobRun.deleteMany({ where: { id: { in: stale } } })).count;
  if (w.auditRows) summary.auditRows = (await db.auditLog.deleteMany({ where: w.auditRows })).count;
  await audit({ schoolId: null, actorUserId: null, action: "retention.sweep", meta: { ...summary, auditDays: config.auditDays, healthReadDays: config.healthReadDays } });
  return { summary, perSchool };
}
