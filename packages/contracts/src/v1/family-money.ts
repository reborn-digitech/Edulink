import { z } from "zod";
import { feeDemandRowSchema } from "./fees";

/**
 * family money and time: a guardian choosing an open fee plan for their
 * child, the year's payment calendar, the pupil's own read of their dues
 * (never a way to pay — pupils do not pay), and the fortnight agenda the
 * pupil and the guardian share.
 *
 * EVERY AMOUNT IS INTEGER PAISE; days are YYYY-MM-DD keys in the school's
 * zone; instants are ISO strings.
 */

const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const paise = z.number().int().min(0);
const yearRef = z.object({ id: z.string(), name: z.string() }).nullable();

/* ---------------------------------------------------------------------- */
/* Fee plans a family may choose                                           */
/* ---------------------------------------------------------------------- */

export const familyChildFeesQuerySchema = z.object({ student: id.optional(), childId: id.optional() });

export const familyFeePlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  gradeLevel: z.string().nullable(),
  totalPaise: paise,
  instalments: z.array(z.object({ id: z.string(), label: z.string(), dueDateKey: dateKey, totalPaise: paise })),
});
export const familyFeePlansSchema = z.object({
  student: z.object({ studentMembershipId: z.string(), name: z.string(), gradeLevel: z.string().nullable() }),
  year: yearRef,
  /** The plan the child is on already, if any; while set, nothing can be chosen. */
  current: z.object({ structureId: z.string(), structureName: z.string(), paidPaise: paise }).nullable(),
  /** Whether a choice can be made now: no plan yet and nothing paid this year. */
  canEnrol: z.boolean(),
  plans: z.array(familyFeePlanSchema),
});
export type FamilyFeePlans = z.infer<typeof familyFeePlansSchema>;

export const familyFeeEnrolBodySchema = z.object({ student: id, planId: id });
export const familyFeeEnrolledSchema = z.object({ ok: z.literal(true), structureId: z.string(), demands: z.number().int() });

/* ---------------------------------------------------------------------- */
/* The payment calendar                                                    */
/* ---------------------------------------------------------------------- */

export const familyFeeCalendarKindSchema = z.enum(["INSTALMENT", "DUE", "REMINDER"]);
export const familyFeeCalendarRowSchema = z.object({
  date: dateKey,
  title: z.string(),
  amount: paise,
  /** UPCOMING | DUE_SOON | OVERDUE | PAID | PART | WAIVED | CARRIED */
  status: z.string(),
  kind: familyFeeCalendarKindSchema,
  /** The demand this row is about, when it has one. */
  demandId: z.string().nullable(),
});
export const familyFeeCalendarSchema = z.object({
  student: z.object({ studentMembershipId: z.string(), name: z.string() }),
  year: yearRef,
  todayKey: dateKey,
  rows: z.array(familyFeeCalendarRowSchema),
});
export type FamilyFeeCalendar = z.infer<typeof familyFeeCalendarSchema>;

/* ---------------------------------------------------------------------- */
/* The pupil's own read                                                    */
/* ---------------------------------------------------------------------- */

export const pupilFeesSchema = z.object({
  /** Whether this pupil may see their fees at all: the school has set an age and the pupil is at or past it. */
  allowed: z.boolean(),
  /** The age the school set, or null when pupils see nothing. */
  fromAge: z.number().int().nullable(),
  /** When not allowed: the pupil has no date of birth on file, or is under the age. */
  reason: z.enum(["OFF", "NO_BIRTHDATE", "UNDER_AGE"]).nullable(),
  schoolName: z.string(),
  year: yearRef,
  todayKey: dateKey,
  demands: z.array(feeDemandRowSchema),
  totals: z.object({ outstandingPaise: paise, overduePaise: paise, paidPaise: paise }),
  nextDue: z.object({ label: z.string(), dueDateKey: dateKey, amountPaise: paise }).nullable(),
});
export type PupilFees = z.infer<typeof pupilFeesSchema>;

export const feePupilViewAgeSchema = z.object({ pupilFeeViewAge: z.number().int().min(5).max(25).nullable() });
export const feeStructureSelfEnrolBodySchema = z.object({ open: z.boolean() });

/* ---------------------------------------------------------------------- */
/* The fortnight agenda                                                    */
/* ---------------------------------------------------------------------- */

export const familyAgendaQuerySchema = z.object({ student: id.optional(), childId: id.optional(), days: z.coerce.number().int().min(1).max(60).optional() });
export const familyAgendaKindSchema = z.enum(["EXAM", "WORK", "SESSION", "MEETING", "CLOSURE", "EVENT", "FEE"]);
export const familyAgendaRowSchema = z.object({
  id: z.string(),
  kind: familyAgendaKindSchema,
  dateKey: dateKey,
  /** The instant it starts, when it has a time; a due date at the day's end has one too. */
  at: z.string().datetime().nullable(),
  /** The last day, for a closure that spans several. */
  endDateKey: dateKey.nullable(),
  title: z.string(),
  detail: z.string().nullable(),
  amountPaise: paise.nullable(),
  /** The web page the row opens — the role's own path; the phone maps it to a screen. */
  href: z.string(),
});
export const familyAgendaSchema = z.object({
  children: z.array(z.object({ studentMembershipId: z.string(), name: z.string(), schoolName: z.string(), leftAt: z.string().nullable() })),
  student: z.object({ studentMembershipId: z.string(), name: z.string(), schoolName: z.string() }),
  fromKey: dateKey,
  toKey: dateKey,
  days: z.number().int(),
  timeZone: z.string(),
  rows: z.array(familyAgendaRowSchema),
});
export type FamilyAgenda = z.infer<typeof familyAgendaSchema>;
export type FamilyAgendaRow = z.infer<typeof familyAgendaRowSchema>;
