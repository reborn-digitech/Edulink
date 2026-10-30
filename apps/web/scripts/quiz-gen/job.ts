/**
 * THE GENERATION JOB'S RUNNER (quiz-publish-jobs, 11 October 2026): the generator's CLI run as
 * `scripts/quiz-gen/cli.ts --job=<QuizGenJob id>`, spawned detached by src/lib/quiz-jobs.ts when the
 * operator or the content team presses Start on the bank desk. It owns nothing but its own run's row,
 * and writes it only through src/lib/quiz-jobs.ts:
 *
 *   1. waits for both model servers to answer ok ("starting the model": Start brought them up when they
 *      were down; about a minute to load), at most ten minutes; then for the second chat server a few minutes more
 *      while it loads (gen-throughput, 19 Oct 2026), beginning without it when it is not up;
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
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import type { QuizGenProgress, QuizGenRequest, QuizGenStage } from "@edulink/contracts";
import { readAssistantConfig } from "../../src/lib/assistant-env";
import { chat2Enabled, requiredServers } from "../../src/lib/model-holders";
import { MACHINE, emptyProgress, finishJob, heartbeat, markRunning, modelReady, modelServers, runnerRow, writeProgress, type JobDb } from "../../src/lib/quiz-jobs";
import { loadGeneratedBatches, type QueueBatch } from "../quiz-queue-load";
import { fileNameFor, generateChapter, OUT_DIR, type ChapterHooks, type GeneratedChapter } from "./cli";
import { chaptersWanted, planCombos, type Combo } from "./plan";
import { collegePlan, generateCollegeUnit } from "./college"; // college-content (12 Oct 2026)
import { chapterLineFilter, listChapters, type ListedChapter } from "./select";
// owner-batch-item6 (30 Oct 2026): saturated and failing chapters set aside for the run (scripts/quiz-gen/set-aside.ts).
import { afterOutcome, freshStreak, passContinues, refusedItems, type ChapterOutcome, type ChapterStreak } from "./set-aside";
import type { RunLog } from "./pipeline";
import type { GeneratedTopicFile } from "./shape";

const BEAT_MS = 3_000;
const MODEL_WAIT_MS = 10 * 60_000;
/** How long a run waits for the second chat server to finish loading before it begins without it. */
const CHAT2_WAIT_MS = 5 * 60_000;
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
/** quiz-topup (19 Oct 2026): the most passes a target run makes over the plan before it ends on its own. */
export const MAX_PASSES = 20;

export { passContinues };

/**
 * The served questions a chapter already has: the live items of every topic of that board, class and subject whose
 * chapter line starts "Chapter <number> " (the loader writes "Chapter N — Name"; the authored bank's chapter and a
 * generated one of the same number both count). owner-batch-item8: a chapter of a book the plan names (two books under
 * one number) counts its book's lines alone, "Chapter N (Book) "; a plain chapter never counts another book's. Read
 * through the app connection, which sees every served item.
 */
export async function servedCount(db: PrismaClient, ref: Pick<ChapterRef, "board" | "grade" | "subject" | "number">, book: string | null = null): Promise<number> {
  const topics = await db.quizTopic.findMany({
    where: { board: ref.board, classLevel: ref.grade, subject: ref.subject, audience: "SCHOOL", retiredAt: null, chapter: chapterLineFilter(ref.number, book) },
    select: { id: true },
  });
  if (topics.length === 0) return 0;
  return db.quizQuestion.count({ where: { topicId: { in: topics.map((t) => t.id) }, takenDownAt: null } });
}

type Work = { ref: ChapterRef; label: string; fileName: string; book?: string | null; generate: (hooks: ChapterHooks, variant?: number) => Promise<GeneratedChapter> };

/** One chapter a run takes of a class and subject: what it is called, its batch file and the book it is of when the plan names one. */
export type ChapterWork = { ref: ChapterRef; number: number; book: { code: string; title: string } | null; label: string; fileName: string };

/**
 * owner-batch-item8 (31 Oct 2026): the chapters a run takes of one class and subject's list (listChapters), in its order.
 * A plan that names its books (two books under one number, select.ts planNcert) gives one chapter of a number per book,
 * each with its own batch file (ncert-12-civics-leps1-5.json), served count and live name; otherwise one per number, the
 * first name given winning. Pure.
 */
export function chapterWork(combo: Combo, chapters: readonly ListedChapter[], request: Pick<QuizGenRequest, "chapterFrom" | "chapterTo">): ChapterWork[] {
  const wanted = new Set(chaptersWanted(chapters.map((c) => c.number), request));
  const byKey = new Map<string, ListedChapter>();
  for (const c of chapters) {
    const key = `${c.planBook ? c.bookCode : ""}|${c.number}`;
    const had = byKey.get(key);
    if (!had || (!had.name && c.name)) byKey.set(key, c);
  }
  const named = chapters.some((c) => c.planBook);
  const list = [...byKey.values()].filter((c) => wanted.has(c.number));
  if (!named) list.sort((a, b) => a.number - b.number);
  return list.map((c) => {
    const book = c.planBook && c.bookCode ? { code: c.bookCode, title: c.planBook } : null;
    return {
      // The card's live line names the book beside the title when the plan names it.
      ref: { board: combo.boardCode, grade: combo.grade, subject: combo.subjectCode, number: c.number, name: book && c.name ? `${c.name} · ${book.title}` : c.name },
      number: c.number,
      book,
      label: `${combo.board} class ${combo.grade} ${combo.subject}, ${book ? `"${book.title}" ` : ""}chapter ${c.number}${c.name ? ` (${c.name})` : ""}`,
      fileName: `${fileNameFor({ board: combo.board, classLevel: combo.grade, subjectCode: combo.subjectCode, chapterNumber: c.number, planBook: book })}.json`,
    };
  });
}

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

/** How landChapter touches the batch files: content/quiz/generated/ in a run, a temporary folder in a test. */
export type BatchFiles = {
  write: (name: string, file: GeneratedTopicFile) => void;
  /** Moves the batch to generated/held/, which the bank check does not read. */
  hold: (name: string) => void;
  /** Puts back the file as it was before this pass wrote it (`previous`, its text), or removes it when there was none. */
  restore: (name: string, previous: string | null) => void;
  /** Another batch's item stem, for a duplicate the bank check reports against that batch. */
  stemOf: (name: string, index: number) => string | null;
};

/** The batch files in a folder (content/quiz/generated/ in a run). */
export function batchFiles(dir: string = OUT_DIR): BatchFiles {
  return {
    write: (name, file) => writeFileSync(join(dir, name), JSON.stringify(file, null, 2) + "\n"),
    hold: (name) => {
      const src = join(dir, name);
      if (!existsSync(src)) return;
      const held = join(dir, "held");
      mkdirSync(held, { recursive: true });
      renameSync(src, join(held, name));
    },
    restore: (name, previous) => {
      const path = join(dir, name);
      if (previous === null) rmSync(path, { force: true });
      else writeFileSync(path, previous);
    },
    stemOf: (name, index) => {
      try {
        const other = JSON.parse(readFileSync(join(dir, name), "utf8")) as { questions?: { stem?: string }[] };
        return other.questions?.[index]?.stem ?? null;
      } catch {
        return null;
      }
    },
  };
}

export type Landing = {
  loaded: number;
  /** Items new to the bank (loaded counts re-written ones too). */
  created: number;
  figuresHeld: number;
  problem: string | null;
  dropped: number;
  held: boolean;
  /** owner-batch-item6: the batch landed nothing new (no items left, or none the bank lacked). Not a problem: nothing is held. */
  nothingNew: boolean;
};

/**
 * A finished chapter lands in the bank: the bank verified (scripts/verify-quiz.ts, as quiz:queue does) and
 * the chapter's batch loaded through scripts/quiz-queue-load.ts — served at once, a failed figure held.
 *
 * quiz-topup (19 Oct 2026): the bank check refusing items of THIS batch (a within-batch duplicate the pipeline's
 * similarity rule let through, on 19 October) drops those items and asks again; a batch the check still refuses, or the
 * loader refuses, is set aside in generated/held/, which the check does not read, so it cannot block every chapter
 * after it, as an empty college batch and then this duplicate did.
 *
 * owner-batch-item6 (30 Oct 2026): a batch with no items, from the pipeline or once the refused ones are dropped, is
 * NOTHING NEW and not a failure: it is neither verified nor held, and the chapter's file goes back to what it was before
 * this pass (`previous`), so no empty batch blocks the bank check or fills generated/held. A duplicate the check reports
 * against another batch ("<other>[3]: duplicate of a question already in <this>") drops this batch's item of that stem.
 */
export async function landChapter(
  ownerDb: PrismaClient,
  fileName: string,
  file: GeneratedTopicFile,
  verify: () => string | null = verifyBank,
  fs: BatchFiles = batchFiles(),
  previous: string | null = null,
): Promise<Landing> {
  const nothing = (dropped: number): Landing => {
    fs.restore(fileName, previous);
    return { loaded: 0, created: 0, figuresHeld: 0, problem: null, dropped, held: false, nothingNew: true };
  };
  if (file.questions.length === 0) return nothing(0);
  let problem = verify();
  let dropped = 0;
  // Three rounds at most: the report names three errors at a time.
  for (let round = 0; problem && round < 3; round++) {
    const own = refusedItems(problem, fileName, file.questions, fs.stemOf);
    if (own.length === 0) break;
    const keep = file.questions.filter((_, i) => !own.includes(i));
    dropped += file.questions.length - keep.length;
    file = { ...file, questions: keep };
    if (keep.length === 0) return nothing(dropped);
    fs.write(fileName, file);
    problem = verify();
  }
  if (problem) {
    fs.hold(fileName);
    return { loaded: 0, created: 0, figuresHeld: 0, problem: `set aside in generated/held (${problem})`, dropped, held: true, nothingNew: false };
  }
  let result;
  try {
    result = await loadGeneratedBatches(ownerDb, [{ file: fileName, batch: file as unknown as QueueBatch }]);
  } catch (error) {
    fs.hold(fileName);
    return { loaded: 0, created: 0, figuresHeld: 0, problem: `set aside in generated/held (the loader refused it: ${(error as Error).message.split("\n")[0]!.slice(0, 300)})`, dropped, held: true, nothingNew: false };
  }
  return { loaded: result.created + result.updated, created: result.created, figuresHeld: result.figuresFailed.length, problem: null, dropped, held: false, nothingNew: result.created === 0 };
}

/** The item indexes a verify report names in this batch alone ("generated/<file>[7]: …"); another file's errors are not this chapter's to drop. */
export function ownItemErrors(report: string, fileName: string): number[] {
  return refusedItems(report, fileName, []);
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
    while (!(await modelReady(MACHINE, requiredServers("QUIZ")))) {
      if (stop) return await end("STOPPED");
      if (Date.now() > deadline) return await end("FAILED", "the model servers did not answer within ten minutes");
      await sleep(5_000);
    }
    if (stop || !(await markRunning(jobDb, jobId))) return await end("STOPPED");
    log("the model is up; running");
    // gen-throughput (19 Oct 2026): the second chat server, when it is switched on (QUIZ_GEN_CHAT2=on) and while it loads
    // (Start brought it up), is waited for a few minutes; not up by then, or not started (memory), the run begins on the
    // chat server alone, and each chapter looks for it again when its pool is made (scripts/quiz-gen/model.ts).
    const chat2Deadline = Date.now() + CHAT2_WAIT_MS;
    while (chat2Enabled()) {
      const two = (await modelServers(MACHINE, { fresh: true })).find((s) => s.server === "chat2");
      if (two?.state === "STARTING" && !stop && Date.now() < chat2Deadline) {
        await sleep(5_000);
        continue;
      }
      log(
        two?.state === "RUNNING"
          ? "the second chat server (chat2) is up: generating on both chat servers"
          : two?.state === "STARTING"
            ? `the second chat server (chat2) is still loading after ${CHAT2_WAIT_MS / 60_000} minutes: beginning on the chat server alone`
            : "the second chat server (chat2) is not running (storage/models/chat2.log says why when its start was refused): generating on the chat server alone",
      );
      break;
    }

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
        const chapters = await listChapters(appDb, { board: combo.board, grade: combo.grade, subject: combo.subject }, log);
        // owner-batch-item8: one chapter per number, or per book and number when the plan names its books (chapterWork).
        for (const w of chapterWork(combo, chapters, request)) {
          yield {
            ref: w.ref,
            label: w.label,
            fileName: w.fileName,
            book: w.book?.title ?? null,
            generate: (hooks, variant) => generateChapter(appDb, w.number, { board: combo.board, grade: combo.grade, subject: combo.subject, book: w.book?.code, limit, perLevel: 4, variant }, hooks),
          };
        }
      }
    }

    // 3. the chapters. quiz-topup (19 Oct 2026): with a target, the run makes passes over the plan, skipping each chapter
    // whose served bank already holds the target and generating the rest again (the batch file is rewritten and the
    // loader drops the duplicates), until every chapter is there, a pass keeps nothing, or twenty passes are done.
    const target = request.target ?? null;
    if (target) log(`target: ${target} served question(s) a chapter`);
    // owner-batch-item6 (30 Oct 2026): each chapter's streak of passes with nothing new and of failed landings, by its
    // batch file; a chapter set aside (scripts/quiz-gen/set-aside.ts) is left out of every later pass and of `pending`.
    const streaks = new Map<string, ChapterStreak>();
    const setAside = new Set<string>();
    for (let pass = 1; pass <= (target ? MAX_PASSES : 1) && !stop; pass++) {
    let keptThisPass = 0;
    let pendingThisPass = 0;
    if (target) {
      progress.pass = pass;
      log(`pass ${pass}`);
    }
    const settle = (fileName: string, label: string, outcome: ChapterOutcome) => {
      const { streak, setAside: aside } = afterOutcome(streaks.get(fileName) ?? freshStreak(), outcome);
      streaks.set(fileName, streak);
      if (!aside || !target) return;
      setAside.add(fileName);
      pendingThisPass--;
      progress.chaptersSetAside.push({ label, kind: aside.kind, pass, tries: aside.tries, reason: aside.reason.slice(0, 300) });
      log(`${label}: set aside for the rest of the run (${aside.kind === "SATURATED" ? "saturated" : "failing"}: ${aside.reason.slice(0, 200)})`);
    };
    for await (const work of plan()) {
      if (stop) break;
      const { ref, label, fileName } = work;
      if (setAside.has(fileName)) continue;
      let have = 0;
      if (target) {
        have = await servedCount(appDb, ref, work.book ?? null);
        if (have >= target) {
          progress.chaptersSkipped++;
          await write();
          continue;
        }
        pendingThisPass++;
      } else if (existsSync(join(OUT_DIR, fileName))) {
        progress.chaptersSkipped++;
        await write();
        continue;
      }
      const chapterStarted = Date.now();
      progress.phase = "GENERATING";
      progress.chapter = { ...ref, drafted: 0, kept: 0, rejects: zeroRejects(), seconds: 0, loaded: 0, keepRate: null, secondsPerKept: null };
      await write();
      log(label);
      // The chapter's batch file as it stands before this pass rewrites it: put back when the pass lands nothing new.
      const before = (() => {
        try {
          return readFileSync(join(OUT_DIR, fileName), "utf8");
        } catch {
          return null;
        }
      })();
      try {
        const r = await work.generate(
          {
          log,
          shouldStop: () => stop,
          onProgress: (p) => {
            if (!progress.chapter) return;
            const seconds = Math.round((Date.now() - chapterStarted) / 1000);
            Object.assign(progress.chapter, { drafted: p.drafted, kept: p.kept, rejects: { ...zeroRejects(), ...p.rejects }, seconds, keepRate: ratio(p.kept, p.drafted), secondsPerKept: perKept(seconds, p.kept) });
            void write();
          },
          },
          // The drafting seeds follow what the chapter already holds, so a run restarted on a half-filled chapter, or
          // a later pass, drafts differently from the asking that filled it (0, the first asking, keeps the old seeds).
          target ? have : undefined,
        );
        if (r.stopped || !r.file || !r.fileName) break;

        // The chapter's file is written: verified and loaded into the bank now, served while the run goes on.
        progress.phase = "LOADING";
        await write();
        const landed = await landChapter(ownerDb, r.fileName, r.file, verifyBank, batchFiles(), r.fileName === fileName ? before : null);
        const loaded = landed.loaded;
        if (landed.dropped) log(`${landed.dropped} item(s) the bank check refused were dropped from the batch`);
        const last = chapterNumbers(ref, r.runLog, loaded);
        if (landed.problem) {
          progress.chaptersFailed.push({ label, reason: landed.problem });
          settle(fileName, label, { kind: "FAILED", reason: landed.problem });
        } else if (landed.nothingNew) {
          // owner-batch-item6: nothing new is not a failure; no held file was written and the earlier batch file is back.
          log(`nothing new: ${last.drafted} drafted, none the chapter lacked${loaded ? ` (${loaded} re-written)` : ""}`);
          progress.chaptersSaturated.push({ label, pass, drafted: last.drafted, dropped: Math.max(0, last.drafted - last.kept) + landed.dropped });
          settle(fileName, label, { kind: "NOTHING_NEW" });
        } else {
          log(`loaded ${loaded} item(s) into the bank (${landed.figuresHeld} figure(s) failed and held)`);
          settle(fileName, label, { kind: "LANDED" });
        }
        progress.last = last;
        progress.chaptersDone++;
        progress.drafted += last.drafted;
        progress.kept += last.kept;
        keptThisPass += last.kept;
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
        settle(fileName, label, { kind: "FAILED", reason });
        progress.chapter = null;
        await write();
      }
    }
    if (!passContinues(target, pendingThisPass, keptThisPass)) break;
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
