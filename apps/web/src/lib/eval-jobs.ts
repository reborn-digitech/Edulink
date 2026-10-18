/**
 * EVALUATION RUNS STARTED AND STOPPED FROM THE OPERATOR'S PANEL (Vidura pass 3, 18 October 2026; docs/plans/vidura.md,
 * "Evaluation runs from the panel"; runbook docs/runbooks/assistant-local.md §11). The harness's nine sets
 * (scripts/assistant-eval.ts) run like a quiz generation run (src/lib/quiz-jobs.ts), whose rules this file keeps:
 *
 *   START  reaps the dead, refuses while a generation run or a crawl holds the model (its scores would measure them:
 *          pass 2's run with the renderer on all four slots turned dozens of tutor questions out of scope), claims the
 *          one slot (AssistantEvalJob.active is unique), brings up through scripts/model-serve.sh exactly the servers
 *          the run needs that were down (chat, embed, and the gate's small model when the gate asks one) and records
 *          them, then spawns the runner (`scripts/assistant-eval.ts --job=<id>`) detached and records its pid.
 *   LIVE   the runner rewrites the live line after every case and reads its row every few seconds.
 *   STOP   the row turns STOPPING; the runner finishes the case in hand, writes the scores of what it ran and halts.
 *   END    (FINISHED, STOPPED, FAILED) keeps the scores on the row, frees the slot and takes down the servers THIS
 *          run brought up — handed instead to a generation run or a crawl still active (src/lib/model-holders.ts).
 *   REAP   an active row whose runner's pid is gone, or which has not written for ten minutes, ends FAILED (STOPPED if
 *          a stop was asked), on every read and before every Start.
 *
 * ONE WRITER: every write of an AssistantEvalJob row is a function here; the panel's doors and actions call them
 * through src/lib/eval-jobs-desk.ts (which asserts the operator and audits), the runner directly with its own client.
 * No server-only import, so the runner (a plain Node process) uses this file too.
 */
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  MODEL_SERVERS,
  QUIZ_GEN_ACTIVE_STATES,
  viduraEvalProgressSchema,
  viduraEvalRequestSchema,
  viduraEvalScoreSchema,
  type ModelServer,
  type QuizGenJobState,
  type ViduraEvalJob,
  type ViduraEvalProgress,
  type ViduraEvalRequest,
  type ViduraEvalScore,
  type ViduraEvals,
} from "@edulink/contracts";
import { APP_ROOT, MACHINE, couldNotBegin, deadReason, forgetHealth, modelServers, stoppingProblems, type JobDeps } from "./quiz-jobs";
import { generationOrCrawlActive, handOverTo, neededServers, type HandOver } from "./model-holders";

export type EvalDb = Pick<PrismaClient, "assistantEvalJob" | "quizGenJob" | "competitionCrawlJob" | "user">;

/** The machine, as the quiz job has it, with the evaluation's own runner. */
export type EvalDeps = Omit<JobDeps, "spawnRunner" | "handOver"> & { spawnRunner: (jobId: string) => number; handOver?: HandOver };

const EVAL_LOG_DIR = join(APP_ROOT, "storage", "assistant-eval", "jobs");
/** How many runs the panel lists. */
export const EVAL_RECENT = 10;

function spawnEvalRunner(jobId: string): number {
  mkdirSync(EVAL_LOG_DIR, { recursive: true });
  const log = openSync(join(EVAL_LOG_DIR, `${jobId}.log`), "a");
  try {
    const tsx = join(APP_ROOT, "node_modules", ".bin", "tsx");
    // A plain Node process: the dev server's own NODE_OPTIONS are not its.
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const child = spawn(tsx, ["--tsconfig", "scripts/tsconfig.json", "scripts/assistant-eval.ts", `--job=${jobId}`], { cwd: APP_ROOT, detached: true, stdio: ["ignore", log, log], env });
    child.unref();
    if (!child.pid) throw new Error("the runner did not start");
    return child.pid;
  } finally {
    closeSync(log);
  }
}

export const EVAL_MACHINE: EvalDeps = { health: MACHINE.health, serve: MACHINE.serve, pidAlive: MACHINE.pidAlive, serverPid: MACHINE.serverPid, now: MACHINE.now, spawnRunner: spawnEvalRunner };

export class EvalRefusal extends Error {
  constructor(
    readonly errorKey: "viduraOps.errOneAtATime" | "viduraOps.errNoSuchRun" | "viduraOps.errModelBusy" | "viduraOps.errServerFailed",
    readonly status: 404 | 409 | 500,
  ) {
    super(errorKey);
  }
}

const ACTIVE = [...QUIZ_GEN_ACTIVE_STATES] as string[];
type Row = Prisma.AssistantEvalJobGetPayload<object>;

export function emptyEvalProgress(phase: ViduraEvalProgress["phase"], setsTotal: number): ViduraEvalProgress {
  return { phase, set: null, setIndex: 0, setsTotal, done: 0, total: null, passed: 0, casesDone: 0, seconds: 0, contended: false };
}

function toJob(row: Row, names: Map<string, string>): ViduraEvalJob {
  const request = viduraEvalRequestSchema.safeParse(row.request);
  const progress = viduraEvalProgressSchema.safeParse(row.progress);
  const scores = viduraEvalScoreSchema.array().safeParse(row.scores);
  return {
    id: row.id,
    state: row.state as QuizGenJobState,
    request: request.success ? request.data : { sets: ["refusal"] },
    progress: progress.success ? progress.data : null,
    scores: scores.success ? scores.data : null,
    gate: row.gate,
    startedBy: names.get(row.startedByUserId) ?? "—",
    startedServers: row.startedServers.filter((s): s is ModelServer => (MODEL_SERVERS as readonly string[]).includes(s)),
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    heartbeatAt: row.heartbeatAt?.toISOString() ?? null,
  };
}

async function namesFor(db: EvalDb, rows: Row[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.map((r) => r.startedByUserId))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/**
 * THE END OF A RUN, its one writer: the state, the scores, the slot freed; then the servers this run brought up taken
 * down or handed on. Conditional on the run still being active, so a run ends once.
 */
export async function finishEval(
  db: EvalDb,
  jobId: string,
  state: "FINISHED" | "STOPPED" | "FAILED",
  deps: EvalDeps = EVAL_MACHINE,
  end: { error?: string | null; scores?: ViduraEvalScore[]; gate?: boolean | null; progress?: ViduraEvalProgress } = {},
): Promise<boolean> {
  const now = deps.now();
  const { count } = await db.assistantEvalJob.updateMany({
    where: { id: jobId, active: true },
    data: {
      state,
      active: null,
      pid: null,
      finishedAt: now,
      heartbeatAt: now,
      ...(end.error ? { error: end.error.slice(0, 2000) } : {}),
      ...(end.scores ? { scores: viduraEvalScoreSchema.array().parse(end.scores) as Prisma.InputJsonValue } : {}),
      ...(end.gate !== undefined ? { gate: end.gate } : {}),
      ...(end.progress ? { progress: viduraEvalProgressSchema.parse(end.progress) as Prisma.InputJsonValue } : {}),
    },
  });
  if (count === 0) return false;
  const row = await db.assistantEvalJob.findUnique({ where: { id: jobId }, select: { startedServers: true } });
  const mine = (row?.startedServers ?? []).filter((s): s is ModelServer => (MODEL_SERVERS as readonly string[]).includes(s));
  const toStop = await (deps.handOver ?? handOverTo(db, "EVAL"))(mine);
  const problems: string[] = [];
  for (const server of toStop) {
    try {
      await deps.serve(`stop-${server}`);
    } catch (error) {
      problems.push(`${server}: ${(error as Error).message}`);
    }
  }
  forgetHealth();
  if (problems.length) await db.assistantEvalJob.update({ where: { id: jobId }, data: { error: [end.error, stoppingProblems(problems)].filter(Boolean).join(" — ").slice(0, 2000) } });
  return true;
}

/** Why an active row's runner is dead, or null while it lives: the generation run's own rule (quiz-jobs.ts). */
export function evalDeadReason(row: Pick<Row, "pid" | "state" | "createdAt" | "heartbeatAt">, deps: Pick<EvalDeps, "now" | "pidAlive">): string | null {
  return deadReason(row, deps);
}

export async function reapEvals(db: EvalDb, deps: EvalDeps = EVAL_MACHINE): Promise<number> {
  const rows = await db.assistantEvalJob.findMany({ where: { active: true }, select: { id: true, pid: true, state: true, createdAt: true, heartbeatAt: true } });
  let reaped = 0;
  for (const row of rows) {
    const reason = evalDeadReason(row, deps);
    if (!reason) continue;
    const ended = row.state === "STOPPING" ? await finishEval(db, row.id, "STOPPED", deps) : await finishEval(db, row.id, "FAILED", deps, { error: reason });
    if (ended) reaped++;
  }
  return reaped;
}

/** The run in hand (or the last), the latest runs, the servers, and whether the model is held by another kind of run. Reaps first. */
export async function readEvals(db: EvalDb, deps: EvalDeps = EVAL_MACHINE): Promise<ViduraEvals> {
  await reapEvals(db, deps);
  const [active, recent, servers, busy] = await Promise.all([
    db.assistantEvalJob.findFirst({ where: { active: true } }),
    db.assistantEvalJob.findMany({ orderBy: { createdAt: "desc" }, take: EVAL_RECENT }),
    modelServers(deps),
    generationOrCrawlActive(db),
  ]);
  const current = active ?? recent[0] ?? null;
  const names = await namesFor(db, [...recent, ...(active ? [active] : [])]);
  return { current: current ? toJob(current, names) : null, recent: recent.map((r) => toJob(r, names)), servers, modelBusy: busy };
}

export async function readEval(db: EvalDb, jobId: string, deps: EvalDeps = EVAL_MACHINE): Promise<ViduraEvalJob> {
  await reapEvals(db, deps);
  const row = await db.assistantEvalJob.findUnique({ where: { id: jobId } });
  if (!row) throw new EvalRefusal("viduraOps.errNoSuchRun", 404);
  return toJob(row, await namesFor(db, [row]));
}

/** START: refused while a generation run or a crawl holds the model; the slot, the servers that were down, the runner. */
export async function startEval(db: EvalDb, who: { userId: string }, request: ViduraEvalRequest, deps: EvalDeps = EVAL_MACHINE): Promise<ViduraEvalJob> {
  await reapEvals(db, deps);
  if (await generationOrCrawlActive(db)) throw new EvalRefusal("viduraOps.errModelBusy", 409);
  const needs = neededServers("EVAL");
  const servers = (await modelServers(deps, { fresh: true })).filter((s) => needs.includes(s.server));
  const down = servers.filter((s) => s.state === "STOPPED").map((s) => s.server);
  const clean = viduraEvalRequestSchema.parse({ ...request, sets: [...new Set(request.sets)] });
  let row: Row;
  try {
    row = await db.assistantEvalJob.create({
      data: {
        state: "QUEUED",
        active: true,
        request: clean as Prisma.InputJsonValue,
        progress: emptyEvalProgress(servers.every((s) => s.state === "RUNNING") ? "RUNNING" : "STARTING_MODEL", clean.sets.length) as Prisma.InputJsonValue,
        startedServers: down,
        startedByUserId: who.userId,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new EvalRefusal("viduraOps.errOneAtATime", 409);
    throw error;
  }
  try {
    for (const server of down) await deps.serve(`start-${server}`);
    forgetHealth();
    const pid = deps.spawnRunner(row.id);
    row = await db.assistantEvalJob.update({ where: { id: row.id }, data: { pid, heartbeatAt: deps.now() } });
  } catch (error) {
    await finishEval(db, row.id, "FAILED", deps, { error: couldNotBegin(error) });
    throw new EvalRefusal("viduraOps.errServerFailed", 500);
  }
  return toJob(row, await namesFor(db, [row]));
}

/** STOP: the runner is asked (STOPPING) and halts after the case in hand; a runner already gone is reaped at once. */
export async function stopEval(db: EvalDb, jobId: string, who: { userId: string }, deps: EvalDeps = EVAL_MACHINE): Promise<ViduraEvalJob> {
  const row = await db.assistantEvalJob.findUnique({ where: { id: jobId } });
  if (!row) throw new EvalRefusal("viduraOps.errNoSuchRun", 404);
  if (row.active && (row.state === "QUEUED" || row.state === "RUNNING")) {
    await db.assistantEvalJob.updateMany({ where: { id: jobId, active: true, state: { in: ["QUEUED", "RUNNING"] } }, data: { state: "STOPPING", stopRequestedBy: who.userId } });
  }
  const now = await db.assistantEvalJob.findUniqueOrThrow({ where: { id: jobId } });
  if (now.active && now.state === "STOPPING" && (now.pid === null || !deps.pidAlive(now.pid))) await finishEval(db, jobId, "STOPPED", deps);
  return readEval(db, jobId, deps);
}

/* ---- the runner's side ------------------------------------------------------------------------------------------- */

/** The runner's record of its request and where to write, at boot; null when the row is gone or not active. */
export async function evalRunnerRow(db: EvalDb, jobId: string): Promise<{ request: ViduraEvalRequest; state: QuizGenJobState } | null> {
  const row = await db.assistantEvalJob.findUnique({ where: { id: jobId }, select: { request: true, state: true, active: true } });
  if (!row || row.active !== true) return null;
  const request = viduraEvalRequestSchema.safeParse(row.request);
  return request.success ? { request: request.data, state: row.state as QuizGenJobState } : null;
}

/**
 * The model is up and the runner begins: QUEUED → RUNNING, with where it writes and ITS OWN pid. The pid Start recorded
 * is the launcher's (tsx's command line, which runs the script in a child process); from here the reaper watches the
 * process doing the work, so a launcher gone first never ends a live run. False when the run was stopped meanwhile.
 */
export async function markEvalRunning(db: EvalDb, jobId: string, outDir: string, deps: Pick<EvalDeps, "now"> = EVAL_MACHINE, pid: number = process.pid): Promise<boolean> {
  const now = deps.now();
  const { count } = await db.assistantEvalJob.updateMany({ where: { id: jobId, active: true, state: "QUEUED" }, data: { state: "RUNNING", startedAt: now, heartbeatAt: now, outDir, pid } });
  return count === 1;
}

/**
 * The scores of a run that was ended under the runner (reaped, or stopped after the case in hand had already been
 * scored): kept on the row all the same, never over scores already written. True when they were written.
 */
export async function keepScoresAfterEnd(db: EvalDb, jobId: string, scores: ViduraEvalScore[], gate: boolean | null): Promise<boolean> {
  const row = await db.assistantEvalJob.findUnique({ where: { id: jobId }, select: { active: true, scores: true } });
  if (!row || row.active || row.scores !== null) return false;
  await db.assistantEvalJob.update({ where: { id: jobId }, data: { scores: viduraEvalScoreSchema.array().parse(scores) as Prisma.InputJsonValue, gate } });
  return true;
}

/**
 * The runner's beat and live line: the row's heartbeat (and the line, when given) written; the state read back
 * (STOPPING tells it to halt) with whether a generation run or a crawl now shares the model.
 */
export async function evalBeat(db: EvalDb, jobId: string, progress: ViduraEvalProgress | null, deps: Pick<EvalDeps, "now"> = EVAL_MACHINE): Promise<{ state: QuizGenJobState | null; contended: boolean }> {
  await db.assistantEvalJob.updateMany({ where: { id: jobId, active: true }, data: { heartbeatAt: deps.now(), ...(progress ? { progress: viduraEvalProgressSchema.parse(progress) as Prisma.InputJsonValue } : {}) } });
  const [row, contended] = await Promise.all([db.assistantEvalJob.findUnique({ where: { id: jobId }, select: { state: true } }), generationOrCrawlActive(db)]);
  return { state: (row?.state as QuizGenJobState | undefined) ?? null, contended };
}

export const EVAL_ACTIVE_STATES = ACTIVE;
