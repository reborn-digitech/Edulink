/**
 * Loads the quiz bank generator's batches (content/quiz/generated/*.json) into the REVIEW QUEUE.
 *
 * The owner's amendment of 10 October 2026: the app admins and the operator review the generated bank,
 * one stamp serves an item, a Hindi or Marathi row is served once its language is stamped too. So a
 * generated item lands in QuizQuestion as an UNSERVED row — `generated` true, reviewedAt null — and
 * src/lib/quiz-served.ts keeps it from every pupil until a reviewer stamps it on /appadmin/quiz-review
 * or /root/quiz-review (src/lib/quiz-review.ts, the one writer of a stamp). The database is the truth
 * for the stamps; the files' `stamps: []` stay as the generator wrote them.
 *
 * A batch may extend a SERVED topic now (its slug is an authored chapter's): serving is gated by the
 * stamp, not by the file. A batch for a new chapter makes the topic; it does not list for a pupil until
 * its first item is stamped (quiz.ts listTopics drops a chapter with nothing to serve).
 *
 * IDEMPOTENT by (topic, stem): a re-run updates a WAITING item in place (the generator re-ran the
 * chapter), and never touches one a reviewer has stamped or discarded. An item whose stem the chapter
 * already holds as an authored question is skipped as a duplicate. The authored bank's importer
 * (scripts/import-quiz.ts) leaves these rows alone: it reads only `generated: false`.
 *
 * Verifies first, as quiz:import does (scripts/verify-quiz.ts reads the generated batches too).
 *
 * quiz-board (11 October 2026): THE ONE WAY IN for a generated item (scripts/import-quiz.ts loads the
 * authored files only). The batch's `board` becomes its topic's board, and an item's `figure` is drawn
 * and stored on load in English, Hindi and Marathi (a figure that cannot be drawn loads with its reason,
 * "figure failed" on the desk) — the writes are scripts/quiz-queue-load.ts's.
 *
 * Run: npm run quiz:queue [-- --dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { loadGeneratedBatches, type QueueBatch } from "./quiz-queue-load";

config();

const DIR = join(process.cwd(), "content", "quiz", "generated");
const DRY = process.argv.includes("--dry-run");
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

function verifyOrExit() {
  try {
    execFileSync("npx", ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/verify-quiz.ts"], { stdio: "inherit" });
  } catch {
    console.error("\nQueue load refused: the bank did not verify. Nothing was written.\n");
    process.exit(1);
  }
}

async function main() {
  if (!existsSync(DIR)) {
    console.log(`No ${DIR}: the generator has written no batch yet. Nothing to load.`);
    return;
  }
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.log("No generated batch to load.");
    return;
  }
  verifyOrExit();

  const batches = files.map((file) => ({ file, batch: JSON.parse(readFileSync(join(DIR, file), "utf8")) as QueueBatch }));
  const r = await loadGeneratedBatches(db, batches, { dry: DRY });

  console.log(
    `\n${DRY ? "Would load" : "Loaded"} ${files.length} batch(es) into the review queue — ${r.created} new, ${r.updated} waiting items refreshed, ${r.settled} already stamped or discarded left alone, ${r.duplicates} duplicates of authored questions skipped, ${r.topicsMade} chapter(s) made, ${r.boardsSet} chapter board(s) set; figures ${r.figuresDrawn} ${DRY ? "would be drawn" : "drawn"}, ${r.figuresKept} kept, ${r.figuresFailed.length} failed.\n`,
  );
  for (const f of r.figuresFailed) console.log(`  figure failed — ${f.file}: "${f.stem.slice(0, 70)}": ${f.reason}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
