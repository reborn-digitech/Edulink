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
import { G6_CIVICS } from "./g6-civics";
import { G7_MATHS } from "./g7-maths";
import { G8_MATHS } from "./g8-maths";
import { G9_MATHS } from "./g9-maths";
import { G7_SCIENCE } from "./g7-science";
import { G7_GEOGRAPHY } from "./g7-geography";
import { G7_HISTORY } from "./g7-history";
import { G7_CIVICS } from "./g7-civics";
import { G8_SCIENCE } from "./g8-science";
import { G8_GEOGRAPHY } from "./g8-geography";
import { G8_HISTORY } from "./g8-history";
import { G8_CIVICS } from "./g8-civics";

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
    ...G6_CIVICS.map(generateChapter),
    ...G7_SCIENCE.map(generateChapter),
    ...G7_GEOGRAPHY.map(generateChapter),
    ...G7_HISTORY.map(generateChapter),
    ...G7_CIVICS.map(generateChapter),
    ...G8_SCIENCE.map(generateChapter),
    ...G8_GEOGRAPHY.map(generateChapter),
    ...G8_HISTORY.map(generateChapter),
    ...G8_CIVICS.map(generateChapter),
    ...G3_MATHS,
    ...G4_MATHS,
    ...G5_MATHS,
    ...G6_MATHS,
    ...G7_MATHS,
    ...G8_MATHS,
    ...G9_MATHS,
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
