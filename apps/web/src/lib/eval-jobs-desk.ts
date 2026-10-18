import "server-only";
import type { ViduraEvalJob, ViduraEvalRequest, ViduraEvals } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { assertSuperuser } from "./superuser";
import { EVAL_MACHINE, readEval, readEvals, startEval, stopEval, type EvalDb, type EvalDeps } from "./eval-jobs";
import type { ActiveContext } from "./session";

/**
 * The operator's gate over src/lib/eval-jobs.ts (Vidura pass 3, 18 Oct 2026), which the runner imports too and so
 * holds no session and writes no audit line: every press asserts the operator and writes the audit line. The doors
 * under /api/v1/operator/vidura/evals and the panel's actions call these and nothing else.
 */
const evalDb = db as unknown as EvalDb;
let deps: EvalDeps = EVAL_MACHINE;

/** The suites' seam: a fake machine (the model "down", a runner that is a pid of their choosing). Tests only. */
export function useEvalDepsForTests(fake: EvalDeps | null): void {
  if (process.env.NODE_ENV !== "test") throw new Error("useEvalDepsForTests is for the test suites");
  deps = fake ?? EVAL_MACHINE;
}

export async function panelEvals(session: ActiveContext): Promise<ViduraEvals> {
  assertSuperuser(session);
  return readEvals(evalDb, deps);
}

export async function panelEval(session: ActiveContext, jobId: string): Promise<ViduraEvalJob> {
  assertSuperuser(session);
  return readEval(evalDb, jobId, deps);
}

export async function panelStartEval(session: ActiveContext, request: ViduraEvalRequest): Promise<ViduraEvalJob> {
  assertSuperuser(session);
  const job = await startEval(evalDb, { userId: session.user.id }, request, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "vidura.eval.start", targetType: "AssistantEvalJob", targetId: job.id, meta: { sets: job.request.sets, limit: job.request.limit ?? null, startedServers: job.startedServers } });
  return job;
}

export async function panelStopEval(session: ActiveContext, jobId: string): Promise<ViduraEvalJob> {
  assertSuperuser(session);
  const job = await stopEval(evalDb, jobId, { userId: session.user.id }, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "vidura.eval.stop", targetType: "AssistantEvalJob", targetId: jobId, meta: { state: job.state } });
  return job;
}
