/**
 * The retention sweep: rows past their horizon go, rows inside it stay,
 * each job's last success is never taken, the audit log is spared when its
 * horizon is 0, the preview counts what the sweep then takes, and the sweep
 * leaves one audit row of its own bound to no school. Who opened a pupil's
 * health card goes after a year (never under the guardian's ninety days).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { retentionPreview, sweepExpired } from "@/lib/retention";
import { RETENTION_DEFAULTS, readRetentionConfig } from "@/lib/env";
import { JOBS, crontabText } from "@/lib/jobs";

const db = new PrismaClient();
const STAMP = Date.now();
const NOW = new Date("2030-06-15T04:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);
const JOB = `zz:retention-${STAMP}`;
let userId = "";
let schoolId = "";
const ids = { sessions: [] as string[], tokens: [] as string[], tickets: [] as string[], outbox: [] as string[], runs: [] as string[], audit: [] as string[], reads: [] as string[] };
const buckets = [`zz-ret-${STAMP}-old`, `zz-ret-${STAMP}-new`];
const MAIL = `zz-ret-${STAMP}@test.invalid`;
/** Own fixtures only: the sweep is scoped exactly as a test must scope it, never the whole server. */
const scope = () => ({ userIds: [userId], buckets, outboxTo: MAIL, jobs: [JOB], schoolIds: [schoolId] });

beforeAll(async () => {
  userId = (await db.user.create({ data: { name: `ZZ Ret ${STAMP}`, email: `zz-ret-${STAMP}@test.invalid` }, select: { id: true } })).id;
  schoolId = (await db.school.create({ data: { name: `ZZ Ret School ${STAMP}`, slug: `zz-ret-${STAMP}`, code: `ZR${String(STAMP).slice(-6)}`, contactEmail: `zz-ret-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const session = async (data: { expiresAt: Date; revokedAt?: Date | null }) => (await db.session.create({ data: { userId, tokenHash: `zz-ret-${STAMP}-${Math.random()}`, ...data }, select: { id: true } })).id;
  ids.sessions.push(await session({ expiresAt: daysAgo(10) }), await session({ expiresAt: daysAgo(40), revokedAt: daysAgo(30) }), await session({ expiresAt: daysAgo(2) }), await session({ expiresAt: new Date(NOW.getTime() + 20 * 86_400_000), revokedAt: daysAgo(1) }), await session({ expiresAt: new Date(NOW.getTime() + 20 * 86_400_000) }));
  const token = async (data: { expiresAt: Date; consumedAt?: Date | null }) => (await db.authToken.create({ data: { userId, purpose: "MAGIC_LINK", tokenHash: `zz-ret-${STAMP}-${Math.random()}`, ...data }, select: { id: true } })).id;
  ids.tokens.push(await token({ expiresAt: daysAgo(9) }), await token({ expiresAt: daysAgo(-1), consumedAt: daysAgo(8) }), await token({ expiresAt: daysAgo(3) }), await token({ expiresAt: new Date(NOW.getTime() + 3600_000) }));
  await db.rateLimit.createMany({ data: [{ bucket: buckets[0]!, hits: 3, windowEndsAt: daysAgo(3) }, { bucket: buckets[1]!, hits: 1, windowEndsAt: new Date(NOW.getTime() + 3600_000) }] });
  const ticket = async (consumedAt: Date | null) => (await db.uploadTicket.create({ data: { userId, fileId: `zz-ret-${STAMP}-${Math.random()}.png`, mime: "image/png", size: 10, consumedAt }, select: { id: true } })).id;
  ids.tickets.push(await ticket(daysAgo(40)), await ticket(daysAgo(1)), await ticket(null));
  const mail = async (createdAt: Date) => (await db.outboundEmail.create({ data: { to: MAIL, subject: "ZZ", text: "ZZ", html: "<p>ZZ</p>", createdAt }, select: { id: true } })).id;
  ids.outbox.push(await mail(daysAgo(45)), await mail(daysAgo(2)));
  const run = async (startedAt: Date, ok: boolean | null) => (await db.jobRun.create({ data: { job: JOB, startedAt, finishedAt: ok === null ? null : startedAt, ok, summary: "{}" }, select: { id: true } })).id;
  // Oldest success, a newer success (the one to keep), an old failure, an old run still "running", a fresh failure.
  ids.runs.push(await run(daysAgo(200), true), await run(daysAgo(120), true), await run(daysAgo(150), false), await run(daysAgo(130), null), await run(daysAgo(5), false));
  const row = async (createdAt: Date, school: string | null) => (await db.auditLog.create({ data: { schoolId: school, action: "zz.retention", meta: "{}", createdAt }, select: { id: true } })).id;
  ids.audit.push(await row(daysAgo(800), schoolId), await row(daysAgo(750), schoolId), await row(daysAgo(100), schoolId), await row(daysAgo(900), null));
  // The fixture user is the pupil and, for the scope's sake, the reader: a scoped sweep narrows health reads by school and reader.
  const pupil = (await db.membership.create({ data: { userId, schoolId, role: "STUDENT" }, select: { id: true } })).id;
  const read = async (readAt: Date) => (await db.healthCardRead.create({ data: { schoolId, studentMembershipId: pupil, readerUserId: userId, readerRole: "TEACHER", readAt }, select: { id: true } })).id;
  // Thirteen months, a year and five days, a hundred days (outside the guardian's ninety, inside the year), yesterday.
  ids.reads.push(await read(daysAgo(400)), await read(daysAgo(370)), await read(daysAgo(100)), await read(daysAgo(1)));
});

afterAll(async () => {
  await db.session.deleteMany({ where: { id: { in: ids.sessions } } });
  await db.authToken.deleteMany({ where: { id: { in: ids.tokens } } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: buckets } } });
  await db.uploadTicket.deleteMany({ where: { id: { in: ids.tickets } } });
  await db.outboundEmail.deleteMany({ where: { id: { in: ids.outbox } } });
  await db.jobRun.deleteMany({ where: { job: JOB } });
  await db.auditLog.deleteMany({ where: { id: { in: ids.audit } } });
  await db.healthCardRead.deleteMany({ where: { id: { in: ids.reads } } });
  await db.membership.deleteMany({ where: { schoolId, userId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

const remaining = async () => ({
  sessions: (await db.session.findMany({ where: { id: { in: ids.sessions } }, select: { id: true } })).map((r) => r.id),
  tokens: (await db.authToken.findMany({ where: { id: { in: ids.tokens } }, select: { id: true } })).map((r) => r.id),
  buckets: (await db.rateLimit.findMany({ where: { bucket: { in: buckets } }, select: { bucket: true } })).map((r) => r.bucket),
  tickets: (await db.uploadTicket.findMany({ where: { id: { in: ids.tickets } }, select: { id: true } })).map((r) => r.id),
  outbox: (await db.outboundEmail.findMany({ where: { id: { in: ids.outbox } }, select: { id: true } })).map((r) => r.id),
  runs: (await db.jobRun.findMany({ where: { job: JOB }, select: { id: true } })).map((r) => r.id),
  audit: (await db.auditLog.findMany({ where: { id: { in: ids.audit } }, select: { id: true } })).map((r) => r.id),
  reads: (await db.healthCardRead.findMany({ where: { id: { in: ids.reads } }, select: { id: true } })).map((r) => r.id),
});

describe("retention:sweep", () => {
  it("is a registered nightly job on the crontab, and the defaults are what the policy says", () => {
    expect(JOBS["retention:sweep"].schedule).toBe("0 4 * * *");
    expect(crontabText("/srv/edulink")).toContain("retention:sweep");
    expect(RETENTION_DEFAULTS).toEqual({ sessionDays: 7, tokenDays: 7, rateLimitDays: 1, uploadTicketDays: 30, outboxDays: 30, jobRunDays: 90, auditDays: 730, healthReadDays: 365, tripPositionDays: 30 });
  });

  it("reads RETENTION_HEALTH_READS_DAYS, and refuses one under the guardian's ninety days", () => {
    const before = process.env.RETENTION_HEALTH_READS_DAYS;
    try {
      process.env.RETENTION_HEALTH_READS_DAYS = "500";
      expect(readRetentionConfig().config.healthReadDays).toBe(500);
      process.env.RETENTION_HEALTH_READS_DAYS = "30";
      const short = readRetentionConfig();
      expect(short.config.healthReadDays).toBe(365);
      expect(short.problems.map((p) => p.key)).toContain("RETENTION_HEALTH_READS_DAYS");
    } finally {
      if (before === undefined) delete process.env.RETENTION_HEALTH_READS_DAYS;
      else process.env.RETENTION_HEALTH_READS_DAYS = before;
    }
  });

  it("refuses an unscoped sweep with a clock in the future — the guard that keeps a test from sweeping the server", async () => {
    await expect(sweepExpired(NOW)).rejects.toThrow(/refusing an unscoped sweep/);
    await expect(sweepExpired(NOW, undefined, {})).rejects.toThrow(/days in the future/);
    await expect(sweepExpired(NOW, undefined, { schoolIds: undefined })).rejects.toThrow(/days in the future/);
  });

  it("keeps a scoped sweep to the tables its scope narrows: { schoolIds } alone takes no session, token, limit, ticket, e-mail or job run anywhere (campaign LIFECYCLE-1)", async () => {
    const preview = await retentionPreview(NOW, undefined, { schoolIds: [schoolId] });
    expect(preview.pending).toMatchObject({ sessions: 0, tokens: 0, rateLimits: 0, uploadTickets: 0, outbox: 0, jobRuns: 0 });
    // The school's own rows are still its to sweep.
    expect(preview.pending.healthReads).toBeGreaterThan(0);
    // Swept for real with a school that has nothing: every table no school key narrows is left alone.
    const before = await remaining();
    const { summary } = await sweepExpired(NOW, undefined, { schoolIds: [`zz-none-${STAMP}`] });
    expect(summary).toMatchObject({ sessions: 0, tokens: 0, rateLimits: 0, uploadTickets: 0, outbox: 0, jobRuns: 0, auditRows: 0, healthReads: 0, tripPositions: 0 });
    expect(await remaining()).toEqual(before);
    // A user-narrowed preview takes that user's sessions and nothing of the schools'.
    const mine = await retentionPreview(NOW, undefined, { userIds: [userId] });
    expect(mine.pending.sessions).toBeGreaterThan(0);
    expect(mine.pending).toMatchObject({ auditRows: 0, tripPositions: 0, rateLimits: 0, outbox: 0, jobRuns: 0 });
  });

  it("spares the audit log when its horizon is 0, and takes nothing else twice", async () => {
    const before = await retentionPreview(NOW, { ...RETENTION_DEFAULTS, auditDays: 0 }, scope());
    expect(before.pending.auditRows).toBe(0);
    expect(before.pending).toEqual({ sessions: 2, tokens: 2, rateLimits: 1, uploadTickets: 1, outbox: 1, jobRuns: 2, auditRows: 0, healthReads: 2, tripPositions: 0 });
    const { summary } = await sweepExpired(NOW, { ...RETENTION_DEFAULTS, auditDays: 0 }, scope());
    expect(summary.auditRows).toBe(0);
    expect(summary).toEqual({ sessions: 2, tokens: 2, rateLimits: 1, uploadTickets: 1, outbox: 1, jobRuns: 2, auditRows: 0, healthReads: 2, tripPositions: 0 });
    const left = await remaining();
    // Expired ten days ago and revoked thirty days ago: gone. Expired two days ago, revoked yesterday, live: kept.
    expect(left.sessions).toEqual([ids.sessions[2], ids.sessions[3], ids.sessions[4]]);
    // Lapsed nine days ago and used eight days ago: gone. Lapsed three days ago and live: kept.
    expect(left.tokens).toEqual([ids.tokens[2], ids.tokens[3]]);
    expect(left.buckets).toEqual([buckets[1]]);
    // Spent forty days ago: gone. Spent yesterday and unspent (files:reclaim's): kept.
    expect(left.tickets).toEqual([ids.tickets[1], ids.tickets[2]]);
    expect(left.outbox).toEqual([ids.outbox[1]]);
    // The oldest success and the old failure go; the newest success stays however old, so does the unfinished run and the fresh failure.
    expect(left.runs.sort()).toEqual([ids.runs[1], ids.runs[3], ids.runs[4]].sort());
    expect(left.audit).toEqual(ids.audit);
    // Past a year: gone. A hundred days and yesterday: kept, the hundred-day one for a dispute the guardian's list no longer shows.
    expect(left.reads.sort()).toEqual([ids.reads[2], ids.reads[3]].sort());
    const again = await sweepExpired(NOW, { ...RETENTION_DEFAULTS, auditDays: 0 }, scope());
    expect(again.summary).toMatchObject({ sessions: 0, tokens: 0, rateLimits: 0, uploadTickets: 0, outbox: 0, jobRuns: 0, auditRows: 0, healthReads: 0 });
  });

  it("prunes the audit log past the horizon, school by school, and writes its own unbound row saying so", async () => {
    const preview = await retentionPreview(NOW, undefined, scope());
    expect(preview.config.auditDays).toBe(730);
    expect(preview.pending.auditRows).toBe(2);
    const { summary, perSchool } = await sweepExpired(NOW, undefined, scope());
    expect(summary.auditRows).toBe(2);
    expect(perSchool).toEqual({ [schoolId]: { auditRows: 2 } });
    const left = await remaining();
    // The school's two old rows go; its recent one and the unbound row (outside a school scope) stay.
    expect(left.audit.sort()).toEqual([ids.audit[2], ids.audit[3]].sort());
    const own = await db.auditLog.findFirst({ where: { action: "retention.sweep", schoolId: null, createdAt: { gte: new Date(Date.now() - 60_000) } }, orderBy: { createdAt: "desc" } });
    expect(own).not.toBeNull();
    expect(JSON.parse(own!.meta)).toMatchObject({ auditRows: summary.auditRows, auditDays: 730 });
    ids.audit.push(own!.id);
  });
});
