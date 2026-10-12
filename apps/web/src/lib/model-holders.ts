/**
 * TWO KINDS OF RUN, ONE MODEL (competitions-crawler, 12 October 2026). A quiz generation run
 * (QuizGenJob, src/lib/quiz-jobs.ts) and a competitions crawl (CompetitionCrawlJob,
 * src/lib/competition-crawl-jobs.ts) are different jobs, one active of each at a time, and they may run
 * side by side on the same two local model servers. Each keeps the quiz job's rule — a Start brings up
 * only the servers that were down and records them; the run's end takes down only what it recorded —
 * with one addition so that neither pulls the model out from under the other: when a run ends while a
 * run of the OTHER kind is active, the servers it brought up are HANDED to that run (added to its
 * `startedServers`) instead of stopped, and go down when the last holder ends. And a server's own Stop
 * on the desk is refused while a run of either kind is active.
 *
 * No server-only import: the runners (plain Node processes) end their runs through these too.
 */
import type { PrismaClient } from "@prisma/client";
import type { ModelServer } from "@edulink/contracts";

export type HolderDb = Pick<PrismaClient, "quizGenJob" | "competitionCrawlJob">;
export type HolderKind = "QUIZ" | "CRAWL";

/** Given the servers a run brought up, hands them to another active run where there is one; answers the servers still to stop. */
export type HandOver = (servers: ModelServer[]) => Promise<ModelServer[]>;

/** Which servers go to the peer and which go down: all to an active peer, none without one. Pure. */
export function splitAtEnd(servers: ModelServer[], peer: { startedServers: string[] } | null): { stop: ModelServer[]; keepFor: string[] | null } {
  if (!servers.length) return { stop: [], keepFor: null };
  if (!peer) return { stop: servers, keepFor: null };
  return { stop: [], keepFor: [...new Set([...peer.startedServers, ...servers])] };
}

/**
 * The hand-over to the other kind's active run, read from the database. If the peer ends between the
 * read and the write (the update is conditional on it still being active) the servers are stopped here
 * after all, so a server is never left recorded on a run that has already ended.
 */
export function handOverTo(db: HolderDb, endingKind: HolderKind): HandOver {
  return async (servers) => {
    if (!servers.length) return [];
    if (endingKind === "CRAWL") {
      const peer = await db.quizGenJob.findFirst({ where: { active: true }, select: { id: true, startedServers: true } });
      const { stop, keepFor } = splitAtEnd(servers, peer);
      if (!peer || !keepFor) return stop;
      const { count } = await db.quizGenJob.updateMany({ where: { id: peer.id, active: true }, data: { startedServers: keepFor } });
      return count === 1 ? [] : servers;
    }
    const peer = await db.competitionCrawlJob.findFirst({ where: { active: true }, select: { id: true, startedServers: true } });
    const { stop, keepFor } = splitAtEnd(servers, peer);
    if (!peer || !keepFor) return stop;
    const { count } = await db.competitionCrawlJob.updateMany({ where: { id: peer.id, active: true }, data: { startedServers: keepFor } });
    return count === 1 ? [] : servers;
  };
}

/** How many runs of either kind hold the model now (a server's own Stop is refused while any does). */
export async function activeRuns(db: HolderDb): Promise<number> {
  const [quiz, crawl] = await Promise.all([db.quizGenJob.count({ where: { active: true } }), db.competitionCrawlJob.count({ where: { active: true } })]);
  return quiz + crawl;
}
