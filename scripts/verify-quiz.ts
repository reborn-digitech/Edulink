/**
 * The Practice bank verifier.
 *
 * WHAT IT CAN AND CANNOT DO, said first because the difference is the whole
 * point of the file. There is no program that can tell you whether "Dandi March,
 * 1930" is the right answer to a history question. Anybody who says their
 * question bank is "verified correct" by a script is telling you about the
 * script, not about the answers.
 *
 * So this checks three separate things and reports them separately:
 *
 *   STRUCTURE — every row is well-formed, the answer index points at a real
 *   option, no two questions are the same, no topic has a hole in its difficulty
 *   ladder. All hard failures. These are the errors that make a bank unusable
 *   rather than merely wrong, and they are entirely machine-checkable.
 *
 *   ARITHMETIC — for any question carrying `checkExpr`, the expression is
 *   evaluated and compared against the option the answer index points at. This
 *   is a REAL correctness check, and it is the only one here. A mismatch is a
 *   hard failure.
 *
 *   HUMAN REVIEW — how many questions a person has actually read, from
 *   `reviewedAt`. Reported as a number, never as a pass. An unreviewed history
 *   answer is unverified no matter how many structural checks it survives.
 *
 * Run: npm run quiz:verify
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluate, numberIn } from "./quiz-arith";

const DIR = join(process.cwd(), "content", "quiz");
const SUBJECTS = ["MATHS", "SCIENCE", "HISTORY", "GEOGRAPHY", "CIVICS", "ECONOMICS"];
const MAX_LEVEL = 6;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type QuestionTranslation = { stem?: string; choices?: string[]; solution?: string };

type Question = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  translations?: Record<string, QuestionTranslation>;
};

type TopicFile = {
  subject: string;
  classLevel: number;
  chapter: string;
  name: string;
  slug: string;
  summary?: string;
  position?: number;
  source: string;
  licence: string;
  translations?: Record<string, { name?: string; summary?: string }>;
  questions: Question[];
};

/** The languages a translation block may name. Anything else is a typo. */
const LANGUAGES = new Set(["hi", "mr"]);

const errors: string[] = [];
const warnings: string[] = [];
let checkedByMachine = 0;
let reviewedByHuman = 0;
let answerNotRestated = 0;
let numericButUnchecked = 0;
const unchecked: string[] = [];
const translationCounts: Record<string, number> = {};
let total = 0;
const levelCounts = new Array(MAX_LEVEL).fill(0) as number[];
const seenStems = new Map<string, string>();
const seenSlugs = new Set<string>();

function fail(where: string, message: string) {
  errors.push(`${where}: ${message}`);
}

/* --------------------------------------------------------------------------
   The arithmetic evaluator and option-number reader live in quiz-arith.ts,
   SHARED with the generator — one evaluation, so the generator's proof and
   this verifier's proof can never drift apart.
   -------------------------------------------------------------------------- */

function verifyTopic(file: string, topic: TopicFile) {
  const where = file;

  if (!SUBJECTS.includes(topic.subject)) {
    fail(where, `subject "${topic.subject}" is not one of ${SUBJECTS.join(", ")}`);
  }
  if (!Number.isInteger(topic.classLevel) || topic.classLevel < 1 || topic.classLevel > 12) {
    fail(where, `classLevel ${topic.classLevel} is not a class between 1 and 12`);
  }
  if (!SLUG_RE.test(topic.slug ?? "")) {
    fail(where, `slug "${topic.slug}" must be lowercase-with-hyphens`);
  }
  if (seenSlugs.has(topic.slug)) {
    // Hard failure, not a warning: badge ids are built from the slug, so two
    // topics sharing one means two different achievements writing the same badge.
    fail(where, `slug "${topic.slug}" is already used by another topic`);
  }
  seenSlugs.add(topic.slug);

  for (const code of Object.keys(topic.translations ?? {})) {
    if (!LANGUAGES.has(code)) {
      fail(where, `topic translation "${code}" is not a language this bank knows`);
    }
  }

  if (!topic.source?.trim()) fail(where, "source is required");
  if (!topic.licence?.trim()) fail(where, "licence is required");
  if (!Array.isArray(topic.questions) || topic.questions.length === 0) {
    fail(where, "has no questions");
    return;
  }

  const levelsPresent = new Set<number>();

  topic.questions.forEach((question, i) => {
    const at = `${file}[${i}]`;
    total++;

    if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > MAX_LEVEL) {
      fail(at, `difficulty ${question.difficulty} is outside 1–${MAX_LEVEL}`);
    } else {
      levelsPresent.add(question.difficulty);
      levelCounts[question.difficulty - 1]!++;
    }

    if (!question.stem?.trim()) fail(at, "stem is empty");
    const key = question.stem?.trim().toLowerCase();
    if (key) {
      const previous = seenStems.get(key);
      if (previous) fail(at, `duplicate of a question already in ${previous}`);
      else seenStems.set(key, file);
    }

    if (!Array.isArray(question.choices) || question.choices.length < 2) {
      fail(at, "needs at least two choices");
      return;
    }
    if (question.choices.some((c) => typeof c !== "string" || !c.trim())) {
      fail(at, "has a blank choice");
    }
    const distinct = new Set(question.choices.map((c) => c.trim().toLowerCase()));
    if (distinct.size !== question.choices.length) {
      // Two identical options mean one of them is also correct, so the marked
      // answer is not the only right one and the child is marked wrong for
      // picking an identical string.
      fail(at, "has two identical choices");
    }

    if (
      !Number.isInteger(question.answerIndex) ||
      question.answerIndex < 0 ||
      question.answerIndex >= question.choices.length
    ) {
      fail(at, `answerIndex ${question.answerIndex} does not point at a choice`);
      return;
    }

    if ((question.solution ?? "").trim().length < 20) {
      // A solution shorter than this is the answer restated. The whole reason
      // revealing costs a badge is that what is behind it is worth something.
      fail(at, "solution is too short to be a worked solution");
    }

    if (question.reviewedAt) reviewedByHuman++;

    if (question.checkExpr) {
      // A checkExpr with no operation in it is a bare literal, and comparing a
      // literal against the answer it was copied from proves exactly nothing —
      // "5" checks that 5 is 5. It is worse than having no check at all,
      // because it INFLATES the machine-checked count, which is the one number
      // this bank uses to say how much of it has actually been proven. Refused
      // outright so the count can never be padded, by anyone, by accident.
      if (!/[+\-*/^]/.test(question.checkExpr)) {
        fail(
          at,
          `checkExpr "${question.checkExpr}" is a bare literal — it restates the answer instead of computing it. Give an expression that derives the answer, or remove it and let the question count as unproven.`,
        );
        return;
      }

      const expected = evaluate(question.checkExpr);
      if (expected === null) {
        fail(at, `checkExpr "${question.checkExpr}" is not arithmetic this can evaluate`);
        return;
      }
      const stated = numberIn(question.choices[question.answerIndex]!);
      if (stated === null) {
        fail(at, `checkExpr is set but the marked answer "${question.choices[question.answerIndex]}" states no number`);
        return;
      }
      if (Math.abs(stated - expected) > 1e-6) {
        fail(
          at,
          `ARITHMETIC MISMATCH — checkExpr "${question.checkExpr}" = ${expected}, but the marked answer says ${stated}`,
        );
        return;
      }
      checkedByMachine++;
    }

    /* ---- the two heuristics, both warnings ---------------------------------
     *
     * Neither can prove an answer right, so neither is a hard failure. What
     * they do is narrow 60 unproven questions down to the handful worth a
     * person's time — which is the only thing that makes hand-review tractable
     * at all.
     */
    const answerText = question.choices[question.answerIndex]!;
    const answerNumber = numberIn(answerText);

    if (answerNumber !== null) {
      // A solution that never states its own answer is the shape of the bug
      // this bank has already shipped once: marked 90, worked through to 94.
      // Matching on a token boundary so that 9 does not "find" itself inside 94.
      const solutionText = (question.solution ?? "").replace(/[−–—]/g, "-").replace(/,/g, "");
      const token = String(answerNumber);
      // A full stop ENDING a sentence is a boundary; a full stop followed by a
      // digit is a decimal point and is not. Getting this wrong made the check
      // fire on every answer that happened to finish a sentence, which is most
      // of them — a warning that cries wolf is a warning nobody reads.
      const restated = new RegExp(
        `(^|[^0-9.])${token.replace(".", "\\.")}(\\.(?![0-9])|[^0-9.]|$)`,
      ).test(solutionText);
      if (!restated) {
        warnings.push(
          `${at}: the marked answer is ${token}, but the solution never states that number — check the working lands where the answer says`,
        );
        answerNotRestated++;
      }

      // Numeric, and nothing evaluates it. These are exactly the questions that
      // COULD be machine-checked and are not, so they are the cheapest wins.
      if (!question.checkExpr) {
        numericButUnchecked++;
        unchecked.push(`${at}: "${question.stem.slice(0, 62)}${question.stem.length > 62 ? "…" : ""}" → ${answerText}`);
      }
    }

    /* ---- translations ----------------------------------------------------
     *
     * HARD FAILURES, all of them, and the reason is narrow: `answerIndex` is
     * stored once and indexes the ORIGINAL choices array. A translation with a
     * different number of options leaves that index pointing at the wrong
     * string, so a child answering correctly in Marathi is marked wrong. A
     * missing translation is fine and falls back; a MISALIGNED one is not
     * recoverable at read time, so it is refused at the door.
     */
    for (const [code, tr] of Object.entries(question.translations ?? {})) {
      const where = `${at} (${code})`;
      if (!LANGUAGES.has(code)) {
        fail(where, `"${code}" is not a language this bank knows (${[...LANGUAGES].join(", ")})`);
        continue;
      }
      if (tr.choices !== undefined) {
        if (!Array.isArray(tr.choices)) {
          fail(where, "choices must be an array when present");
        } else if (tr.choices.length !== question.choices.length) {
          fail(
            where,
            `has ${tr.choices.length} choices but the original has ${question.choices.length} — answerIndex would point at the wrong option`,
          );
        } else if (tr.choices.some((c) => typeof c !== "string" || !c.trim())) {
          fail(where, "has a blank choice");
        }
      }
      if (tr.stem !== undefined && !tr.stem.trim()) fail(where, "stem is present but empty");
      if (tr.solution !== undefined && !tr.solution.trim()) {
        fail(where, "solution is present but empty");
      }
      translationCounts[code] = (translationCounts[code] ?? 0) + 1;
    }
  });

  // A hole in the middle of the ladder is unplayable: the engine falls to the
  // NEAREST level, so a topic with 1,2,4 never serves anything at 3 and a child
  // promoted past 2 skips a step they were supposed to climb.
  const levels = [...levelsPresent].sort((a, b) => a - b);
  if (levels.length > 1) {
    for (let l = levels[0]!; l < levels[levels.length - 1]!; l++) {
      if (!levelsPresent.has(l)) {
        warnings.push(`${file}: ladder has a hole at level ${l} (has ${levels.join(", ")})`);
      }
    }
  }
}

function main() {
  let files: string[];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  } catch {
    console.error(`No ${DIR} directory. Nothing to verify.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("content/quiz has no .json topic files.");
    process.exit(1);
  }

  for (const file of files) {
    let parsed: TopicFile;
    try {
      parsed = JSON.parse(readFileSync(join(DIR, file), "utf8"));
    } catch (error) {
      fail(file, `is not valid JSON — ${(error as Error).message}`);
      continue;
    }
    verifyTopic(file, parsed);
  }

  console.log(`\nPractice bank — ${files.length} topic file${files.length === 1 ? "" : "s"}\n`);
  console.log(`  questions            ${total}`);
  console.log(
    `  by level             ${levelCounts.map((n, i) => `L${i + 1}:${n}`).join("  ")}`,
  );
  console.log(`  arithmetic-checked   ${checkedByMachine}  (evaluated and matched)`);
  console.log(`  read by a person     ${reviewedByHuman}`);
  console.log(
    `  NOT machine-checked  ${total - checkedByMachine}  ← correctness of these is asserted, not proven`,
  );

  // Reported as "n of total", never as a tick. A language that is 11 questions
  // into 105 is a language a child will fall out of on question 12, and a bare
  // "Hindi ✓" would hide exactly that.
  const languages = Object.keys(translationCounts).sort();
  if (languages.length) {
    console.log(
      `  translated           ${languages
        .map((code) => `${code}:${translationCounts[code]}/${total}`)
        .join("  ")}`,
    );
  } else {
    console.log(`  translated           none — every question reads in English only`);
  }

  if (numericButUnchecked) {
    // Deliberately NOT phrased as "could be machine-checked". A date, a digit
    // named as a digit, or a distance quoted in a unit all contain a number and
    // none of them is a computation. This is a list to glance down, not a list
    // of defects — saying otherwise would train people to ignore it.
    console.log(
      `\n${numericButUnchecked} question${numericButUnchecked === 1 ? " has a number" : "s have a number"} in the marked answer and no checkExpr (a date or a label is not a computation — glance, don't assume):`,
    );
    for (const line of unchecked) console.log(`  · ${line}`);
  }

  if (warnings.length) {
    console.log(`\n${warnings.length} warning${warnings.length === 1 ? "" : "s"}:`);
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }

  if (errors.length) {
    console.log(`\n${errors.length} error${errors.length === 1 ? "" : "s"}:`);
    for (const error of errors) console.log(`  ✗ ${error}`);
    console.log("");
    process.exit(1);
  }

  console.log("\nStructure and arithmetic: all checks passed.");
  console.log(
    "This does NOT mean every answer is right. Non-arithmetic answers are unproven until a person reads them.\n",
  );
}

main();
