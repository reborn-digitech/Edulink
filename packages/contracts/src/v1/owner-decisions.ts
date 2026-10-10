import { z } from "zod";

/**
 * THE OWNER'S DECISIONS OF 10 OCTOBER 2026 (docs/audit-2026-10-05/08-remaining-risks.md,
 * R-61 Q2, R-69, R-70): the office's settlement of what a leaver still owes,
 * the previous schools' leaving certificates and published report cards on
 * the pupil's record at the new school and on the family's page, and the
 * one-click copy of the coded lines of the previous school's pupil record on
 * an admission matched by PEN. Every amount is integer paise; days are
 * YYYY-MM-DD keys; instants are ISO strings.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const iso = z.string();

/* ---------------------------------------------------------------------- */
/* R-61 Q2: settle on leaving                                              */
/* ---------------------------------------------------------------------- */

export const SETTLEMENT_CHOICES = ["CANCEL", "KEEP"] as const;
export const settlementChoiceSchema = z.enum(SETTLEMENT_CHOICES);
export type SettlementChoice = z.infer<typeof settlementChoiceSchema>;

export const SETTLEMENT_DESKS = ["ACCOUNTS", "LIBRARY", "HOSTEL", "LAB"] as const;

/** A demand still owed when the pupil left: its balance, whether it fell due after the leaving day, and the office's choice once made. */
export const settlementLineSchema = z.object({
  demandId: z.string(),
  label: z.string(),
  dueDateKey: dateKey,
  netPaise: z.number().int(),
  paidPaise: z.number().int(),
  balancePaise: z.number().int(),
  /** True for an instalment that fell due after the leaving day (a part-paid later instalment). */
  later: z.boolean(),
  choice: settlementChoiceSchema.nullable(),
});

export const leavingSettlementViewSchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  /** The leaving day; null while the pupil is on the roll (then nothing can be settled). */
  leftOnKey: dateKey.nullable(),
  /** What is still owed: part-paid later instalments and unpaid earlier ones, each with the office's choice once made. */
  owed: z.array(settlementLineSchema),
  /** What the departure itself cancelled: later instalments nothing was paid against. */
  cancelled: z.array(z.object({ demandId: z.string(), label: z.string(), dueDateKey: dateKey, netPaise: z.number().int() })),
  /** Items still out at each desk (books on loan, lab issues, a bed held), read from the no-dues lines; nothing here returns one. */
  items: z.array(z.object({ desk: z.enum(SETTLEMENT_DESKS), itemsOut: z.number().int(), owedPaise: z.number().int() })),
  /** The settlement once recorded: when, by whom, and the totals of the choices. */
  settled: z.object({ decidedAt: iso, decidedBy: z.string().nullable(), cancelledPaise: z.number().int(), keptPaise: z.number().int() }).nullable(),
  /** True for the office while the pupil has left and nothing is recorded yet. */
  canSettle: z.boolean(),
});
export type LeavingSettlementView = z.infer<typeof leavingSettlementViewSchema>;

export const leavingSettleBodySchema = z.object({
  lines: z.array(z.object({ demandId: cuid, choice: settlementChoiceSchema })).max(200),
});
export type LeavingSettleBody = z.infer<typeof leavingSettleBodySchema>;

export const familyLeavingQuerySchema = z.object({ childId: cuid.optional() });

/** The family's read of the outcome: what the office cancelled and what stays owed; null until the office has settled. */
export const familyLeavingSchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  leftOnKey: dateKey.nullable(),
  cancelledByDeparture: z.array(z.object({ label: z.string(), dueDateKey: dateKey, netPaise: z.number().int() })),
  settlement: z
    .object({
      decidedAt: iso,
      lines: z.array(z.object({ label: z.string(), dueDateKey: dateKey, balancePaise: z.number().int(), choice: settlementChoiceSchema })),
      cancelledPaise: z.number().int(),
      keptPaise: z.number().int(),
    })
    .nullable(),
});
export type FamilyLeaving = z.infer<typeof familyLeavingSchema>;

/* ---------------------------------------------------------------------- */
/* R-70: the previous schools                                              */
/* ---------------------------------------------------------------------- */

/** One published report card of a previous school, from its frozen snapshot (the subjects as the card printed them, never the marks behind it). */
export const previousSchoolCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  fromDateKey: dateKey,
  toDateKey: dateKey,
  publishedAt: iso.nullable(),
  attendancePresent: z.number().int(),
  attendanceTotal: z.number().int(),
  /** Percent to a thousandth, as stored; null where the card carries no overall figure. */
  overallPercent: z.number().nullable(),
  overallLetter: z.string().nullable(),
  gradePoints: z.number().nullable(),
  subjects: z.array(z.object({ subject: z.string(), percent: z.number().nullable(), letter: z.string().nullable() })),
  remark: z.string().nullable(),
});

export const previousSchoolSchema = z.object({
  /** The leaving certificate (SchoolRecord) that opens this school's documents to the reader. */
  recordId: z.string(),
  schoolName: z.string(),
  serial: z.string().nullable(),
  className: z.string().nullable(),
  gradeLevel: z.string().nullable(),
  joinedAt: iso,
  leftAt: iso,
  reason: z.string(),
  conduct: z.string().nullable(),
  attendanceMarked: z.number().int(),
  attendancePresent: z.number().int(),
  reportCardCount: z.number().int(),
  cards: z.array(previousSchoolCardSchema),
});

export const previousSchoolsViewSchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  /** Oldest departure last. Empty when the pupil has no live leaving certificate elsewhere, or the reader's clause does not open one. */
  schools: z.array(previousSchoolSchema),
});
export type PreviousSchoolsView = z.infer<typeof previousSchoolsViewSchema>;
export type PreviousSchool = z.infer<typeof previousSchoolSchema>;

export const familyPreviousSchoolsQuerySchema = z.object({ childId: cuid.optional() });

/* ---------------------------------------------------------------------- */
/* R-69: copy from the previous school's record                            */
/* ---------------------------------------------------------------------- */

/**
 * The lines a school may carry over from the previous school's pupil record,
 * as the owner listed them on 10 Oct 2026: the coded category, mother tongue
 * and nationality, the religion, caste and place of birth, and the parents'
 * names. Never the address, the phone numbers, the household's income or
 * occupations, a document, a health or an incident row, or the free-text
 * note. A coded line whose old value does not code is not copied.
 */
export const RECORD_COPY_FIELDS = ["category", "religion", "caste", "motherTongue", "placeOfBirth", "nationality", "fatherName", "motherName"] as const;
export const recordCopyFieldSchema = z.enum(RECORD_COPY_FIELDS);
export type RecordCopyField = z.infer<typeof recordCopyFieldSchema>;

export const recordCopyPreviewSchema = z.object({
  studentMembershipId: z.string(),
  fromSchoolName: z.string(),
  fromRecordId: z.string(),
  /** Each line the previous record holds, with whether this school's record still has it blank (only blanks are filled). */
  lines: z.array(z.object({ field: recordCopyFieldSchema, value: z.string(), blankHere: z.boolean() })),
  /** True for the office while at least one line is blank here. */
  canCopy: z.boolean(),
  /** When this school last copied from that record, from the audit log; null if never. */
  copiedAt: iso.nullable(),
});
export type RecordCopyPreview = z.infer<typeof recordCopyPreviewSchema>;

export const recordCopyResultSchema = z.object({
  studentMembershipId: z.string(),
  fromSchoolName: z.string(),
  copied: z.array(recordCopyFieldSchema),
});
export type RecordCopyResult = z.infer<typeof recordCopyResultSchema>;
