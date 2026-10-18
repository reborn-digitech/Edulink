/**
 * THREE KINDS OF RUN, ONE MODEL (competitions-crawler, 12 October 2026; Vidura pass 3, 18 October 2026). A quiz
 * generation run (QuizGenJob, src/lib/quiz-jobs.ts), a competitions crawl (CompetitionCrawlJob,
 * src/lib/competition-crawl-jobs.ts) and an evaluation run (AssistantEvalJob, src/lib/eval-jobs.ts) are different
 * jobs, one active of each at a time, on the same local model servers. Each keeps the quiz job's rule — a Start brings
 * up only the servers that were down and records them; the run's end takes down only what it recorded — with one
 * addition so that none pulls the model out from under another: when a run ends while a run of ANOTHER kind is active,
 * the servers it brought up are HANDED to that run (added to its `startedServers`) instead of stopped, and go down
 * when the last holder ends. And a server's own Stop on the desks is refused while a run of any kind is active.
 *
 * Since pass 3 there are three servers (chat, embed and the gate's small model); a run brings up only those it needs
 * (`neededServers`): a generation run and a crawl the chat and embedding models, an evaluation run the small one too
 * when the gate is configured to ask it.
 *
 * No server-only import: the runners (plain Node processes) end their runs through these too.
 */
import type { PrismaClient } from "@prisma/client";
import type { ModelServer } from "@edulink/contracts";

export type HolderDb = Pick<PrismaClient, "quizGenJob" | "competitionCrawlJob" | "assistantEvalJob">;
export type HolderKind = "QUIZ" | "CRAWL" | "EVAL";

/** Given the servers a run brought up, hands them to another active run where there is one; answers the servers still to stop. */
export type HandOver = (servers: ModelServer[]) => Promise<ModelServer[]>;

/** Which servers go to the peer and which go down: all to an active peer, none without one. Pure. */
export function splitAtEnd(servers: ModelServer[], peer: { startedServers: string[] } | null): { stop: ModelServer[]; keepFor: string[] | null } {
  if (!servers.length) return { stop: [], keepFor: null };
  if (!peer) return { stop: servers, keepFor: null };
  return { stop: [], keepFor: [...new Set([...peer.startedServers, ...servers])] };
}

/** The servers a kind of run needs up: the generation and the crawl the chat and embedding models; an evaluation the gate's small model too when the gate asks one. Pure. */
export function neededServers(kind: HolderKind, env: Record<string, string | undefined> = process.env): ModelServer[] {
  const base: ModelServer[] = ["chat", "embed"];
  return kind === "EVAL" && env.ASSISTANT_GATE_MODEL_URL?.trim() ? [...base, "small"] : base;
}

/** The other kinds' tables, in the order a hand-over tries them. */
function peersOf(db: HolderDb, endingKind: HolderKind) {
  const all: { kind: HolderKind; find: () => Promise<{ id: string; startedServers: string[] } | null>; give: (id: string, servers: string[]) => Promise<number> }[] = [
    {
      kind: "QUIZ",
      find: () => db.quizGenJob.findFirst({ where: { active: true }, select: { id: true, startedServers: true } }),
      give: async (id, servers) => (await db.quizGenJob.updateMany({ where: { id, active: true }, data: { startedServers: servers } })).count,
    },
    {
      kind: "CRAWL",
      find: () => db.competitionCrawlJob.findFirst({ where: { active: true }, select: { id: true, startedServers: true } }),
      give: async (id, servers) => (await db.competitionCrawlJob.updateMany({ where: { id, active: true }, data: { startedServers: servers } })).count,
    },
    {
      kind: "EVAL",
      find: () => db.assistantEvalJob.findFirst({ where: { active: true }, select: { id: true, startedServers: true } }),
      give: async (id, servers) => (await db.assistantEvalJob.updateMany({ where: { id, active: true }, data: { startedServers: servers } })).count,
    },
  ];
  return all.filter((p) => p.kind !== endingKind);
}

/**
 * The hand-over to another kind's active run, read from the database. If the peer ends between the read and the write
 * (the update is conditional on it still being active) the next peer is tried, and with none left the servers are
 * stopped here after all, so a server is never left recorded on a run that has already ended.
 */
export function handOverTo(db: HolderDb, endingKind: HolderKind): HandOver {
  return async (servers) => {
    if (!servers.length) return [];
    for (const peer of peersOf(db, endingKind)) {
      const row = await peer.find();
      const { keepFor } = splitAtEnd(servers, row);
      if (!row || !keepFor) continue;
      if ((await peer.give(row.id, keepFor)) === 1) return [];
    }
    return servers;
  };
}

/** How many runs of any kind hold the model now (a server's own Stop is refused while any does). */
export async function activeRuns(db: HolderDb): Promise<number> {
  const [quiz, crawl, evals] = await Promise.all([db.quizGenJob.count({ where: { active: true } }), db.competitionCrawlJob.count({ where: { active: true } }), db.assistantEvalJob.count({ where: { active: true } })]);
  return quiz + crawl + evals;
}

/** Runs other than evaluations holding the model now: an evaluation is refused while one does, as its scores would measure them. */
export async function generationOrCrawlActive(db: Pick<HolderDb, "quizGenJob" | "competitionCrawlJob">): Promise<boolean> {
  const [quiz, crawl] = await Promise.all([db.quizGenJob.count({ where: { active: true } }), db.competitionCrawlJob.count({ where: { active: true } })]);
  return quiz + crawl > 0;
}
