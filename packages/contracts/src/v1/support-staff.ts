import { z } from "zod";
import { realDateKey } from "./calendar-keys";
import { paymentModeSchema, staffSalarySchema } from "./payroll";

/**
 * owner-batch-item2a (27 October 2026): SUPPORT STAFF WITHOUT A LOGIN. A
 * cleaner, cook, guard, peon, gardener or ayah is paid by the school like
 * everybody else, but everyone on a pay run had to be a member with an
 * account, and nobody could add one. The office now adds a support worker
 * from the people page: the name, a phone the office rings (optional), the
 * job (the staff record's designation, free text), the day they joined, and
 * optionally the salary they are paid. One role, SUPPORT, with the job in
 * the designation (the owner's decision), not a role per job.
 *
 * POST /api/v1/admin/people/support. The account made has no email, phone,
 * password or handle: nobody can sign in as it. The phone is the staff
 * record's `contactPhone`, never the account's sign-in phone.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const paise = z.number().int().min(0).max(2_000_000_000);

/** The salary given with the worker: the structure, the monthly basic and how they are paid. PAN, UAN, ESI and the bank or UPI details are added on the payroll's salaries page. */
export const supportStaffSalarySchema = z.object({
  structureId: cuid,
  basicPaise: paise.refine((n) => n > 0, "basic"),
  paymentMode: paymentModeSchema.default("CASH"),
  /** From when this salary is paid; the day they joined when left out. */
  effectiveFrom: realDateKey.optional(),
});
export type SupportStaffSalary = z.infer<typeof supportStaffSalarySchema>;

export const supportStaffCreateSchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  /** A ten-digit Indian mobile or an international number; kept as E.164 or refused. Blank for none. */
  phone: z.string().trim().max(24).default(""),
  /** The job: cleaner, cook, guard, peon, gardener, ayah… free text, as the board calls it. */
  designation: z.string().trim().min(2, "designation").max(80, "designation"),
  /** The day they joined this school (YYYY-MM-DD); not a day still to come. */
  joinedOnKey: realDateKey,
  /** Optional: the salary they are paid, which needs the payroll module on. */
  salary: supportStaffSalarySchema.nullable().default(null),
});
export type SupportStaffCreate = z.infer<typeof supportStaffCreateSchema>;

export const supportStaffCreatedSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  role: z.literal("SUPPORT"),
  designation: z.string(),
  joinedOnKey: z.string(),
  /** E.164, or null when none was given. */
  phone: z.string().nullable(),
  /** The salary saved with the worker (payroll's own view: PAN and bank as their last four only), or null. */
  salary: staffSalarySchema.nullable(),
  /** True when the same worker was added a moment ago (a second press): this is that worker, and nothing new was made. */
  duplicate: z.boolean(),
});
export type SupportStaffCreated = z.infer<typeof supportStaffCreatedSchema>;
