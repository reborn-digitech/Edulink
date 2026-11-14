import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { readRetentionConfig, type RetentionConfig } from "./env";
import { deleteStoredFile } from "./storage";
import { NOT_A_STOP_REPLY, SKIPPED_WORDS, STOP_REPLY } from "./text-retention";

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
 * the guardian is shown ninety days of it), a bus's positions from a driver's
 * phone (thirty days by default, RETENTION_TRIP_POSITIONS_DAYS), the assistant's conversations
 * thirty days after their last message (RETENTION_ASSISTANT_DAYS, decision 0005) and its daily
 * counts after sixty-two (RETENTION_ASSISTANT_USAGE_DAYS), and — the one deliberate policy
 * change — audit rows past a horizon the operator sets, two years by default
 * and never when RETENTION_AUDIT_DAYS is 0.
 *
 * KEEP ONE YEAR, THEN DELETE, AND NEVER FORGET A STOP (TA-457; the owner's decision of 14 November 2026, decision
 * 0002; counsel to confirm the year). Texts (OutboundMessage) a year after they were written (RETENTION_TEXTS_DAYS),
 * a pupil's bus boarding times a year after the row (RETENTION_TRIP_BOARDINGS_DAYS), closed job and admission
 * enquiries a year after closing with their messages (RETENTION_ENQUIRIES_DAYS), and refused or withdrawn expert
 * applications a year after the decision with their document (RETENTION_EXPERT_APPLICATIONS_DAYS). The row that
 * records a number's STOP reply is never deleted: past the year it loses its words and keeps the number. The words
 * of a skipped text are blanked when it is written (messaging.ts); the sweep blanks those written before that.
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
export type RetentionScope = { userIds?: string[]; buckets?: string[]; outboxTo?: string; jobs?: string[]; schoolIds?: string[]; applicationEmails?: string[] };

export type RetentionKey = "sessions" | "tokens" | "rateLimits" | "uploadTickets" | "outbox" | "jobRuns" | "auditRows" | "healthReads" | "tripPositions" | "assistantConversations" | "assistantUsage" | "textMessages" | "tripBoardings" | "enquiries" | "expertApplications";
export const RETENTION_KEYS: RetentionKey[] = ["sessions", "tokens", "rateLimits", "uploadTickets", "outbox", "jobRuns", "auditRows", "healthReads", "tripPositions", "assistantConversations", "assistantUsage", "textMessages", "tripBoardings", "enquiries", "expertApplications"];
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
    tripPositions: daysAgo(now, cfg.tripPositionDays),
    /** The assistant (Phase B): a conversation by its last message (its messages go with it), a day's counts by the day. */
    assistantConversations: daysAgo(now, cfg.assistantDays),
    assistantUsage: daysAgo(now, cfg.assistantUsageDays).toISOString().slice(0, 10),
    /** TA-457: a text by when it was written, a boarding by its row, an enquiry by its closing, an application by its decision. */
    textMessages: daysAgo(now, cfg.textMessageDays),
    tripBoardings: daysAgo(now, cfg.tripBoardingDays),
    enquiries: daysAgo(now, cfg.enquiryDays),
    expertApplications: daysAgo(now, cfg.expertApplicationDays),
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

/** Whether a scope names anything at all: the nightly job's is empty, a test's or a walk's is not. */
export const isScoped = (scope: RetentionScope): boolean => Object.values(scope).some((v) => v !== undefined);

/**
 * Each table's rows to take, or NULL to leave the table alone. A SCOPED sweep
 * touches only the tables its scope narrows by their own key (campaign
 * LIFECYCLE-1): `{ schoolIds }` alone used to pass the future-clock guard and
 * then take every session, token, rate limit, ticket, e-mail and job run in the
 * database, because none of those tables carries a school. Now sessions,
 * tokens and tickets need `userIds`, rate limits `buckets`, the outbox
 * `outboxTo`, job runs `jobs`, the audit log and the bus positions
 * `schoolIds`, the health reads either. The unscoped nightly sweep is as it was.
 */
const where = (at: ReturnType<typeof cutoffs>, scope: RetentionScope) => {
  const scoped = isScoped(scope);
  const user = scope.userIds ? { userId: { in: scope.userIds } } : {};
  const narrowed = <T>(by: boolean, rows: T): T | null => (!scoped || by ? rows : null);
  return {
    sessions: narrowed(!!scope.userIds, { ...user, OR: [{ expiresAt: { lt: at.sessions } }, { revokedAt: { lt: at.sessions } }] }),
    tokens: narrowed(!!scope.userIds, { ...user, OR: [{ expiresAt: { lt: at.tokens } }, { consumedAt: { lt: at.tokens } }] }),
    rateLimits: narrowed(!!scope.buckets, { ...(scope.buckets ? { bucket: { in: scope.buckets } } : {}), windowEndsAt: { lt: at.rateLimits } }),
    uploadTickets: narrowed(!!scope.userIds, { ...user, consumedAt: { lt: at.uploadTickets } }),
    outbox: narrowed(!!scope.outboxTo, { ...(scope.outboxTo ? { to: scope.outboxTo } : {}), createdAt: { lt: at.outbox } }),
    jobRuns: narrowed(!!scope.jobs, true),
    auditRows: at.auditRows ? narrowed(!!scope.schoolIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), createdAt: { lt: at.auditRows } }) : null,
    // School rows: a scoped test narrows them to its own school and its own reader.
    healthReads: narrowed(!!scope.schoolIds || !!scope.userIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...(scope.userIds ? { readerUserId: { in: scope.userIds } } : {}), readAt: { lt: at.healthReads } }),
    // A bus's positions (transport): a scoped test narrows them to its own school.
    tripPositions: narrowed(!!scope.schoolIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), at: { lt: at.tripPositions } }),
    // The assistant's rows: a scoped test narrows them to its own school or its own people.
    assistantConversations: narrowed(!!scope.schoolIds || !!scope.userIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...user, lastAt: { lt: at.assistantConversations } }),
    assistantUsage: narrowed(!!scope.schoolIds || !!scope.userIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...user, dayKey: { lt: at.assistantUsage } }),
    // TA-457. Texts: a scoped test narrows them to its own school or its own people; a STOP reply's row is never taken.
    textMessages: narrowed<Prisma.OutboundMessageWhereInput>(!!scope.schoolIds || !!scope.userIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...user, createdAt: { lt: at.textMessages }, ...NOT_A_STOP_REPLY }),
    tripBoardings: narrowed<Prisma.TripBoardingWhereInput>(!!scope.schoolIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), createdAt: { lt: at.tripBoardings } }),
    enquiries: narrowed<Prisma.EnquiryWhereInput>(!!scope.schoolIds || !!scope.userIds, { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...(scope.userIds ? { fromUserId: { in: scope.userIds } } : {}), status: "CLOSED", closedAt: { lt: at.enquiries } }),
    // An applicant belongs to no school: a scoped test narrows them by the address it applied with.
    expertApplications: narrowed<Prisma.ExpertApplicationWhereInput>(!!scope.applicationEmails, {
      ...(scope.applicationEmails ? { email: { in: scope.applicationEmails } } : {}),
      status: { in: ["REFUSED", "WITHDRAWN"] },
      OR: [{ decidedAt: { lt: at.expertApplications } }, { decidedAt: null, createdAt: { lt: at.expertApplications } }],
    }),
  };
};

/**
 * The words a sweep blanks without taking the row (TA-457): a skipped text's, written before skipped texts were
 * written without them, and a STOP reply's past the year, whose number stays. Narrowed as the texts are.
 */
const textWordsWhere = (at: ReturnType<typeof cutoffs>, scope: RetentionScope): Prisma.OutboundMessageWhereInput | null => {
  if (isScoped(scope) && !scope.schoolIds && !scope.userIds) return null;
  const mine = { ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), ...(scope.userIds ? { userId: { in: scope.userIds } } : {}) };
  const hasWords = { NOT: { body: "", varsJson: "{}" } };
  return { AND: [mine, hasWords, { OR: [{ status: "SKIPPED" }, { AND: [STOP_REPLY, { createdAt: { lt: at.textMessages } }] }] }] };
};

/** What a sweep tonight would take, table by table, and the day counts it would use. */
export async function retentionPreview(now: Date = new Date(), config: RetentionConfig = readRetentionConfig().config, scope: RetentionScope = {}): Promise<{ config: RetentionConfig; pending: RetentionCounts }> {
  const at = cutoffs(now, config);
  const w = where(at, scope);
  const none = Promise.resolve(0);
  const [sessions, tokens, rateLimits, uploadTickets, outbox, jobRuns, auditRows, healthReads, tripPositions, assistantConversations, assistantUsage, textMessages, tripBoardings, enquiries, expertApplications] = await Promise.all([
    w.sessions ? db.session.count({ where: w.sessions }) : none,
    w.tokens ? db.authToken.count({ where: w.tokens }) : none,
    w.rateLimits ? db.rateLimit.count({ where: w.rateLimits }) : none,
    w.uploadTickets ? db.uploadTicket.count({ where: w.uploadTickets }) : none,
    w.outbox ? db.outboundEmail.count({ where: w.outbox }) : none,
    w.jobRuns ? staleJobRunIds(at.jobRuns, scope).then((ids) => ids.length) : none,
    w.auditRows ? db.auditLog.count({ where: w.auditRows }) : none,
    w.healthReads ? db.healthCardRead.count({ where: w.healthReads }) : none,
    w.tripPositions ? db.tripPosition.count({ where: w.tripPositions }) : none,
    w.assistantConversations ? db.assistantConversation.count({ where: w.assistantConversations }) : none,
    w.assistantUsage ? db.assistantUsage.count({ where: w.assistantUsage }) : none,
    w.textMessages ? db.outboundMessage.count({ where: w.textMessages }) : none,
    w.tripBoardings ? db.tripBoarding.count({ where: w.tripBoardings }) : none,
    w.enquiries ? db.enquiry.count({ where: w.enquiries }) : none,
    w.expertApplications ? db.expertApplication.count({ where: w.expertApplications }) : none,
  ]);
  return { config, pending: { sessions, tokens, rateLimits, uploadTickets, outbox, jobRuns, auditRows, healthReads, tripPositions, assistantConversations, assistantUsage, textMessages, tripBoardings, enquiries, expertApplications } };
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
  // A scope keeps a future clock to the tables it narrows by their own keys (where(), LIFECYCLE-1).
  if (now.getTime() > Date.now() + DAY && !isScoped(scope)) {
    throw new Error(`retention: refusing an unscoped sweep with a clock ${Math.round((now.getTime() - Date.now()) / DAY)} days in the future`);
  }
  const at = cutoffs(now, config);
  const w = where(at, scope);
  const perSchool: Record<string, Record<string, number>> = {};
  if (w.auditRows) {
    const bySchool = await db.auditLog.groupBy({ by: ["schoolId"], where: w.auditRows, _count: { _all: true } });
    for (const row of bySchool) if (row.schoolId && row._count._all > 0) perSchool[row.schoolId] = { auditRows: row._count._all };
  }
  if (w.healthReads) {
    const readsBySchool = await db.healthCardRead.groupBy({ by: ["schoolId"], where: w.healthReads, _count: { _all: true } });
    for (const row of readsBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).healthReads = row._count._all;
  }
  if (w.tripPositions) {
    const positionsBySchool = await db.tripPosition.groupBy({ by: ["schoolId"], where: w.tripPositions, _count: { _all: true } });
    for (const row of positionsBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).tripPositions = row._count._all;
  }
  if (w.assistantConversations) {
    const conversationsBySchool = await db.assistantConversation.groupBy({ by: ["schoolId"], where: w.assistantConversations, _count: { _all: true } });
    for (const row of conversationsBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).assistantConversations = row._count._all;
  }
  if (w.textMessages) {
    const textsBySchool = await db.outboundMessage.groupBy({ by: ["schoolId"], where: w.textMessages, _count: { _all: true } });
    for (const row of textsBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).textMessages = row._count._all;
  }
  if (w.tripBoardings) {
    const boardingsBySchool = await db.tripBoarding.groupBy({ by: ["schoolId"], where: w.tripBoardings, _count: { _all: true } });
    for (const row of boardingsBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).tripBoardings = row._count._all;
  }
  if (w.enquiries) {
    const enquiriesBySchool = await db.enquiry.groupBy({ by: ["schoolId"], where: w.enquiries, _count: { _all: true } });
    for (const row of enquiriesBySchool) if (row._count._all > 0) (perSchool[row.schoolId] ??= {}).enquiries = row._count._all;
  }
  // An expert application's document goes with it: read before the rows go, deleted once they have (TA-457).
  const applicationFiles = w.expertApplications ? (await db.expertApplication.findMany({ where: { ...w.expertApplications, documentFileId: { not: null } }, select: { documentFileId: true } })).map((r) => r.documentFileId!) : [];
  const words = textWordsWhere(at, scope);
  const textWordsBlanked = words ? (await db.outboundMessage.updateMany({ where: words, data: SKIPPED_WORDS })).count : 0;
  const summary: RetentionCounts = {
    sessions: w.sessions ? (await db.session.deleteMany({ where: w.sessions })).count : 0,
    tokens: w.tokens ? (await db.authToken.deleteMany({ where: w.tokens })).count : 0,
    rateLimits: w.rateLimits ? (await db.rateLimit.deleteMany({ where: w.rateLimits })).count : 0,
    uploadTickets: w.uploadTickets ? (await db.uploadTicket.deleteMany({ where: w.uploadTickets })).count : 0,
    outbox: w.outbox ? (await db.outboundEmail.deleteMany({ where: w.outbox })).count : 0,
    jobRuns: 0,
    auditRows: 0,
    healthReads: w.healthReads ? (await db.healthCardRead.deleteMany({ where: w.healthReads })).count : 0,
    tripPositions: w.tripPositions ? (await db.tripPosition.deleteMany({ where: w.tripPositions })).count : 0,
    // A conversation's messages go with it (onDelete: Cascade); the count is the conversations'.
    assistantConversations: w.assistantConversations ? (await db.assistantConversation.deleteMany({ where: w.assistantConversations })).count : 0,
    assistantUsage: w.assistantUsage ? (await db.assistantUsage.deleteMany({ where: w.assistantUsage })).count : 0,
    textMessages: w.textMessages ? (await db.outboundMessage.deleteMany({ where: w.textMessages })).count : 0,
    tripBoardings: w.tripBoardings ? (await db.tripBoarding.deleteMany({ where: w.tripBoardings })).count : 0,
    // An enquiry's messages go with it (onDelete: Cascade); the count is the enquiries'.
    enquiries: w.enquiries ? (await db.enquiry.deleteMany({ where: w.enquiries })).count : 0,
    expertApplications: w.expertApplications ? (await db.expertApplication.deleteMany({ where: w.expertApplications })).count : 0,
  };
  // A document no remaining application names is deleted; one already gone is the desired end state.
  if (applicationFiles.length > 0) {
    const stillNamed = new Set((await db.expertApplication.findMany({ where: { documentFileId: { in: applicationFiles } }, select: { documentFileId: true } })).map((r) => r.documentFileId));
    for (const fileId of applicationFiles) if (!stillNamed.has(fileId)) await deleteStoredFile(fileId).catch(() => {});
  }
  const stale = w.jobRuns ? await staleJobRunIds(at.jobRuns, scope) : [];
  if (stale.length > 0) summary.jobRuns = (await db.jobRun.deleteMany({ where: { id: { in: stale } } })).count;
  if (w.auditRows) summary.auditRows = (await db.auditLog.deleteMany({ where: w.auditRows })).count;
  await audit({ schoolId: null, actorUserId: null, action: "retention.sweep", meta: { ...summary, auditDays: config.auditDays, healthReadDays: config.healthReadDays, tripPositionDays: config.tripPositionDays, assistantDays: config.assistantDays, textMessageDays: config.textMessageDays, tripBoardingDays: config.tripBoardingDays, enquiryDays: config.enquiryDays, expertApplicationDays: config.expertApplicationDays, textWordsBlanked } });
  return { summary, perSchool };
}
