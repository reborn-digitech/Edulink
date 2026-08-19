"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { submitReview } from "@/lib/reviews";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
};

export async function rate(input: {
  roundId: string;
  teacherMembershipId: string;
  scores: Record<string, number>;
}): Promise<Result> {
  try {
    const ctx = await requireApiRole("STUDENT", "PARENT");
    const result = await submitReview(ctx, input);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/reviews");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[reviews-rate]", error);
    return { ok: false, errorKey: "common.tryAgainMoment" };
  }
}
