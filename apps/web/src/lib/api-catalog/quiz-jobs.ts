import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * quiz-jobs: generation started and stopped from the bank desk, and the two local model servers (the
 * owner, 11 October 2026; src/lib/quiz-jobs.ts, the one writer of a run). The web's cards on
 * /appadmin/quiz-review and /root/quiz-review. Access "app-admin", which the operator passes too, so
 * every role token the sweep holds expects 403 and signed out is a 401: no sweep actor can start a run or
 * touch a server. The writes are sampled on ids nothing holds (a run "zz-sweep-no-such-job", a server
 * "zz-sweep-no-such-server") so that even a fence that failed would change nothing (404). Every write is
 * audited (appadmin.quizJobs.*, appadmin.modelServer.*). tests/quiz-jobs.test.ts proves the rest.
 */
const NO_JOB = "/api/v1/appadmin/quiz-jobs/zz-sweep-no-such-job";
const NO_SERVER = "/api/v1/appadmin/quiz-jobs/servers/zz-sweep-no-such-server";

export const QUIZ_JOBS: Endpoint[] = [
  { method: "GET", path: "/api/v1/appadmin/quiz-jobs", summary: "The generation run in hand, or the last one, with its live line (the chapter running, items drafted and kept, the keep rate, seconds per kept item, rejects per stage, the last chapter's numbers); the latest five runs; the two model servers' state", access: "app-admin", response: c.quizJobsStateSchema },
  { method: "POST", path: "/api/v1/appadmin/quiz-jobs", summary: "Start a generation run on this machine: a board's class, subject and chapter range, or everything not yet generated in the plan's order; brings up the model servers that are down; 201 with the run, 409 while another run is active", access: "app-admin", request: c.quizGenRequestSchema, response: c.quizGenJobReadSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/appadmin/quiz-jobs/servers", summary: "The two model servers, Running, Starting or Stopped, with the model's name and the port, read from their health endpoints (cached ten seconds)", access: "app-admin", response: c.modelServersSchema },
  { method: "POST", path: "/api/v1/appadmin/quiz-jobs/servers/{server}/start", summary: "Start one model server (chat or embed) through scripts/model-serve.sh; nothing when it already answers", access: "app-admin", response: c.modelServersSchema, sample: `${NO_SERVER}/start` },
  { method: "POST", path: "/api/v1/appadmin/quiz-jobs/servers/{server}/stop", summary: "Stop one model server the script started; 409 while a generation run is active (stop the run first)", access: "app-admin", response: c.modelServersSchema, sample: `${NO_SERVER}/stop` },
  { method: "GET", path: "/api/v1/appadmin/quiz-jobs/{jobId}", summary: "One generation run: its state, its request, its live line, who started it and which model servers it brought up", access: "app-admin", response: c.quizGenJobReadSchema, sample: NO_JOB },
  { method: "POST", path: "/api/v1/appadmin/quiz-jobs/{jobId}/stop", summary: "Stop a run: the runner finishes the item in hand and halts, nothing half-written lands, and the model servers this run brought up go down with it; an ended run is left as it is", access: "app-admin", response: c.quizGenJobReadSchema, sample: `${NO_JOB}/stop` },
];
