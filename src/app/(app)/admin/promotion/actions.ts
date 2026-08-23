"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { promoteSchool, type PromotionMove, type PromotionResult } from "@/lib/promotion";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result =
  | PromotionResult
  | { ok: false; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

export async function promoteSchoolAction(
  moves: PromotionMove[],
  lastDayKey: string,
): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await promoteSchool(ctx, moves, {
      lastDayKey: /^\d{4}-\d{2}-\d{2}$/.test(lastDayKey) ? lastDayKey : undefined,
    });
    revalidatePath("/admin/promotion");
    revalidatePath("/admin/classes");
    revalidatePath("/admin/people");
    return result;
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[promotion]", error);
    return { ok: false };
  }
}
