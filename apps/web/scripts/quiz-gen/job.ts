/**
 * THE GENERATION JOB'S RUNNER (quiz-publish-jobs, 11 October 2026): the generator's CLI run as
 * `scripts/quiz-gen/cli.ts --job=<QuizGenJob id>`, spawned detached by src/lib/quiz-jobs.ts when the
 * operator or the content team presses Start on the bank desk. It owns nothing but its own run's row,
 * and writes it only through src/lib/quiz-jobs.ts:
 *
 *   1. waits for both model servers to answer ok ("starting the model": Start brought them up when they
 *      were down; about a minute to load), at most ten minutes;
 *   2. marks the run RUNNING and works through the request in the plan's order (scripts/quiz-gen/plan.ts),
 *      leaving out every chapter whose batch already exists — so a stopped run picks up where it was;
 *   3. per chapter: the generator's pipeline (generateChapter, the CLI's own path) with the live line
 *      written after every item (drafted, kept, rejects per stage, the keep rate, seconds per kept item);
 *      the chapter's file written, verified (scripts/verify-quiz.ts, as quiz:queue does) and loaded into
 *      the bank through scripts/quiz-queue-load.ts, so its items are served while the run goes on;
 *   4. reads its row every three seconds (the heartbeat): STOPPING halts it after the item in hand, and
 *      the chapter in progress is not written (nothing half-written lands);
 *   5. ends FINISHED, STOPPED or FAILED through finishJob, which takes down the model servers THIS run
 *      brought up and no others.
 *
 * The log is storage/quiz-jobs/<id>.log (the CLI's own lines).
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import type { QuizGenProgress, QuizGenStage } from "@edulink/contracts";
import { readAssistantConfig } from "../../src/lib/assistant-env";
import { MACHINE, emptyProgress, finishJob, heartbeat, markRunning, modelReady, runnerRow, writeProgress, type JobDb } from "../../src/lib/quiz-jobs";
import { loadGeneratedBatches, type QueueBatch } from "../quiz-queue-load";
import { fileNameFor, generateChapter, OUT_DIR, type ChapterHooks, type GeneratedChapter } from "./cli";
import { chaptersWanted, planCombos } from "./plan";
import { collegePlan, generateCollegeUnit } from "./college"; // college-content (12 Oct 2026)
import { listChapters } from "./select";
import type { RunLog } from "./pipeline";
import type { GeneratedTopicFile } from "./shape";

const BEAT_MS = 3_000;
const MODEL_WAIT_MS = 10 * 60_000;
const STAGES: QuizGenStage[] = ["draft", "critique", "solver", "form", "verify", "dedupe", "translation"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const zeroRejects = (): Record<QuizGenStage, number> => Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<QuizGenStage, number>;
const ratio = (kept: number, drafted: number) => (drafted > 0 ? Math.min(1, kept / drafted) : null);
const perKept = (seconds: number, kept: number) => (kept > 0 ? Math.round((seconds / kept) * 10) / 10 : null);

/** What the live line names a chapter (or a college unit) by. */
type ChapterRef = Pick<NonNullable<QuizGenProgress["chapter"]>, "board" | "grade" | "subject" | "number" | "name" | "stream" | "programme">;

/**
 * One chapter (or college unit) the run will take: what the live line names it, its batch file (a chapter
 * whose file exists is left out: that is how a stopped run resumes), and how it is generated.
 */
type Work = { ref: ChapterRef; label: string; fileName: string; generate: (hooks: ChapterHooks) => Promise<GeneratedChapter> };

/** The run's numbers out of the pipeline's log, for the "last chapter" line. */
function chapterNumbers(ref: ChapterRef, log: RunLog, loaded: number): NonNullable<QuizGenProgress["last"]> {
  const rejects = zeroRejects();
  for (const s of STAGES) rejects[s] = log.stages[s]?.rejects ?? 0;
  const drafted = log.stages.draft?.out ?? 0;
  return { ...ref, drafted, kept: log.kept, rejects, seconds: log.seconds, loaded, keepRate: ratio(log.kept, drafted), secondsPerKept: perKept(log.seconds, log.kept) };
}

function verifyBank(): string | null {
  try {
    execFileSync(join(process.cwd(), "node_modules", ".bin", "tsx"), ["--tsconfig", "scripts/tsconfig.json", "scripts/verify-quiz.ts"], { stdio: "pipe" });
    return null;
  } catch (error) {
    const out = `${(error as { stdout?: Buffer }).stdout?.toString() ?? ""}${(error as { stderr?: Buffer }).stderr?.toString() ?? ""}`;
    return out.split("\n").filter((l) => /✗|error|fail/i.test(l)).slice(0, 3).join(" ").slice(0, 400) || "the bank did not verify";
  }
}

/**
 * A finished chapter lands in the bank: the bank verified (scripts/verify-quiz.ts, as quiz:queue does) and
 * the chapter's batch loaded through scripts/quiz-queue-load.ts — served at once, a failed figure held.
 * A bank that does not verify leaves the file written and the chapter unloaded, with the reason.
 */
export async function landChapter(
  ownerDb: PrismaClient,
  fileName: string,
  file: GeneratedTopicFile,
  verify: () => string | null = verifyBank,
): Promise<{ loaded: number; figuresHeld: number; problem: string | null }> {
  const problem = verify();
  if (problem) return { loaded: 0, figuresHeld: 0, problem };
  const result = await loadGeneratedBatches(ownerDb, [{ file: fileName, batch: file as unknown as QueueBatch }]);
  return { loaded: result.created + result.updated, figuresHeld: result.figuresFailed.length, problem: null };
}

export async function runJob(jobId: string): Promise<void> {
  config();
  const appDb = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  // The loader writes the bank as quiz:queue does: through the owner connection.
  const ownerDb = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
  const jobDb = appDb as unknown as JobDb;
  const log = (line: string) => console.log(`[${new Date().toISOString()}] ${line}`);

  let stop = false;
  let ended = false;
  const progress: QuizGenProgress = emptyProgress("STARTING_MODEL");
  const runStarted = Date.now();
  // Progress writes in order, never two at once.
  let writing: Promise<void> = Promise.resolve();
  const write = () => {
    const snapshot = structuredClone(progress);
    writing = writing.then(() => writeProgress(jobDb, jobId, snapshot)).catch((e) => log(`progress not written: ${(e as Error).message}`));
    return writing;
  };
  const end = async (state: "FINISHED" | "STOPPED" | "FAILED", error: string | null = null) => {
    if (ended) return;
    ended = true;
    await writing;
    progress.phase = "DONE";
    progress.chapter = null;
    await finishJob(jobDb, jobId, state, MACHINE, error, progress);
    log(`run ${state.toLowerCase()}${error ? `: ${error}` : ""}`);
  };

  const beat = setInterval(() => {
    heartbeat(jobDb, jobId)
      .then((state) => {
        if (state === null || state === "STOPPING" || state === "STOPPED" || state === "FAILED" || state === "FINISHED") stop = true;
      })
      .catch((e) => log(`heartbeat failed: ${(e as Error).message}`));
  }, BEAT_MS);

  try {
    const row = await runnerRow(jobDb, jobId);
    if (!row || !row.active) {
      log(`run ${jobId} is not active; nothing to do`);
      return;
    }
    const request = row.request;
    log(`run ${jobId}: ${JSON.stringify(request)}`);
    if (!readAssistantConfig().ok) return await end("FAILED", "the model endpoints are not configured (ASSISTANT_* in .env)");

    // 1. the model
    await write();
    const deadline = Date.now() + MODEL_WAIT_MS;
    while (!(await modelReady(MACHINE))) {
      if (stop) return await end("STOPPED");
      if (Date.now() > deadline) return await end("FAILED", "the model servers did not answer within ten minutes");
      await sleep(5_000);
    }
    if (stop || !(await markRunning(jobDb, jobId))) return await end("STOPPED");
    log("the model is up; running");

    // 2. the plan
    progress.phase = "PLANNING";
    await write();
    const limit = request.limit ?? 0;
    // The work, in order, one chapter (or college unit) at a time: a book's chapters are listed when the run reaches the book.
    async function* plan(): AsyncGenerator<Work> {
      // college-content (12 Oct 2026): a stream's programme from the syllabus corpus, unit by unit.
      if (request.scope === "COLLEGE") {
        const units = await collegePlan(appDb, request);
        log(`${units.length} unit(s) of ${request.stream} ${request.programme} to work through`);
        for (const u of units) {
          yield {
            ref: { board: u.board, grade: 13, subject: u.stream, number: u.unit, name: u.unitName, stream: u.stream, programme: u.programme },
            label: `${u.board} ${u.stream} ${u.programme}, "${u.title}", unit ${u.unit} (${u.unitName})`,
            fileName: u.fileName,
            generate: (hooks) => generateCollegeUnit(appDb, { path: u.path, unit: u.unit, limit, perLevel: 4 }, hooks),
          };
        }
        return;
      }
      const inventory = await appDb.contentDocument.groupBy({
        by: ["source", "gradeOrProgramme", "subject"],
        where: { kind: "textbook", source: { in: ["ncert", "balbharati"] } },
      });
      const combos = planCombos(
        request,
        inventory.map((r) => ({ source: r.source, grade: r.gradeOrProgramme, subject: r.subject })),
      );
      log(`${combos.length} book(s) to work through`);
      for (const combo of combos) {
        const chapters = await listChapters(appDb, { board: combo.board, grade: combo.grade, subject: combo.subject });
        // Two books may carry one number (NCERT class 8 science: "Curiosity" and the 2024 "Science"); the first name given wins.
        const names = new Map<number, string>();
        for (const c of chapters) if (c.name && !names.get(c.number)) names.set(c.number, c.name);
        for (const number of chaptersWanted(chapters.map((c) => c.number), request)) {
          const name = names.get(number) ?? "";
          yield {
            ref: { board: combo.boardCode, grade: combo.grade, subject: combo.subjectCode, number, name },
            label: `${combo.board} class ${combo.grade} ${combo.subject}, chapter ${number}${name ? ` (${name})` : ""}`,
            fileName: `${fileNameFor({ board: combo.board, classLevel: combo.grade, subjectCode: combo.subjectCode, chapterNumber: number })}.json`,
            generate: (hooks) => generateChapter(appDb, number, { board: combo.board, grade: combo.grade, subject: combo.subject, limit, perLevel: 4 }, hooks),
          };
        }
      }
    }

    // 3. the chapters
    for await (const work of plan()) {
      if (stop) break;
      const { ref, label, fileName } = work;
      if (existsSync(join(OUT_DIR, fileName))) {
        progress.chaptersSkipped++;
        await write();
        continue;
      }
      const chapterStarted = Date.now();
      progress.phase = "GENERATING";
      progress.chapter = { ...ref, drafted: 0, kept: 0, rejects: zeroRejects(), seconds: 0, loaded: 0, keepRate: null, secondsPerKept: null };
      await write();
      log(label);
      try {
        const r = await work.generate({
          log,
          shouldStop: () => stop,
          onProgress: (p) => {
            if (!progress.chapter) return;
            const seconds = Math.round((Date.now() - chapterStarted) / 1000);
            Object.assign(progress.chapter, { drafted: p.drafted, kept: p.kept, rejects: { ...zeroRejects(), ...p.rejects }, seconds, keepRate: ratio(p.kept, p.drafted), secondsPerKept: perKept(seconds, p.kept) });
            void write();
          },
        });
        if (r.stopped || !r.file || !r.fileName) break;

        // The chapter's file is written: verified and loaded into the bank now, served while the run goes on.
        progress.phase = "LOADING";
        await write();
        const landed = await landChapter(ownerDb, r.fileName, r.file);
        const loaded = landed.loaded;
        if (landed.problem) progress.chaptersFailed.push({ label, reason: `written but not loaded (npm run quiz:queue loads it once the bank verifies): ${landed.problem}` });
        else log(`loaded ${loaded} item(s) into the bank (${landed.figuresHeld} figure(s) failed and held)`);
        const last = chapterNumbers(ref, r.runLog, loaded);
        progress.last = last;
        progress.chaptersDone++;
        progress.drafted += last.drafted;
        progress.kept += last.kept;
        progress.loaded += loaded;
        const elapsed = Math.round((Date.now() - runStarted) / 1000);
        progress.keepRate = ratio(progress.kept, progress.drafted);
        progress.secondsPerKept = perKept(elapsed, progress.kept);
        progress.chapter = null;
        progress.phase = "GENERATING";
        await write();
      } catch (error) {
        const reason = (error as Error).message.split("\n")[0]!.slice(0, 300);
        log(`${label}: ${reason}`);
        progress.chaptersFailed.push({ label, reason });
        progress.chapter = null;
        await write();
      }
    }
    await end(stop ? "STOPPED" : "FINISHED");
  } catch (error) {
    await end("FAILED", (error as Error).message.split("\n")[0]!.slice(0, 500));
  } finally {
    clearInterval(beat);
    await writing;
    await appDb.$disconnect();
    await ownerDb.$disconnect();
  }
}
