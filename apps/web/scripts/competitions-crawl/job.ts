/**
 * THE CRAWL JOB'S RUNNER (competitions-crawler, 12 October 2026): `scripts/competitions-crawl/cli.ts
 * --job=<CompetitionCrawlJob id>`, spawned detached by src/lib/competition-crawl-jobs.ts when the operator
 * or the content team presses Start on the competitions desk. The quiz runner's shape
 * (scripts/quiz-gen/job.ts): it waits for both model servers (Start brought up those that were down), marks
 * the run RUNNING, crawls (run.ts) writing the live line after every page, reads its row every three
 * seconds (STOPPING halts it after the page in hand) and ends through finishCrawl, which takes down the
 * servers this crawl brought up — or hands them to a quiz run still going (src/lib/model-holders.ts).
 * Its log is storage/competition-crawl/<id>.log.
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import type { CompetitionCrawlProgress } from "@edulink/contracts";
import { readAssistantConfig } from "../../src/lib/assistant-env";
import { modelReady } from "../../src/lib/quiz-jobs";
import { CRAWL_MACHINE, crawlHeartbeat, crawlRunnerRow, emptyCrawlProgress, finishCrawl, markCrawlRunning, writeCrawlProgress, type CrawlJobDb } from "../../src/lib/competition-crawl-jobs";
import { chatClient } from "../quiz-gen/model";
import { machineClient } from "./http";
import { crawlAll, type RunDb } from "./run";

const BEAT_MS = 3_000;
const MODEL_WAIT_MS = 10 * 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runCrawlJob(jobId: string): Promise<void> {
  config();
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  const jobDb = db as unknown as CrawlJobDb;
  const log = (line: string) => console.log(`[${new Date().toISOString()}] ${line}`);
  let stop = false;
  let ended = false;
  const progress: CompetitionCrawlProgress = emptyCrawlProgress("STARTING_MODEL");
  let writing: Promise<void> = Promise.resolve();
  const write = () => {
    const snapshot = structuredClone(progress);
    writing = writing.then(() => writeCrawlProgress(jobDb, jobId, snapshot)).catch((e) => log(`progress not written: ${(e as Error).message}`));
    return writing;
  };
  const end = async (state: "FINISHED" | "STOPPED" | "FAILED", error: string | null = null) => {
    if (ended) return;
    ended = true;
    await writing;
    progress.phase = "DONE";
    progress.source = null;
    await finishCrawl(jobDb, jobId, state, CRAWL_MACHINE, error, progress);
    log(`crawl ${state.toLowerCase()}${error ? `: ${error}` : ""}`);
  };
  const beat = setInterval(() => {
    crawlHeartbeat(jobDb, jobId)
      .then((state) => {
        if (state === null || state === "STOPPING" || state === "STOPPED" || state === "FAILED" || state === "FINISHED") stop = true;
      })
      .catch((e) => log(`heartbeat failed: ${(e as Error).message}`));
  }, BEAT_MS);

  try {
    const row = await crawlRunnerRow(jobDb, jobId);
    if (!row || !row.active) {
      log(`crawl ${jobId} is not active; nothing to do`);
      return;
    }
    log(`crawl ${jobId}: ${JSON.stringify(row.request)}`);
    // decision 0007 (6 Nov 2026): the crawler is the marketplace's and does not run while the platform has the
    // COMPETITIONS feature off — the desk refuses to start one, and a runner reaching here anyway stops here.
    const feature = await db.platformFeature.findUnique({ where: { code: "COMPETITIONS" }, select: { enabled: true } });
    if (!feature?.enabled) return await end("FAILED", "the competition marketplace is off (/root/features)");
    const cfg = readAssistantConfig();
    if (!cfg.ok) return await end("FAILED", "the model endpoints are not configured (ASSISTANT_* in .env)");

    await write();
    const deadline = Date.now() + MODEL_WAIT_MS;
    while (!(await modelReady(CRAWL_MACHINE))) {
      if (stop) return await end("STOPPED");
      if (Date.now() > deadline) return await end("FAILED", "the model servers did not answer within ten minutes");
      await sleep(5_000);
    }
    if (stop || !(await markCrawlRunning(jobDb, jobId))) return await end("STOPPED");
    log("the model is up; crawling");

    const model = chatClient(cfg.config.chat, cfg.config.embed);
    const result = await crawlAll(db as unknown as RunDb, row.request, progress, {
      client: machineClient(),
      model,
      embed: (texts) => model.embed(texts),
      shouldStop: () => stop,
      onProgress: () => void write(),
      log,
    });
    await end(result.stopped || stop ? "STOPPED" : "FINISHED");
  } catch (error) {
    await end("FAILED", (error as Error).message.split("\n")[0]!.slice(0, 500));
  } finally {
    clearInterval(beat);
    await writing;
    await db.$disconnect();
  }
}
