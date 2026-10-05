import { z } from "zod";

/**
 * THE READING-ROOM REGISTER (risks batch 5A, 5 October 2026; module LIBRARY).
 * The desk (the librarian or the office) signs a reader — a student or a
 * member of staff — in and out by their library card, student code or chosen
 * membership; one open visit per person. The day report is the librarian's:
 * every visit of a day with its times, who is still inside, readers by kind,
 * the average stay and the busiest hour. The head reads it.
 */
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDate = z.string().datetime();
const count = z.number().int();

/** POST /api/v1/library/reading-room — sign a reader in or out. Exactly one of `membershipId` and `code`. */
export const readingRoomScanSchema = z
  .object({
    action: z.enum(["IN", "OUT"]),
    membershipId: z.string().min(1).max(40).optional(),
    /** A library card number (L00001) or a student code. */
    code: z.string().trim().min(1).max(40).optional(),
  })
  .refine((v) => Boolean(v.membershipId) !== Boolean(v.code), { message: "membershipId or code", path: ["code"] });
export type ReadingRoomScan = z.infer<typeof readingRoomScanSchema>;

export const readingRoomVisitSchema = z.object({
  id: z.string(),
  membershipId: z.string(),
  name: z.string(),
  /** STUDENT or STAFF. */
  kind: z.enum(["STUDENT", "STAFF"]),
  className: z.string().nullable(),
  dayKey: dateKey,
  inAt: isoDate,
  outAt: isoDate.nullable(),
  /** Minutes inside, to now for an open visit. */
  minutes: count,
});
export type ReadingRoomVisitView = z.infer<typeof readingRoomVisitSchema>;

/** What a scan did: `changed` false when the reader was already in (IN) — the open visit is answered as it stands. */
export const readingRoomScannedSchema = z.object({ visit: readingRoomVisitSchema, changed: z.boolean() });

/** GET /api/v1/library/reading-room?day= — the day report (today when omitted). */
export const readingRoomQuerySchema = z.object({ day: dateKey.optional() });
export const readingRoomDaySchema = z.object({
  dayKey: dateKey,
  today: z.boolean(),
  visits: z.array(readingRoomVisitSchema),
  /** Readers inside now (today), or never signed out (a past day). */
  inside: count,
  readers: count,
  students: count,
  staff: count,
  averageMinutes: count.nullable(),
  /** The hour (0–23, the school's clock) in which most readers came in; null on a day with none. */
  busiestHour: count.nullable(),
  canRecord: z.boolean(),
});
export type ReadingRoomDay = z.infer<typeof readingRoomDaySchema>;
