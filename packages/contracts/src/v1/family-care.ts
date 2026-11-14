import { z } from "zod";
import { realDateKey } from "./calendar-keys";

/**
 * The family's side of the child's record, where the family acts rather
 * than reads: ending their own link to a child, telling the school the
 * child will be away, and seeing who at the school has opened the health
 * card. And the school's one dial for the pupil's own eyes — the age from
 * which a pupil may read their own health card and incidents.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

/* -------------------------------------------------------------------------- */
/* Unlink my child                                                             */
/* -------------------------------------------------------------------------- */

/** DELETE /api/v1/family/children/{membershipId}/link — the guardian ends their own link. The confirmation is the body; the typed name is the screen's. */
export const familyUnlinkSchema = z.object({ confirm: z.literal(true) });
export const familyUnlinkedSchema = z.object({
  ok: z.literal(true),
  /** Whether the school now stands in as the child's guardian (no family guardian is left on the app). */
  schoolStandsIn: z.boolean(),
  /** How many children the guardian still has after this one. Zero sends them to the link page. */
  remaining: z.number().int(),
});
export type FamilyUnlinked = z.infer<typeof familyUnlinkedSchema>;

/* -------------------------------------------------------------------------- */
/* Absence notes                                                               */
/* -------------------------------------------------------------------------- */

/** Why the child will be away: a coded list, never free text where the register wants a code. */
export const ABSENCE_REASONS = ["ILLNESS", "FAMILY", "RELIGIOUS", "TRAVEL", "OTHER"] as const;
export const absenceReasonSchema = z.enum(ABSENCE_REASONS);
export type AbsenceReason = z.infer<typeof absenceReasonSchema>;

/** POST /api/v1/family/students/{membershipId}/absence-notes — one note per day; a second for the same day replaces the first. */
export const absenceNoteCreateSchema = z.object({
  /** A day on the calendar (TA-546): 2026-11-31 is a 422 naming dateKey, since no register would ever match it. */
  dateKey: realDateKey,
  reason: absenceReasonSchema,
  text: z.string().trim().max(300).default(""),
});
export type AbsenceNoteCreate = z.infer<typeof absenceNoteCreateSchema>;

export const absenceNoteSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  dateKey,
  reason: absenceReasonSchema,
  text: z.string(),
  authorName: z.string(),
  /** PARENT when a guardian filed it, STUDENT when the pupil did. */
  authorRole: z.enum(["PARENT", "STUDENT"]),
  createdAt: iso,
  /** Whether this viewer may take the note back: its author, before the day's register has marked the pupil. */
  canDelete: z.boolean(),
});
export type AbsenceNoteRow = z.infer<typeof absenceNoteSchema>;

/** GET /api/v1/family/students/{membershipId}/absence-notes — the notes from today on, soonest first. */
export const absenceNotesSchema = z.object({
  studentMembershipId: z.string(),
  childName: z.string(),
  /** Today at the school, so the form can refuse a past day before asking. */
  today: dateKey,
  notes: z.array(absenceNoteSchema),
});
export type AbsenceNotes = z.infer<typeof absenceNotesSchema>;

/** What the register shows beside a pupil who has a note for the day. */
export const registerAbsenceNoteSchema = z.object({
  reason: absenceReasonSchema,
  text: z.string(),
  /** True when a guardian filed it; false when the pupil did for themselves. */
  byFamily: z.boolean(),
});
export type RegisterAbsenceNote = z.infer<typeof registerAbsenceNoteSchema>;

/* -------------------------------------------------------------------------- */
/* Who read my child's health card                                             */
/* -------------------------------------------------------------------------- */

export const healthCardReadSchema = z.object({
  id: z.string(),
  readerName: z.string(),
  /** WARDEN since 3 Oct 2026: the hostel's warden reads a boarder's card from the hostel screens, and the family sees that too. */
  readerRole: z.enum(["ADMIN", "PRINCIPAL", "TEACHER", "WARDEN"]),
  readAt: iso,
});

/** GET /api/v1/family/students/{membershipId}/health/reads — the staff reads of the card in the last ninety days, newest first. */
export const healthCardReadsSchema = z.object({
  studentMembershipId: z.string(),
  childName: z.string(),
  days: z.number().int(),
  reads: z.array(healthCardReadSchema),
});
export type HealthCardReads = z.infer<typeof healthCardReadsSchema>;

/* -------------------------------------------------------------------------- */
/* The pupil's own eyes                                                        */
/* -------------------------------------------------------------------------- */

/** GET and POST /api/v1/office/self-read-age — null means a pupil never reads their own card or incidents. */
export const selfReadAgeSchema = z.object({ selfReadAge: z.number().int().min(5).max(25).nullable() });
export type SelfReadAge = z.infer<typeof selfReadAgeSchema>;
