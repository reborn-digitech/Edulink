"use server";

import { revalidatePath } from "next/cache";
import { officeSyllabusSaveSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { saveOfficeSyllabus } from "@/lib/syllabus";

/**
 * The office's one write on the syllabus — replace a grade and subject's
 * chapter list in order — as the web editor calls it. Who may write is
 * settled inside src/lib/syllabus.ts; this file only checks the shape and
 * turns a refusal into a key the editor can say in the reader's language.
 * Only async functions and types may be exported from a "use server" file —
 * see tests/use-server-exports.test.ts.
 */
export type SyllabusActionResult = { ok: boolean; units?: number; removed?: number; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function failure(error: unknown): SyllabusActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[syllabus]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function saveOfficeSyllabusAction(input: unknown): Promise<SyllabusActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = officeSyllabusSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const { units, removed } = await saveOfficeSyllabus(ctx, parsed.data);
    revalidatePath("/admin/syllabus");
    revalidatePath("/admin/syllabus/coverage");
    revalidatePath("/principal");
    return { ok: true, units, removed };
  } catch (error) {
    return failure(error);
  }
}
