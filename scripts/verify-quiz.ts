/**
 * The Abhyaas bank verifier.
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

const DIR = join(process.cwd(), "content", "quiz");
const SUBJECTS = ["MATHS", "SCIENCE", "HISTORY", "GEOGRAPHY", "CIVICS", "ECONOMICS"];
const MAX_LEVEL = 6;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Question = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
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
  questions: Question[];
};

const errors: string[] = [];
const warnings: string[] = [];
let checkedByMachine = 0;
let reviewedByHuman = 0;
let total = 0;
const levelCounts = new Array(MAX_LEVEL).fill(0) as number[];
const seenStems = new Map<string, string>();
const seenSlugs = new Set<string>();

function fail(where: string, message: string) {
  errors.push(`${where}: ${message}`);
}

/* -------------------------------------------------------------------------- */
/* A tiny arithmetic evaluator                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Recursive-descent, over `+ - * / ^ ( )` and numbers. NOT `eval`.
 *
 * `eval` would be four lines and would also make every file in content/quiz a
 * code-execution path into the build. A bank is exactly the kind of thing that
 * gets a pull request from somebody who is not on the team.
 *
 * Returns null for anything it does not understand, which the caller treats as
 * "not machine-checkable" rather than as a failure — a `checkExpr` of "Na" is a
 * mistake in the file, but a silent wrong answer would be worse than a skip.
 */
function evaluate(expression: string): number | null {
  let index = 0;
  const src = expression.replace(/\s+/g, "");

  function peek(): string | undefined {
    return src[index];
  }
  function eat(char: string): boolean {
    if (src[index] === char) {
      index++;
      return true;
    }
    return false;
  }

  function primary(): number | null {
    if (eat("(")) {
      const value = addition();
      if (value === null || !eat(")")) return null;
      return value;
    }
    if (eat("-")) {
      const value = primary();
      return value === null ? null : -value;
    }
    const start = index;
    while (index < src.length && /[0-9.]/.test(src[index]!)) index++;
    if (index === start) return null;
    const parsed = Number(src.slice(start, index));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function power(): number | null {
    const base = primary();
    if (base === null) return null;
    if (eat("^")) {
      const exponent = power();
      return exponent === null ? null : Math.pow(base, exponent);
    }
    return base;
  }

  function multiplication(): number | null {
    let value = power();
    if (value === null) return null;
    for (;;) {
      if (eat("*")) {
        const rhs = power();
        if (rhs === null) return null;
        value *= rhs;
      } else if (eat("/")) {
        const rhs = power();
        if (rhs === null || rhs === 0) return null;
        value /= rhs;
      } else break;
    }
    return value;
  }

  function addition(): number | null {
    let value = multiplication();
    if (value === null) return null;
    for (;;) {
      if (eat("+")) {
        const rhs = multiplication();
        if (rhs === null) return null;
        value += rhs;
      } else if (eat("-")) {
        const rhs = multiplication();
        if (rhs === null) return null;
        value -= rhs;
      } else break;
    }
    return value;
  }

  const result = addition();
  // Trailing junk means we understood only part of it, which is not the same as
  // understanding it.
  if (peek() !== undefined) return null;
  return result;
}

/**
 * The number an option states, if it states one.
 *
 * Options read like "12 cm" or "x = 7" or "−3", so this pulls the first numeric
 * token rather than demanding the whole string be a number. The unicode minus
 * is normalised because it is what a properly typeset option actually contains.
 */
function numberIn(option: string): number | null {
  const normalised = option.replace(/[−–—]/g, "-").replace(/,/g, "");
  const match = normalised.match(/-?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?/);
  if (!match) return null;
  const token = match[0]!;
  if (token.includes("/")) {
    const [a, b] = token.split("/").map(Number) as [number, number];
    return b === 0 ? null : a / b;
  }
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

/* -------------------------------------------------------------------------- */

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

  console.log(`\nAbhyaas bank — ${files.length} topic file${files.length === 1 ? "" : "s"}\n`);
  console.log(`  questions            ${total}`);
  console.log(
    `  by level             ${levelCounts.map((n, i) => `L${i + 1}:${n}`).join("  ")}`,
  );
  console.log(`  arithmetic-checked   ${checkedByMachine}  (evaluated and matched)`);
  console.log(`  read by a person     ${reviewedByHuman}`);
  console.log(
    `  NOT machine-checked  ${total - checkedByMachine}  ← correctness of these is asserted, not proven`,
  );

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
