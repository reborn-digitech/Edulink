/**
 * What a generation run works through, in order (quiz-publish-jobs, 11 October 2026): the request from
 * the bank desk read against the textbooks the corpus holds. Pure; tests/quiz-jobs.test.ts holds it.
 *
 * "Everything not yet generated" is the plan's order (docs/plans/assistant-and-quiz-bank.md §8 item 9):
 * classes 6 to 10 mathematics and science first, both boards, then the rest; within each band by class,
 * then subject, then board (NCERT, then Balbharati). A chapter is "generated" when its batch file
 * exists under content/quiz/generated/ (scripts/quiz-gen/cli.ts fileNameFor), so a run stopped half way
 * picks up at the chapter it was on.
 */
import { QUIZ_GEN_SUBJECTS, type QuizBoard, type QuizGenRequest } from "@edulink/contracts";
import { subjectCodeOf } from "./select";

/** One board's book for one class and subject, as the corpus names it. */
export type Combo = {
  /** The generator's spelling ("NCERT", "Balbharati"), which selectChapter and fileNameFor read. */
  board: "NCERT" | "Balbharati";
  boardCode: QuizBoard;
  grade: number;
  /** The corpus's subject name ("Mathematics"), which selectChapter matches. */
  subject: string;
  /** The bank's code ("MATHS"). */
  subjectCode: string;
};

export type InventoryRow = { source: string; grade: string; subject: string };

const BOARD_OF: Record<string, { board: Combo["board"]; boardCode: QuizBoard }> = {
  ncert: { board: "NCERT", boardCode: "NCERT" },
  balbharati: { board: "Balbharati", boardCode: "BALBHARATI" },
};

export function inFirstBand(c: Pick<Combo, "grade" | "subjectCode">): boolean {
  return c.grade >= 6 && c.grade <= 10 && (c.subjectCode === "MATHS" || c.subjectCode === "SCIENCE");
}

const subjectRank = (code: string) => {
  const i = (QUIZ_GEN_SUBJECTS as readonly string[]).indexOf(code);
  return i < 0 ? QUIZ_GEN_SUBJECTS.length : i;
};

/** The textbooks the request covers, in the order the run takes them. Subjects the bank has no code for are left out. */
export function planCombos(request: QuizGenRequest, inventory: InventoryRow[]): Combo[] {
  const seen = new Set<string>();
  const combos: Combo[] = [];
  for (const row of inventory) {
    const board = BOARD_OF[row.source];
    const grade = Number(row.grade);
    if (!board || !Number.isInteger(grade) || grade < 1 || grade > 12) continue;
    // quiz-topup (19 Oct 2026): the classes the run takes, when the request names them.
    if (request.scope === "EVERYTHING" && ((request.gradeFrom && grade < request.gradeFrom) || (request.gradeTo && grade > request.gradeTo))) continue;
    let subjectCode: string;
    try {
      subjectCode = subjectCodeOf(row.subject);
    } catch {
      continue;
    }
    if (!(QUIZ_GEN_SUBJECTS as readonly string[]).includes(subjectCode)) continue;
    const combo: Combo = { ...board, grade, subject: row.subject, subjectCode };
    if (request.scope === "CHAPTERS") {
      if (combo.boardCode !== request.board || combo.grade !== request.grade || combo.subjectCode !== request.subject) continue;
    }
    const key = `${combo.boardCode}|${combo.grade}|${combo.subject.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    combos.push(combo);
  }
  return combos.sort(
    (a, b) =>
      Number(inFirstBand(b)) - Number(inFirstBand(a)) ||
      a.grade - b.grade ||
      subjectRank(a.subjectCode) - subjectRank(b.subjectCode) ||
      a.boardCode.localeCompare(b.boardCode) ||
      a.subject.localeCompare(b.subject),
  );
}

/** The chapter numbers of a book the request asks for: every one, or the range given. */
export function chaptersWanted(numbers: number[], request: Pick<QuizGenRequest, "chapterFrom" | "chapterTo">): number[] {
  const from = request.chapterFrom ?? 1;
  const to = request.chapterTo ?? Number.MAX_SAFE_INTEGER;
  return [...new Set(numbers)].filter((n) => n >= from && n <= to).sort((a, b) => a - b);
}
