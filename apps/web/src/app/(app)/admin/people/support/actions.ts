"use server";

import { revalidatePath } from "next/cache";
import { supportStaffCreateSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { addSupportStaff } from "@/lib/support-staff";
import { RuleRefusal } from "@/lib/rule-refusal";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * owner-batch-item2a (27 Oct 2026): the office adds a support worker with no login, from the people page. The same
 * library as POST /api/v1/admin/people/support; the answer names the field a refusal is about.
 */
export type AddSupportResult =
  | { ok: true; membershipId: string; duplicate: boolean; salary: boolean }
  | { ok: false; errorKey: TranslationKey; errorVars?: Record<string, string | number>; field?: string; error?: string };

const FIELD_KEY: Record<string, TranslationKey> = {
  name: "supportStaff.invalidName",
  designation: "supportStaff.invalidDesignation",
  phone: "supportStaff.refusePhone",
  joinedOnKey: "supportStaff.invalidDate",
  "salary.basicPaise": "supportStaff.invalidBasic",
  "salary.structureId": "payroll.refuseUnknownStructure",
  "salary.paymentMode": "supportStaff.invalidBasic",
};

export async function addSupportStaffAction(input: unknown): Promise<AddSupportResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = supportStaffCreateSchema.safeParse(input);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".") ?? "";
      return { ok: false, errorKey: FIELD_KEY[field] ?? "supportStaff.notAdded", field };
    }
    const made = await addSupportStaff(ctx, parsed.data);
    revalidatePath("/admin/people");
    revalidatePath("/admin/payroll/salaries");
    return { ok: true, membershipId: made.membershipId, duplicate: made.duplicate, salary: made.salary !== null };
  } catch (error) {
    if (error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars, field: error.field };
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[support-staff]", error);
    return { ok: false, errorKey: "common.tryAgainMoment" };
  }
}
