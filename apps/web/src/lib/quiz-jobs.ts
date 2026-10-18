/**
 * GENERATION STARTED AND STOPPED FROM THE BANK DESK, and the two local model servers (the owner,
 * 11 October 2026; docs/plans/assistant-and-quiz-bank.md Phase 1, docs/runbooks/assistant-local.md §9).
 *
 * ONE LIBRARY, ONE WRITER. Every write of a QuizGenJob row is a function of this file: the desk's Start
 * and Stop (through src/lib/quiz-jobs-desk.ts, which asserts the person and audits), and the runner's
 * heartbeat, progress and finish (scripts/quiz-gen/job.ts, the generator's CLI run with --job=<id> as a
 * detached child of whoever pressed Start). It imports nothing that needs a request, so the runner — a
 * plain Node process — uses it too, with its own Prisma client.
 *
 *   START  reaps the dead (below), checks the two model servers' health endpoints, claims the one slot
 *          (QuizGenJob.active is unique: a second Start while one is QUEUED, RUNNING or STOPPING fails on
 *          the index, not on a read that two presses could both pass), brings up through
 *          scripts/model-serve.sh exactly the servers that were down and records them on the row, then
 *          spawns the runner and records its pid. The runner waits for the model ("starting the model"),
 *          marks the run RUNNING and works.
 *   STOP   asks: the row turns STOPPING and the runner, which reads its row every few seconds, finishes the
 *          item in hand and halts; the chapter in progress is not written (nothing half-written lands) and
 *          is generated again, from the start, by the next run. A runner already dead is reaped at once.
 *   END    (FINISHED, STOPPED, FAILED) frees the slot, and takes down through scripts/model-serve.sh the
 *          servers THIS run brought up, and no others: servers that were up for the assistant stay up.
 *   REAP   on every read and before every Start: an active row whose runner's pid is dead (or whose
 *          heartbeat is ten minutes old) becomes FAILED with the reason (STOPPED if a stop was asked);
 *          that covers a machine or dev server restarted under a run.
 *
 * The model servers are controlled through scripts/model-serve.sh ONLY (start-chat, start-chat2, start-embed,
 * start-small and their stops), never by killing a process here; the script stops only servers it started (by
 * its pid files). Stopping a server while a run is active is refused until the run is stopped.
 *
 * HOSTED: the runner runs where the model runs. On the owner's machine that is this machine; on a hosted
 * deployment the generation job belongs on the model's host, with this file's spawn and the script
 * swapped for that host's job runner (the plan says so).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, closeSync } from "node:fs";
import { join } from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  MODEL_SERVERS,
  QUIZ_GEN_ACTIVE_STATES,
  quizGenProgressSchema,
  quizGenRequestSchema,
  type ModelServer,
  type ModelServerStatus,
  type QuizGenJob,
  type QuizGenJobState,
  type QuizGenProgress,
  type QuizGenRequest,
  type QuizJobsState,
} from "@edulink/contracts";
import { activeRuns, handOverTo, neededServers, OPTIONAL_SERVERS, type HandOver } from "./model-holders";

/**
 * The tables this file touches; the web passes src/lib/db's client, the runner its own. The crawl's
 * table is read so a run ending beside an active competitions crawl hands it the servers it brought up
 * (src/lib/model-holders.ts, 12 Oct 2026).
 */
export type JobDb = Pick<PrismaClient, "quizGenJob" | "user" | "competitionCrawlJob" | "assistantEvalJob">;

/** The apps/web directory: scripts/model-serve.sh, the runner's CLI and storage/ live under it. */
export const APP_ROOT = process.cwd();
export const MODEL_SERVE_SCRIPT = join(APP_ROOT, "scripts", "model-serve.sh");
const JOB_LOG_DIR = join(APP_ROOT, "storage", "quiz-jobs");

/** How long a health answer is reused (the dashboards' "short cache"). */
export const HEALTH_CACHE_MS = 10_000;
/** A runner that has not written its row in this long is dead, whatever its pid says (a pid reused after a restart). */
export const HEARTBEAT_STALE_MS = 10 * 60_000;
/** A QUEUED row whose runner never wrote a pid in this long failed to start. */
const SPAWN_GRACE_MS = 2 * 60_000;

export type ServeCommand = `start-${ModelServer}` | `stop-${ModelServer}`;
export type Health = "ok" | "loading" | "down";

/** Everything that touches the machine, injectable so the suites can say "the model is down" without stopping it. */
export type JobDeps = {
  health: (server: ModelServer) => Promise<Health>;
  /** scripts/model-serve.sh <command>, waited for (the script backgrounds the server itself and returns). */
  serve: (command: ServeCommand) => Promise<void>;
  pidAlive: (pid: number) => boolean;
  /** The pid scripts/model-serve.sh recorded for a server it started, if any. */
  serverPid: (server: ModelServer) => number | null;
  /** Starts the runner, detached; its pid. */
  spawnRunner: (jobId: string) => number;
  now: () => Date;
  /**
   * Where the servers a run brought up go when it ends (competitions-crawler, 12 Oct 2026): to the other
   * kind's active run if there is one, else down. Absent: the database's own answer (model-holders.ts).
   */
  handOver?: HandOver;
};

/* -------------------------------------------------------------------------- */
/* The model servers                                                           */
/* -------------------------------------------------------------------------- */

const DEFAULTS: Record<ModelServer, { url: string; model: string; urlKey: string; modelKey: string }> = {
  chat: { url: "http://127.0.0.1:8180/v1", model: "qwen3-30b-a3b", urlKey: "ASSISTANT_MODEL_URL", modelKey: "ASSISTANT_MODEL" },
  embed: { url: "http://127.0.0.1:8181/v1", model: "qwen3-embedding-0.6b", urlKey: "ASSISTANT_EMBED_URL", modelKey: "ASSISTANT_EMBED_MODEL" },
  // Vidura pass 3 (18 Oct 2026): the gate's small model (scripts/model-serve.sh start-small).
  small: { url: "http://127.0.0.1:8182/v1", model: "qwen3-4b", urlKey: "ASSISTANT_GATE_MODEL_URL", modelKey: "ASSISTANT_GATE_MODEL" },
  // gen-throughput (19 Oct 2026): the generator's second chat server, the same model on :8183 (scripts/model-serve.sh
  // start-chat2); the assistant never reads it (src/lib/assistant-env.ts), so all its slots are the generator's.
  chat2: { url: "http://127.0.0.1:8183/v1", model: "qwen3-30b-a3b", urlKey: "QUIZ_GEN_CHAT2_URL", modelKey: "QUIZ_GEN_CHAT2_MODEL" },
};

/** The server's address and name from the assistant's own settings (src/lib/assistant-env.ts), else the script's defaults. */
export function serverEndpoint(server: ModelServer, env: Record<string, string | undefined> = process.env): { origin: string; port: number | null; model: string } {
  const d = DEFAULTS[server];
  let url: URL;
  try {
    url = new URL(env[d.urlKey]?.trim() || d.url);
  } catch {
    url = new URL(d.url);
  }
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : url.protocol === "http:" ? 80 : null;
  return { origin: url.origin, port, model: env[d.modelKey]?.trim() || d.model };
}

/** llama-server's /health: 200 when the model is loaded, 503 while it loads; nothing answering is down. */
export async function healthOf(server: ModelServer): Promise<Health> {
  try {
    const res = await fetch(`${serverEndpoint(server).origin}/health`, { signal: AbortSignal.timeout(2_000), cache: "no-store" });
    if (res.ok) return "ok";
    return res.status === 503 ? "loading" : "down";
  } catch {
    return "down";
  }
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: alive, another user's; ESRCH: gone.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function serverPid(server: ModelServer): number | null {
  const file = join(APP_ROOT, "storage", "models", `${server}.pid`);
  if (!existsSync(file)) return null;
  const pid = Number(readFileSync(file, "utf8").trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function serve(command: ServeCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    // Detached: the server the script backgrounds lands in its own session, so stopping the dev server
    // (or a suite's process) never takes the model down with it.
    const child = spawn("bash", [MODEL_SERVE_SCRIPT, command], { cwd: APP_ROOT, detached: true, stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`scripts/model-serve.sh ${command} exited ${code}`))));
  });
}

function spawnRunner(jobId: string): number {
  mkdirSync(JOB_LOG_DIR, { recursive: true });
  const log = openSync(join(JOB_LOG_DIR, `${jobId}.log`), "a");
  try {
    const tsx = join(APP_ROOT, "node_modules", ".bin", "tsx");
    // The runner is a plain Node process: the dev server's own NODE_OPTIONS (its hooks, an inspector) are not its.
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const child = spawn(tsx, ["--tsconfig", "scripts/tsconfig.json", "scripts/quiz-gen/cli.ts", `--job=${jobId}`], {
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

export const MACHINE: JobDeps = { health: healthOf, serve, pidAlive, serverPid, spawnRunner, now: () => new Date() };

const healthCache = new Map<ModelServer, { at: number; status: ModelServerStatus }>();

/** Forget the cached answers: after a start or a stop, the next read asks the servers. */
export function forgetHealth(): void {
  healthCache.clear();
}

/**
 * Each server's state, read live from its health endpoint and reused for ten seconds: RUNNING when it
 * answers ok, STARTING while it loads (or while the script's pid is alive and the port not yet open),
 * STOPPED when nothing answers.
 */
export async function modelServers(deps: Pick<JobDeps, "now" | "health" | "serverPid" | "pidAlive"> = MACHINE, opts: { fresh?: boolean } = {}): Promise<ModelServerStatus[]> {
  const now = deps.now();
  return Promise.all(
    MODEL_SERVERS.map(async (server) => {
      const cached = healthCache.get(server);
      if (!opts.fresh && cached && now.getTime() - cached.at < HEALTH_CACHE_MS) return cached.status;
      const health = await deps.health(server);
      const pid = health === "down" ? deps.serverPid(server) : null;
      const state = health === "ok" ? "RUNNING" : health === "loading" || (pid !== null && deps.pidAlive(pid)) ? "STARTING" : "STOPPED";
      const endpoint = serverEndpoint(server);
      const status: ModelServerStatus = { server, state, model: endpoint.model, port: endpoint.port, checkedAt: now.toISOString() };
      healthCache.set(server, { at: now.getTime(), status });
      return status;
    }),
  );
}

/** The servers a run needs (model-holders.ts `neededServers`: chat and embed, and the small one for an evaluation) answer ok: the runner may begin. */
export async function modelReady(deps: Pick<JobDeps, "now" | "health" | "serverPid" | "pidAlive"> = MACHINE, needs: readonly ModelServer[] = ["chat", "embed"]): Promise<boolean> {
  return (await modelServers(deps, { fresh: true })).filter((s) => needs.includes(s.server)).every((s) => s.state === "RUNNING");
}

/* -------------------------------------------------------------------------- */
/* The job row                                                                 */
/* -------------------------------------------------------------------------- */

export class JobRefusal extends Error {
  constructor(
    readonly errorKey: "quizJobs.oneAtATime" | "quizJobs.noSuchJob" | "quizJobs.stopRunFirst" | "quizJobs.serverFailed" | "quizJobs.notOurs",
    readonly status: 404 | 409 | 422 | 500,
  ) {
    super(errorKey);
  }
}

const ACTIVE = [...QUIZ_GEN_ACTIVE_STATES] as string[];

export function emptyProgress(phase: QuizGenProgress["phase"]): QuizGenProgress {
  return { phase, chapter: null, chaptersDone: 0, chaptersSkipped: 0, chaptersFailed: [], drafted: 0, kept: 0, loaded: 0, keepRate: null, secondsPerKept: null, last: null };
}

type JobRow = Prisma.QuizGenJobGetPayload<object>;

function readProgress(raw: unknown): QuizGenProgress | null {
  const parsed = quizGenProgressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function toJob(row: JobRow, names: Map<string, string>): QuizGenJob {
  const request = quizGenRequestSchema.safeParse(row.request);
  return {
    id: row.id,
    state: row.state as QuizGenJobState,
    request: request.success ? request.data : { scope: "EVERYTHING" },
    progress: readProgress(row.progress),
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

async function namesFor(db: JobDb, rows: JobRow[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.map((r) => r.startedByUserId))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/**
 * The servers a run brought up go down with it, through the script; a failure to stop is said, never
 * thrown. While a competitions crawl is active they are handed to it instead (model-holders.ts): the
 * crawl takes them down when it ends.
 */
async function serversDownAfter(db: JobDb, row: Pick<JobRow, "startedServers">, deps: JobDeps): Promise<string[]> {
  const problems: string[] = [];
  const mine = row.startedServers.filter((s): s is ModelServer => (MODEL_SERVERS as readonly string[]).includes(s));
  const toStop = await (deps.handOver ?? handOverTo(db, "QUIZ"))(mine);
  for (const server of toStop) {
    try {
      await deps.serve(`stop-${server}`);
    } catch (error) {
      problems.push(`${server}: ${(error as Error).message}`);
    }
  }
  forgetHealth();
  return problems;
}

/**
 * THE END OF A RUN, its one writer: the state, the slot freed, the pid cleared, the reason when it failed;
 * then the servers this run brought up taken down. Conditional on the run still being active, so a run
 * ends once (the runner's own finish and a reap cannot both take the servers down).
 */
export async function finishJob(db: JobDb, jobId: string, state: "FINISHED" | "STOPPED" | "FAILED", deps: JobDeps = MACHINE, error: string | null = null, progress?: QuizGenProgress): Promise<boolean> {
  const now = deps.now();
  const { count } = await db.quizGenJob.updateMany({
    where: { id: jobId, active: true },
    data: { state, active: null, pid: null, finishedAt: now, heartbeatAt: now, ...(error ? { error: error.slice(0, 2000) } : {}), ...(progress ? { progress: progress as Prisma.InputJsonValue } : {}) },
  });
  if (count === 0) return false;
  const row = await db.quizGenJob.findUnique({ where: { id: jobId }, select: { startedServers: true } });
  if (row) {
    const problems = await serversDownAfter(db, row, deps);
    if (problems.length) await db.quizGenJob.update({ where: { id: jobId }, data: { error: [error, stoppingProblems(problems)].filter(Boolean).join(" — ").slice(0, 2000) } });
  }
  return true;
}

/**
 * A run's own words for the operator's log line (the row's `error`, shown as it is): kept here once for every kind of
 * run (the evaluation runs of Vidura pass 3 use them too, src/lib/eval-jobs.ts).
 */
export function stoppingProblems(problems: string[]): string {
  return `stopping the model servers: ${problems.join("; ")}`;
}
export function couldNotBegin(error: unknown): string {
  return `the run could not begin: ${(error as Error).message}`;
}

/** Why an active row's runner is dead, or null while it lives. */
export function deadReason(row: Pick<JobRow, "pid" | "state" | "createdAt" | "heartbeatAt">, deps: Pick<JobDeps, "now" | "pidAlive">): string | null {
  const now = deps.now().getTime();
  if (row.pid === null) return now - row.createdAt.getTime() > SPAWN_GRACE_MS ? "the runner never started" : null;
  if (!deps.pidAlive(row.pid)) return `the runner's process (pid ${row.pid}) is no longer running`;
  if (row.heartbeatAt && now - row.heartbeatAt.getTime() > HEARTBEAT_STALE_MS) return `the runner (pid ${row.pid}) has not written for ${Math.round((now - row.heartbeatAt.getTime()) / 60_000)} minutes`;
  return null;
}

/** REAP: every active row whose runner is dead ends (FAILED with the reason; STOPPED if a stop had been asked). */
export async function reapJobs(db: JobDb, deps: JobDeps = MACHINE): Promise<number> {
  const rows = await db.quizGenJob.findMany({ where: { active: true }, select: { id: true, pid: true, state: true, createdAt: true, heartbeatAt: true } });
  let reaped = 0;
  for (const row of rows) {
    const reason = deadReason(row, deps);
    if (!reason) continue;
    const ended = row.state === "STOPPING" ? await finishJob(db, row.id, "STOPPED", deps) : await finishJob(db, row.id, "FAILED", deps, reason);
    if (ended) reaped++;
  }
  return reaped;
}

/** The run in hand (or the last), the latest five, and the servers' state; reaps first. */
export async function readJobs(db: JobDb, deps: JobDeps = MACHINE): Promise<QuizJobsState> {
  await reapJobs(db, deps);
  const [active, recent, servers] = await Promise.all([
    db.quizGenJob.findFirst({ where: { active: true } }),
    db.quizGenJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    modelServers(deps),
  ]);
  const current = active ?? recent[0] ?? null;
  const names = await namesFor(db, [...recent, ...(active ? [active] : [])]);
  return { current: current ? toJob(current, names) : null, recent: recent.map((r) => toJob(r, names)), servers };
}

export async function readJob(db: JobDb, jobId: string, deps: JobDeps = MACHINE): Promise<QuizGenJob> {
  await reapJobs(db, deps);
  const row = await db.quizGenJob.findUnique({ where: { id: jobId } });
  if (!row) throw new JobRefusal("quizJobs.noSuchJob", 404);
  return toJob(row, await namesFor(db, [row]));
}

function isUniqueClash(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

/**
 * START. The slot is claimed first (the unique index), then the servers that were down are brought up
 * and recorded, then the runner is spawned. A failure after the claim ends the run FAILED with the
 * reason, so the slot is never left held by a run that never began.
 */
export async function startJob(db: JobDb, who: { userId: string; role: "APP_ADMIN" | "OPERATOR" }, request: QuizGenRequest, deps: JobDeps = MACHINE): Promise<QuizGenJob> {
  await reapJobs(db, deps);
  // Only the servers a generation run needs (the gate's small model is the assistant's, pass 3; the second chat server
  // is the generator's own since 19 Oct 2026).
  const servers = (await modelServers(deps, { fresh: true })).filter((s) => neededServers("QUIZ").includes(s.server));
  const down = servers.filter((s) => s.state === "STOPPED").map((s) => s.server);
  let row: JobRow;
  try {
    row = await db.quizGenJob.create({
      data: {
        state: "QUEUED",
        active: true,
        request: request as Prisma.InputJsonValue,
        progress: emptyProgress(down.length || servers.some((s) => s.state !== "RUNNING") ? "STARTING_MODEL" : "PLANNING") as Prisma.InputJsonValue,
        startedServers: down,
        startedByUserId: who.userId,
        startedByRole: who.role,
      },
    });
  } catch (error) {
    if (isUniqueClash(error)) throw new JobRefusal("quizJobs.oneAtATime", 409);
    throw error;
  }
  try {
    // gen-throughput (19 Oct 2026): the second chat server is optional. The script refuses it when free memory is short
    // (and says so in storage/models/chat2.log); the run then goes on without it and does not record it as its own.
    const notStarted: ModelServer[] = [];
    for (const server of down) {
      try {
        await deps.serve(`start-${server}`);
      } catch (error) {
        if (!OPTIONAL_SERVERS.includes(server)) throw error;
        notStarted.push(server);
      }
    }
    forgetHealth();
    const pid = deps.spawnRunner(row.id);
    row = await db.quizGenJob.update({
      where: { id: row.id },
      data: { pid, heartbeatAt: deps.now(), ...(notStarted.length ? { startedServers: down.filter((s) => !notStarted.includes(s)) } : {}) },
    });
  } catch (error) {
    await finishJob(db, row.id, "FAILED", deps, couldNotBegin(error));
    throw new JobRefusal("quizJobs.serverFailed", 500);
  }
  return toJob(row, await namesFor(db, [row]));
}

/**
 * STOP: the runner is asked (STOPPING) and halts after the item in hand; a runner already dead is reaped
 * at once. Stopping a run that has ended changes nothing.
 */
export async function stopJob(db: JobDb, jobId: string, who: { userId: string }, deps: JobDeps = MACHINE): Promise<QuizGenJob> {
  const row = await db.quizGenJob.findUnique({ where: { id: jobId } });
  if (!row) throw new JobRefusal("quizJobs.noSuchJob", 404);
  if (row.active && (row.state === "QUEUED" || row.state === "RUNNING")) {
    await db.quizGenJob.updateMany({ where: { id: jobId, active: true, state: { in: ["QUEUED", "RUNNING"] } }, data: { state: "STOPPING", stopRequestedBy: who.userId } });
  }
  // Reaped on Stop: a runner that is gone cannot halt itself.
  const now = await db.quizGenJob.findUniqueOrThrow({ where: { id: jobId } });
  if (now.active && now.state === "STOPPING" && (now.pid === null || !deps.pidAlive(now.pid))) await finishJob(db, jobId, "STOPPED", deps);
  return readJob(db, jobId, deps);
}

/* ---- the runner's side ---------------------------------------------------------------------------- */

/** The runner's beat: the row's heartbeat written; the state read back (STOPPING tells it to halt). */
export async function heartbeat(db: JobDb, jobId: string, deps: Pick<JobDeps, "now"> = MACHINE): Promise<QuizGenJobState | null> {
  await db.quizGenJob.updateMany({ where: { id: jobId, active: true }, data: { heartbeatAt: deps.now() } });
  const row = await db.quizGenJob.findUnique({ where: { id: jobId }, select: { state: true } });
  return (row?.state as QuizGenJobState | undefined) ?? null;
}

/** The model is up and the runner begins: QUEUED → RUNNING. False when the run was stopped meanwhile. */
export async function markRunning(db: JobDb, jobId: string, deps: Pick<JobDeps, "now"> = MACHINE): Promise<boolean> {
  const now = deps.now();
  const { count } = await db.quizGenJob.updateMany({ where: { id: jobId, active: true, state: "QUEUED" }, data: { state: "RUNNING", startedAt: now, heartbeatAt: now } });
  return count === 1;
}

/** The live line, after every item. Written only while the run is active. */
export async function writeProgress(db: JobDb, jobId: string, progress: QuizGenProgress, deps: Pick<JobDeps, "now"> = MACHINE): Promise<void> {
  await db.quizGenJob.updateMany({ where: { id: jobId, active: true }, data: { progress: quizGenProgressSchema.parse(progress) as Prisma.InputJsonValue, heartbeatAt: deps.now() } });
}

/** The runner's own record of its request and the row's state, at boot. */
export async function runnerRow(db: JobDb, jobId: string): Promise<{ request: QuizGenRequest; state: QuizGenJobState; active: boolean } | null> {
  const row = await db.quizGenJob.findUnique({ where: { id: jobId }, select: { request: true, state: true, active: true } });
  if (!row) return null;
  const request = quizGenRequestSchema.safeParse(row.request);
  if (!request.success) return null;
  return { request: request.data, state: row.state as QuizGenJobState, active: row.active === true };
}

/* ---- the servers' own Start and Stop on the card ---------------------------------------------------- */

/** Start one server through the script (nothing when it already answers or is loading). */
export async function startModelServer(server: ModelServer, deps: JobDeps = MACHINE): Promise<ModelServerStatus[]> {
  const [state] = (await modelServers(deps, { fresh: true })).filter((s) => s.server === server);
  if (state?.state === "STOPPED") {
    try {
      await deps.serve(`start-${server}`);
    } catch {
      throw new JobRefusal("quizJobs.serverFailed", 500);
    }
  }
  forgetHealth();
  return modelServers(deps, { fresh: true });
}

/**
 * Stop one server through the script; refused while a run is active (stop the run first), and refused
 * for a server the script did not start (no pid file: it was started by hand, and is stopped there).
 */
export async function stopModelServer(db: JobDb, server: ModelServer, deps: JobDeps = MACHINE): Promise<ModelServerStatus[]> {
  await reapJobs(db, deps);
  // A competitions crawl (12 Oct 2026) and an evaluation run (Vidura pass 3) hold the model too: refused while any kind runs.
  if ((await db.quizGenJob.count({ where: { active: true, state: { in: ACTIVE } } })) + (await activeRuns(db)) > 0) throw new JobRefusal("quizJobs.stopRunFirst", 409);
  const [state] = (await modelServers(deps, { fresh: true })).filter((s) => s.server === server);
  if (state?.state === "STOPPED") return modelServers(deps);
  if (deps.serverPid(server) === null) throw new JobRefusal("quizJobs.notOurs", 422);
  try {
    await deps.serve(`stop-${server}`);
  } catch {
    throw new JobRefusal("quizJobs.serverFailed", 500);
  }
  forgetHealth();
  return modelServers(deps, { fresh: true });
}
