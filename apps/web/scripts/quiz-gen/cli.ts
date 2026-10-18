/**
 * The quiz bank generator, Phase 1 step 1 (docs/plans/assistant-and-quiz-bank.md): drafts
 * multiple-choice items for one textbook chapter on the owner's machine, through the two local
 * llama.cpp servers (docs/runbooks/assistant-local.md), and writes them in the bank's own file shape
 * under content/quiz/generated/. Nothing is loaded here (scripts/quiz-queue.ts loads the files; the
 * generation job, --job, loads each chapter as it finishes).
 *
 *   npm run quiz:gen -- --board=NCERT --grade=8 --subject=Science --chapter=4 [--limit=24] [--book=hecu1]
 *   npm run quiz:gen -- --board=Balbharati --grade=8 --subject=Science --all-chapters --limit=18
 *   npm run quiz:gen -- --board=NCERT --grade=8 --subject=Science --list        the chapters the corpus has
 *   … --per-level=4   items asked for per level per chapter (24 a chapter; --limit caps the total)
 *   … --dry           select and group the chapter, call no model
 *
 *   npm run quiz:gen -- --job=<QuizGenJob id>   the bank desk's generation job (scripts/quiz-gen/job.ts); the desk spawns it
 *   npm run quiz:gen -- --document=<syllabus path> --unit=2 [--limit=6] [--dry]   one college unit (scripts/quiz-gen/college.ts,
 *     college-content, 12 Oct 2026): a unit of a syllabus document of the corpus, landing as a COLLEGE topic when loaded
 *
 * Output: content/quiz/generated/<board>-<grade>-<subject>-<chapter>.json (the file) and
 * content/quiz/generated/runs/<same>.<time>.json (the run log: timings, tokens, rejects per stage).
 * `npm run quiz:queue` loads the files into the bank (published at once since 11 October 2026); the job
 * loads each chapter itself as it finishes.
 *
 * Reads the corpus and the bank as the app role (DATABASE_URL); writes files only.
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireAssistantConfig } from "../../src/lib/assistant-env";
import { chapterNumberOf, groupChunks, matchTopic, newTopicSlug } from "./checks";
import { generatorClient } from "./model";
import { runChapter, type PipelineOptions, type RunLog } from "./pipeline";
import { bankStems, bankTopics, glossaryFor, listChapters, selectChapter, styleExcerpts, type SelectedChapter } from "./select";
import type { GeneratedTopicFile } from "./shape";

config();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`) || a === `--${name}`);
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

export const OUT_DIR = join(process.cwd(), "content", "quiz", "generated");

/** "Original questions written for Shalaghar · CC BY-SA 4.0": the README's line for authored items, the product's name as it is today. */
export const LICENCE = "Original questions written for Shalaghar · CC BY-SA 4.0";

export function sourceLine(chapter: Pick<SelectedChapter, "board" | "subject" | "classLevel" | "chapterNumber" | "edition">): string {
  return `generated against ${chapter.board} ${chapter.subject}, Class ${chapter.classLevel}, chapter ${chapter.chapterNumber}${chapter.edition ? ` (${chapter.edition})` : ""}`;
}

export function fileNameFor(chapter: Pick<SelectedChapter, "board" | "classLevel" | "subjectCode" | "chapterNumber">): string {
  return `${chapter.board.toLowerCase()}-${chapter.classLevel}-${chapter.subjectCode.toLowerCase()}-${chapter.chapterNumber}`;
}

/** quiz-topup (19 Oct 2026): `variant` is what the chapter already holds when a target run asks again (0 on the first asking), mixed into the drafting seeds so the asking that tops a chapter up drafts differently from the one that filled it. */
export type GenerateArgs = { board: string; grade: number; subject: string; book?: string; limit: number; perLevel: number; variant?: number };

/** quiz-publish-jobs (11 Oct 2026): the generation job's hooks into one chapter (scripts/quiz-gen/job.ts). */
export type ChapterHooks = {
  log?: (line: string) => void;
  onProgress?: PipelineOptions["onProgress"];
  shouldStop?: PipelineOptions["shouldStop"];
};

export type GeneratedChapter = {
  chapter: SelectedChapter;
  runLog: RunLog;
  /** Halted by a stop: nothing was written. */
  stopped: boolean;
  file: GeneratedTopicFile | null;
  fileName: string | null;
  outPath: string | null;
  logPath: string | null;
};

/** One chapter through the pipeline, its file and run log written (unless a stop halted it): the CLI's and the job's one path. */
export async function generateChapter(db: PrismaClient, chapterNumber: number, args: GenerateArgs, hooks: ChapterHooks = {}): Promise<GeneratedChapter> {
  const log = hooks.log ?? ((line: string) => console.log(line));
  const chapter = await selectChapter(db, { board: args.board, grade: args.grade, subject: args.subject, chapter: chapterNumber, book: args.book }, log);
  log(`  "${chapter.book}"${chapter.bookCode ? ` (${chapter.bookCode})` : ""}, ${chapter.documentPath}, ${chapter.edition ?? "no edition stated"}: ${chapter.chapterLabel}`);
  log(`  ${chapter.chunks.length} chunks, pp. ${chapter.chunks[0]!.pageStart}–${chapter.chunks[chapter.chunks.length - 1]!.pageEnd}, ${chapter.figures.size} figures (${[...chapter.figures.values()].filter((f) => f.caption).length} captioned)`);

  const endpoints = requireAssistantConfig("quiz:gen");
  const client = await generatorClient(endpoints, log);
  const [stems, topics, glossary, style] = await Promise.all([
    bankStems(db, chapter.subjectCode, chapter.classLevel),
    bankTopics(db, chapter.subjectCode, chapter.classLevel),
    glossaryFor(db, chapter.subject),
    styleExcerpts(db, endpoints.embed, { subject: chapter.subject, classLevel: chapter.classLevel, chapterName: chapter.chapterName }),
  ]);
  const existing = matchTopic(topics, chapter.chapterNumber, chapter.chapterName);
  const slug = existing?.slug ?? newTopicSlug(chapter.board, chapter.subjectCode, chapter.classLevel, chapter.chapterName);
  log(`  topic: ${existing ? `the bank's "${existing.slug}" (${existing.chapter})` : `new, "${slug}"`}; ${stems.length} served questions in class ${chapter.classLevel} ${chapter.subjectCode} for the duplicate check`);

  const { questions, log: runLog, topicWords, stopped } = await runChapter(client, chapter, { limit: args.limit, perLevel: args.perLevel, variant: args.variant, bankStems: stems, glossary, style, log, onProgress: hooks.onProgress, shouldStop: hooks.shouldStop });
  if (stopped) {
    log(`  stopped: the chapter was halted after the items in hand; nothing was written`);
    return { chapter, runLog, stopped: true, file: null, fileName: null, outPath: null, logPath: null };
  }

  const file: GeneratedTopicFile = {
    subject: chapter.subjectCode,
    classLevel: chapter.classLevel,
    chapter: existing?.chapter ?? chapter.chapterLabel,
    name: existing?.name ?? chapter.chapterName,
    slug,
    summary: topicWords?.summary ?? "",
    position: existing?.position ?? chapter.chapterNumber,
    source: sourceLine(chapter),
    licence: LICENCE,
    translations: topicWords
      ? { hi: { name: topicWords.nameHi, summary: topicWords.summaryHi }, mr: { name: topicWords.nameMr, summary: topicWords.summaryMr } }
      : {},
    // quiz-board (11 Oct 2026): the coded board (QUIZ_BOARDS), the truth for the topic's board when quiz:queue loads the file; the corpus spells it "Balbharati".
    board: chapter.board.toUpperCase(),
    book: chapter.book,
    edition: chapter.edition,
    generatedAt: runLog.startedAt,
    model: runLog.model,
    topicIsNew: !existing,
    questions,
  };
  mkdirSync(join(OUT_DIR, "runs"), { recursive: true });
  const name = fileNameFor(chapter);
  const outPath = join(OUT_DIR, `${name}.json`);
  writeFileSync(outPath, JSON.stringify(file, null, 2) + "\n");
  const logPath = join(OUT_DIR, "runs", `${name}.${runLog.startedAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(logPath, JSON.stringify(runLog, null, 2) + "\n");
  return { chapter, runLog, stopped: false, file, fileName: `${name}.json`, outPath, logPath };
}

async function one(db: PrismaClient, chapterNumber: number, args: GenerateArgs & { dry: boolean }) {
  console.log(`\n${args.board} class ${args.grade} ${args.subject}, chapter ${chapterNumber}`);
  if (args.dry) {
    const chapter = await selectChapter(db, { board: args.board, grade: args.grade, subject: args.subject, chapter: chapterNumber, book: args.book }, (line) => console.log(line));
    console.log(`  "${chapter.book}"${chapter.bookCode ? ` (${chapter.bookCode})` : ""}, ${chapter.documentPath}, ${chapter.edition ?? "no edition stated"}: ${chapter.chapterLabel}`);
    console.log(`  ${chapter.chunks.length} chunks, pp. ${chapter.chunks[0]!.pageStart}–${chapter.chunks[chapter.chunks.length - 1]!.pageEnd}, ${chapter.figures.size} figures (${[...chapter.figures.values()].filter((f) => f.caption).length} captioned)`);
    for (const [i, g] of groupChunks(chapter.chunks).entries()) console.log(`    group ${i}: chunks ${g[0]!.ordinal}–${g[g.length - 1]!.ordinal}, ${g.reduce((n, c) => n + c.tokens, 0)} tokens, pp. ${g[0]!.pageStart}–${g[g.length - 1]!.pageEnd}`);
    return;
  }
  const r = await generateChapter(db, chapterNumber, args);
  if (r.outPath && r.logPath) printSummary(r.runLog, r.outPath, r.logPath);
}

function printSummary(r: RunLog, outPath: string, logPath: string) {
  const stage = (s: keyof RunLog["stages"]) => {
    const c = r.stages[s];
    return `${s.padEnd(12)} in ${String(c.in).padStart(3)}  out ${String(c.out).padStart(3)}  rejected ${String(c.rejects).padStart(3)}  calls ${String(c.calls).padStart(4)}  ${(c.ms / 1000).toFixed(0).padStart(5)} s  tokens ${c.promptTokens}+${c.completionTokens}`;
  };
  console.log(`\n  kept ${r.kept} items (${Object.entries(r.keptByLevel).map(([l, n]) => `L${l}:${n}`).join(" ")}), ${r.flagged} level-flagged, ${r.needsFigure} need a figure; ${r.rejects.length} rejects; ${r.seconds} s in all${r.kept ? `, ${(r.seconds / r.kept).toFixed(0)} s per kept item` : ""}`);
  for (const s of ["draft", "critique", "solver", "form", "verify", "dedupe", "translation"] as const) console.log(`    ${stage(s)}`);
  for (const n of r.notes) console.log(`  note: ${n}`);
  console.log(`  wrote ${outPath}\n  log   ${logPath}`);
}

async function main() {
  // quiz-publish-jobs (11 Oct 2026): run as the bank desk's generation job (src/lib/quiz-jobs.ts spawns this, detached).
  const job = arg("job");
  if (job && job !== "true") {
    const { runJob } = await import("./job");
    await runJob(job);
    // The runner is a process of its own: done is done (a keep-alive socket must not hold it open).
    process.exit(0);
  }
  // college-content (12 Oct 2026): one unit of a college syllabus document.
  const document = arg("document");
  if (document && document !== "true") {
    const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
    try {
      const { generateCollegeUnit, selectCollegeUnit } = await import("./college");
      const unit = Number(arg("unit") ?? 1);
      if (arg("dry") === "true") {
        const u = await selectCollegeUnit(db, { path: document, unit });
        console.log(`  ${u.syllabusBoard} ${u.stream} ${u.programme}${u.yearOrSemester ? ` ${u.yearOrSemester}` : ""}: "${u.book}", ${u.chapterLabel}; ${u.chunks.length} chunks in ${groupChunks(u.chunks).length} groups`);
        return;
      }
      const r = await generateCollegeUnit(db, { path: document, unit, limit: Number(arg("limit") ?? 0), perLevel: Number(arg("per-level") ?? 4) });
      if (r.outPath && r.logPath) printSummary(r.runLog, r.outPath, r.logPath);
    } finally {
      await db.$disconnect();
    }
    return;
  }
  const board = arg("board");
  const grade = Number(arg("grade"));
  const subject = arg("subject");
  if (!board || !Number.isInteger(grade) || !subject) {
    throw new Error("usage: npm run quiz:gen -- --board=NCERT|Balbharati --grade=8 --subject=Science (--chapter=4 | --all-chapters | --list) [--limit=N] [--per-level=4] [--book=code] [--dry]");
  }
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  try {
    if (arg("list") === "true") {
      for (const c of await listChapters(db, { board, grade, subject, book: arg("book") })) console.log(`  ${String(c.number).padStart(2)}  ${c.name}  [${c.bookCode ?? "?"} "${c.book}"]`);
      return;
    }
    const limit = Number(arg("limit") ?? 0);
    const perLevel = Number(arg("per-level") ?? 4);
    const dry = arg("dry") === "true";
    const common = { board, grade, subject, book: arg("book"), limit, perLevel, dry };
    if (arg("all-chapters") === "true") {
      const chapters = await listChapters(db, { board, grade, subject, book: arg("book") });
      const seen = new Set<number>();
      for (const c of chapters) {
        if (seen.has(c.number)) continue;
        seen.add(c.number);
        await one(db, c.number, common);
      }
      return;
    }
    const chapter = Number(arg("chapter"));
    if (!Number.isInteger(chapter)) throw new Error("--chapter=N, --all-chapters or --list");
    if (chapterNumberOf(`Chapter ${chapter}:`) !== chapter) throw new Error(`chapter ${chapter} is not a chapter number`);
    await one(db, chapter, common);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && /quiz-gen[\\/]cli\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
