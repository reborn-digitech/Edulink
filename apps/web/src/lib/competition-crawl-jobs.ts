/**
 * A COMPETITIONS CRAWL STARTED AND STOPPED FROM THE COMPETITIONS DESK (the owner, 12 October 2026;
 * docs/plans/competitions-crawler.md). The quiz generation job's pattern (src/lib/quiz-jobs.ts), on its own
 * table, CompetitionCrawlJob — a separate table rather than a `kind` on QuizGenJob, because the quiz
 * library's every query, its unique `active` index and its suites assume one kind of row; generalising it
 * would have changed its behaviour, and the brief allowed that only if it did not.
 *
 * ONE LIBRARY, ONE WRITER of a crawl's row: the desk's Start and Stop (through
 * src/lib/competition-crawl-desk.ts, which asserts the person and audits) and the runner's heartbeat,
 * progress and finish (scripts/competitions-crawl/job.ts, run detached as `cli.ts --job=<id>`).
 *
 *   START  reaps the dead, reads both model servers fresh, claims the one crawl slot (the unique
 *          `active`: a second Start while one is QUEUED, RUNNING or STOPPING fails on the index), brings up
 *          through scripts/model-serve.sh exactly the servers that were down and records them, spawns
 *          the runner and records its pid. A crawl may run beside a quiz run: different slots, one model.
 *   STOP   asks: STOPPING; the runner finishes the page in hand and halts. A dead runner is reaped at once.
 *   END    frees the slot and takes down the servers THIS crawl brought up — unless a quiz run is active,
 *          in which case they are handed to it (src/lib/model-holders.ts) and go down when it ends.
 *   REAP   on every read and before every Start: a dead pid or a ten-minute-old heartbeat ends the run.
 *
 * The model servers are touched only through quiz-jobs.ts's machine (its health reads and the script).
 */
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  CRAWL_REJECT_REASONS,
  competitionCrawlProgressSchema,
  competitionCrawlRequestSchema,
  type CompetitionCrawlJob,
  type CompetitionCrawlJobState,
  type CompetitionCrawlProgress,
  type CompetitionCrawlRequest,
  type CompetitionCrawlState,
  type ModelServer,
  MODEL_SERVERS,
} from "@edulink/contracts";
import { APP_ROOT, MACHINE, deadReason, forgetHealth, modelServers, type JobDeps } from "./quiz-jobs";
import { handOverTo, neededServers } from "./model-holders";

export type CrawlJobDb = Pick<PrismaClient, "competitionCrawlJob" | "quizGenJob" | "assistantEvalJob" | "user">;

const JOB_LOG_DIR = join(APP_ROOT, "storage", "competition-crawl");

export class CrawlJobRefusal extends Error {
  constructor(
    readonly errorKey: "competitionCrawl.oneAtATime" | "competitionCrawl.noSuchJob" | "competitionCrawl.serverFailed",
    readonly status: 404 | 409 | 500,
  ) {
    super(errorKey);
  }
}

function spawnCrawlRunner(jobId: string): number {
  mkdirSync(JOB_LOG_DIR, { recursive: true });
  const log = openSync(join(JOB_LOG_DIR, `${jobId}.log`), "a");
  try {
    const tsx = join(APP_ROOT, "node_modules", ".bin", "tsx");
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const child = spawn(tsx, ["--tsconfig", "scripts/tsconfig.json", "scripts/competitions-crawl/cli.ts", `--job=${jobId}`], {
      cwd: APP_ROOT,
      detached: true,
      stdio: ["ignore", log, log],
      env,
    });
    child.unref();
    if (!child.pid) throw new Error("the runner did not start");
    return child.pid;
  } finally {
    closeSync(log);
  }
}

/** The machine: the quiz job's health reads, script and pid checks; the crawl's own runner. */
export const CRAWL_MACHINE: JobDeps = { ...MACHINE, spawnRunner: spawnCrawlRunner };

export function emptyCrawlProgress(phase: CompetitionCrawlProgress["phase"], sourcesTotal = 0): CompetitionCrawlProgress {
  return {
    phase,
    source: null,
    sourcesTotal,
    sourcesVisited: 0,
    pagesRead: 0,
    cachedHits: 0,
    candidates: 0,
    drafted: 0,
    updated: 0,
    dismissedUnchanged: 0,
    changedPublished: 0,
    rejects: Object.fromEntries(CRAWL_REJECT_REASONS.map((r) => [r, 0])) as CompetitionCrawlProgress["rejects"],
    refused: [],
  };
}

type Row = Prisma.CompetitionCrawlJobGetPayload<object>;

export function toCrawlJob(row: Row, names: Map<string, string>): CompetitionCrawlJob {
  const request = competitionCrawlRequestSchema.safeParse(row.request);
  const progress = competitionCrawlProgressSchema.safeParse(row.progress);
  return {
    id: row.id,
    state: row.state as CompetitionCrawlJobState,
    request: request.success ? request.data : {},
    progress: progress.success ? progress.data : null,
    startedBy: names.get(row.startedByUserId) ?? "—",
    startedByRole: row.startedByRole === "OPERATOR" ? "OPERATOR" : "APP_ADMIN",
    startedServers: row.startedServers.filter((s): s is ModelServer => (MODEL_SERVERS as readonly string[]).includes(s)),
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    heartbeatAt: row.heartbeatAt?.toISOString() ?? null,
  };
}

async function namesFor(db: CrawlJobDb, rows: Row[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.map((r) => r.startedByUserId))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/**
 * THE END OF A CRAWL, its one writer: the state, the slot freed, the pid cleared, the reason when it
 * failed; then the servers this crawl brought up handed to an active quiz run or taken down. Conditional
 * on the run still being active, so a crawl ends once.
 */
export async function finishCrawl(db: CrawlJobDb, jobId: string, state: "FINISHED" | "STOPPED" | "FAILED", deps: JobDeps = CRAWL_MACHINE, error: string | null = null, progress?: CompetitionCrawlProgress): Promise<boolean> {
  const now = deps.now();
  const { count } = await db.competitionCrawlJob.updateMany({
    where: { id: jobId, active: true },
    data: { state, active: null, pid: null, finishedAt: now, heartbeatAt: now, ...(error ? { error: error.slice(0, 2000) } : {}), ...(progress ? { progress: progress as Prisma.InputJsonValue } : {}) },
  });
  if (count === 0) return false;
  const row = await db.competitionCrawlJob.findUnique({ where: { id: jobId }, select: { startedServers: true } });
  const mine = (row?.startedServers ?? []).filter((s): s is ModelServer => (MODEL_SERVERS as readonly string[]).includes(s));
  const toStop = await (deps.handOver ?? handOverTo(db, "CRAWL"))(mine);
  const problems: string[] = [];
  for (const server of toStop) {
    try {
      await deps.serve(`stop-${server}`);
    } catch (e) {
      problems.push(`${server}: ${(e as Error).message}`);
    }
  }
  forgetHealth();
  if (problems.length) await db.competitionCrawlJob.update({ where: { id: jobId }, data: { error: [error, `stopping the model servers: ${problems.join("; ")}`].filter(Boolean).join(" — ").slice(0, 2000) } });
  return true;
}

/** REAP: every active crawl whose runner is dead ends (FAILED with the reason; STOPPED if a stop had been asked). */
export async function reapCrawls(db: CrawlJobDb, deps: JobDeps = CRAWL_MACHINE): Promise<number> {
  const rows = await db.competitionCrawlJob.findMany({ where: { active: true }, select: { id: true, pid: true, state: true, createdAt: true, heartbeatAt: true } });
  let reaped = 0;
  for (const row of rows) {
    const reason = deadReason(row, deps);
    if (!reason) continue;
    const ended = row.state === "STOPPING" ? await finishCrawl(db, row.id, "STOPPED", deps) : await finishCrawl(db, row.id, "FAILED", deps, reason);
    if (ended) reaped++;
  }
  return reaped;
}

export async function readCrawls(db: CrawlJobDb, deps: JobDeps = CRAWL_MACHINE): Promise<CompetitionCrawlState> {
  await reapCrawls(db, deps);
  const [active, recent, servers] = await Promise.all([
    db.competitionCrawlJob.findFirst({ where: { active: true } }),
    db.competitionCrawlJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    modelServers(deps),
  ]);
  const current = active ?? recent[0] ?? null;
  const names = await namesFor(db, [...recent, ...(active ? [active] : [])]);
  return { current: current ? toCrawlJob(current, names) : null, recent: recent.map((r) => toCrawlJob(r, names)), servers };
}

export async function readCrawl(db: CrawlJobDb, jobId: string, deps: JobDeps = CRAWL_MACHINE): Promise<CompetitionCrawlJob> {
  await reapCrawls(db, deps);
  const row = await db.competitionCrawlJob.findUnique({ where: { id: jobId } });
  if (!row) throw new CrawlJobRefusal("competitionCrawl.noSuchJob", 404);
  return toCrawlJob(row, await namesFor(db, [row]));
}

const isUniqueClash = (error: unknown) => typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";

/** START: the slot claimed first, then the servers that were down brought up and recorded, then the runner spawned. */
export async function startCrawl(db: CrawlJobDb, who: { userId: string; role: "APP_ADMIN" | "OPERATOR" }, request: CompetitionCrawlRequest, deps: JobDeps = CRAWL_MACHINE): Promise<CompetitionCrawlJob> {
  await reapCrawls(db, deps);
  // Only the servers a crawl needs (the gate's small model is the assistant's, Vidura pass 3).
  const servers = (await modelServers(deps, { fresh: true })).filter((s) => neededServers("CRAWL").includes(s.server));
  const down = servers.filter((s) => s.state === "STOPPED").map((s) => s.server);
  let row: Row;
  try {
    row = await db.competitionCrawlJob.create({
      data: {
        state: "QUEUED",
        active: true,
        request: request as Prisma.InputJsonValue,
        progress: emptyCrawlProgress(servers.every((s) => s.state === "RUNNING") ? "CRAWLING" : "STARTING_MODEL") as Prisma.InputJsonValue,
        startedServers: down,
        startedByUserId: who.userId,
        startedByRole: who.role,
      },
    });
  } catch (error) {
    if (isUniqueClash(error)) throw new CrawlJobRefusal("competitionCrawl.oneAtATime", 409);
    throw error;
  }
  try {
    for (const server of down) await deps.serve(`start-${server}`);
    forgetHealth();
    const pid = deps.spawnRunner(row.id);
    row = await db.competitionCrawlJob.update({ where: { id: row.id }, data: { pid, heartbeatAt: deps.now() } });
  } catch (error) {
    await finishCrawl(db, row.id, "FAILED", deps, `the crawl could not begin: ${(error as Error).message}`);
    throw new CrawlJobRefusal("competitionCrawl.serverFailed", 500);
  }
  return toCrawlJob(row, await namesFor(db, [row]));
}

/** STOP: the runner is asked (STOPPING) and halts after the page in hand; a dead runner is reaped at once. */
export async function stopCrawl(db: CrawlJobDb, jobId: string, who: { userId: string }, deps: JobDeps = CRAWL_MACHINE): Promise<CompetitionCrawlJob> {
  const row = await db.competitionCrawlJob.findUnique({ where: { id: jobId } });
  if (!row) throw new CrawlJobRefusal("competitionCrawl.noSuchJob", 404);
  if (row.active && (row.state === "QUEUED" || row.state === "RUNNING")) {
    await db.competitionCrawlJob.updateMany({ where: { id: jobId, active: true, state: { in: ["QUEUED", "RUNNING"] } }, data: { state: "STOPPING", stopRequestedBy: who.userId } });
  }
  const now = await db.competitionCrawlJob.findUniqueOrThrow({ where: { id: jobId } });
  if (now.active && now.state === "STOPPING" && (now.pid === null || !deps.pidAlive(now.pid))) await finishCrawl(db, jobId, "STOPPED", deps);
  return readCrawl(db, jobId, deps);
}

/* ---- the runner's side ---------------------------------------------------------------------------- */

export async function crawlHeartbeat(db: CrawlJobDb, jobId: string, deps: Pick<JobDeps, "now"> = CRAWL_MACHINE): Promise<CompetitionCrawlJobState | null> {
  await db.competitionCrawlJob.updateMany({ where: { id: jobId, active: true }, data: { heartbeatAt: deps.now() } });
  const row = await db.competitionCrawlJob.findUnique({ where: { id: jobId }, select: { state: true } });
  return (row?.state as CompetitionCrawlJobState | undefined) ?? null;
}

export async function markCrawlRunning(db: CrawlJobDb, jobId: string, deps: Pick<JobDeps, "now"> = CRAWL_MACHINE): Promise<boolean> {
  const now = deps.now();
  const { count } = await db.competitionCrawlJob.updateMany({ where: { id: jobId, active: true, state: "QUEUED" }, data: { state: "RUNNING", startedAt: now, heartbeatAt: now } });
  return count === 1;
}

export async function writeCrawlProgress(db: CrawlJobDb, jobId: string, progress: CompetitionCrawlProgress, deps: Pick<JobDeps, "now"> = CRAWL_MACHINE): Promise<void> {
  await db.competitionCrawlJob.updateMany({ where: { id: jobId, active: true }, data: { progress: competitionCrawlProgressSchema.parse(progress) as Prisma.InputJsonValue, heartbeatAt: deps.now() } });
}

export async function crawlRunnerRow(db: CrawlJobDb, jobId: string): Promise<{ request: CompetitionCrawlRequest; state: CompetitionCrawlJobState; active: boolean } | null> {
  const row = await db.competitionCrawlJob.findUnique({ where: { id: jobId }, select: { request: true, state: true, active: true } });
  if (!row) return null;
  const request = competitionCrawlRequestSchema.safeParse(row.request);
  if (!request.success) return null;
  return { request: request.data, state: row.state as CompetitionCrawlJobState, active: row.active === true };
}
