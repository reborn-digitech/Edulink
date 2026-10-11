import "server-only";
import type { ModelServer, ModelServerStatus, QuizGenJob, QuizGenRequest, QuizJobsState } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { reviewerRole } from "./quiz-review";
import { MACHINE, modelServers, readJob, readJobs, startJob, startModelServer, stopJob, stopModelServer, type JobDb, type JobDeps } from "./quiz-jobs";
import type { ActiveContext } from "./session";

/**
 * The bank desk's gate over src/lib/quiz-jobs.ts (which a plain Node runner imports too, so it holds no
 * session and writes no audit line): every press asserts the content team's gate (the operator passes
 * it), names the role the person stood in, and writes the audit line. The doors under
 * /api/v1/appadmin/quiz-jobs and the desk's server actions call these and nothing else.
 */

const jobDb = db as unknown as JobDb;
let deps: JobDeps = MACHINE;

/** The suites' seam: a fake machine (the model "down", a runner that is a pid of their choosing). Tests only. */
export function useJobDepsForTests(fake: JobDeps | null): void {
  if (process.env.NODE_ENV !== "test") throw new Error("useJobDepsForTests is for the test suites");
  deps = fake ?? MACHINE;
}

export async function deskJobs(session: ActiveContext): Promise<QuizJobsState> {
  reviewerRole(session);
  return readJobs(jobDb, deps);
}

export async function deskJob(session: ActiveContext, jobId: string): Promise<QuizGenJob> {
  reviewerRole(session);
  return readJob(jobDb, jobId, deps);
}

export async function deskStartJob(session: ActiveContext, request: QuizGenRequest): Promise<QuizGenJob> {
  const role = reviewerRole(session);
  const job = await startJob(jobDb, { userId: session.user.id, role }, request, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizJobs.start", targetType: "QuizGenJob", targetId: job.id, meta: { role, request, startedServers: job.startedServers } });
  return job;
}

export async function deskStopJob(session: ActiveContext, jobId: string): Promise<QuizGenJob> {
  const role = reviewerRole(session);
  const job = await stopJob(jobDb, jobId, { userId: session.user.id }, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.quizJobs.stop", targetType: "QuizGenJob", targetId: jobId, meta: { role, state: job.state } });
  return job;
}

export async function deskServers(session: ActiveContext): Promise<ModelServerStatus[]> {
  reviewerRole(session);
  return modelServers(deps);
}

/** The two dashboards' line: no gate of its own (each dashboard's page asserts its own), the cached read. */
export async function serversForDashboard(): Promise<ModelServerStatus[]> {
  return modelServers(deps);
}

export async function deskStartServer(session: ActiveContext, server: ModelServer): Promise<ModelServerStatus[]> {
  const role = reviewerRole(session);
  const servers = await startModelServer(server, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.modelServer.start", targetType: "ModelServer", targetId: server, meta: { role } });
  return servers;
}

export async function deskStopServer(session: ActiveContext, server: ModelServer): Promise<ModelServerStatus[]> {
  const role = reviewerRole(session);
  const servers = await stopModelServer(jobDb, server, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.modelServer.stop", targetType: "ModelServer", targetId: server, meta: { role } });
  return servers;
}
