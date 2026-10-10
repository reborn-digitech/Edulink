"use server";

import { revalidatePath } from "next/cache";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { copyPreviousRecord } from "@/lib/record-copy";

/**
 * The one click of R-69 (10 Oct 2026): the office copies the coded lines of
 * the previous school's record onto this school's. The library decides what
 * may be copied and audits both sides; this file checks the role and turns a
 * refusal into a key the panel says in the reader's language. Only async
 * functions and types leave a "use server" file.
 */
export type RecordCopyActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number>; copied?: number; school?: string };

export async function copyPreviousRecordAction(studentMembershipId: string): Promise<RecordCopyActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    if (typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    const result = await copyPreviousRecord(ctx, studentMembershipId);
    revalidatePath(`/admin/records/${studentMembershipId}`);
    revalidatePath("/admin/admissions/applications");
    revalidatePath("/parent/record");
    revalidatePath("/student/record");
    return { ok: true, copied: result.copied.length, school: result.fromSchoolName };
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[record-copy]", error);
    return { ok: false, errorKey: "common.tryAgain" };
  }
}
