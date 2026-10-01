import { z } from "zod";

/**
 * office-bulk: the office's three bulk doors of October 2026 — a timetable
 * pasted as CSV and previewed before it is written, a section's week copied
 * to its sister sections, and a bank statement matched to pupils and
 * recorded as fee payments. Each preview writes nothing; each commit is
 * the preview run again and written. Area-prefixed names, because
 * `export *` collides otherwise.
 */

const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

/** A CSV row the parser could not use — a key and its numbers, never a sentence. */
const csvProblemSchema = z.object({
  line: z.number().int(),
  value: z.string(),
  reasonKey: z.string(),
  reasonVars: z.record(z.union([z.string(), z.number()])).optional(),
});

/* ---------------------------------------------------------------------- */
/* Timetable import — POST /api/v1/office/timetable/import[/preview]       */
/* ---------------------------------------------------------------------- */

/** A pasted sheet: day, period, class, subject, teacher (email or name), room. Up to half a million characters, like the admission list. */
export const timetableImportBodySchema = z.object({ csv: z.string().min(1).max(500_000) });
export type TimetableImportBody = z.infer<typeof timetableImportBodySchema>;

/**
 * One lesson the sheet resolves to. `teacherIssueKey` names why the teacher
 * column could not be honoured (not on staff, two of that name, already
 * teaching another class then): the lesson is still written, without a
 * teacher, as the day-copy tool does. `replaces` says a lesson is already
 * in that cell and will be overwritten.
 */
export const timetableImportRowSchema = z.object({
  line: z.number().int(),
  weekday: z.number().int().min(0).max(6),
  periodId: id,
  periodName: z.string(),
  classId: id,
  className: z.string(),
  subject: z.string(),
  room: z.string().nullable(),
  teacherMembershipId: z.string().nullable(),
  teacherName: z.string().nullable(),
  teacherIssueKey: z.string().nullable(),
  teacherIssueVars: z.record(z.union([z.string(), z.number()])).optional(),
  replaces: z.boolean(),
});
export type TimetableImportRow = z.infer<typeof timetableImportRowSchema>;

export const timetableImportPreviewSchema = z.object({
  rows: z.array(timetableImportRowSchema),
  problems: z.array(csvProblemSchema),
  recognised: z.object({ day: z.boolean(), period: z.boolean(), className: z.boolean(), subject: z.boolean(), teacher: z.boolean(), room: z.boolean() }),
});
export type TimetableImportPreview = z.infer<typeof timetableImportPreviewSchema>;

export const timetableImportResultSchema = z.object({
  written: z.number().int(),
  replaced: z.number().int(),
  unstaffed: z.number().int(),
  classes: z.number().int(),
  problems: z.array(csvProblemSchema),
});
export type TimetableImportResult = z.infer<typeof timetableImportResultSchema>;

/* ---------------------------------------------------------------------- */
/* Copy a section's week to its sisters — POST /api/v1/office/timetable/copy */
/* ---------------------------------------------------------------------- */

export const timetableCopyBodySchema = z.object({ fromClassId: id, toClassIds: z.array(id).min(1).max(40) });
export type TimetableCopyBody = z.infer<typeof timetableCopyBodySchema>;

export const timetableCopyResultSchema = z.object({
  copied: z.number().int(),
  /** Lessons written without a teacher, for the office to fill. */
  unstaffed: z.number().int(),
  classes: z.array(z.object({ classId: id, className: z.string(), copied: z.number().int() })),
});
export type TimetableCopyResult = z.infer<typeof timetableCopyResultSchema>;

/* ---------------------------------------------------------------------- */
/* Bank statement import — POST /api/v1/fees/bank-import[/preview|/commit] */
/* ---------------------------------------------------------------------- */

export const feeBankImportBodySchema = z.object({ csv: z.string().min(1).max(500_000) });
export type FeeBankImportBody = z.infer<typeof feeBankImportBodySchema>;

/**
 * What one statement line would do: `new` records a payment for the pupil
 * named; `claim` confirms the UPI payment the family already claimed with
 * that UTR; `already` is a line whose reference is on a payment in the
 * ledger (a second import of the same statement); `unmatched` is for the
 * office to key by hand, with `problemKey` saying why.
 */
export const feeBankImportOutcomeSchema = z.enum(["new", "claim", "already", "unmatched"]);
export const feeBankImportLineSchema = z.object({
  line: z.number().int(),
  dateKey: dateKey.nullable(),
  description: z.string(),
  reference: z.string(),
  amountPaise: z.number().int().nullable(),
  /** CHEQUE | BANK | UPI, read off the narration. */
  method: z.string().nullable(),
  outcome: feeBankImportOutcomeSchema,
  studentMembershipId: z.string().nullable(),
  pupilName: z.string().nullable(),
  paymentId: z.string().nullable(),
  problemKey: z.string().nullable(),
});
export type FeeBankImportLine = z.infer<typeof feeBankImportLineSchema>;

export const feeBankImportPreviewSchema = z.object({
  lines: z.array(feeBankImportLineSchema),
  counts: z.object({ new: z.number().int(), claim: z.number().int(), already: z.number().int(), unmatched: z.number().int() }),
});
export type FeeBankImportPreview = z.infer<typeof feeBankImportPreviewSchema>;

export const feeBankImportResultSchema = z.object({
  recorded: z.number().int(),
  confirmed: z.number().int(),
  already: z.number().int(),
  unmatched: z.number().int(),
  failed: z.array(z.object({ line: z.number().int(), error: z.string() })),
});
export type FeeBankImportResult = z.infer<typeof feeBankImportResultSchema>;
