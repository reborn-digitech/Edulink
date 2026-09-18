"use server";

import { revalidatePath } from "next/cache";
import { staffAttendanceSettingsSchema, staffRegisterMarkSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { markStaffRegister, saveStaffAttendanceSettings } from "@/lib/staff-attendance";

/**
 * The office's two writes on the staff register — mark a day, set the
 * check-in time — as the web form calls them. Who may do either is settled
 * inside src/lib/staff-attendance.ts; this file only checks the shape and
 * turns a refusal into a key the form can say in the reader's language.
 * Only async functions and types may be exported from a "use server" file —
 * see tests/use-server-exports.test.ts.
 */
export type StaffAttendanceActionResult = { ok: boolean; marked?: number; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function failure(error: unknown): StaffAttendanceActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[staff attendance]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function markStaffRegisterAction(input: unknown): Promise<StaffAttendanceActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = staffRegisterMarkSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const { marked } = await markStaffRegister(ctx, parsed.data);
    revalidatePath("/admin/staff-attendance");
    revalidatePath("/teacher/attendance/me");
    return { ok: true, marked };
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffAttendanceSettingsAction(input: unknown): Promise<StaffAttendanceActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = staffAttendanceSettingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    await saveStaffAttendanceSettings(ctx, parsed.data);
    revalidatePath("/admin/staff-attendance");
    revalidatePath("/teacher/attendance/me");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
