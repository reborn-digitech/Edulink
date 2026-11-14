import { z } from "zod";

/**
 * office: request and response shapes for the phone's remaining school-office
 * screens (September 2026) — the list previews, resending an invitation, the
 * directory profile, the logo, deciding a safety report, telling a family,
 * the compliance exports as text, editing and retiring periods, clearing a
 * lesson, archiving an exam series and the notification housekeeping.
 * Area-prefixed export names, because `export *` collides otherwise.
 */

const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

/** A CSV row the parser could not use — a key and its numbers, never a sentence. */
const csvProblemSchema = z.object({
  line: z.number().int(),
  value: z.string(),
  reasonKey: z.string(),
  reasonVars: z.record(z.union([z.string(), z.number()])).optional(),
});

/* ---------------------------------------------------------------------- */
/* Previews: the server's own parser, run before anything is written       */
/* ---------------------------------------------------------------------- */

/** A pasted list, as the invite and intake forms send it. */
export const officeCsvBodySchema = z.object({ csv: z.string().min(1).max(500_000) });

export const officeInvitePreviewSchema = z.object({
  valid: z.array(z.object({ line: z.number().int(), name: z.string(), email: z.string(), subjects: z.array(z.string()) })),
  problems: z.array(csvProblemSchema),
});
export type OfficeInvitePreview = z.infer<typeof officeInvitePreviewSchema>;

export const officeIntakePreviewSchema = z.object({
  valid: z.array(
    z.object({
      line: z.number().int(),
      name: z.string(),
      birthdateKey: dateKey.nullable(),
      className: z.string().nullable(),
      guardianEmail: z.string().nullable(),
      /** A student code on the row: a transfer, linking an existing account. */
      transfer: z.boolean(),
      /** A class named that the school has no running class called. */
      unknownClass: z.boolean(),
    }),
  ),
  problems: z.array(csvProblemSchema),
  recognised: z.object({ name: z.boolean(), birthdate: z.boolean(), className: z.boolean(), pupilEmail: z.boolean(), guardianEmail: z.boolean() }),
});
export type OfficeIntakePreview = z.infer<typeof officeIntakePreviewSchema>;

/* ---------------------------------------------------------------------- */
/* The school's public directory profile, and its logo                     */
/* ---------------------------------------------------------------------- */

export const officeDirectoryProfileSchema = z.object({
  about: z.string().max(4000),
  admissionsContactMembershipId: id.nullable(),
});
export type OfficeDirectoryProfile = z.infer<typeof officeDirectoryProfileSchema>;

export const officeDirectoryPublishBodySchema = z.object({ published: z.boolean() });

/** A file this person uploaded through POST /api/v1/uploads; null takes the logo off. */
export const officeLogoBodySchema = z.object({ fileId: z.string().min(1).max(200).nullable() });
export const officeLogoSchema = z.object({ logoPath: z.string().nullable() });

/* ---------------------------------------------------------------------- */
/* Safety: deciding a report                                               */
/* ---------------------------------------------------------------------- */

const decisionNote = trimmed(1, 1000);

/** The author is told, with the note. */
export const officeTakeDownBodySchema = z.object({ targetType: z.enum(["POST", "COMMENT"]), targetId: id, note: decisionNote });
/** Only staff see the note. */
export const officeDismissBodySchema = z.object({ targetType: z.enum(["POST", "COMMENT", "USER"]), targetId: id, note: decisionNote });

/* ---------------------------------------------------------------------- */
/* Attendance: telling a family, and the compliance files                  */
/* ---------------------------------------------------------------------- */

export const officeAbsenceAlertBodySchema = z.object({ studentMembershipId: id });
/** `skipped`: this family was told within the last week, so nothing was sent. */
export const officeAbsenceAlertSchema = z.object({ notified: z.number().int(), skipped: z.boolean() });

export const officeRegisterExportQuerySchema = z.object({
  classId: id,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month"),
});
/** The file as text, for the system share sheet; the same bytes the web downloads. */
export const officeCsvExportSchema = z.object({ filename: z.string(), csv: z.string(), rows: z.number().int() });
export type OfficeCsvExport = z.infer<typeof officeCsvExportSchema>;

/* ---------------------------------------------------------------------- */
/* Timetable: editing the day, clearing a lesson                           */
/* ---------------------------------------------------------------------- */

export const officePeriodBodySchema = z.object({
  name: trimmed(1, 60),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  kind: z.enum(["LESSON", "BREAK"]),
});

/** `retired: true` takes the period off the day (its lessons are kept); `false` brings it back. */
export const officePeriodRetireBodySchema = z.object({ retired: z.boolean() });

/** weekday 0 (Sunday) to 6 (TA-544), as the slot door takes it; a cell with no lesson is refused by clearSlot. */
export const officeSlotClearBodySchema = z.object({ classId: id, periodId: id, weekday: z.number().int().min(0).max(6) });

/* ---------------------------------------------------------------------- */
/* Notification housekeeping                                               */
/* ---------------------------------------------------------------------- */

/** Days; null is the platform default. The ranges are the library's to enforce, in the reader's language. */
export const officeHousekeepingBodySchema = z.object({
  autoReadDays: z.number().int().min(0).max(100_000).nullable(),
  expireDays: z.number().int().min(0).max(100_000).nullable(),
});
