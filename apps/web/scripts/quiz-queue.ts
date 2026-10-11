/**
 * Loads the quiz bank generator's batches (content/quiz/generated/*.json) into the bank.
 *
 * PUBLISHED WITHOUT REVIEW (the owner, 11 October 2026; a review queue from 10 October): an item the
 * generator kept passed its own checks — the critique, the blind solver, the form checks, the verifier —
 * and is served the moment it is loaded, its Hindi and Marathi rows with it (src/lib/quiz-served.ts).
 * An item whose figure failed to draw is loaded but held until the figure is drawn. The operator and the
 * content team take an item down or edit it afterwards on the bank desk (/root/quiz-review,
 * /appadmin/quiz-review; src/lib/quiz-review.ts). The generation job started from that desk loads each
 * chapter through the same loader as it finishes (scripts/quiz-gen/job.ts); this command loads every file.
 *
 * A batch may extend a SERVED topic (its slug is an authored chapter's). A batch for a new chapter makes
 * the topic, which lists for pupils once it holds a served item (quiz.ts listTopics).
 *
 * IDEMPOTENT by (topic, stem): a re-run updates an item in place (the generator re-ran the chapter), and
 * never touches one a person edited or took down (or the review queue stamped, before this). An item
 * whose stem the chapter already holds as an authored question is skipped as a duplicate. The authored
 * bank's importer (scripts/import-quiz.ts) leaves these rows alone: it reads only `generated: false`.
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
    `\n${DRY ? "Would load" : "Loaded"} ${files.length} batch(es) into the bank — ${r.created} new, ${r.updated} items refreshed, ${r.settled} edited or taken down on the desk (or stamped earlier) left alone, ${r.duplicates} duplicates of authored questions skipped, ${r.topicsMade} chapter(s) made, ${r.boardsSet} chapter board(s) set; figures ${r.figuresDrawn} ${DRY ? "would be drawn" : "drawn"}, ${r.figuresKept} kept, ${r.figuresFailed.length} failed.\n`,
  );
  for (const f of r.figuresFailed) console.log(`  figure failed — ${f.file}: "${f.stem.slice(0, 70)}": ${f.reason}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
