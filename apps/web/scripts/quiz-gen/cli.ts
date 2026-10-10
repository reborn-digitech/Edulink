/**
 * The quiz bank generator, Phase 1 step 1 (docs/plans/assistant-and-quiz-bank.md): drafts
 * multiple-choice items for one textbook chapter on the owner's machine, through the two local
 * llama.cpp servers (docs/runbooks/assistant-local.md), and writes them in the bank's own file shape
 * under content/quiz/generated/ for the app admins' and the operator's review. Nothing is imported
 * here; scripts/import-quiz.ts takes a generated item only once it carries a stamp.
 *
 *   npm run quiz:gen -- --board=NCERT --grade=8 --subject=Science --chapter=4 [--limit=24] [--book=hecu1]
 *   npm run quiz:gen -- --board=Balbharati --grade=8 --subject=Science --all-chapters --limit=18
 *   npm run quiz:gen -- --board=NCERT --grade=8 --subject=Science --list        the chapters the corpus has
 *   … --per-level=4   items asked for per level per chapter (24 a chapter; --limit caps the total)
 *   … --dry           select and group the chapter, call no model
 *
 * Output: content/quiz/generated/<board>-<grade>-<subject>-<chapter>.json (the file) and
 * content/quiz/generated/runs/<same>.<time>.json (the run log: timings, tokens, rejects per stage).
 *
 * Reads the corpus and the bank as the app role (DATABASE_URL); writes files only.
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireAssistantConfig } from "../../src/lib/assistant-env";
import { chapterNumberOf, groupChunks, matchTopic, newTopicSlug } from "./checks";
import { chatClient } from "./model";
import { runChapter, type RunLog } from "./pipeline";
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

async function one(db: PrismaClient, chapterNumber: number, args: { board: string; grade: number; subject: string; book?: string; limit: number; perLevel: number; dry: boolean }) {
  const log = (line: string) => console.log(line);
  console.log(`\n${args.board} class ${args.grade} ${args.subject}, chapter ${chapterNumber}`);
  const chapter = await selectChapter(db, { board: args.board, grade: args.grade, subject: args.subject, chapter: chapterNumber, book: args.book }, log);
  console.log(`  "${chapter.book}"${chapter.bookCode ? ` (${chapter.bookCode})` : ""}, ${chapter.documentPath}, ${chapter.edition ?? "no edition stated"}: ${chapter.chapterLabel}`);
  console.log(`  ${chapter.chunks.length} chunks, pp. ${chapter.chunks[0]!.pageStart}–${chapter.chunks[chapter.chunks.length - 1]!.pageEnd}, ${chapter.figures.size} figures (${[...chapter.figures.values()].filter((f) => f.caption).length} captioned)`);
  if (args.dry) {
    for (const [i, g] of groupChunks(chapter.chunks).entries()) console.log(`    group ${i}: chunks ${g[0]!.ordinal}–${g[g.length - 1]!.ordinal}, ${g.reduce((n, c) => n + c.tokens, 0)} tokens, pp. ${g[0]!.pageStart}–${g[g.length - 1]!.pageEnd}`);
    return;
  }

  const endpoints = requireAssistantConfig("quiz:gen");
  const client = chatClient(endpoints.chat, endpoints.embed);
  const [stems, topics, glossary, style] = await Promise.all([
    bankStems(db, chapter.subjectCode, chapter.classLevel),
    bankTopics(db, chapter.subjectCode, chapter.classLevel),
    glossaryFor(db, chapter.subject),
    styleExcerpts(db, endpoints.embed, { subject: chapter.subject, classLevel: chapter.classLevel, chapterName: chapter.chapterName }),
  ]);
  const existing = matchTopic(topics, chapter.chapterNumber, chapter.chapterName);
  const slug = existing?.slug ?? newTopicSlug(chapter.board, chapter.subjectCode, chapter.classLevel, chapter.chapterName);
  console.log(`  topic: ${existing ? `the bank's "${existing.slug}" (${existing.chapter})` : `new, "${slug}"`}; ${stems.length} served questions in class ${chapter.classLevel} ${chapter.subjectCode} for the duplicate check`);

  const { questions, log: runLog, topicWords } = await runChapter(client, chapter, { limit: args.limit, perLevel: args.perLevel, bankStems: stems, glossary, style, log });

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
  printSummary(runLog, outPath, logPath);
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
