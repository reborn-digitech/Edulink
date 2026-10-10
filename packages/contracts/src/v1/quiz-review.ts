import { z } from "zod";
import { quizBoardSchema } from "./quiz-board"; // quiz-board (11 Oct 2026)

/**
 * The generated bank's review queue (docs/plans/assistant-and-quiz-bank.md, Phase 1 "Output and
 * review", as the owner amended it on 10 October 2026): the quiz bank generator's items land in the
 * database unserved, and the app admins and the operator — never teachers — read each one and accept
 * it (one stamp serves it), edit then accept it, or discard it with a coded reason; a Hindi or
 * Marathi row is served once a reviewer stamps that language as well, and until then the English item
 * is served alone. Every door is app-admin (the content team, and the operator, who passes that gate
 * too); none names a school.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/**
 * THE TEACHERS' QUESTION GIG, OFF (the owner, 10 October 2026). One place: the web's nav, the
 * teacher's /teacher/contributions pages (404), the /api/v1/gigs/questions and /gigs/payee doors (404,
 * catalogued with statusByRole TEACHER 404 while this is false) and the phone's menu entry and two
 * screens all read it. Nothing is deleted: QuestionContribution rows stay, the content team still reads
 * them at /appadmin/contributions, and the operator still records what is owed. The owner removes the
 * gig altogether once the review by the app admins has proved itself.
 */
export const QUESTION_GIG_FOR_TEACHERS: boolean = false;

/** Who may stamp: the content team or the operator. */
export const QUIZ_REVIEW_ROLES = ["APP_ADMIN", "OPERATOR"] as const;
export type QuizReviewRole = (typeof QUIZ_REVIEW_ROLES)[number];

/** What a stamp row records. The first ACCEPT or EDIT_ACCEPT serves the English item. */
export const QUIZ_REVIEW_ACTIONS = ["ACCEPT", "EDIT_ACCEPT", "DISCARD", "STAMP_TRANSLATION", "UNSTAMP_TRANSLATION"] as const;
export type QuizReviewAction = (typeof QUIZ_REVIEW_ACTIONS)[number];

/** Why an item is thrown away: a coded list, so the generator's reject counts can be read against it. */
export const QUIZ_DISCARD_REASONS = [
  "WRONG_KEY",
  "AMBIGUOUS",
  "WEAK_DISTRACTORS",
  "WRONG_LEVEL",
  "OFF_SYLLABUS",
  "FACTUAL_ERROR",
  "DUPLICATE",
  "FIGURE_PROBLEM",
  "POOR_WORDING",
] as const;
export type QuizDiscardReason = (typeof QUIZ_DISCARD_REASONS)[number];

export const quizReviewLanguageSchema = z.enum(["hi", "mr"]);

/** The queue's filters, shared by the list and the next item. `skip` is the ids skipped this sitting, comma-separated. */
export const quizReviewQuerySchema = z.object({
  // quiz-board (11 Oct 2026): the coded board (QUIZ_BOARDS), the same codes the practice list switches between.
  board: quizBoardSchema.optional(),
  grade: z.coerce.number().int().min(1).max(13).optional(), // 13: the college placement bank (integration, 11 Oct 2026)
  subject: z.string().trim().min(1).max(40).optional(),
  topic: id.optional(),
  level: z.coerce.number().int().min(1).max(6).optional(),
  skip: z.string().max(4000).optional(),
});
export type QuizReviewQuery = z.infer<typeof quizReviewQuerySchema>;

const reviewerCountSchema = z.object({ name: z.string(), role: z.enum(QUIZ_REVIEW_ROLES), accepted: count, discarded: count, languages: count });

/** GET /api/v1/appadmin/quiz-review — the queue by chapter and level, with the counts a reviewer works against. */
export const quizReviewListSchema = z.object({
  /** Every generated item still waiting, whatever the filter. */
  remaining: count,
  /** Waiting under the filter given. */
  filtered: count,
  /** Stamped items still waiting for a Hindi or a Marathi stamp. */
  languagesWaiting: z.object({ hi: count, mr: count }),
  boards: z.array(z.string()),
  subjects: z.array(z.string()),
  groups: z.array(
    z.object({
      board: z.string().nullable(),
      topicId: id,
      subject: z.string(),
      grade: z.number().int(),
      chapter: z.string(),
      name: z.string(),
      /** Waiting items at levels 1 to 6. */
      levels: z.array(count).length(6),
      total: count,
      /** Grades 6 to 10 mathematics and science, the plan's first band (section 8 item 9). */
      first: z.boolean(),
    }),
  ),
  mine: z.object({ today: count, total: count }),
  reviewers: z.array(reviewerCountSchema),
});
export type QuizReviewList = z.infer<typeof quizReviewListSchema>;

const translationSchema = z.object({
  stem: z.string(),
  choices: z.array(z.string()),
  solution: z.string(),
  imageAlt: z.string().nullable(),
  critique: z.string().nullable(),
  flag: z.string().nullable(),
  stampedAt: iso.nullable(),
  stampedBy: z.string().nullable(),
  /** The English was edited after this translation was drafted: read it against the new English. */
  stale: z.boolean(),
});

export const quizReviewStampSchema = z.object({
  action: z.enum(QUIZ_REVIEW_ACTIONS),
  language: quizReviewLanguageSchema.nullable(),
  reason: z.enum(QUIZ_DISCARD_REASONS).nullable(),
  reviewer: z.string(),
  role: z.enum(QUIZ_REVIEW_ROLES),
  at: iso,
});

export const quizReviewItemSchema = z.object({
  id,
  board: z.string().nullable(),
  topic: z.object({ id, name: z.string(), chapter: z.string(), subject: z.string(), grade: z.number().int() }),
  difficulty: z.number().int().min(1).max(6),
  stem: z.string(),
  choices: z.array(z.string()),
  answerIndex: z.number().int(),
  solution: z.string(),
  checkExpr: z.string().nullable(),
  /** One line per option, null at the key. */
  distractorReasons: z.array(z.string().nullable()),
  /** The blind solver's answers (option indexes), kept after an edit. */
  solverAnswers: z.array(z.number().int()),
  levelFlag: z.string().nullable(),
  critique: z.string().nullable(),
  edition: z.string().nullable(),
  source: z.string(),
  model: z.string().nullable(),
  generatedAt: z.string().nullable(),
  /** The figure builder's spec, passed through as the generator wrote it. */
  figure: z.object({ kind: z.string(), spec: z.record(z.unknown()) }).nullable(),
  needsFigure: z.boolean(),
  imageKey: z.string().nullable(),
  imageAlt: z.string().nullable(),
  // quiz-board (11 Oct 2026): why quiz:queue could not draw the item's figure, when it could not ("figure failed" on the desk).
  figureError: z.string().nullable().optional(),
  editedAfterSolvingAt: iso.nullable(),
  reviewedAt: iso.nullable(),
  discardedAt: iso.nullable(),
  discardReason: z.enum(QUIZ_DISCARD_REASONS).nullable(),
  translations: z.object({ hi: translationSchema.nullable(), mr: translationSchema.nullable() }),
  stamps: z.array(quizReviewStampSchema),
});
export type QuizReviewItem = z.infer<typeof quizReviewItemSchema>;

/** GET /api/v1/appadmin/quiz-review/next and /{questionId}: one item, or none left under the filter. */
export const quizReviewNextSchema = z.object({ item: quizReviewItemSchema.nullable(), remaining: count });
export type QuizReviewNext = z.infer<typeof quizReviewNextSchema>;

/** POST …/{questionId}/edit — the English as the reviewer corrected it; accepted in the same press. */
export const quizReviewEditBodySchema = z.object({
  stem: z.string().trim().min(8).max(1200),
  choices: z.array(z.string().trim().min(1).max(400)).min(2).max(6),
  answerIndex: z.number().int().min(0).max(5),
  solution: z.string().trim().min(8).max(3000),
  checkExpr: z.string().trim().max(120).nullable().optional(),
  difficulty: z.number().int().min(1).max(6),
});
export type QuizReviewEditBody = z.infer<typeof quizReviewEditBodySchema>;

/** POST …/{questionId}/discard */
export const quizReviewDiscardBodySchema = z.object({ reason: z.enum(QUIZ_DISCARD_REASONS) });
export type QuizReviewDiscardBody = z.infer<typeof quizReviewDiscardBodySchema>;

/** POST …/{questionId}/stamp-translation — `stamped` false takes the language stamp off. */
export const quizReviewTranslationBodySchema = z.object({ language: quizReviewLanguageSchema, stamped: z.boolean().optional() });
export type QuizReviewTranslationBody = z.infer<typeof quizReviewTranslationBodySchema>;

/** What every write answers: where the item now stands. */
export const quizReviewStampedSchema = z.object({
  ok: z.literal(true),
  reviewedAt: iso.nullable(),
  discardedAt: iso.nullable(),
  hiStampedAt: iso.nullable(),
  mrStampedAt: iso.nullable(),
});
export type QuizReviewStamped = z.infer<typeof quizReviewStampedSchema>;
