import { z } from "zod";
import { quizBoardSchema } from "./quiz-board";
import { QUIZ_BANK_STATES, QUIZ_TAKEDOWN_REASONS } from "./quiz-review";

/**
 * THE BANK DESK BY CLASS AND SUBJECT (the owner's ask of 20 October 2026): the whole practice bank, authored and
 * generated, read three ways on /root/quiz-review and /appadmin/quiz-review — a matrix of classes by subjects with the
 * served questions and the chapters at the target, the chapters grouped by class and subject in their book's order,
 * and one chapter's served questions in English, Hindi or Marathi. Every door is app-admin (the content team, and the
 * operator, who passes that gate too); none names a school, and none is a person's data.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/** The questions a chapter should reach when no generation run names a target (the run's own `target` otherwise). */
export const QUIZ_BANK_DEFAULT_TARGET = 100;

/** Who made a chapter's served questions: the generator, the content team's authored bank, or both. */
export const QUIZ_BANK_MAKERS = ["GENERATED", "AUTHORED", "MIXED"] as const;
export type QuizBankMaker = (typeof QUIZ_BANK_MAKERS)[number];

/** The languages a chapter's questions are read in on the desk. */
export const QUIZ_BANK_LANGUAGES = ["en", "hi", "mr"] as const;
export type QuizBankLanguage = (typeof QUIZ_BANK_LANGUAGES)[number];

/**
 * Why an item's words in the language asked are not simply its translation: none is stored (the English is shown),
 * the item was taken down because the Hindi or the Marathi is wrong, or the translation was written before the
 * English was edited.
 */
export const QUIZ_BANK_LANGUAGE_NOTES = ["MISSING", "BAD_TRANSLATION", "STALE"] as const;
export type QuizBankLanguageNote = (typeof QUIZ_BANK_LANGUAGE_NOTES)[number];

/** GET /api/v1/appadmin/quiz-review/matrix?board= — absent board is both boards. */
export const quizBankMatrixQuerySchema = z.object({ board: quizBoardSchema.optional() });
export type QuizBankMatrixQuery = z.infer<typeof quizBankMatrixQuerySchema>;

const cellSchema = z.object({
  subject: z.string(),
  /** Questions served to pupils now (src/lib/quiz-served.ts). */
  served: count,
  /** Chapters in the cell: a book's chapter number counts once, as the generation run counts it. */
  chapters: count,
  /** Of those, the chapters whose served questions have reached the target. */
  atTarget: count,
});
export type QuizBankCell = z.infer<typeof cellSchema>;

export const quizBankMatrixSchema = z.object({
  board: quizBoardSchema.nullable(),
  target: z.number().int().positive(),
  /** True when the target is the active generation run's; false when it is the default. */
  targetFromRun: z.boolean(),
  /** The school columns, in the order of QUIZ_GEN_SUBJECTS. */
  subjects: z.array(z.string()),
  /** Classes 3 to 12, one cell per column, an empty cell with zero chapters. */
  rows: z.array(z.object({ grade: z.number().int(), cells: z.array(cellSchema), served: count, chapters: count, atTarget: count })),
  /** The college bank by stream (null: the college-wide banks), its own columns; empty when the bank has no college chapter. */
  college: z.object({
    subjects: z.array(z.string()),
    rows: z.array(z.object({ stream: z.string().nullable(), cells: z.array(cellSchema), served: count, chapters: count, atTarget: count })),
  }),
});
export type QuizBankMatrix = z.infer<typeof quizBankMatrixSchema>;

/** GET /api/v1/appadmin/quiz-review/chapters?board=&grade=&subject= */
export const quizBankChaptersQuerySchema = z.object({
  board: quizBoardSchema.optional(),
  grade: z.coerce.number().int().min(1).max(13).optional(),
  subject: z.string().trim().min(1).max(40).optional(),
});
export type QuizBankChaptersQuery = z.infer<typeof quizBankChaptersQuerySchema>;

export const quizBankChapterRowSchema = z.object({
  topicId: id,
  slug: z.string(),
  board: z.string().nullable(),
  grade: z.number().int(),
  subject: z.string(),
  /** The chapter line and the name, the case rule applied (src/lib/chapter-title-case.ts). */
  chapter: z.string(),
  name: z.string(),
  /** The book's chapter number, when the chapter line carries one. */
  number: z.number().int().nullable(),
  /** owner-batch-item8: the book the chapter line names beside its number, where two books of the class share chapter numbers; null otherwise. */
  book: z.string().nullable(),
  /** Served questions at levels 1 to 6, and in all. */
  levels: z.array(count).length(6),
  total: count,
  /** Not served: taken down, and held until a figure is drawn. */
  down: count,
  held: count,
  /** Null for a chapter with no question yet. */
  maker: z.enum(QUIZ_BANK_MAKERS).nullable(),
});
export type QuizBankChapterRow = z.infer<typeof quizBankChapterRowSchema>;

export const quizBankChaptersSchema = z.object({
  target: z.number().int().positive(),
  groups: z.array(
    z.object({
      grade: z.number().int(),
      subject: z.string(),
      board: z.string().nullable(),
      served: count,
      chapters: z.array(quizBankChapterRowSchema),
    }),
  ),
});
export type QuizBankChapters = z.infer<typeof quizBankChaptersSchema>;

/** GET /api/v1/appadmin/quiz-review/chapters/{slug}?lang=&state=&page= — fifty items a page; absent state is the served ones. */
export const quizBankChapterQuerySchema = z.object({
  lang: z.enum(QUIZ_BANK_LANGUAGES).optional(),
  state: z.enum(QUIZ_BANK_STATES).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});
export type QuizBankChapterQuery = z.infer<typeof quizBankChapterQuerySchema>;

export const QUIZ_BANK_PAGE_SIZE = 50;

export const quizBankChapterItemSchema = z.object({
  id,
  generated: z.boolean(),
  difficulty: z.number().int().min(1).max(6),
  /** The words in `language`: the translation's when one is stored, else the English (with the note MISSING). */
  language: z.enum(QUIZ_BANK_LANGUAGES),
  stem: z.string(),
  choices: z.array(z.string()),
  answerIndex: z.number().int(),
  solution: z.string(),
  notes: z.array(z.enum(QUIZ_BANK_LANGUAGE_NOTES)),
  /** The figure in this language (its own drawing when one is stored, else the English one). */
  imageKey: z.string().nullable(),
  imageAlt: z.string().nullable(),
  needsFigure: z.boolean(),
  /** Generated: when the generator drafted it (its material's time, else when it was loaded); authored: when it was added. */
  madeAt: iso,
  source: z.string(),
  state: z.enum(QUIZ_BANK_STATES),
  takenDownReason: z.enum(QUIZ_TAKEDOWN_REASONS).nullable(),
});
export type QuizBankChapterItem = z.infer<typeof quizBankChapterItemSchema>;

export const quizBankChapterSchema = z.object({
  /** qb-A (QB-17): `book` is the book the chapter's line names ("Chapter 5 (Contemporary World Politics) — …"), null when it names none. */
  topic: z.object({ id, slug: z.string(), name: z.string(), chapter: z.string(), subject: z.string(), grade: z.number().int(), board: z.string().nullable(), book: z.string().nullable() }),
  language: z.enum(QUIZ_BANK_LANGUAGES),
  state: z.enum(QUIZ_BANK_STATES),
  counts: z.object({ served: count, down: count, held: count }),
  page: z.number().int().min(1),
  pages: z.number().int().min(1),
  /** Items in this standing, across the pages. */
  total: count,
  items: z.array(quizBankChapterItemSchema),
});
export type QuizBankChapter = z.infer<typeof quizBankChapterSchema>;
