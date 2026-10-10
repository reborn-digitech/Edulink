import { isCollegeClassLevel, quizBoardOrder, QUIZ_BOARD_BOTH, type QuizBoard, type QuizBoardChoice } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * THE PRACTICE BANK'S BOARD on the web (quiz-board, 11 October 2026). The codes and the rules are the
 * contract's (packages/contracts v1/quiz-board.ts); this file holds what the pages need beside them:
 * the labels and the switch's options in the order a person sees them. Client-safe: the school's board
 * is read on the server by schoolQuizBoard in src/lib/quiz.ts.
 */

/** The switch's labels and a topic card's board line, in the reader's language. */
export const QUIZ_BOARD_KEY: Record<QuizBoardChoice, TranslationKey> = {
  NCERT: "quizBoard.NCERT",
  BALBHARATI: "quizBoard.BALBHARATI",
  ALL: "quizBoard.ALL",
};

/** A stored board's label, or null for a topic with none (the placement banks) or a value that is not a code. */
export function quizBoardKey(board: string | null | undefined): TranslationKey | null {
  return board === "NCERT" || board === "BALBHARATI" ? QUIZ_BOARD_KEY[board] : null;
}

/**
 * The switch's three positions in order: the school's own board first, then the other, then both;
 * with no board of the two, both first and then the two boards.
 */
export function quizBoardOptions(schoolBoard: QuizBoard | null): QuizBoardChoice[] {
  const boards = quizBoardOrder(schoolBoard);
  return schoolBoard ? [...boards, QUIZ_BOARD_BOTH] : [QUIZ_BOARD_BOTH, ...boards];
}

/** A chapter's class as a reader sees it: "Class 8", or "College" for the placement bank at 13 and above (integration, 11 Oct 2026). */
export function classLevelLabel(t: Translate, classLevel: number): string {
  return isCollegeClassLevel(classLevel) ? t("practice.collegeLevel") : t("practice.classN", { n: classLevel });
}
