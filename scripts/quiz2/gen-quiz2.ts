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
import { G10_MATHS } from "./g10-maths";
import { G11_MATHS } from "./g11-maths";
import { G7_SCIENCE } from "./g7-science";
import { G7_GEOGRAPHY } from "./g7-geography";
import { G7_HISTORY } from "./g7-history";
import { G7_CIVICS } from "./g7-civics";
import { G8_SCIENCE } from "./g8-science";
import { G8_GEOGRAPHY } from "./g8-geography";
import { G8_HISTORY } from "./g8-history";
import { G8_CIVICS } from "./g8-civics";
import { G9_SCIENCE } from "./g9-science";
import { G9_HISTORY } from "./g9-history";
import { G10_SCIENCE } from "./g10-science";
import { G10_HISTORY } from "./g10-history";
import { G10_GEOGRAPHY } from "./g10-geography";
import { G10_CIVICS } from "./g10-civics";
import { G10_ECONOMICS } from "./g10-economics";
import { G9_GEOGRAPHY } from "./g9-geography";
import { G9_CIVICS } from "./g9-civics";
import { G9_ECONOMICS } from "./g9-economics";
import { G11_PHYSICS, G11_PHYSICS_NUMERIC } from "./g11-physics";
import { G11_CHEMISTRY, G11_CHEMISTRY_NUMERIC } from "./g11-chemistry";
import { G11_BIOLOGY, G11_BIOLOGY_NUMERIC } from "./g11-biology";
import { G12_PHYSICS, G12_PHYSICS_NUMERIC } from "./g12-physics";
import { G12_CHEMISTRY, G12_CHEMISTRY_NUMERIC } from "./g12-chemistry";
import { G12_BIOLOGY, G12_BIOLOGY_NUMERIC } from "./g12-biology";
import { withNumeric } from "./numeric";

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
    ...G9_SCIENCE.map(generateChapter),
    ...G9_HISTORY.map(generateChapter),
    ...G10_SCIENCE.map(generateChapter),
    ...G10_HISTORY.map(generateChapter),
    ...G10_GEOGRAPHY.map(generateChapter),
    ...G10_CIVICS.map(generateChapter),
    ...G10_ECONOMICS.map(generateChapter),
    ...G9_GEOGRAPHY.map(generateChapter),
    ...G9_CIVICS.map(generateChapter),
    ...G9_ECONOMICS.map(generateChapter),
    // Class 11 physics is the first family that is conceptual AND computed in
    // the same chapter — the ladder from the engine, the problems bolted on.
    ...G11_PHYSICS.map(generateChapter).map((t) => withNumeric(t, G11_PHYSICS_NUMERIC[t.slug] ?? [])),
    ...G11_CHEMISTRY.map(generateChapter).map((t) => withNumeric(t, G11_CHEMISTRY_NUMERIC[t.slug] ?? [])),
    // Biology is the counter-example: `G11_BIOLOGY_NUMERIC` is empty for every
    // chapter whose subject is not measured by calculation, and withNumeric
    // returns the ladder untouched when it is handed nothing.
    ...G11_BIOLOGY.map(generateChapter).map((t) => withNumeric(t, G11_BIOLOGY_NUMERIC[t.slug] ?? [])),
    // Class 12 keeps the Class 11 shape but shifts the weight: the conceptual
    // half is no longer the softer half. "Why can two field lines never cross"
    // is what licenses the formula the numerical half then uses.
    ...G12_PHYSICS.map(generateChapter).map((t) => withNumeric(t, G12_PHYSICS_NUMERIC[t.slug] ?? [])),
    ...G12_CHEMISTRY.map(generateChapter).map((t) => withNumeric(t, G12_CHEMISTRY_NUMERIC[t.slug] ?? [])),
    ...G12_BIOLOGY.map(generateChapter).map((t) => withNumeric(t, G12_BIOLOGY_NUMERIC[t.slug] ?? [])),
    ...G3_MATHS,
    ...G4_MATHS,
    ...G5_MATHS,
    ...G6_MATHS,
    ...G7_MATHS,
    ...G8_MATHS,
    ...G9_MATHS,
    ...G10_MATHS,
    // Class 11 maths arrives fully built like the earlier grades: it is the one
    // Class 11 family with no conceptual half to bolt problems onto, because a
    // set, a relation and a discriminant are already the things being counted.
    ...G11_MATHS,
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
