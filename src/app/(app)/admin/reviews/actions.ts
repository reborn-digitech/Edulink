"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { openReviewRound, closeReviewRound } from "@/lib/reviews";
import type { ReviewAudience } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
};

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[reviews]", error);
  return { ok: false, errorKey: "common.tryAgainMoment" };
}

export async function openRound(input: {
  teacherMembershipIds: string[];
  audience: ReviewAudience;
  closesDateKey: string;
}): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await openReviewRound(ctx, input);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/reviews");
    revalidatePath("/reviews");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function closeRound(roundId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await closeReviewRound(ctx, roundId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/reviews");
    revalidatePath("/reviews");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
