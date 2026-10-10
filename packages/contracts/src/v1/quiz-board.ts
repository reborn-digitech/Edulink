import { z } from "zod";
import type { SCHOOL_BOARDS } from "./filings";

/**
 * THE PRACTICE BANK'S BOARD (the owner, 11 October 2026). Every chapter of the practice bank is
 * written against one board's books: the authored bank's chapters against the NCERT syllabus, the
 * generator's batches against the book they were drawn from (content/quiz/generated/*.json carries
 * `board`, the truth). QuizTopic.board holds the code; a topic with none (the placement banks, which
 * follow no school book) lists under either board.
 *
 * A pupil sees their school's board first, with a switch to the other; a guardian the same for the
 * child; the phone likewise; the review queue filters by it.
 */
export const QUIZ_BOARDS = ["NCERT", "BALBHARATI"] as const;
export type QuizBoard = (typeof QUIZ_BOARDS)[number];
export const quizBoardSchema = z.enum(QUIZ_BOARDS);

/** The switch's third position: both boards' chapters together. */
export const QUIZ_BOARD_BOTH = "ALL" as const;
export const quizBoardChoiceSchema = z.enum([...QUIZ_BOARDS, QUIZ_BOARD_BOTH]);
export type QuizBoardChoice = z.infer<typeof quizBoardChoiceSchema>;

/**
 * The practice board a school's own board reads from (School.board, the filings' code): a CBSE school
 * teaches from the NCERT books, a Maharashtra State Board school from Balbharati's. Any other board
 * (CISCE, NIOS, IB, another state's, none recorded) has no board of the two, and its pupils see both.
 */
const SCHOOL_TO_QUIZ: Partial<Record<(typeof SCHOOL_BOARDS)[number], QuizBoard>> = { CBSE: "NCERT", MSBSHSE: "BALBHARATI" };

export function quizBoardForSchool(schoolBoard: string | null | undefined): QuizBoard | null {
  return (schoolBoard && SCHOOL_TO_QUIZ[schoolBoard as (typeof SCHOOL_BOARDS)[number]]) || null;
}

/** A value read from a file or a query, when it is one of the codes exactly; null otherwise. */
export function asQuizBoard(value: unknown): QuizBoard | null {
  return typeof value === "string" && (QUIZ_BOARDS as readonly string[]).includes(value) ? (value as QuizBoard) : null;
}

/** The boards in the order a person sees them: the school's own first, then the other. */
export function quizBoardOrder(first: QuizBoard | null): QuizBoard[] {
  return first ? [first, ...QUIZ_BOARDS.filter((b) => b !== first)] : [...QUIZ_BOARDS];
}

/**
 * The switch's position: what was chosen when it is one of the three, else the school's board, else
 * both. A topic matches when its board is the chosen one, or it has none, or both are chosen.
 */
export function quizBoardChoice(asked: unknown, schoolBoard: QuizBoard | null): QuizBoardChoice {
  const parsed = quizBoardChoiceSchema.safeParse(asked);
  if (parsed.success) return parsed.data;
  return schoolBoard ?? QUIZ_BOARD_BOTH;
}

export function topicOnBoard(topicBoard: string | null | undefined, choice: QuizBoardChoice): boolean {
  return choice === QUIZ_BOARD_BOTH || !topicBoard || topicBoard === choice;
}

// ---- integration (11 Oct 2026): the placement banks and the fixtures' chapters ----
/**
 * A practice chapter at class 13 or above is the college's placement bank (aptitude, reasoning, coding),
 * not a school class: a list, a chip and the review queue say "College", never "Class 13".
 */
export const COLLEGE_CLASS_LEVEL = 13;
export function isCollegeClassLevel(classLevel: number): boolean {
  return classLevel >= COLLEGE_CLASS_LEVEL;
}
/**
 * A chapter whose slug starts "zz-" is a test fixture's (the ZZ placement banks, a suite's own topic). It
 * lists only for a reader at a fixture school (School.isTestFixture) or a reviewer who is a fixture
 * (User.isTestFixture); a real school never sees "ZZ …" chapters.
 */
export const FIXTURE_TOPIC_SLUG_PREFIX = "zz-";
export function isFixtureTopicSlug(slug: string): boolean {
  return slug.startsWith(FIXTURE_TOPIC_SLUG_PREFIX);
}
// ---- end integration ----
