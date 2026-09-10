import { z } from "zod";

/**
 * contest: the competition WRITES for the phone — a pupil handing work in and
 * withdrawing, a guardian saying no, a school admin posting and organising
 * one (publish, withdraw, the leaderboard), staff recording results — and the
 * content team's platform competitions and question bank.
 *
 * Bodies carry the SHAPE only. The rules (a title of three characters, an
 * https link, an end after the start, a score that is not negative) are the
 * web form's, applied on the server by the same src/lib schema the server
 * action uses, so a refusal comes back as a 422 in the reader's language with
 * the field named in `issues`. Dates are typed as the web's date input sends
 * them ("YYYY-MM-DD", or empty for none); ids are strings.
 */

const id = z.string().min(1).max(64);
const optionalText = (max: number) => z.string().max(max).nullable().optional();
/** "YYYY-MM-DD" or "" — read by the server exactly as the web form's date field is. */
const dateInput = z.string().max(40).nullable().optional();

export const contestStatusValueSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

/* ---------------------------------------------------------------------- */
/* A pupil and a guardian                                                  */
/* ---------------------------------------------------------------------- */

/** POST /api/v1/contest/competitions/{competitionId}/submit — the link to the work; https only (checked on the server). */
export const contestSubmitSchema = z.object({ url: z.string().max(500) });

/* ---------------------------------------------------------------------- */
/* Posting one                                                             */
/* ---------------------------------------------------------------------- */

/** POST /api/v1/contest/competitions — a school admin's competition, saved as a draft. */
export const contestCreateSchema = z.object({
  title: z.string().max(140),
  summary: z.string().max(200),
  body: optionalText(5000),
  subject: optionalText(40),
  gradeLow: optionalText(10),
  gradeHigh: optionalText(10),
  eligibility: optionalText(5000),
  rules: optionalText(5000),
  prizes: optionalText(5000),
  externalUrl: optionalText(500),
  registrationClosesAt: dateInput,
  startsAt: dateInput,
  endsAt: dateInput,
  requiresParentConsent: z.boolean(),
  leaderboardEnabled: z.boolean().default(false),
});
export type ContestCreate = z.infer<typeof contestCreateSchema>;

/** POST /api/v1/appadmin/competitions/drafts — the content team's, for every school; the organiser's name is theirs to give. */
export const contestPlatformCreateSchema = contestCreateSchema.extend({ organizerName: optionalText(120) });
export type ContestPlatformCreate = z.infer<typeof contestPlatformCreateSchema>;

export const contestCreatedSchema = z.object({ competitionId: id, status: z.literal("DRAFT") });

/* ---------------------------------------------------------------------- */
/* Organising one                                                          */
/* ---------------------------------------------------------------------- */

/** POST .../{competitionId}/status — publish, withdraw (ARCHIVED, nothing deleted) or back to a draft. */
export const contestStatusSchema = z.object({ status: contestStatusValueSchema });
export const contestStatusSetSchema = z.object({ ok: z.literal(true), status: contestStatusValueSchema });

/** POST /api/v1/contest/competitions/{competitionId}/leaderboard — schools ranked, never children. */
export const contestLeaderboardSchema = z.object({ enabled: z.boolean() });
export const contestLeaderboardSetSchema = z.object({ ok: z.literal(true), enabled: z.boolean() });

/** One entry as the child's own school's staff see it. */
export const contestEntrySchema = z.object({
  entryId: id,
  studentMembershipId: id,
  studentName: z.string(),
  status: z.string(),
  submissionUrl: z.string().nullable(),
  scoreMilli: z.number().int().nullable(),
  rank: z.number().int().nullable(),
  awaitingConsent: z.boolean(),
});

/** GET /api/v1/contest/competitions/{competitionId}/entries — this school's entries only; the policy, not a filter. */
export const contestEntriesSchema = z.object({
  competition: z.object({
    id,
    title: z.string(),
    status: z.string(),
    isOrganiser: z.boolean(),
    leaderboardEnabled: z.boolean(),
    requiresParentConsent: z.boolean(),
  }),
  entries: z.array(contestEntrySchema),
});
export type ContestEntries = z.infer<typeof contestEntriesSchema>;

/**
 * POST /api/v1/contest/entries/{entryId}/result — a score and a place as staff
 * type them. Empty means "not recorded", which is not zero: both empty clears.
 */
export const contestResultSchema = z.object({ score: z.string().max(20), rank: z.string().max(10) });
export const contestResultSetSchema = z.object({ ok: z.literal(true), cleared: z.boolean() });

/* ---------------------------------------------------------------------- */
/* The question bank                                                       */
/* ---------------------------------------------------------------------- */

/** GET /api/v1/appadmin/bank — the chapters, with how many questions each holds. */
export const contestBankSchema = z.object({
  translationOn: z.boolean(),
  topics: z.array(
    z.object({
      id,
      subject: z.string(),
      classLevel: z.number().int(),
      chapter: z.string(),
      name: z.string(),
      questionCount: z.number().int().min(0),
    }),
  ),
});
export type ContestBank = z.infer<typeof contestBankSchema>;

export const contestBankQuestionSchema = z.object({
  id,
  difficulty: z.number().int(),
  stem: z.string(),
  choices: z.array(z.string()),
  answerIndex: z.number().int(),
  solution: z.string(),
  /** The languages beside English this question is translated into. */
  languages: z.array(z.string()),
});
export type ContestBankQuestion = z.infer<typeof contestBankQuestionSchema>;

/** GET /api/v1/appadmin/bank/{topicId} — one chapter and every question in it. */
export const contestBankTopicSchema = z.object({
  translationOn: z.boolean(),
  topic: z.object({ id, subject: z.string(), classLevel: z.number().int(), chapter: z.string(), name: z.string() }),
  questions: z.array(contestBankQuestionSchema),
});
export type ContestBankTopic = z.infer<typeof contestBankTopicSchema>;

/**
 * POST /api/v1/appadmin/bank/{topicId}/questions (add) and
 * POST .../questions/{questionId} (edit): written in English; the save
 * translates it. Blank choices are dropped on the phone before sending, as
 * the web form does, so `answerIndex` points into what is sent.
 */
export const contestQuestionSchema = z.object({
  difficulty: z.number().int().min(1).max(6),
  stem: z.string().max(2000),
  choices: z.array(z.string().max(500)).min(1).max(10),
  answerIndex: z.number().int().min(0).max(9),
  solution: z.string().max(4000),
});
export type ContestQuestion = z.infer<typeof contestQuestionSchema>;

/** `translated` is false when the English saved and the Hindi and Marathi did not. */
export const contestQuestionSavedSchema = z.object({ questionId: id, translated: z.boolean() });

