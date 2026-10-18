import { z } from "zod";
import { modelServerNameSchema, modelServerSchema } from "./quiz-jobs";
import { streamSchema } from "./streams"; // college-content (12 Oct 2026)

/**
 * COMPETITIONS SUGGESTED FROM THE WEB (the owner, 12 October 2026; docs/plans/competitions-crawler.md).
 * The crawler reads the official organisers' own sites (CompetitionSource), asks the local chat model to
 * pull out the competitions a page announces, refuses what the rules refuse, and lands the rest as
 * platform competitions in DRAFT for the content team and the operator to publish, edit or dismiss.
 * A crawl is a background job on the model's machine, started and stopped from the competitions desk,
 * exactly as a quiz generation run is (quiz-jobs.ts). Every door is app-admin; none names a school.
 */

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const count = z.number().int().nonnegative();

/**
 * What kind of competitions a source announces. college-content (12 Oct 2026): the college organisers' kinds —
 * MOOT_COURT (the Bar Council's and law schools'), HACKATHON (Smart India Hackathon), COLLEGE_EVENT (AICTE's,
 * the Pharmacy Council's, ICAR's student events).
 */
export const COMPETITION_SOURCE_KINDS = ["OLYMPIAD", "TALENT_SEARCH", "SCIENCE_FAIR", "QUIZ", "OTHER", "MOOT_COURT", "HACKATHON", "COLLEGE_EVENT"] as const;
export type CompetitionSourceKind = (typeof COMPETITION_SOURCE_KINDS)[number];

/**
 * college-content (12 Oct 2026): who a source's competitions are for when the page itself does not say: a school
 * organiser's kinds are SCHOOL, a college organiser's COLLEGE, OTHER says nothing (the competition is shown to both).
 */
export function sourceKindAudience(kind: string): "SCHOOL" | "COLLEGE" | null {
  if (kind === "MOOT_COURT" || kind === "HACKATHON" || kind === "COLLEGE_EVENT") return "COLLEGE";
  if (kind === "OLYMPIAD" || kind === "TALENT_SEARCH" || kind === "SCIENCE_FAIR" || kind === "QUIZ") return "SCHOOL";
  return null;
}

/** Who a competition is open to, as the organiser describes its reach. */
export const COMPETITION_LEVELS = ["SCHOOL", "STATE", "NATIONAL", "INTERNATIONAL"] as const;
export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];

/** The platform's coded subjects (the practice bank's, src/lib/quiz.ts QUIZ_SUBJECTS) or OTHER. */
export const COMPETITION_SUBJECTS = ["MATHS", "SCIENCE", "PHYSICS", "CHEMISTRY", "BIOLOGY", "EVS", "HISTORY", "GEOGRAPHY", "CIVICS", "ECONOMICS", "APTITUDE", "REASONING", "CODING", "OTHER"] as const;
export type CompetitionSubject = (typeof COMPETITION_SUBJECTS)[number];

/** Why the desk dismissed a suggestion. A dismissed one is not suggested again unless its page changes. */
export const COMPETITION_DISMISS_REASONS = ["NOT_A_COMPETITION", "DUPLICATE", "ALREADY_OVER", "NOT_FOR_PUPILS", "WRONG_DETAILS", "NOT_THE_ORGANISER", "OTHER"] as const;
export type CompetitionDismissReason = (typeof COMPETITION_DISMISS_REASONS)[number];

/**
 * Why code refused an extracted entry: the shape was wrong, it carried no date and no link, its link
 * left the source's host (and was not the organiser's own site), it carried a phone number or an e-mail
 * (the organiser's site is the contact), or the model's confidence was under 0.6.
 */
export const CRAWL_REJECT_REASONS = ["SHAPE", "NO_DATE_NO_LINK", "OFF_HOST_LINK", "CONTACT_DETAILS", "LOW_CONFIDENCE", "PAST", "NOT_ENTERABLE"] as const;
// college-content (12 Oct 2026, the coordinator's rules from the crawler's hand check): PAST — every date the entry carries
// is before the crawl's day; NOT_ENTERABLE — a programme heading, an award ceremony or a results notice, nothing a person enters.
export type CrawlRejectReason = (typeof CRAWL_REJECT_REASONS)[number];

/** Why a page or a whole source was not read. A site that needs a login, a form or a script is refused, never worked around. */
export const CRAWL_REFUSALS = ["ROBOTS", "LOGIN", "RENDERED_BY_SCRIPT", "HTTP_ERROR", "UNREACHABLE", "UNSUPPORTED_TYPE", "TOO_LARGE"] as const;
export type CrawlRefusal = (typeof CRAWL_REFUSALS)[number];

/* -------------------------------------------------------------------------- */
/* What the model extracts                                                     */
/* -------------------------------------------------------------------------- */

/** "YYYY-MM-DD", or null when the page does not say. */
const dayOrNull = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

/**
 * One competition as the model reads it off a page (the locked JSON schema the chat model answers in,
 * scripts/competitions-crawl/extract.ts). Classes are 1 to 12; `forCollege` for one open to college
 * students. Free text is short; the page's URL is added by code, never taken from the model.
 */
export const competitionExtractEntrySchema = z.object({
  title: z.string().min(3).max(140),
  organiser: z.string().min(2).max(140),
  summary: z.string().max(200),
  level: z.enum(COMPETITION_LEVELS),
  classFrom: z.number().int().min(1).max(12).nullable(),
  classTo: z.number().int().min(1).max(12).nullable(),
  forCollege: z.boolean(),
  subject: z.enum(COMPETITION_SUBJECTS),
  registrationOpens: dayOrNull,
  registrationCloses: dayOrNull,
  eventStarts: dayOrNull,
  eventEnds: dayOrNull,
  fee: z.string().max(200).nullable(),
  eligibility: z.string().max(600).nullable(),
  prizes: z.string().max(300).nullable(),
  website: z.string().max(500).nullable(),
  confidence: z.number().min(0).max(1),
  // ---- college-content (12 Oct 2026): required in the model's locked schema; optional here so the entries the
  // first crawls kept (in CompetitionCrawl.extracted) still read.
  /** SCHOOL (pupils of classes 1–12), COLLEGE (college or university students), BOTH, or UNKNOWN when the page does not say. */
  audience: z.enum(["SCHOOL", "COLLEGE", "BOTH", "UNKNOWN"]).optional(),
  /** The college streams the page names (law, engineering…); [] when it names none. Code keeps only a stream the page's words name. */
  streams: z.array(streamSchema).max(12).optional(),
  /** Whether a person can register for or sit this itself: false for a programme heading over several exams, an award ceremony, results, a past event. */
  enterable: z.boolean().optional(),
  // ---- end college-content ----
});
export type CompetitionExtractEntry = z.infer<typeof competitionExtractEntrySchema>;

/* -------------------------------------------------------------------------- */
/* Sources                                                                     */
/* -------------------------------------------------------------------------- */

/** One source's numbers from its last crawl, or why it was refused. */
export const competitionCrawlSourceResultSchema = z.object({
  pages: count,
  cached: count,
  candidates: count,
  drafted: count,
  updated: count,
  dismissedUnchanged: count,
  changedPublished: count,
  rejected: count,
  refused: z.object({ reason: z.enum(CRAWL_REFUSALS), detail: z.string().max(300) }).nullable(),
});
export type CompetitionCrawlSourceResult = z.infer<typeof competitionCrawlSourceResultSchema>;

export const competitionSourceSchema = z.object({
  id,
  name: z.string(),
  rootUrl: z.string(),
  organiser: z.string(),
  kind: z.enum(COMPETITION_SOURCE_KINDS),
  enabled: z.boolean(),
  official: z.boolean(),
  addedByRole: z.string(),
  lastCrawledAt: isoOrNull,
  lastResult: competitionCrawlSourceResultSchema.nullable(),
  /** Competitions this source suggested that wait on the desk. */
  waiting: count,
  /** college-content (12 Oct 2026): a college organiser's streams, given to a crawled COLLEGE entry that names none. */
  streams: z.array(streamSchema).optional(),
});
export type CompetitionSource = z.infer<typeof competitionSourceSchema>;

/** GET /api/v1/appadmin/competition-crawl/sources — every source not removed. */
export const competitionSourcesSchema = z.object({ sources: z.array(competitionSourceSchema) });

/** POST /api/v1/appadmin/competition-crawl/sources — the organiser's own site; http(s) only, checked on the server. */
export const competitionSourceAddSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    rootUrl: z.string().trim().min(8).max(500),
    organiser: z.string().trim().min(2).max(140),
    kind: z.enum(COMPETITION_SOURCE_KINDS),
    /** The organiser's own site (not a coaching site or an aggregator). */
    official: z.boolean(),
    /** college-content (12 Oct 2026): a college organiser's streams (the Bar Council's: LAW); none for a school organiser. */
    streams: z.array(streamSchema).max(12).optional(),
  })
  .strict();
export type CompetitionSourceAdd = z.infer<typeof competitionSourceAddSchema>;

export const COMPETITION_SOURCE_ACTIONS = ["ENABLE", "DISABLE", "REMOVE"] as const;
/** POST /api/v1/appadmin/competition-crawl/sources/{sourceId} — switch a source off or on, or remove it (a stamp; what it suggested stays). */
export const competitionSourceActionSchema = z.object({ action: z.enum(COMPETITION_SOURCE_ACTIONS) }).strict();
export const competitionSourceReadSchema = z.object({ source: competitionSourceSchema });

/* -------------------------------------------------------------------------- */
/* The crawl job                                                               */
/* -------------------------------------------------------------------------- */

export const COMPETITION_CRAWL_JOB_STATES = ["QUEUED", "RUNNING", "STOPPING", "STOPPED", "FINISHED", "FAILED"] as const;
export type CompetitionCrawlJobState = (typeof COMPETITION_CRAWL_JOB_STATES)[number];
export const COMPETITION_CRAWL_ACTIVE_STATES = ["QUEUED", "RUNNING", "STOPPING"] as const satisfies readonly CompetitionCrawlJobState[];

export const COMPETITION_CRAWL_PHASES = ["STARTING_MODEL", "CRAWLING", "DONE"] as const;

/** What to crawl: the sources named, or every enabled one when none is named. */
export const competitionCrawlRequestSchema = z.object({ sourceIds: z.array(id).max(60).optional() }).strict();
export type CompetitionCrawlRequest = z.infer<typeof competitionCrawlRequestSchema>;

/** The live line, rewritten by the runner after every page. */
export const competitionCrawlProgressSchema = z.object({
  phase: z.enum(COMPETITION_CRAWL_PHASES),
  /** The source being read now. */
  source: z.string().nullable(),
  sourcesTotal: count,
  sourcesVisited: count,
  pagesRead: count,
  cachedHits: count,
  candidates: count,
  drafted: count,
  updated: count,
  dismissedUnchanged: count,
  changedPublished: count,
  rejects: z.record(z.enum(CRAWL_REJECT_REASONS), count),
  refused: z.array(z.object({ source: z.string(), reason: z.enum(CRAWL_REFUSALS), detail: z.string().max(300) })),
});
export type CompetitionCrawlProgress = z.infer<typeof competitionCrawlProgressSchema>;

export const competitionCrawlJobSchema = z.object({
  id,
  state: z.enum(COMPETITION_CRAWL_JOB_STATES),
  request: competitionCrawlRequestSchema,
  progress: competitionCrawlProgressSchema.nullable(),
  startedBy: z.string(),
  startedByRole: z.enum(["APP_ADMIN", "OPERATOR"]),
  startedServers: z.array(modelServerNameSchema),
  error: z.string().nullable(),
  createdAt: iso,
  startedAt: isoOrNull,
  finishedAt: isoOrNull,
  heartbeatAt: isoOrNull,
});
export type CompetitionCrawlJob = z.infer<typeof competitionCrawlJobSchema>;

/** GET /api/v1/appadmin/competition-crawl — the crawl in hand (or the last), the latest ones, the model servers. */
export const competitionCrawlStateSchema = z.object({
  current: competitionCrawlJobSchema.nullable(),
  recent: z.array(competitionCrawlJobSchema),
  servers: z.array(modelServerSchema),
});
export type CompetitionCrawlState = z.infer<typeof competitionCrawlStateSchema>;

/** GET /api/v1/appadmin/competition-crawl/{jobId}, and Start's and Stop's answer. */
export const competitionCrawlJobReadSchema = z.object({ job: competitionCrawlJobSchema });

/* -------------------------------------------------------------------------- */
/* Suggested from the web (the desk's tab)                                      */
/* -------------------------------------------------------------------------- */

export const COMPETITION_SUGGESTION_SHOWS = ["SUGGESTED", "CHANGED", "DISMISSED"] as const;
export type CompetitionSuggestionShow = (typeof COMPETITION_SUGGESTION_SHOWS)[number];

const diffValue = z.union([z.string(), z.null()]);
export const competitionDiffSchema = z.record(z.string(), z.object({ before: diffValue, after: diffValue }));
export type CompetitionDiff = z.infer<typeof competitionDiffSchema>;

export const competitionSuggestionSchema = z.object({
  competitionId: id,
  title: z.string(),
  summary: z.string(),
  organizerName: z.string(),
  status: z.string(),
  verified: z.boolean(),
  subject: z.string().nullable(),
  gradeLow: z.string().nullable(),
  gradeHigh: z.string().nullable(),
  level: z.enum(COMPETITION_LEVELS).nullable(),
  fee: z.string().nullable(),
  eligibility: z.string().nullable(),
  prizes: z.string().nullable(),
  externalUrl: z.string().nullable(),
  registrationOpensAt: isoOrNull,
  registrationClosesAt: isoOrNull,
  startsAt: isoOrNull,
  endsAt: isoOrNull,
  source: z.object({ id, name: z.string(), organiser: z.string(), official: z.boolean() }),
  pageUrl: z.string(),
  crawledAt: iso,
  lastCheckedAt: iso,
  confidence: z.number().min(0).max(1),
  matchedExisting: z.boolean(),
  changedSinceReview: z.boolean(),
  diff: competitionDiffSchema.nullable(),
  dismissedAt: isoOrNull,
  dismissedReason: z.enum(COMPETITION_DISMISS_REASONS).nullable(),
  // college-content (12 Oct 2026): who it is for, as landed (from the page and the source's kind) or as the desk set it.
  audience: z.enum(["SCHOOL", "COLLEGE"]).nullable().optional(),
  streams: z.array(z.string()).optional(),
});
export type CompetitionSuggestion = z.infer<typeof competitionSuggestionSchema>;

/** GET /api/v1/appadmin/competitions/suggested?show=SUGGESTED|CHANGED|DISMISSED */
export const competitionSuggestionsSchema = z.object({
  show: z.enum(COMPETITION_SUGGESTION_SHOWS),
  counts: z.object({ suggested: count, changed: count, dismissed: count }),
  items: z.array(competitionSuggestionSchema),
});
export type CompetitionSuggestions = z.infer<typeof competitionSuggestionsSchema>;

/** POST /api/v1/appadmin/competitions/{competitionId}/dismiss — a coded reason. */
export const competitionDismissSchema = z.object({ reason: z.enum(COMPETITION_DISMISS_REASONS) }).strict();

/** "YYYY-MM-DD" or "" — as the web's date input sends it. */
const dateInput = z.string().max(40).nullable().optional();
const optionalText = (max: number) => z.string().max(max).nullable().optional();

/**
 * POST /api/v1/appadmin/competitions/{competitionId}/edit — a platform competition's DRAFT edited in
 * place (the content team's draft edit; a published one is put back to draft first). The parental
 * consent rule and the leaderboard are not on the form: a crawled one keeps consent on and the board off.
 */
export const competitionDraftEditSchema = z
  .object({
    title: z.string().max(140),
    summary: z.string().max(200),
    body: optionalText(5000),
    organizerName: optionalText(120),
    subject: optionalText(40),
    gradeLow: optionalText(10),
    gradeHigh: optionalText(10),
    eligibility: optionalText(5000),
    rules: optionalText(5000),
    prizes: optionalText(5000),
    externalUrl: optionalText(500),
    registrationOpensAt: dateInput,
    registrationClosesAt: dateInput,
    startsAt: dateInput,
    endsAt: dateInput,
  })
  .strict();
export type CompetitionDraftEdit = z.infer<typeof competitionDraftEditSchema>;

export const competitionSuggestionReadSchema = z.object({ suggestion: competitionSuggestionSchema });

/** What the draft edit answers: the fields that changed (none when the press changed nothing). */
export const competitionDraftEditedSchema = z.object({ ok: z.literal(true), changed: z.array(z.string()) });
