import { z } from "zod";

/**
 * The library module (module LIBRARY, role LIBRARIAN; the owner's decision of
 * 3 October 2026). The desk lends copies to members — a pupil or a member of
 * staff — until a due day, renews within the school's limits, keeps a queue
 * per title, and records fines. A fine is never money the platform takes
 * (decision 0003): it becomes a demand on the pupil's fee ledger under the
 * head the office chose, or a due the office settles at its own counter.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

export const LIBRARY_COPY_STATUSES = ["AVAILABLE", "ISSUED", "LOST", "WITHDRAWN", "REPAIR"] as const;
export const libraryCopyStatusSchema = z.enum(LIBRARY_COPY_STATUSES);
export type LibraryCopyStatus = z.infer<typeof libraryCopyStatusSchema>;
/** What the desk may set by hand: ISSUED is the loan's alone. */
export const LIBRARY_DESK_STATUSES = ["AVAILABLE", "LOST", "WITHDRAWN", "REPAIR"] as const;

export const LIBRARY_FINE_REASONS = ["OVERDUE", "DAMAGE", "LOST"] as const;
export const libraryFineReasonSchema = z.enum(LIBRARY_FINE_REASONS);
export type LibraryFineReason = z.infer<typeof libraryFineReasonSchema>;
export const LIBRARY_FINE_STATUSES = ["DUE", "PAID", "WAIVED"] as const;
export const libraryFineStatusSchema = z.enum(LIBRARY_FINE_STATUSES);

/** The book's language, coded (English, Hindi, Marathi, Sanskrit, Urdu, other). */
export const LIBRARY_LANGUAGES = ["EN", "HI", "MR", "SA", "UR", "OTHER"] as const;
export const libraryLanguageSchema = z.enum(LIBRARY_LANGUAGES);
export const LIBRARY_CATEGORIES = ["GENERAL", "FICTION", "NON_FICTION", "REFERENCE", "TEXTBOOK", "PERIODICAL", "CHILDREN"] as const;
export const libraryCategorySchema = z.enum(LIBRARY_CATEGORIES);
/** STUDENT_COLLEGE and FACULTY borrow on a college's own terms (4 Oct 2026; LibrarySettings faculty… and collegeStudent… columns). */
export const LIBRARY_MEMBER_KINDS = ["PUPIL", "STAFF", "STUDENT_COLLEGE", "FACULTY"] as const;
export const libraryMemberKindSchema = z.enum(LIBRARY_MEMBER_KINDS);

/**
 * An ISBN as printed (hyphens and spaces allowed), kept as its ten or thirteen
 * characters; the check digit is verified, so a typo is refused at the desk
 * rather than found as a second copy of the same book.
 */
export function normaliseIsbn(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(s)) {
    let sum = 0;
    for (let i = 0; i < 10; i += 1) sum += (s[i] === "X" ? 10 : Number(s[i])) * (10 - i);
    return sum % 11 === 0 ? s : null;
  }
  if (/^\d{13}$/.test(s)) {
    let sum = 0;
    for (let i = 0; i < 13; i += 1) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0 ? s : null;
  }
  return null;
}
// qb-C (31 Oct 2026, QB-13): one book, one key. An ISBN-10 and the ISBN-13 printed for the same book are one title.
/** The ISBN-13 of a checked ISBN (ten or thirteen characters, as normaliseIsbn returns it): an ISBN-10 gains 978 and a new check digit. */
export function isbn13(isbn: string): string {
  if (isbn.length === 13) return isbn;
  const body = `978${isbn.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  return `${body}${(10 - (sum % 10)) % 10}`;
}
/** Every form one book may be catalogued under: its ISBN-13 and, for a 978 number, its ISBN-10. */
export function isbnForms(isbn: string): string[] {
  const long = isbn13(isbn);
  if (!long.startsWith("978")) return [long];
  const body = long.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(body[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return [long, `${body}${check === 10 ? "X" : String(check)}`];
}
/**
 * An e-resource's name as the desk compares it (QB-12): trimmed, every run of spaces one space, lower case, so
 * "ZZ DIKSHA", "zz diksha" and "ZZ  DIKSHA" are one resource. Stored as LibraryEResource.nameKey, unique per school;
 * this is its only writer (data:audit "eresource-name-key" holds the rows to it).
 */
export function eResourceNameKey(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}
// qb-C end

export const isbnSchema = z
  .string()
  .trim()
  .max(20)
  .transform((v, ctx) => {
    const n = normaliseIsbn(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "isbn" });
      return z.NEVER;
    }
    return n;
  });

/** The number written in the book; letters, digits and - / . only. */
export const accessionSchema = z.string().trim().min(1).max(30).regex(/^[A-Za-z0-9][A-Za-z0-9\-/.]*$/, "accession");

/* ---- settings ---------------------------------------------------------- */

export const librarySettingsSaveSchema = z.object({
  pupilLimit: z.number().int().min(0).max(20),
  pupilLoanDays: z.number().int().min(1).max(120),
  staffLimit: z.number().int().min(0).max(50),
  staffLoanDays: z.number().int().min(1).max(365),
  maxRenewals: z.number().int().min(0).max(10),
  finePerDayPaise: z.number().int().min(0).max(100_000),
  /** The fee head a pupil's fine is charged under; null keeps fines as counter dues. */
  fineHeadId: cuid.nullable(),
});
export type LibrarySettingsSave = z.infer<typeof librarySettingsSaveSchema>;

export const librarySettingsSchema = librarySettingsSaveSchema.extend({
  fineHeads: z.array(z.object({ id: z.string(), name: z.string(), code: z.string() })),
  stockTakeStartedAt: iso.nullable(),
  /** The office writes the rules; the desk and the head read them. */
  canEdit: z.boolean(),
});
export type LibrarySettingsView = z.infer<typeof librarySettingsSchema>;

/* ---- the catalogue ----------------------------------------------------- */

export const libraryTitleSaveSchema = z.object({
  isbn: isbnSchema.nullable().default(null),
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().max(120).default(""),
  publisher: z.string().trim().max(120).default(""),
  year: z.number().int().min(1000).max(2100).nullable().default(null),
  subject: z.string().trim().max(80).default(""),
  language: libraryLanguageSchema.default("OTHER"),
  category: libraryCategorySchema.default("GENERAL"),
});
export type LibraryTitleSave = z.infer<typeof libraryTitleSaveSchema>;

export const libraryCopyInputSchema = z.object({ accession: accessionSchema, rack: z.string().trim().max(40).default("") });
export const libraryTitleCreateSchema = libraryTitleSaveSchema.extend({ copies: z.array(libraryCopyInputSchema).max(50).default([]) });
export type LibraryTitleCreate = z.infer<typeof libraryTitleCreateSchema>;

export const libraryTitleRowSchema = z.object({
  id: z.string(),
  isbn: z.string().nullable(),
  title: z.string(),
  author: z.string(),
  publisher: z.string(),
  year: z.number().int().nullable(),
  subject: z.string(),
  language: libraryLanguageSchema,
  category: libraryCategorySchema,
  /** Copies the library lends (lost and withdrawn ones are not counted). */
  copies: z.number().int(),
  /** On the shelf and not held for someone in the queue. */
  available: z.number().int(),
  /** Members waiting in the queue. */
  waiting: z.number().int(),
});
export type LibraryTitleRow = z.infer<typeof libraryTitleRowSchema>;

export const libraryCatalogueQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  /** A guardian's child, whose school's catalogue is read; the first child when omitted. */
  childId: cuid.optional(),
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export const libraryCatalogueSchema = z.object({ items: z.array(libraryTitleRowSchema), nextCursor: z.string().nullable() });

export const libraryCopyRowSchema = z.object({
  id: z.string(),
  accession: z.string(),
  rack: z.string(),
  status: libraryCopyStatusSchema,
  /** Seen in the running stock-take. */
  seen: z.boolean(),
  /** The desk's view only: who has it and until when. */
  borrowerName: z.string().nullable(),
  dueOn: dateKey.nullable(),
  /** Held on the shelf for the first in the queue. */
  heldFor: z.string().nullable(),
});

export const libraryQueueEntrySchema = z.object({ id: z.string(), memberName: z.string(), placedAt: iso, ready: z.boolean() });

export const libraryTitleViewSchema = z.object({
  title: libraryTitleRowSchema,
  /** Empty except for the desk. */
  copies: z.array(libraryCopyRowSchema),
  queue: z.array(libraryQueueEntrySchema),
  /** The reader's own place in the queue (or their child's). */
  mine: z.object({ id: z.string(), placedAt: iso, ready: z.boolean(), position: z.number().int() }).nullable(),
  canEdit: z.boolean(),
  canReserve: z.boolean(),
});
export type LibraryTitleView = z.infer<typeof libraryTitleViewSchema>;

export const libraryCopySaveSchema = z.object({ titleId: cuid, accession: accessionSchema, rack: z.string().trim().max(40).default("") });
export const libraryCopyUpdateSchema = z
  .object({ status: z.enum(LIBRARY_DESK_STATUSES).optional(), rack: z.string().trim().max(40).optional() })
  .refine((v) => v.status !== undefined || v.rack !== undefined, "empty");

/** A pasted sheet: a header row naming title, author, isbn, copies, accession (and optionally publisher, year, subject, language, category, rack). */
export const libraryImportSchema = z.object({ text: z.string().min(1).max(500_000) });
export const LIBRARY_IMPORT_SKIPS = ["NO_TITLE", "BAD_ISBN", "BAD_YEAR", "BAD_ACCESSION", "ACCESSION_TAKEN", "TOO_MANY_COPIES"] as const;
export const libraryImportResultSchema = z.object({
  titlesCreated: z.number().int(),
  titlesMatched: z.number().int(),
  copiesCreated: z.number().int(),
  skipped: z.array(z.object({ line: z.number().int(), reason: z.enum(LIBRARY_IMPORT_SKIPS) })),
  /** The header named no title column: nothing was read. */
  noHeader: z.boolean(),
});
export type LibraryImportResult = z.infer<typeof libraryImportResultSchema>;

/* ---- members, loans, fines, the queue ----------------------------------- */

export const libraryMemberSummarySchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  kind: libraryMemberKindSchema,
  className: z.string().nullable(),
  cardNumber: z.string().nullable(),
  onLoan: z.number().int(),
  limit: z.number().int(),
  /** Fines still due, in paise. */
  owedPaise: z.number().int(),
});
export type LibraryMemberSummary = z.infer<typeof libraryMemberSummarySchema>;
export const libraryMemberSearchQuerySchema = z.object({ q: z.string().trim().min(1).max(80) });
export const libraryMemberSearchSchema = z.object({ items: z.array(libraryMemberSummarySchema) });

export const libraryLoanSchema = z.object({
  id: z.string(),
  copyId: z.string(),
  accession: z.string(),
  titleId: z.string(),
  title: z.string(),
  author: z.string(),
  membershipId: z.string(),
  memberName: z.string(),
  className: z.string().nullable(),
  issuedAt: iso,
  dueOn: dateKey,
  returnedAt: iso.nullable(),
  renewedCount: z.number().int(),
  /** Days past the due day, today in the school's zone; 0 when not late. */
  overdueDays: z.number().int(),
  canRenew: z.boolean(),
});
export type LibraryLoan = z.infer<typeof libraryLoanSchema>;

export const libraryFineSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  title: z.string(),
  membershipId: z.string(),
  memberName: z.string(),
  paise: z.number().int(),
  reason: libraryFineReasonSchema,
  createdAt: iso,
  status: libraryFineStatusSchema,
  /** Charged on the pupil's fee ledger, where the family pays it with their fees. */
  onLedger: z.boolean(),
  waivedReason: z.string().nullable(),
});
export type LibraryFine = z.infer<typeof libraryFineSchema>;

export const libraryReservationSchema = z.object({
  id: z.string(),
  titleId: z.string(),
  title: z.string(),
  membershipId: z.string(),
  memberName: z.string(),
  placedAt: iso,
  ready: z.boolean(),
  readyAccession: z.string().nullable(),
  /** 1 for the first in the title's queue. */
  position: z.number().int(),
});
export type LibraryReservation = z.infer<typeof libraryReservationSchema>;

export const libraryMemberViewSchema = z.object({
  member: libraryMemberSummarySchema,
  loans: z.array(libraryLoanSchema),
  fines: z.array(libraryFineSchema),
  reservations: z.array(libraryReservationSchema),
});
export type LibraryMemberView = z.infer<typeof libraryMemberViewSchema>;

export const libraryLookupQuerySchema = z.object({ code: z.string().trim().min(1).max(40) });
export const libraryLookupSchema = z.object({
  kind: z.enum(["COPY", "MEMBER", "TITLE", "NONE"]),
  copy: libraryCopyRowSchema.extend({ titleId: z.string(), title: z.string(), author: z.string(), loanId: z.string().nullable() }).nullable(),
  member: libraryMemberSummarySchema.nullable(),
  title: libraryTitleRowSchema.nullable(),
});
export type LibraryLookup = z.infer<typeof libraryLookupSchema>;

export const libraryIssueCreateSchema = z.object({ accession: accessionSchema, membershipId: cuid });
export const libraryReturnSchema = z.object({ accession: accessionSchema });
export const libraryReturnResultSchema = z.object({
  loan: libraryLoanSchema,
  fine: libraryFineSchema.nullable(),
  /** The copy is now held for the first in its title's queue. */
  heldFor: z.object({ reservationId: z.string(), memberName: z.string() }).nullable(),
});
export type LibraryReturnResult = z.infer<typeof libraryReturnResultSchema>;

export const libraryRenewSchema = z.object({ issueId: cuid });
export const libraryOverdueSchema = z.object({ todayKey: dateKey, items: z.array(libraryLoanSchema) });
export const libraryNoticesResultSchema = z.object({ sent: z.number().int(), already: z.number().int() });

export const libraryReservationCreateSchema = z.object({
  titleId: cuid,
  /** A guardian's child to reserve for; the first child when omitted. */
  childId: cuid.optional(),
  /** The desk reserving for a member. */
  membershipId: cuid.optional(),
});
export const libraryReservationsSchema = z.object({ items: z.array(libraryReservationSchema) });

export const libraryFinesQuerySchema = z.object({ status: z.enum(["DUE", "ALL"]).default("DUE") });
export const libraryFinesSchema = z.object({ items: z.array(libraryFineSchema), duePaise: z.number().int() });
export const libraryFineCreateSchema = z.object({ issueId: cuid, reason: z.enum(["DAMAGE", "LOST"]), paise: z.number().int().min(1).max(10_000_000) });
export const libraryFineWaiveSchema = z.object({ reason: z.string().trim().min(3).max(300) });

export const libraryStockTakeActionSchema = z.object({ action: z.enum(["START", "FINISH"]) });
export const libraryStockTakeSeenSchema = z.object({ accession: accessionSchema });
export const libraryStockTakeSchema = z.object({
  startedAt: iso.nullable(),
  total: z.number().int(),
  seen: z.number().int(),
  /** Copies not yet seen (on the shelf or the repair rack — loans are not looked for), the first two hundred. */
  unseen: z.array(z.object({ accession: z.string(), title: z.string(), rack: z.string(), status: libraryCopyStatusSchema })),
});
export type LibraryStockTake = z.infer<typeof libraryStockTakeSchema>;

export const libraryReportsSchema = z.object({
  totals: z.object({ titles: z.number().int(), copies: z.number().int(), onLoan: z.number().int(), overdue: z.number().int(), members: z.number().int(), duePaise: z.number().int() }),
  /** The last twelve months, oldest first, "YYYY-MM". */
  issuesByMonth: z.array(z.object({ month: z.string(), count: z.number().int() })),
  mostBorrowed: z.array(z.object({ titleId: z.string(), title: z.string(), count: z.number().int() })),
  /** null: members of staff, who have no class. */
  overdueByClass: z.array(z.object({ className: z.string().nullable(), count: z.number().int() })),
});
export type LibraryReports = z.infer<typeof libraryReportsSchema>;

export const libraryMineQuerySchema = z.object({ childId: cuid.optional() });
export const libraryMineSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  limit: z.number().int(),
  loans: z.array(libraryLoanSchema),
  fines: z.array(libraryFineSchema),
  reservations: z.array(libraryReservationSchema),
});
export type LibraryMine = z.infer<typeof libraryMineSchema>;

/* ---- a periodical's subscription and volumes (G4-21, risks batch 5 Oct 2026) ---------------------------------- */

/** How often a periodical comes. */
export const PERIODICAL_FREQUENCIES = ["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "BIMONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "IRREGULAR"] as const;
export const periodicalFrequencySchema = z.enum(PERIODICAL_FREQUENCIES);
/** POST /api/v1/library/titles/{titleId}/subscription — a PERIODICAL's subscription: how often and the days it runs (refused on a book). */
export const periodicalSubscriptionSaveSchema = z.object({ frequency: periodicalFrequencySchema, subscriptionFrom: dateKey.nullable(), subscriptionUntil: dateKey.nullable() });
export type PeriodicalSubscriptionSave = z.infer<typeof periodicalSubscriptionSaveSchema>;
/** POST /api/v1/library/titles/{titleId}/volumes — a volume (and issue) received; one row per volume and issue. */
export const libraryVolumeSaveSchema = z.object({ volume: z.string().trim().min(1).max(20), issue: z.string().trim().max(20).default(""), receivedOn: dateKey });
export type LibraryVolumeSave = z.infer<typeof libraryVolumeSaveSchema>;
export const libraryVolumeSchema = z.object({ id: z.string(), volume: z.string(), issue: z.string(), receivedOn: dateKey });
/** GET /api/v1/library/titles/{titleId}/volumes — the periodical, its subscription (active today or not) and its volumes, newest first. */
export const periodicalViewSchema = z.object({
  titleId: z.string(),
  title: z.string(),
  frequency: periodicalFrequencySchema.nullable(),
  subscriptionFrom: dateKey.nullable(),
  subscriptionUntil: dateKey.nullable(),
  /** The subscription runs today (from on or before today, until on or after it, either open). */
  active: z.boolean(),
  volumes: z.array(libraryVolumeSchema),
  canEdit: z.boolean(),
});
export type PeriodicalView = z.infer<typeof periodicalViewSchema>;
