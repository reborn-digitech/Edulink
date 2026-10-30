import { z } from "zod";

/**
 * The content team's tooling (2026-10-01): native review of the bank's Hindi
 * and Marathi, the bank as a sheet in and out, near-duplicates, how each
 * question is doing, and platform moderation of the global feed. Every
 * endpoint is app-admin (the content team and the operator); none names a
 * school in its path.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/* ---------------------------------------------------------------------- */
/* Translation review                                                     */
/* ---------------------------------------------------------------------- */

export const reviewLanguageSchema = z.enum(["hi", "mr"]);
export const reviewStatusSchema = z.enum(["unreviewed", "reviewed", "missing"]);

/** GET /api/v1/appadmin/translations?language=hi|mr&status=&page=&topic= */
export const translationsQuerySchema = z.object({
  language: reviewLanguageSchema,
  status: reviewStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  topic: id.optional(),
});

const reviewTextSchema = z.object({ stem: z.string(), choices: z.array(z.string()), solution: z.string() });

export const translationsSchema = z.object({
  language: reviewLanguageSchema,
  status: reviewStatusSchema,
  page: z.number().int().min(1),
  pages: z.number().int().min(1),
  counts: z.object({ unreviewed: count, reviewed: count, missing: count }),
  items: z.array(
    z.object({
      id,
      topic: z.object({ id, name: z.string(), subject: z.string(), classLevel: z.number().int() }),
      difficulty: z.number().int(),
      english: reviewTextSchema,
      translation: reviewTextSchema.nullable(),
      reviewedAt: iso.nullable(),
      reviewedBy: z.string().nullable(),
    }),
  ),
});
export type Translations = z.infer<typeof translationsSchema>;

/** POST /api/v1/appadmin/translations/{questionId}/review — a corrected text (optional) and the stamp. */
export const translationReviewBodySchema = z.object({
  language: reviewLanguageSchema,
  text: z.object({ stem: z.string().max(2000), choices: z.array(z.string().max(500)).max(10), solution: z.string().max(4000) }).optional(),
  reviewed: z.boolean(),
});
export type TranslationReviewBody = z.infer<typeof translationReviewBodySchema>;
export const translationReviewedSchema = z.object({ ok: z.literal(true), reviewed: z.boolean() });

/* ---------------------------------------------------------------------- */
/* Bank tooling                                                           */
/* ---------------------------------------------------------------------- */

/** POST /api/v1/appadmin/bank/import — the sheet as text; `commit` false (the default) previews. */
export const bankImportBodySchema = z.object({ csv: z.string().min(1).max(900_000), commit: z.boolean().optional() });
export type BankImportBody = z.infer<typeof bankImportBodySchema>;

export const bankImportProblemSchema = z.object({ line: z.number().int(), value: z.string(), reason: z.string() });

export const bankImportResultSchema = z.object({
  committed: z.boolean(),
  parsed: count,
  create: count,
  update: count,
  translations: count,
  written: count,
  unknownTopics: z.array(z.string()),
  problems: z.array(bankImportProblemSchema),
});
export type BankImportResult = z.infer<typeof bankImportResultSchema>;

/** GET /api/v1/appadmin/bank/export?subject=&grade=&format=csv|xlsx */
export const bankExportQuerySchema = z.object({
  subject: z.string().max(20).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  format: z.enum(["csv", "xlsx"]).optional(),
});

const duplicateSideSchema = z.object({ id, topicId: id, topicName: z.string(), classLevel: z.number().int(), stem: z.string() });

/** GET /api/v1/appadmin/bank/duplicates */
export const bankDuplicatesSchema = z.object({
  trigram: z.boolean(),
  threshold: z.number(),
  pairs: z.array(z.object({ similarity: z.number(), a: duplicateSideSchema, b: duplicateSideSchema })),
  /** qb-A (QB-19): every pair the report holds; `pairs` carries the closest five hundred of them. */
  totalPairs: z.number().int().nonnegative(),
  computedAt: iso,
});
export type BankDuplicates = z.infer<typeof bankDuplicatesSchema>;

export const questionStatSummarySchema = z.object({
  asked: count,
  correct: count,
  correctRate: z.number().int().min(0).max(100).nullable(),
  avgSeconds: count.nullable(),
});
export type QuestionStatSummary = z.infer<typeof questionStatSummarySchema>;

/** GET /api/v1/appadmin/bank/stats?questionId= */
export const bankStatsQuerySchema = z.object({ questionId: id });
export const bankStatsSchema = questionStatSummarySchema.extend({
  questionId: id,
  byGrade: z.array(questionStatSummarySchema.extend({ grade: z.number().int().min(0).max(12) })),
  updatedAt: iso.nullable(),
});
export type BankStats = z.infer<typeof bankStatsSchema>;

/* ---------------------------------------------------------------------- */
/* Platform moderation                                                    */
/* ---------------------------------------------------------------------- */

export const moderationStatusSchema = z.enum(["live", "takenDown", "restored"]);

/** GET /api/v1/appadmin/moderation?status=&page= */
export const moderationQuerySchema = z.object({ status: moderationStatusSchema.optional(), page: z.coerce.number().int().min(1).optional() });

export const moderationItemSchema = z.object({
  postId: id,
  title: z.string(),
  excerpt: z.string(),
  category: z.string(),
  schoolName: z.string(),
  authorName: z.string(),
  createdAt: iso,
  commentCount: count,
  status: z.enum(["APPROVED", "TAKEN_DOWN", "RESTORED"]),
  takedown: z.object({ reason: z.string(), at: iso, by: z.string(), restoredAt: iso.nullable(), restoredBy: z.string().nullable() }).nullable(),
});

export const moderationSchema = z.object({
  status: moderationStatusSchema,
  page: z.number().int().min(1),
  pages: z.number().int().min(1),
  counts: z.object({ live: count, takenDown: count, restored: count }),
  items: z.array(moderationItemSchema),
});
export type Moderation = z.infer<typeof moderationSchema>;

/** GET /api/v1/appadmin/moderation/{postId} — a live post and its approved comments. */
export const moderationPostSchema = z.object({
  postId: id,
  title: z.string(),
  body: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  schoolName: z.string(),
  authorName: z.string(),
  createdAt: iso,
  comments: z.array(z.object({ id, body: z.string(), createdAt: iso, authorName: z.string() })),
});
export type ModerationPost = z.infer<typeof moderationPostSchema>;

/** POST /api/v1/appadmin/moderation/{postId}/takedown — why, told to the school. */
export const takedownBodySchema = z.object({ reason: z.string().trim().min(3).max(500) });
export type TakedownBody = z.infer<typeof takedownBodySchema>;
