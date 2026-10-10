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
 * GENERATED FILES (the quiz bank generator, 10 October 2026): content/quiz/generated/*.json are
 * read after the authored files, in the same shape plus the generator's optional fields. Three
 * things differ for them, each because a generated file is a batch waiting for review, not a
 * served topic: its slug may be an authored topic's (the batch extends that topic); a hole in its
 * ladder is a warning, not a failure (a batch with `--limit`, or without the papers corpus for
 * levels 5 and 6, is partial by design); and its review `stamps` ({reviewer, role APP_ADMIN |
 * OPERATOR, at}) and `figure` ({kind, spec} with an `imageAlt`) are checked for shape. A question
 * naming an `imageKey` must name a file under content/quiz/figures/ and carry an alt.
 *
 * The per-question checks are `questionErrors`, exported so the generator runs the bank's own rules
 * on an item before it writes it (scripts/quiz-gen/pipeline.ts).
 *
 * Run: npm run quiz:verify
 */
import { QUIZ_FIGURE_KINDS } from "@edulink/contracts";
import { asQuizBoard, QUIZ_BOARDS } from "@edulink/contracts"; // quiz-board (11 Oct 2026)
import { figureProblems } from "./quiz-gen/figures/check";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluate, numberIn } from "./quiz-arith";

const DIR = join(process.cwd(), "content", "quiz");
export const GENERATED_DIR = join(DIR, "generated");
export const FIGURES_DIR = join(DIR, "figures");
const SUBJECTS = [
  "MATHS",
  "SCIENCE",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "EVS",
  "HISTORY",
  "GEOGRAPHY",
  "CIVICS",
  "ECONOMICS",
];
const MAX_LEVEL = 6;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The reviewers a stamp may name: the app admins and the operator (the owner, 10 October 2026); never a teacher. */
export const STAMP_ROLES = ["APP_ADMIN", "OPERATOR"] as const;
// figures (10 Oct 2026): the kinds the figure builder draws are the contract's, pie included.
export const FIGURE_KINDS = QUIZ_FIGURE_KINDS;

type QuestionTranslation = { stem?: string; choices?: string[]; solution?: string };

export type Stamp = { reviewer: string; role: string; at: string };

export type Question = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  translations?: Record<string, QuestionTranslation>;
  /* The generator's optional fields; the bank ignores what it does not know. */
  imageKey?: string | null;
  imageAlt?: string | null;
  figure?: { kind: string; spec: Record<string, unknown> } | null;
  needsFigure?: boolean;
  stamps?: Stamp[];
};

export type TopicFile = {
  subject: string;
  classLevel: number;
  chapter: string;
  name: string;
  slug: string;
  summary?: string;
  position?: number;
  source: string;
  licence: string;
  /** quiz-board (11 Oct 2026): "NCERT" | "BALBHARATI". Required on a generated batch (the truth for its topic's board); an authored file without one is NCERT's. */
  board?: string;
  translations?: Record<string, { name?: string; summary?: string }>;
  questions: Question[];
};

/** The languages a translation block may name. Anything else is a typo. */
const LANGUAGES = new Set(["hi", "mr"]);

/* --------------------------------------------------------------------------
   The arithmetic evaluator and option-number reader live in quiz-arith.ts,
   SHARED with the generator — one evaluation, so the generator's proof and
   this verifier's proof can never drift apart.

   What follows is NOT shared: two readers used only by the heuristics below.
   They exist to keep those warnings honest, and a heuristic that is wrong in
   the verifier is a nuisance, whereas a heuristic that is wrong in the
   generator would be a lie about a proof.
   -------------------------------------------------------------------------- */

/**
 * The number an option states, WHEN THE OPTION IS A NUMERIC ANSWER.
 *
 * `numberIn` pulls the first numeric token out of anything, which is right for
 * the arithmetic check — there `checkExpr` has already declared the intent. It
 * is wrong for the heuristics: "'The tanker delivered water on only 4 of the
 * last 30 days'" is a sentence, and "2 → 1 → 3" is an ordering, and neither has
 * an answer whose value a solution could be expected to restate. Both used to
 * be warned about, and both warnings were noise.
 *
 * A numeric answer is the number and, at most, a short unit or label around it
 * — "224 litres", "x = 7", "−3". So: strip the number, and what is left must
 * carry no OTHER digit and must be short. Prose fails on both counts.
 */
function numericAnswer(option: string): number | null {
  const value = numberIn(option);
  if (value === null) return null;
  const normalised = option.replace(/[−–—]/g, "-").replace(/,/g, "");
  const remainder = normalised.replace(/-?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?/, "");
  if (/\d/.test(remainder)) return null;
  if (remainder.trim().length > 24) return null;
  return value;
}

/**
 * 0–12 written out, plus the ordinals, once/twice/thrice, and the pair words —
 * a "how many of these two" question is honestly answered "Neither" or "Both".
 */
const NUMBER_WORDS: Record<number, string[]> = {
  0: ["zero", "none", "neither"],
  1: ["one", "once", "first"],
  2: ["two", "twice", "second", "both"],
  3: ["three", "thrice", "third"],
  4: ["four", "fourth"],
  5: ["five", "fifth"],
  6: ["six", "sixth"],
  7: ["seven", "seventh"],
  8: ["eight", "eighth"],
  9: ["nine", "ninth"],
  10: ["ten", "tenth"],
  11: ["eleven", "eleventh"],
  12: ["twelve", "twelfth"],
};

/**
 * Does the solution state the answer in words rather than digits?
 *
 * "How many lines of symmetry does the letter A have?" is answered 1 and
 * solved "One — the vertical line down its middle". The working lands exactly
 * where the answer says; only the spelling differs. Thirty solutions in this
 * bank read that way, and thirty false alarms is how a warning stops being
 * read at all.
 *
 * CAPPED AT TWELVE, and that ceiling is the point rather than a convenience.
 * Prose spells out small counts and prints large ones, so above twelve a digit
 * is a fair thing to demand — which leaves the check's teeth exactly where the
 * bug it was written for lived: an answer marked 90 and worked through to 94.
 * Below twelve it does lose a little bite, since a solution may say "one" of
 * something else entirely; that is the price of the thirty, and it is worth
 * paying, because a warning nobody reads catches nothing at all.
 */
function statedInWords(answer: number, solutionText: string): boolean {
  if (!Number.isInteger(answer)) return false;
  const words = NUMBER_WORDS[answer];
  if (!words) return false;
  return words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(solutionText));
}

/**
 * The structural and arithmetic checks on ONE question, with no cross-file state: the shape, the
 * answer index, the solution's length, the checkExpr (a bare literal refused, a mismatch a failure),
 * the translations' alignment, the figure and the stamps. Returns every failure in words. The
 * generator runs this on an item before it is written; `verifyTopic` runs it on every row and adds
 * the cross-file checks (duplicate stems, slugs, the ladder).
 */
export function questionErrors(question: Question, opts: { figureExists?: (key: string) => boolean; /** quiz-board (11 Oct 2026): a generated batch's figure that cannot be drawn is the queue's to record, not a failure here. */ figureDrawIsWarning?: boolean } = {}): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(message);

  if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > MAX_LEVEL) {
    fail(`difficulty ${question.difficulty} is outside 1–${MAX_LEVEL}`);
  }
  if (!question.stem?.trim()) fail("stem is empty");

  if (!Array.isArray(question.choices) || question.choices.length < 2) {
    fail("needs at least two choices");
    return errors;
  }
  if (question.choices.some((c) => typeof c !== "string" || !c.trim())) {
    fail("has a blank choice");
  }
  const distinct = new Set(question.choices.map((c) => c.trim().toLowerCase()));
  if (distinct.size !== question.choices.length) {
    // Two identical options mean one of them is also correct, so the marked
    // answer is not the only right one and the child is marked wrong for
    // picking an identical string.
    fail("has two identical choices");
  }

  if (
    !Number.isInteger(question.answerIndex) ||
    question.answerIndex < 0 ||
    question.answerIndex >= question.choices.length
  ) {
    fail(`answerIndex ${question.answerIndex} does not point at a choice`);
    return errors;
  }

  if ((question.solution ?? "").trim().length < 20) {
    // A solution shorter than this is the answer restated. The whole reason
    // revealing costs a badge is that what is behind it is worth something.
    fail("solution is too short to be a worked solution");
  }

  if (question.checkExpr) {
    // A checkExpr with no operation in it is a bare literal, and comparing a
    // literal against the answer it was copied from proves exactly nothing —
    // "5" checks that 5 is 5. It is worse than having no check at all,
    // because it INFLATES the machine-checked count, which is the one number
    // this bank uses to say how much of it has actually been proven. Refused
    // outright so the count can never be padded, by anyone, by accident.
    if (!/[+\-*/^]/.test(question.checkExpr)) {
      fail(
        `checkExpr "${question.checkExpr}" is a bare literal — it restates the answer instead of computing it. Give an expression that derives the answer, or remove it and let the question count as unproven.`,
      );
    } else {
      const expected = evaluate(question.checkExpr);
      if (expected === null) fail(`checkExpr "${question.checkExpr}" is not arithmetic this can evaluate`);
      else {
        const stated = numberIn(question.choices[question.answerIndex]!);
        if (stated === null) fail(`checkExpr is set but the marked answer "${question.choices[question.answerIndex]}" states no number`);
        else if (Math.abs(stated - expected) > 1e-6) {
          fail(`ARITHMETIC MISMATCH — checkExpr "${question.checkExpr}" = ${expected}, but the marked answer says ${stated}`);
        }
      }
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
    if (!LANGUAGES.has(code)) {
      fail(`(${code}) "${code}" is not a language this bank knows (${[...LANGUAGES].join(", ")})`);
      continue;
    }
    if (tr.choices !== undefined) {
      if (!Array.isArray(tr.choices)) {
        fail(`(${code}) choices must be an array when present`);
      } else if (tr.choices.length !== question.choices.length) {
        fail(`(${code}) has ${tr.choices.length} choices but the original has ${question.choices.length} — answerIndex would point at the wrong option`);
      } else if (tr.choices.some((c) => typeof c !== "string" || !c.trim())) {
        fail(`(${code}) has a blank choice`);
      }
    }
    if (tr.stem !== undefined && !tr.stem.trim()) fail(`(${code}) stem is present but empty`);
    if (tr.solution !== undefined && !tr.solution.trim()) fail(`(${code}) solution is present but empty`);
  }

  /* ---- the generator's fields (10 October 2026) ------------------------
   *
   * An image or a figure must come with words a screen reader and a pupil
   * without the picture can use; a stamp must name a reviewer the bank lets
   * review; a figure's kind must be one the figure builder draws.
   */
  if (question.imageKey) {
    const exists = opts.figureExists ?? ((key: string) => existsSync(join(FIGURES_DIR, key)));
    if (!/^[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp|svg)$/i.test(question.imageKey) || !exists(question.imageKey)) {
      fail(`imageKey "${question.imageKey}" names no file under content/quiz/figures/`);
    }
    if (!question.imageAlt?.trim()) fail("imageKey is set without imageAlt");
  }
  if (question.figure) {
    if (!(FIGURE_KINDS as readonly string[]).includes(question.figure.kind)) fail(`figure kind "${question.figure.kind}" is not one the figure builder draws (${FIGURE_KINDS.join(", ")})`);
    if (!question.figure.spec || typeof question.figure.spec !== "object") fail("figure has no spec");
    if (!question.imageAlt?.trim()) fail("figure is set without imageAlt");
  }
  // ---- figures (the figure builder, 10 Oct 2026): the spec against the contract (packages/contracts
  // quizFigureSpecSchema) and a dry draw in English and every language the item is translated into, so
  // a label with no Marathi text or a character no bundled face draws fails here, not at import. ----
  if (question.figure && !opts.figureDrawIsWarning) for (const problem of figureProblems(question)) if (!problem.startsWith("has a figure but no imageAlt")) fail(problem);
  // ---- end figures ----
  if (question.imageAlt && !question.imageKey && !question.figure) fail("imageAlt is set without an imageKey or a figure");
  if (question.stamps !== undefined) {
    if (!Array.isArray(question.stamps)) fail("stamps must be an array");
    else {
      question.stamps.forEach((s, i) => {
        if (!s || typeof s !== "object") fail(`stamp ${i} is not an object`);
        else {
          if (!s.reviewer?.trim()) fail(`stamp ${i} names no reviewer`);
          if (!(STAMP_ROLES as readonly string[]).includes(s.role)) fail(`stamp ${i} has role "${s.role}", not APP_ADMIN or OPERATOR`);
          if (!s.at || Number.isNaN(Date.parse(s.at))) fail(`stamp ${i} has no readable time`);
        }
      });
    }
  }
  return errors;
}

/** One item served by one stamp (the owner, 10 October 2026): the importer reads this, so the rule lives in one place. */
export function isStamped(question: Pick<Question, "stamps">): boolean {
  return Array.isArray(question.stamps) && question.stamps.some((s) => s && (STAMP_ROLES as readonly string[]).includes(s.role) && Boolean(s.reviewer?.trim()));
}

export type VerifyReport = {
  errors: string[];
  warnings: string[];
  total: number;
  checkedByMachine: number;
  reviewedByHuman: number;
  stamped: number;
  numericButUnchecked: number;
  unchecked: string[];
  translationCounts: Record<string, number>;
  levelCounts: number[];
  files: number;
  generatedFiles: number;
};

export type Verifier = {
  verifyTopic(file: string, topic: TopicFile, opts?: { generated?: boolean }): void;
  report(): VerifyReport;
};

/** The cross-file state (duplicate stems, slugs, the counts) lives here, one per run. */
export function createVerifier(): Verifier {
  const errors: string[] = [];
  const warnings: string[] = [];
  let checkedByMachine = 0;
  let reviewedByHuman = 0;
  let stamped = 0;
  let numericButUnchecked = 0;
  const unchecked: string[] = [];
  const translationCounts: Record<string, number> = {};
  let total = 0;
  const levelCounts = new Array(MAX_LEVEL).fill(0) as number[];
  const seenStems = new Map<string, string>();
  const seenSlugs = new Map<string, boolean>();
  let files = 0;
  let generatedFiles = 0;

  function fail(where: string, message: string) {
    errors.push(`${where}: ${message}`);
  }

  function verifyTopic(file: string, topic: TopicFile, opts: { generated?: boolean } = {}) {
    const where = file;
    const generated = opts.generated === true;
    if (generated) generatedFiles++;
    else files++;

    if (!SUBJECTS.includes(topic.subject)) {
      fail(where, `subject "${topic.subject}" is not one of ${SUBJECTS.join(", ")}`);
    }
    if (!Number.isInteger(topic.classLevel) || topic.classLevel < 1 || topic.classLevel > 12) {
      fail(where, `classLevel ${topic.classLevel} is not a class between 1 and 12`);
    }
    if (!SLUG_RE.test(topic.slug ?? "")) {
      fail(where, `slug "${topic.slug}" must be lowercase-with-hyphens`);
    }
    const seen = seenSlugs.get(topic.slug);
    if (seen !== undefined) {
      // Hard failure, not a warning: badge ids are built from the slug, so two
      // topics sharing one means two different achievements writing the same badge.
      // A generated batch for an authored topic shares its slug on purpose (it
      // extends that topic); two batches, or two authored files, may not.
      if (!(generated && seen === false)) fail(where, `slug "${topic.slug}" is already used by another topic`);
      else seenSlugs.set(topic.slug, true);
    } else seenSlugs.set(topic.slug, generated);

    for (const code of Object.keys(topic.translations ?? {})) {
      if (!LANGUAGES.has(code)) {
        fail(where, `topic translation "${code}" is not a language this bank knows`);
      }
    }

    // ---- quiz-board (11 Oct 2026): a generated batch names its board, one of the codes; it becomes its topic's board. ----
    if (generated && !asQuizBoard(topic.board)) fail(where, `board "${topic.board ?? ""}" must be one of ${QUIZ_BOARDS.join(", ")} on a generated batch`);
    if (!generated && topic.board !== undefined && !asQuizBoard(topic.board)) fail(where, `board "${topic.board}" is not one of ${QUIZ_BOARDS.join(", ")}`);
    // ---- end quiz-board ----
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

      if (Number.isInteger(question.difficulty) && question.difficulty >= 1 && question.difficulty <= MAX_LEVEL) {
        levelsPresent.add(question.difficulty);
        levelCounts[question.difficulty - 1]!++;
      }

      const key = question.stem?.trim().toLowerCase();
      if (key) {
        const previous = seenStems.get(key);
        if (previous) fail(at, `duplicate of a question already in ${previous}`);
        else seenStems.set(key, file);
      }

      for (const message of questionErrors(question, { figureDrawIsWarning: generated })) fail(at, message);
      // quiz-board (11 Oct 2026): a generated item whose figure cannot be drawn still loads; quiz:queue writes the reason and the desk shows "figure failed".
      if (generated && question.figure) for (const problem of figureProblems(question)) if (!problem.startsWith("has a figure but no imageAlt")) warnings.push(`${at}: ${problem} (quiz:queue loads it with this reason)`);
      if (!Array.isArray(question.choices) || question.choices.length < 2) return;
      if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.choices.length) return;

      if (question.reviewedAt) reviewedByHuman++;
      if (isStamped(question)) stamped++;
      if (question.checkExpr && /[+\-*/^]/.test(question.checkExpr) && evaluate(question.checkExpr) !== null) {
        const stated = numberIn(question.choices[question.answerIndex]!);
        if (stated !== null && Math.abs(stated - evaluate(question.checkExpr)!) <= 1e-6) checkedByMachine++;
      }

      /* ---- the two heuristics, both warnings ---------------------------------
       *
       * Neither can prove an answer right, so neither is a hard failure. What
       * they do is narrow 60 unproven questions down to the handful worth a
       * person's time — which is the only thing that makes hand-review tractable
       * at all.
       */
      const answerText = question.choices[question.answerIndex]!;
      const answerNumber = numericAnswer(answerText);

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
        const restated =
          new RegExp(`(^|[^0-9.])${token.replace(".", "\\.")}(\\.(?![0-9])|[^0-9.]|$)`).test(
            solutionText,
          ) || statedInWords(answerNumber, solutionText);
        if (!restated) {
          warnings.push(
            `${at}: the marked answer is ${token}, but the solution never states that number — check the working lands where the answer says`,
          );
        }

        // Numeric, and nothing evaluates it. These are exactly the questions that
        // COULD be machine-checked and are not, so they are the cheapest wins.
        if (!question.checkExpr) {
          numericButUnchecked++;
          unchecked.push(`${at}: "${question.stem.slice(0, 62)}${question.stem.length > 62 ? "…" : ""}" → ${answerText}`);
        }
      }

      for (const code of Object.keys(question.translations ?? {})) {
        if (LANGUAGES.has(code)) translationCounts[code] = (translationCounts[code] ?? 0) + 1;
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

    // The refurbishment's bar: a chapter missing a level is a ladder nobody can
    // climb to the top of. Hard failure, no exceptions — the last grandfathered
    // files left with the 2026 purge of the old bank. A GENERATED batch is partial
    // by design until the whole chapter has run (and levels 5–6 wait for the papers
    // corpus), so for it the missing rung is a warning the review queue reads.
    for (let l = 1; l <= MAX_LEVEL; l++) {
      if (!levelsPresent.has(l)) {
        if (generated) warnings.push(`${file}: generated batch has nothing at level ${l} yet`);
        else fail(where, `has nothing at level ${l} — every chapter climbs the whole L1–L${MAX_LEVEL} ladder`);
      }
    }
  }

  return {
    verifyTopic,
    report: () => ({ errors, warnings, total, checkedByMachine, reviewedByHuman, stamped, numericButUnchecked, unchecked, translationCounts, levelCounts, files, generatedFiles }),
  };
}

/** Every topic file: the authored ones, then the generated batches under generated/. */
export function readBankFiles(dir = DIR): { file: string; path: string; generated: boolean }[] {
  const out: { file: string; path: string; generated: boolean }[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) out.push({ file: f, path: join(dir, f), generated: false });
  const gen = join(dir, "generated");
  if (existsSync(gen)) {
    for (const f of readdirSync(gen).filter((f) => f.endsWith(".json")).sort()) out.push({ file: `generated/${f}`, path: join(gen, f), generated: true });
  }
  return out;
}

function main() {
  let files: { file: string; path: string; generated: boolean }[];
  try {
    files = readBankFiles();
  } catch {
    console.error(`No ${DIR} directory. Nothing to verify.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("content/quiz has no .json topic files.");
    process.exit(1);
  }

  const verifier = createVerifier();
  for (const { file, path, generated } of files) {
    let parsed: TopicFile;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      verifier.report().errors.push(`${file}: is not valid JSON — ${(error as Error).message}`);
      continue;
    }
    verifier.verifyTopic(file, parsed, { generated });
  }

  const r = verifier.report();
  console.log(`\nPractice bank — ${r.files} topic file${r.files === 1 ? "" : "s"}${r.generatedFiles ? ` and ${r.generatedFiles} generated batch${r.generatedFiles === 1 ? "" : "es"} waiting for review` : ""}\n`);
  console.log(`  questions            ${r.total}`);
  console.log(
    `  by level             ${r.levelCounts.map((n, i) => `L${i + 1}:${n}`).join("  ")}`,
  );
  console.log(`  arithmetic-checked   ${r.checkedByMachine}  (evaluated and matched)`);
  console.log(`  read by a person     ${r.reviewedByHuman}`);
  if (r.generatedFiles) console.log(`  stamped (generated)  ${r.stamped}  (one stamp from an app admin or the operator serves an item)`);
  console.log(
    `  NOT machine-checked  ${r.total - r.checkedByMachine}  ← correctness of these is asserted, not proven`,
  );

  // Reported as "n of total", never as a tick. A language that is 11 questions
  // into 105 is a language a child will fall out of on question 12, and a bare
  // "Hindi ✓" would hide exactly that.
  const languages = Object.keys(r.translationCounts).sort();
  if (languages.length) {
    console.log(
      `  translated           ${languages
        .map((code) => `${code}:${r.translationCounts[code]}/${r.total}`)
        .join("  ")}`,
    );
  } else {
    console.log(`  translated           none — every question reads in English only`);
  }

  if (r.numericButUnchecked) {
    // Deliberately NOT phrased as "could be machine-checked". A date, a digit
    // named as a digit, or a distance quoted in a unit all contain a number and
    // none of them is a computation. This is a list to glance down, not a list
    // of defects — saying otherwise would train people to ignore it.
    console.log(
      `\n${r.numericButUnchecked} question${r.numericButUnchecked === 1 ? " has a number" : "s have a number"} in the marked answer and no checkExpr (a date or a label is not a computation — glance, don't assume):`,
    );
    for (const line of r.unchecked) console.log(`  · ${line}`);
  }

  if (r.warnings.length) {
    console.log(`\n${r.warnings.length} warning${r.warnings.length === 1 ? "" : "s"}:`);
    for (const warning of r.warnings) console.log(`  ! ${warning}`);
  }

  if (r.errors.length) {
    console.log(`\n${r.errors.length} error${r.errors.length === 1 ? "" : "s"}:`);
    for (const error of r.errors) console.log(`  ✗ ${error}`);
    console.log("");
    process.exit(1);
  }

  console.log("\nStructure and arithmetic: all checks passed.");
  console.log(
    "This does NOT mean every answer is right. Non-arithmetic answers are unproven until a person reads them.\n",
  );
}

if (process.argv[1] && /verify-quiz\.ts$/.test(process.argv[1])) main();
