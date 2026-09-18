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
    .enum(["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "SERVER"])
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
export * from "./v1/join";
export * from "./v1/fees";
export * from "./v1/messaging";
export * from "./v1/health";
