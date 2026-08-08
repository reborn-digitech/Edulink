/**
 * Writes the refurbished bank's chapter files into content/quiz/, where the
 * ordinary verify → import pipeline picks them up:
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/quiz2/gen-quiz2.ts
 *   npm run quiz:import
 *
 * Deterministic end to end (seeded PRNG keyed by slug), so a re-run with
 * unchanged chapter tables produces byte-identical files and the import is a
 * no-op — content review happens in git diffs, which is the point of writing
 * JSON instead of importing straight to the database.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateChapter } from "./engine";
import { G6_HISTORY } from "./g6-history";

const DIR = join(process.cwd(), "content", "quiz");

function main() {
  mkdirSync(DIR, { recursive: true });
  const chapters = [...G6_HISTORY];
  let total = 0;
  for (const chapter of chapters) {
    const out = generateChapter(chapter);
    const file = join(DIR, `${out.slug}.json`);
    writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
    total += out.questions.length;
    console.log(`${out.slug}: ${out.questions.length} questions`);
  }
  console.log(`\n${chapters.length} chapters, ${total} questions written to content/quiz/.`);
}

main();
