/** practice: request and response shapes for the phone's remaining screens. Area-prefixed export names. */
import { z } from "zod";
import { localeSchema } from "../locale";

/**
 * The pupil's practice player and the teacher's worksheets, as JSON — the
 * web's /student/practice/{slug}, /student/practice/revision and
 * /teacher/worksheets.
 *
 * THE LANGUAGE A QUESTION IS READ IN. The web reads it from the stored
 * preference (prefs.locale), which is also the web's page language. The
 * phone's page language lives on the phone, so every call here may carry
 * `language`; left out, the stored preference answers, exactly as on the web.
 * A Marathi phone must never be served Hindi questions.
 *
 * A served question never carries its answer: `answerIndex` and the solution
 * come back only once the pupil has answered or chosen to reveal.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
/** Question ids come from the imported bank; they are opaque here. */
const questionId = z.string().min(1).max(80);
/** A device-minted id for one tap, carried by every body the outbox may replay. */
const clientId = z.string().min(8).max(64);

/** A read that only needs the reading language. */
export const practiceLanguageQuerySchema = z.object({ language: localeSchema.optional() });

/* ------------------------------------------------------------------------- */
/* Playing a chapter                                                          */
/* ------------------------------------------------------------------------- */

/** One question as served: the stem, the options, the rung, and how far into the chapter this sitting is. */
// ---- figures (the quiz bank's figure builder, 10 Oct 2026) ----
/** A served question's figure: a stored image's fileId (read through /api/files) and the figure in words. */
export const practiceFigureSchema = z.object({ fileId: z.string().regex(/^[0-9a-f-]{36}\.(?:png|jpg|webp)$/i, "fileId"), alt: z.string().min(1).max(2000) });
// ---- end figures ----

export const practiceQuestionSchema = z.object({
  questionId: z.string(),
  stem: z.string(),
  choices: z.array(z.string()),
  /** 1–6, the rung of the ladder this question sits on. */
  difficulty: z.number().int(),
  /** Questions this sitting has already seen — "question askedCount + 1 of totalCount". */
  askedCount: z.number().int(),
  totalCount: z.number().int(),
  // ---- figures (the quiz bank's figure builder, 10 Oct 2026) ----
  /**
   * The figure drawn above the stem, in the language the stem is served in: a PNG read through
   * GET /api/files/{fileId} with the session (the phone sends its bearer header), and the figure in
   * words for a screen reader and for a pupil whose picture did not load. Absent or null: no figure.
   */
  image: practiceFigureSchema.nullable().optional(),
  // ---- end figures ----
});
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;

/**
 * POST /api/v1/practice/attempts — open a sitting on a chapter, or pick up the
 * one left half-way. Either a chapter (`slug`) or a chapter the teacher set
 * (`assignmentId`), never both.
 */
export const practiceBeginBodySchema = z
  .object({
    slug: z.string().trim().min(1).max(120).optional(),
    assignmentId: cuid.optional(),
    language: localeSchema.optional(),
  })
  .refine((b) => Boolean(b.slug) !== Boolean(b.assignmentId), { message: "slug or assignmentId", path: ["slug"] });
export type PracticeBeginBody = z.infer<typeof practiceBeginBodySchema>;

/** The chapter as the pupil stands on it: the rung, the badges, the count. */
export const practiceTopicCardSchema = z.object({
  slug: z.string(),
  name: z.string(),
  chapter: z.string(),
  subject: z.string(),
  classLevel: z.number().int(),
  questionCount: z.number().int(),
  level: z.number().int(),
  tierCount: z.number().int(),
  badgeEarned: z.boolean(),
  completed: z.boolean(),
});

/** A chapter the teacher set, with the pupil's own standing against its target rung. */
export const practiceAssignmentProgressSchema = z.object({
  id: z.string(),
  targetLevel: z.number().int(),
  targetTierName: z.string(),
  /** 0 = never opened the chapter; otherwise the rung the pupil stands on. */
  myLevel: z.number().int(),
  reached: z.boolean(),
  note: z.string().nullable(),
  dueAt: iso.nullable(),
});

export const practiceBeganSchema = z.object({
  attemptId: z.string(),
  /** The sitting already had answers in it: this is the pupil coming back half-way. */
  resumed: z.boolean(),
  topic: practiceTopicCardSchema,
  assignment: practiceAssignmentProgressSchema.nullable(),
  /** Null when every question of the chapter has been seen in this sitting. */
  question: practiceQuestionSchema.nullable(),
});
export type PracticeBegan = z.infer<typeof practiceBeganSchema>;

/** GET /api/v1/practice/next?attemptId= — the question to answer now; null when the chapter is done. */
export const practiceNextQuerySchema = z.object({ attemptId: cuid, language: localeSchema.optional() });
export const practiceNextSchema = z.object({ question: practiceQuestionSchema.nullable() });

/**
 * POST /api/v1/practice/answer — the outbox's body. Replay-safe: the server's
 * guard is the (attempt, question) pair, so a second delivery returns the
 * verdict already stored (replayed: true) and never climbs the ladder twice.
 */
export const practiceAnswerBodySchema = z.object({
  attemptId: cuid,
  questionId,
  chosenIndex: z.number().int().min(0).max(50),
  clientId,
  language: localeSchema.optional(),
});
export type PracticeAnswerBody = z.infer<typeof practiceAnswerBodySchema>;

export const practiceAnswerResultSchema = z.object({
  correct: z.boolean(),
  answerIndex: z.number().int(),
  /** The worked solution — free once answered; reading why is marking, not peeking. */
  solution: z.string(),
  /** The rung the next question comes from. 0 on a replay, which moved nothing. */
  newLevel: z.number().int(),
  finished: z.boolean(),
  badgeAwarded: z.boolean(),
});
export type PracticeAnswerResult = z.infer<typeof practiceAnswerResultSchema>;

export const practiceAnsweredSchema = z.object({ replayed: z.boolean(), result: practiceAnswerResultSchema });

/** POST /api/v1/practice/reveal — show the working before answering. Costs the chapter's badge for this sitting. */
export const practiceRevealBodySchema = z.object({ attemptId: cuid, questionId, language: localeSchema.optional() });
export const practiceRevealedSchema = z.object({
  solution: z.string(),
  answerIndex: z.number().int(),
  /** True the first time in a sitting: the badge was still on offer and now is not. */
  badgeForfeited: z.boolean(),
});

/* ------------------------------------------------------------------------- */
/* Smart revision — the pupil's own missed questions, rested and re-served     */
/* ------------------------------------------------------------------------- */

/** GET /api/v1/practice/revision — the queue, fixed when it is read. */
export const practiceRevisionSchema = z.object({
  items: z.array(z.object({ questionId: z.string(), topicSlug: z.string(), topicName: z.string(), subject: z.string() })),
});
export type PracticeRevision = z.infer<typeof practiceRevisionSchema>;

/** GET /api/v1/practice/revision/question?questionId= — one queued question, without its answer. */
export const practiceRevisionQuestionQuerySchema = z.object({ questionId, language: localeSchema.optional() });
export const practiceRevisionQuestionSchema = z.object({
  questionId: z.string(),
  topicSlug: z.string(),
  stem: z.string(),
  choices: z.array(z.string()),
  difficulty: z.number().int(),
  // figures (10 Oct 2026): the re-served question's figure, as practiceQuestionSchema carries it.
  image: practiceFigureSchema.nullable().optional(),
});

/** POST /api/v1/practice/revision/answer — marked through the chapter's own sitting, so revision moves the same ladder. */
export const practiceRevisionAnswerBodySchema = z.object({
  questionId,
  chosenIndex: z.number().int().min(0).max(50),
  clientId,
  language: localeSchema.optional(),
});
export type PracticeRevisionAnswerBody = z.infer<typeof practiceRevisionAnswerBodySchema>;
export const practiceRevisionAnsweredSchema = z.object({ result: practiceAnswerResultSchema });

/* ------------------------------------------------------------------------- */
/* Worksheets — the teacher's printable papers off the bank                   */
/* ------------------------------------------------------------------------- */

/** GET /api/v1/practice/worksheets — the chapters on offer, the rungs, and the most a paper may hold. */
export const practiceWorksheetTopicsSchema = z.object({
  topics: z.array(z.object({ slug: z.string(), name: z.string(), subject: z.string(), classLevel: z.number().int() })),
  levels: z.array(z.object({ level: z.number().int(), tierName: z.string() })),
  maxQuestions: z.number().int(),
});
export type PracticeWorksheetTopics = z.infer<typeof practiceWorksheetTopicsSchema>;

/** GET /api/v1/practice/worksheets/sheet — the same query always builds the same paper; a new seed is a fresh one. */
export const practiceWorksheetQuerySchema = z.object({
  slug: z.string().trim().min(1).max(120),
  level: z.coerce.number().int().min(1).max(6).default(3),
  count: z.coerce.number().int().min(1).max(30).default(10),
  seed: z.string().trim().min(1).max(40).default("1"),
});
export type PracticeWorksheetQuery = z.infer<typeof practiceWorksheetQuerySchema>;

/** The paper and its key. Staff only: the answers ride along, which is what a worksheet is. */
export const practiceWorksheetSchema = z.object({
  topicName: z.string(),
  subject: z.string(),
  classLevel: z.number().int(),
  level: z.number().int(),
  tierName: z.string(),
  seed: z.string(),
  questions: z.array(
    z.object({
      number: z.number().int(),
      stem: z.string(),
      choices: z.array(z.string()),
      answerIndex: z.number().int(),
      solution: z.string(),
    }),
  ),
});
export type PracticeWorksheet = z.infer<typeof practiceWorksheetSchema>;

/* -------------------------------------------------------------------------- */
/* The pupil's own journey (A3-inventory-14, 5 October 2026)                    */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/practice/journey — the pupil's private "how far I've come": badges, the six months' tiers, the streak. */
export const practiceJourneySchema = z.object({
  badges: z.array(z.object({ label: z.string(), description: z.string(), earnedAt: iso, isTier: z.boolean() })),
  /** The last six calendar months, oldest first; `month` is YYYY-MM for the reader's own month names. */
  monthly: z.array(z.object({ label: z.string(), month: z.string().regex(/^\d{4}-\d{2}$/), tiers: z.number().int() })),
  practiceWeeks: z.number().int(),
  totalAnswers: z.number().int(),
  totalTiers: z.number().int(),
});
export type PracticeJourney = z.infer<typeof practiceJourneySchema>;

/* ------------------------------------------------------------------------- */
/* One-time practice (decision 0008, 7 November 2026)                          */
/* ------------------------------------------------------------------------- */

/**
 * A pupil WITHOUT the Student plan opens a set a teacher assigned ONCE: a fixed draw of the chapter's questions
 * nearest the target rung, each answered once, scored, and a second open shows the result rather than the
 * questions. It counts toward nothing else (no rung, no badge, no journey). The doors are open whatever plan the
 * pupil holds (the catalog's `planFree`); the web and the phone draw the sets beside the plan card for a locked
 * pupil, and a pupil with the plan plays the chapter itself.
 */
export const practiceOnceStateSchema = z.enum(["NOT_OPENED", "OPEN", "DONE"]);
export type PracticeOnceState = z.infer<typeof practiceOnceStateSchema>;
export const practiceOnceSetSchema = z.object({
  assignmentId: cuid,
  topicSlug: z.string(),
  topicName: z.string(),
  subject: z.string(),
  classLevel: z.number().int(),
  targetLevel: z.number().int(),
  targetTierName: z.string(),
  note: z.string().nullable(),
  dueAt: iso.nullable(),
  state: practiceOnceStateSchema,
  /** Questions in the set: the draw's size once opened, else how many the open would draw. */
  total: z.number().int(),
  answered: z.number().int(),
  correct: z.number().int(),
});
export type PracticeOnceSet = z.infer<typeof practiceOnceSetSchema>;
/** GET /api/v1/practice/once — the pupil's assigned sets with where each one-time attempt stands. */
export const practiceOnceListSchema = z.object({ sets: z.array(practiceOnceSetSchema) });
/** POST /api/v1/practice/once — open a set once (the draw is fixed at the first open), or read it back as it stands. */
export const practiceOnceOpenBodySchema = z.object({ assignmentId: cuid, language: localeSchema.optional() });
export const practiceOnceSchema = z.object({
  onceId: cuid,
  set: practiceOnceSetSchema,
  /** The question to answer now (never with its answer); null once every question is answered. */
  question: practiceQuestionSchema.nullable(),
});
export type PracticeOnce = z.infer<typeof practiceOnceSchema>;
/** POST /api/v1/practice/once/answer — one answer, replay-safe on (set, question). */
export const practiceOnceAnswerBodySchema = z.object({ onceId: cuid, questionId, chosenIndex: z.number().int().min(0).max(50), clientId, language: localeSchema.optional() });
export type PracticeOnceAnswerBody = z.infer<typeof practiceOnceAnswerBodySchema>;
export const practiceOnceAnsweredSchema = z.object({
  replayed: z.boolean(),
  correct: z.boolean(),
  answerIndex: z.number().int(),
  solution: z.string(),
  set: practiceOnceSetSchema,
  question: practiceQuestionSchema.nullable(),
});
export type PracticeOnceAnswered = z.infer<typeof practiceOnceAnsweredSchema>;
