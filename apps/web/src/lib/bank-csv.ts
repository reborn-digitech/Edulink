import { parseCsv, toCsv } from "./csv";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The question bank as a sheet, read and written.
 *
 * ONE SHAPE BOTH WAYS. What `GET /api/v1/appadmin/bank/export` writes is what
 * `POST /api/v1/appadmin/bank/import` reads, column for column, so the content
 * team's round trip is: export a subject, fix the solutions in a spreadsheet,
 * import the file. The columns are the fields of a question in
 * content/quiz/*.json — the files scripts/import-quiz.ts loads — flattened
 * one question to a row with its chapter named by slug, and the Hindi and
 * Marathi beside the English. The rules are the verifier's (scripts/verify-
 * quiz.ts): a level between 1 and 6, two or more distinct non-blank options,
 * an answer that points at one, a solution long enough to be a worked one, and
 * a translation whose option count matches the English — the one shape rule
 * that keeps `answerIndex` honest in every language (see quiz.ts pickChoices).
 *
 * The script keeps reading JSON: a chapter file carries the topic's own fields
 * (name, chapter, summary, position) and this sheet names an existing chapter
 * only. Nothing here imports "server-only", so a page can preview a paste in
 * the browser with the same parser the server commits with.
 */

/** Options in one cell, separated by a pipe: "3/4 | 2/6 | 1/8 | 1". */
export const CHOICE_SEPARATOR = " | ";

export const BANK_COLUMNS = [
  "topic",
  "level",
  "stem",
  "choices",
  "answer",
  "solution",
  "check",
  "source",
  "licence",
  "hi_stem",
  "hi_choices",
  "hi_solution",
  "hi_reviewed",
  "mr_stem",
  "mr_choices",
  "mr_solution",
  "mr_reviewed",
] as const;

/** Columns the export adds for the reader and the import ignores. */
export const BANK_INFO_COLUMNS = ["id", "subject", "class", "chapter"] as const;

export const BANK_EXPORT_HEADERS: string[] = [...BANK_INFO_COLUMNS, ...BANK_COLUMNS];

export type BankTranslationRow = { stem: string; choices: string[] | null; solution: string; reviewed: boolean };

export type BankRow = {
  line: number;
  topicSlug: string;
  difficulty: number;
  stem: string;
  choices: string[];
  /** 0-based, as the database stores it; the sheet shows it 1-based. */
  answerIndex: number;
  solution: string;
  checkExpr: string | null;
  source: string | null;
  licence: string | null;
  translations: { hi: BankTranslationRow | null; mr: BankTranslationRow | null };
};

export type BankProblem = { line: number; value: string; reasonKey: TranslationKey; reasonVars?: Record<string, string | number> };

export type BankCsvResult = {
  valid: BankRow[];
  problems: BankProblem[];
  /** Which of the required columns the file had; a mis-named header is shown back rather than guessed. */
  recognised: Record<"topic" | "level" | "stem" | "choices" | "answer" | "solution", boolean>;
};

const HEADERS = {
  topic: ["topic", "slug", "chapter slug", "topic slug"],
  level: ["level", "difficulty"],
  stem: ["stem", "question"],
  choices: ["choices", "options"],
  answer: ["answer", "answerindex", "answer index", "correct"],
  solution: ["solution", "worked solution"],
  check: ["check", "checkexpr", "check expr"],
  source: ["source"],
  licence: ["licence", "license"],
  hi_stem: ["hi_stem", "hi stem", "hindi stem"],
  hi_choices: ["hi_choices", "hi choices", "hindi choices"],
  hi_solution: ["hi_solution", "hi solution", "hindi solution"],
  hi_reviewed: ["hi_reviewed", "hi reviewed", "hindi reviewed"],
  mr_stem: ["mr_stem", "mr stem", "marathi stem"],
  mr_choices: ["mr_choices", "mr choices", "marathi choices"],
  mr_solution: ["mr_solution", "mr solution", "marathi solution"],
  mr_reviewed: ["mr_reviewed", "mr reviewed", "marathi reviewed"],
} as const;

export const MIN_SOLUTION_LENGTH = 20;

export function splitChoices(cell: string): string[] {
  return cell
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

export function joinChoices(choices: string[]): string {
  return choices.join(CHOICE_SEPARATOR);
}

/** "yes", "true", "1", "y", a date — anything but blank and a no — reads as reviewed. */
export function readFlag(cell: string): boolean {
  const v = cell.trim().toLowerCase();
  if (!v) return false;
  return !["no", "n", "false", "0", "-"].includes(v);
}

/**
 * Maps a pasted or uploaded sheet onto bank rows. Bad rows are collected with
 * a reason each and never skipped silently; a row that fails is left out and
 * the rest still import, which is what a content editor fixing two hundred
 * questions needs.
 */
export function parseBankCsv(input: string): BankCsvResult {
  const { headers, rows, lineNumbers } = parseCsv(input);
  const key = (aliases: readonly string[]) => headers.find((h) => aliases.includes(h));
  const col = Object.fromEntries(Object.entries(HEADERS).map(([name, aliases]) => [name, key(aliases)])) as Record<keyof typeof HEADERS, string | undefined>;

  const recognised = {
    topic: !!col.topic,
    level: !!col.level,
    stem: !!col.stem,
    choices: !!col.choices,
    answer: !!col.answer,
    solution: !!col.solution,
  };
  const valid: BankRow[] = [];
  const problems: BankProblem[] = [];
  const missing = (Object.keys(recognised) as (keyof typeof recognised)[]).filter((k) => !recognised[k]);
  if (missing.length > 0) {
    if (rows.length > 0 || headers.length > 0) problems.push({ line: 1, value: missing.join(", "), reasonKey: "bankImport.missingColumns" });
    return { valid, problems, recognised };
  }

  const seen = new Map<string, number>();

  rows.forEach((row, index) => {
    const line = lineNumbers[index] ?? index + 2;
    const cell = (k: string | undefined) => (k ? (row[k] ?? "").trim() : "");

    const topicSlug = cell(col.topic).toLowerCase();
    if (!topicSlug) {
      problems.push({ line, value: cell(col.stem).slice(0, 60), reasonKey: "bankImport.noTopic" });
      return;
    }
    const stem = cell(col.stem);
    if (!stem) {
      problems.push({ line, value: topicSlug, reasonKey: "bankImport.noStem" });
      return;
    }
    const difficulty = Number(cell(col.level));
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 6) {
      problems.push({ line, value: cell(col.level) || "—", reasonKey: "bankImport.badLevel" });
      return;
    }
    const choices = splitChoices(cell(col.choices));
    if (choices.length < 2) {
      problems.push({ line, value: stem.slice(0, 60), reasonKey: "bankImport.needTwoChoices" });
      return;
    }
    if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) {
      problems.push({ line, value: stem.slice(0, 60), reasonKey: "bankImport.sameChoices" });
      return;
    }
    const answerRaw = cell(col.answer);
    const answer = Number(answerRaw);
    if (!Number.isInteger(answer) || answer < 1 || answer > choices.length) {
      problems.push({ line, value: answerRaw || "—", reasonKey: "bankImport.badAnswer", reasonVars: { count: choices.length } });
      return;
    }
    const solution = cell(col.solution);
    if (solution.length < MIN_SOLUTION_LENGTH) {
      problems.push({ line, value: stem.slice(0, 60), reasonKey: "bankImport.solutionShort" });
      return;
    }

    const dupKey = `${topicSlug}|${stem.toLowerCase()}`;
    const first = seen.get(dupKey);
    if (first !== undefined) {
      problems.push({ line, value: stem.slice(0, 60), reasonKey: "invites.duplicateOfLine", reasonVars: { line: first } });
      return;
    }
    seen.set(dupKey, line);

    const translation = (lang: "hi" | "mr"): BankTranslationRow | null | "bad" => {
      const tStem = cell(col[`${lang}_stem`]);
      const tChoicesRaw = cell(col[`${lang}_choices`]);
      const tSolution = cell(col[`${lang}_solution`]);
      if (!tStem && !tChoicesRaw && !tSolution) return null;
      const tChoices = tChoicesRaw ? splitChoices(tChoicesRaw) : null;
      if (tChoices && tChoices.length !== choices.length) return "bad";
      return { stem: tStem, choices: tChoices, solution: tSolution, reviewed: readFlag(cell(col[`${lang}_reviewed`])) };
    };
    const hi = translation("hi");
    const mr = translation("mr");
    if (hi === "bad" || mr === "bad") {
      problems.push({ line, value: stem.slice(0, 60), reasonKey: "bankImport.translationShape", reasonVars: { count: choices.length } });
      return;
    }

    valid.push({
      line,
      topicSlug,
      difficulty,
      stem,
      choices,
      answerIndex: answer - 1,
      solution,
      checkExpr: cell(col.check) || null,
      source: cell(col.source) || null,
      licence: cell(col.licence) || null,
      translations: { hi, mr },
    });
  });

  return { valid, problems, recognised };
}

export type BankExportRow = {
  id: string;
  subject: string;
  classLevel: number;
  chapter: string;
  topicSlug: string;
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: string | null;
  source: string;
  licence: string;
  translations: { hi: BankTranslationRow | null; mr: BankTranslationRow | null };
};

/** The sheet, one question a row, in the columns the importer reads. */
export function bankToCsv(rows: BankExportRow[]): string {
  const tr = (t: BankTranslationRow | null) => ({
    stem: t?.stem ?? "",
    choices: t?.choices ? joinChoices(t.choices) : "",
    solution: t?.solution ?? "",
    reviewed: t ? (t.reviewed ? "yes" : "no") : "",
  });
  return toCsv(
    rows.map((r) => {
      const hi = tr(r.translations.hi);
      const mr = tr(r.translations.mr);
      return {
        id: r.id,
        subject: r.subject,
        class: r.classLevel,
        chapter: r.chapter,
        topic: r.topicSlug,
        level: r.difficulty,
        stem: r.stem,
        choices: joinChoices(r.choices),
        answer: r.answerIndex + 1,
        solution: r.solution,
        check: r.checkExpr ?? "",
        source: r.source,
        licence: r.licence,
        hi_stem: hi.stem,
        hi_choices: hi.choices,
        hi_solution: hi.solution,
        hi_reviewed: hi.reviewed,
        mr_stem: mr.stem,
        mr_choices: mr.choices,
        mr_solution: mr.solution,
        mr_reviewed: mr.reviewed,
      };
    }),
    BANK_EXPORT_HEADERS,
  );
}

/** A stem as the duplicates check compares it: lower-case, letters and digits only. The SQL in bank-tools.ts spells the same rule. */
export function normaliseStem(stem: string): string {
  return stem.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}
