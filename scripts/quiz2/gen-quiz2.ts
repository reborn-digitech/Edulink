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
import { generateChapter, type TopicFileOut } from "./engine";
import { G6_HISTORY } from "./g6-history";
import { G3_MATHS, G3_MATHS_CONCEPT } from "./g3-maths";
import { G3_EVS } from "./g3-evs";
import { G4_MATHS } from "./g4-maths";
import { G4_EVS } from "./g4-evs";
import { G5_MATHS } from "./g5-maths";
import { G5_EVS } from "./g5-evs";
import { G6_MATHS } from "./g6-maths";
import { G6_SCIENCE } from "./g6-science";
import { G6_GEOGRAPHY } from "./g6-geography";

const DIR = join(process.cwd(), "content", "quiz");

function main() {
  mkdirSync(DIR, { recursive: true });
  // Conceptual chapters run through the engine; numeric chapters arrive built.
  const topics: TopicFileOut[] = [
    ...G3_EVS.map(generateChapter),
    ...G4_EVS.map(generateChapter),
    ...G5_EVS.map(generateChapter),
    ...G3_MATHS_CONCEPT.map(generateChapter),
    ...G6_HISTORY.map(generateChapter),
    ...G6_SCIENCE.map(generateChapter),
    ...G6_GEOGRAPHY.map(generateChapter),
    ...G3_MATHS,
    ...G4_MATHS,
    ...G5_MATHS,
    ...G6_MATHS,
  ];
  let total = 0;
  for (const out of topics) {
    const file = join(DIR, `${out.slug}.json`);
    writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
    total += out.questions.length;
    console.log(`${out.slug}: ${out.questions.length} questions`);
  }
  console.log(`\n${topics.length} chapters, ${total} questions written to content/quiz/.`);
}

main();
