/**
 * @edulink/contracts — the request and response shapes of the versioned JSON
 * API (`/api/v1`), written once as zod schemas so the route handler on the web
 * side and the client on the phone parse the same thing.
 *
 * Phase 0 lays down the envelope every endpoint answers with and the two
 * schemas every endpoint takes. Domain schemas (attendance, timetable, feed,
 * messages) arrive in Phase 3, one per endpoint, beside the handler that uses
 * them.
 */
import { z } from "zod";

/**
 * Every failure looks the same: a sentence a person can read, in the caller's
 * language, and — for a form — which fields were wrong. Mirrors what the web's
 * server actions already return, so a screen ports rather than rewrites.
 */
export const apiErrorSchema = z.object({
  error: z.string().min(1),
  code: z
    // MODULE_OFF is a 403 from a door whose module the school has not switched on.
    .enum(["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "TOO_LARGE", "SERVER", "MODULE_OFF"])
    .optional(),
  issues: z.record(z.string()).optional(),
  retryAfterSeconds: z.number().int().positive().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export type ApiResult<T> = { ok: true; data: T } | ({ ok: false; status: number } & ApiError);

import { localeSchema } from "./locale";
export { localeSchema };

/**
 * Cursor paging for every list. A phone scrolls; it never asks for page 7.
 * The limit is capped here so a client cannot ask a school's whole feed at once.
 */
export const pageQuerySchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;

export function page<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}

/**
 * A bearer session as the app stores it. The token itself is opaque; the
 * expiry is what tells the app to refresh before a request rather than after
 * a 401.
 */
export const sessionTokenSchema = z.object({
  token: z.string().min(32),
  expiresAt: z.string().datetime(),
  locale: localeSchema,
});
export type SessionToken = z.infer<typeof sessionTokenSchema>;

/* ------------------------------------------------------------------------- */
/* /api/v1 request bodies. Each is the shape the offline outbox replays, so  */
/* every one carries what makes a second delivery harmless.                  */
/* ------------------------------------------------------------------------- */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");

/**
 * A teacher's marks for one exam slot in one class. Replay-safe by nature:
 * the server stores the batch as the current state of that sheet, so sending
 * it twice leaves the same marks. `marks: null` clears a pupil's entry.
 */
export const marksBatchSchema = z.object({
  slotId: cuid,
  classId: cuid,
  entries: z
    .array(z.object({ membershipId: cuid, marks: z.number().min(0).max(100_000).nullable() }))
    .min(1)
    .max(500),
});
export type MarksBatch = z.infer<typeof marksBatchSchema>;

/**
 * One message into a room. `clientId` is minted on the device before the
 * message is queued; the server keeps it unique per room, so a replay returns
 * the message that already landed rather than a twin.
 */
export const conversationMessageSchema = z.object({
  conversationId: cuid,
  body: z.string().trim().min(1).max(8_000),
  clientId: z.string().min(8).max(64),
});
export type ConversationMessageBody = z.infer<typeof conversationMessageSchema>;

export const marksSavedSchema = z.object({ saved: z.number().int(), cleared: z.number().int() });
export const messageSentSchema = z.object({ messageId: z.string() });

export * from "./v1/auth";
export * from "./v1/modules";
export * from "./v1/college";
export * from "./v1/alumni";
export * from "./v1/admin";
export * from "./v1/staff";
export * from "./v1/family";
export * from "./v1/shared";
export * from "./v1/operator";
export * from "./v1/practice";
export * from "./v1/community";
export * from "./v1/teaching";
export * from "./v1/office";
export * from "./v1/account";
export * from "./v1/contest";
export * from "./v1/gigs";
export * from "./v1/join";
export * from "./v1/fees";
export * from "./v1/messaging";
export * from "./v1/health";
export * from "./v1/incidents";
export * from "./v1/circulars";
export * from "./v1/staff-attendance";
export * from "./v1/syllabus";
export * from "./v1/substitutions";
export * from "./v1/report-cards";
export * from "./v1/certificates";
export * from "./v1/admissions";
export * from "./v1/filings";
export * from "./v1/family-money";
export * from "./v1/transport";
export * from "./v1/transport-map";
export * from "./v1/office-year";
export * from "./v1/office-writes";
// The clinical coordinator's desk (R-56, the clinical half; 10 Oct 2026).
export * from "./v1/clinical";

/* -------------------------------------------------------------------------- */
/* Global search — GET /api/v1/search                                          */
/* -------------------------------------------------------------------------- */

/** `?q=` two to eighty characters once trimmed; `?limit=` rows per group. */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchKindSchema = z.enum(["people", "posts", "messages", "papers", "pages"]);
export type SearchKind = z.infer<typeof searchKindSchema>;

/**
 * One hit: what it is, a line to show, the web path and the phone's screen.
 * `phoneRoute` is null for a page of the role's menu, which the phone maps
 * from `href` itself (lib/links.ts), and for anything the phone has no
 * screen for, which it opens on the web.
 */
export const searchHitSchema = z.object({
  kind: searchKindSchema,
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  href: z.string(),
  phoneRoute: z.string().nullable(),
});
export type SearchHit = z.infer<typeof searchHitSchema>;

export const searchResultsSchema = z.object({
  q: z.string(),
  people: z.array(searchHitSchema),
  posts: z.array(searchHitSchema),
  messages: z.array(searchHitSchema),
  papers: z.array(searchHitSchema),
  pages: z.array(searchHitSchema),
});
export type SearchResults = z.infer<typeof searchResultsSchema>;

/* -------------------------------------------------------------------------- */
/* Exports: a class's marks as a file, and a person's own data (DPDP s.11)      */
/* -------------------------------------------------------------------------- */

/** The file a class export comes back as: CSV unless the link says xlsx. */
export const exportFormatSchema = z.enum(["csv", "xlsx"]);
export const marksExportQuerySchema = z.object({ exam: cuid, format: exportFormatSchema.optional() });
export const gradebookExportQuerySchema = z.object({ format: exportFormatSchema.optional() });
/** A guardian names the child (`student`, a membership id); a pupil's own export takes no parameter. */
export const familyExportQuerySchema = z.object({ student: cuid.optional() });

/* -------------------------------------------------------------------------- */
/* The directory's row actions, from the phone                                 */
/* -------------------------------------------------------------------------- */

/**
 * What the office does to one person from the directory's row menu on the
 * web (admin/people/actions.ts), as the phone reaches it: a legal name
 * corrected for a coded reason, a date of birth set or cleared, a teacher's
 * subjects replaced as a set, access paused with a reason kept in the audit
 * log and restored, and a membership removed when nothing was ever recorded
 * against it. Every rule is the library's (lib/legal-name.ts, lib/birthdate.ts,
 * lib/reviews.ts, lib/membership.ts); the body carries the shape alone.
 */
/** POST /api/v1/admin/people/{membershipId}/legal-name — the name as on the admission register, and why. */
export const legalNameBodySchema = z.object({ name: z.string().trim().min(1).max(120), reason: z.enum(["SPELLING", "ADMISSION_RECORD", "LEGAL_CHANGE"]) });
export type LegalNameBody = z.infer<typeof legalNameBodySchema>;
/** POST /api/v1/admin/people/{membershipId}/birthdate — the day, or null to clear it. */
export const birthdateBodySchema = z.object({ dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date").nullable() });
export type BirthdateBody = z.infer<typeof birthdateBodySchema>;
/** POST /api/v1/admin/people/{membershipId}/subjects — a teacher's subjects, replaced as a set; the server trims, de-duplicates and keeps twenty. */
export const subjectsBodySchema = z.object({ subjects: z.array(z.string().max(60)).max(40) });
export type SubjectsBody = z.infer<typeof subjectsBodySchema>;
/** POST /api/v1/admin/people/{membershipId}/pause — why, kept in the audit log; the server refuses a blank. */
export const pauseBodySchema = z.object({ reason: z.string().max(500) });
export type PauseBody = z.infer<typeof pauseBodySchema>;
/**
 * POST /api/v1/admin/people/{membershipId}/remove — a 422 names what stood in
 * the way as `issues` (attendance, marks, submissions, reportCards), each a
 * sentence in the caller's language; the sentence itself is `error`.
 */
export const removalIssueKeys = ["attendance", "marks", "submissions", "reportCards"] as const;
export * from "./v1/family-care";
export * from "./v1/totp";
export * from "./v1/decisions";
export * from "./v1/office-bulk";
export * from "./v1/teacher-head";
export * from "./v1/operator-plans";
export * from "./v1/operator-dashboard";
export * from "./v1/experts";
export * from "./v1/content";
export * from "./v1/inventory";
export * from "./v1/payroll";
export * from "./v1/library";
export * from "./v1/hostel";
export * from "./v1/academics";
export * from "./v1/college-office";
export * from "./v1/college-exams";
export * from "./v1/placement";
export * from "./v1/naac";
export * from "./v1/iqac";
export * from "./v1/iqac-filing-text";
export * from "./v1/regulator-calendar";
export * from "./v1/operator-college";
export * from "./v1/principal-college";
export * from "./v1/streams";
export * from "./v1/duties";
export * from "./v1/council-filings";
export * from "./v1/iqac-insights";
export * from "./v1/stream-records";
// The studio coordinator's desk (R-56, the studio half, 10 Oct 2026).
export * from "./v1/studio";
// The risks batch's college builds (package 5B, 5 Oct 2026): talks and soft-skills training, attendance devices, the Tally export, the peer-team visit file.
export * from "./v1/placement-events";
export * from "./v1/attendance-devices";
export * from "./v1/tally";
export * from "./v1/peer-visits";
// The risks batch's package 5A (5 Oct 2026): homework at a college (R-48), appointment letters, council notices, the reading room.
export * from "./v1/college-homework";
export * from "./v1/reading-room";
export * from "./v1/council-notices";
// The assistant, Phase B (9-10 Oct 2026): conversations, the verdicts, the office's usage and the family's opt-out (docs/plans/assistant.md, decision 0005).
export * from "./v1/assistant";
// The owner's decisions of 10 Oct 2026 (decisions builder): settle on leaving (R-61 Q2), the previous schools' papers (R-70), the record copy (R-69).
export * from "./v1/owner-decisions";
// The generated bank's review queue and the teachers' question gig switched off (review-queue builder, 10 Oct 2026).
export * from "./v1/quiz-review";
// ---- figures (the quiz bank's figure builder, 10 Oct 2026): the figure spec the generator writes and the renderer draws.
export * from "./v1/quiz-figure";
// ---- end figures ----
// ---- quiz-board (the practice bank's board, 11 Oct 2026): NCERT or Balbharati, the school's first.
export * from "./v1/quiz-board";
// ---- end quiz-board ----
// ---- quiz-publish-jobs (generation started and stopped from the bank desk, the model servers' state, 11 Oct 2026).
export * from "./v1/quiz-jobs";
// ---- end quiz-publish-jobs ----
