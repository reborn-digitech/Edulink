"use server";

import { revalidatePath } from "next/cache";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { checkIn } from "@/lib/staff-attendance";

/**
 * "I'm in", as the web button calls it. Present or late is the library's
 * decision in the school's own zone; this file only says what happened, or
 * why not, as a key. Only async functions and types may be exported from a
 * "use server" file — see tests/use-server-exports.test.ts.
 */
export type CheckInActionResult = { ok: boolean; late?: boolean; checkedInAt?: string; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

export async function checkInAction(): Promise<CheckInActionResult> {
  try {
    const ctx = await requireApiUser();
    const result = await checkIn(ctx);
    revalidatePath("/teacher/attendance/me");
    revalidatePath("/admin/staff-attendance");
    return { ok: true, late: result.late, checkedInAt: result.checkedInAt.toISOString() };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[staff check-in]", error);
    return { ok: false, errorKey: "common.tryAgain" };
  }
}
