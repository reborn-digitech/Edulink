import { z } from "zod";
import { quizBoardSchema } from "./quiz-board"; // quiz-board (11 Oct 2026)

/**
 * THE GENERATED BANK'S DESK (docs/plans/assistant-and-quiz-bank.md, Phase 1 "Output and review", as
 * the owner decided on 11 October 2026; it was a review queue from 10 October): the generator's items
 * are PUBLISHED WITHOUT REVIEW — an item that passed the pipeline's own checks is served, with its Hindi
 * and Marathi, the moment it is loaded — and the app admins and the operator, never teachers, walk the
 * bank afterwards: Edit (audited, all three languages), Take down (stops serving at once, with a coded
 * reason; reversible with Put back), Skip. Every door is app-admin (the content team, and the operator,
 * who passes that gate too); none names a school.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/**
 * THE TEACHERS' QUESTION GIG (the owner, 10 October 2026), and since 15 October 2026 NOT THE SWITCH ANY
 * MORE: the gig is the QUESTION_GIG platform feature (v1/platform-features.ts), switched by the operator
 * at /root/features and read at run time by the web's nav, the /teacher/contributions pages, the
 * /api/v1/gigs/questions doors (the catalog's `feature`), the payee door and the phone's menu and
 * screens (/api/v1/me's `features`). This build-time constant is kept, false, for one reader that this
 * change leaves alone: the help index's build (scripts/help-index.ts), which leaves the gig's doors out of
 * the help, and the suites that hold that. Nothing else may read it.
 */
export const QUESTION_GIG_FOR_TEACHERS: boolean = false;

/** Who acts on the desk: the content team or the operator. */
export const QUIZ_REVIEW_ROLES = ["APP_ADMIN", "OPERATOR"] as const;
export type QuizReviewRole = (typeof QUIZ_REVIEW_ROLES)[number];

/**
 * What a QuizReviewStamp row records. The desk writes EDIT, TAKE_DOWN and PUT_BACK; the rest are the
 * review queue's (10–11 October 2026), kept as the history of the items it stamped, and the native-review
 * page's language stamps (translation-review.ts), which still write STAMP_TRANSLATION rows.
 */
export const QUIZ_REVIEW_ACTIONS = ["EDIT", "TAKE_DOWN", "PUT_BACK", "ACCEPT", "EDIT_ACCEPT", "DISCARD", "STAMP_TRANSLATION", "UNSTAMP_TRANSLATION"] as const;
export type QuizReviewAction = (typeof QUIZ_REVIEW_ACTIONS)[number];

/** Why an item is taken down: a coded list, so the take-downs can be read against the generator's checks. */
export const QUIZ_TAKEDOWN_REASONS = [
  "WRONG_KEY",
  "AMBIGUOUS",
  "WEAK_DISTRACTORS",
  "WRONG_LEVEL",
  "OFF_SYLLABUS",
  "FACTUAL_ERROR",
  "DUPLICATE",
  "FIGURE_PROBLEM",
  "POOR_WORDING",
  "BAD_TRANSLATION",
] as const;
export type QuizTakeDownReason = (typeof QUIZ_TAKEDOWN_REASONS)[number];

export const quizReviewLanguageSchema = z.enum(["hi", "mr"]);

/** Where an item stands: served, taken down, or held until its figure is drawn. */
export const QUIZ_BANK_STATES = ["SERVED", "DOWN", "HELD"] as const;
export type QuizBankState = (typeof QUIZ_BANK_STATES)[number];

/** The desk's filters, shared by the list and the next item. `skip` is the ids skipped this sitting, comma-separated. */
export const quizReviewQuerySchema = z.object({
  // quiz-board (11 Oct 2026): the coded board (QUIZ_BOARDS), the same codes the practice list switches between.
  board: quizBoardSchema.optional(),
  grade: z.coerce.number().int().min(1).max(13).optional(), // 13: the college placement bank (integration, 11 Oct 2026)
  subject: z.string().trim().min(1).max(40).optional(),
  topic: id.optional(),
  level: z.coerce.number().int().min(1).max(6).optional(),
  // quiz-publish-jobs (11 Oct 2026): served, taken down or held for its figure; absent is every generated item.
  state: z.enum(QUIZ_BANK_STATES).optional(),
  skip: z.string().max(4000).optional(),
});
export type QuizReviewQuery = z.infer<typeof quizReviewQuerySchema>;

const reviewerCountSchema = z.object({ name: z.string(), role: z.enum(QUIZ_REVIEW_ROLES), edits: count, takenDown: count, putBack: count });

/** GET /api/v1/appadmin/quiz-review — the generated bank by chapter and level, with the counts the desk works against. */
export const quizReviewListSchema = z.object({
  /** Every generated item, whatever the filter. */
  total: count,
  /** Served to pupils now. */
  served: count,
  /** Taken down. */
  takenDown: count,
  /** Loaded but held until the figure it needs is drawn. */
  held: count,
  /** Under the filter given. */
  filtered: count,
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
      /** Items under the filter at levels 1 to 6. */
      levels: z.array(count).length(6),
      total: count,
      /** Of those, taken down and held for a figure. */
      down: count,
      held: count,
      /** Grades 6 to 10 mathematics and science, the plan's first band (section 8 item 9). */
      first: z.boolean(),
    }),
  ),
  /** The reader's own edits and take-downs: today (India's day) and in all. */
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
  /** The English was edited after this translation was last written: read it against the new English. */
  stale: z.boolean(),
});

export const quizReviewStampSchema = z.object({
  action: z.enum(QUIZ_REVIEW_ACTIONS),
  language: quizReviewLanguageSchema.nullable(),
  reason: z.enum(QUIZ_TAKEDOWN_REASONS).nullable(),
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
  /** SERVED, DOWN (taken down) or HELD (its figure not drawn). */
  state: z.enum(QUIZ_BANK_STATES),
  takenDownAt: iso.nullable(),
  takenDownReason: z.enum(QUIZ_TAKEDOWN_REASONS).nullable(),
  takenDownBy: z.string().nullable(),
  /** Pupils' answers to it so far, kept whatever happens to the item. */
  answers: z.object({ asked: count, correct: count }),
  translations: z.object({ hi: translationSchema.nullable(), mr: translationSchema.nullable() }),
  stamps: z.array(quizReviewStampSchema),
});
export type QuizReviewItem = z.infer<typeof quizReviewItemSchema>;

/** GET /api/v1/appadmin/quiz-review/next and /{questionId}: one item, or none left under the filter. */
export const quizReviewNextSchema = z.object({ item: quizReviewItemSchema.nullable(), remaining: count });
export type QuizReviewNext = z.infer<typeof quizReviewNextSchema>;

const translationEditSchema = z.object({
  stem: z.string().trim().min(2).max(1200),
  choices: z.array(z.string().trim().min(1).max(400)).min(2).max(6),
  solution: z.string().trim().min(2).max(3000),
});

/**
 * POST …/{questionId}/edit — the item as corrected, in all three languages at once: the English, and the
 * Hindi and Marathi rows when sent (a language left out is left as it is). Served as edited at once.
 */
export const quizReviewEditBodySchema = z.object({
  stem: z.string().trim().min(8).max(1200),
  choices: z.array(z.string().trim().min(1).max(400)).min(2).max(6),
  answerIndex: z.number().int().min(0).max(5),
  solution: z.string().trim().min(8).max(3000),
  checkExpr: z.string().trim().max(120).nullable().optional(),
  difficulty: z.number().int().min(1).max(6),
  translations: z.object({ hi: translationEditSchema.optional(), mr: translationEditSchema.optional() }).optional(),
});
export type QuizReviewEditBody = z.infer<typeof quizReviewEditBodySchema>;

/** POST …/{questionId}/take-down */
export const quizTakeDownBodySchema = z.object({ reason: z.enum(QUIZ_TAKEDOWN_REASONS) });
export type QuizTakeDownBody = z.infer<typeof quizTakeDownBodySchema>;

/** What every desk write answers: where the item now stands. */
export const quizBankStandingSchema = z.object({
  ok: z.literal(true),
  state: z.enum(QUIZ_BANK_STATES),
  takenDownAt: iso.nullable(),
  takenDownReason: z.enum(QUIZ_TAKEDOWN_REASONS).nullable(),
  editedAfterSolvingAt: iso.nullable(),
});
export type QuizBankStanding = z.infer<typeof quizBankStandingSchema>;
