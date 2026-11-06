import type { NextResponse } from "next/server";
import type { QuizBankStanding } from "@edulink/contracts";
import { quizBankStandingSchema } from "@edulink/contracts";
import type { BankResult } from "@/lib/app-admin";
import { AccessError } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { refused } from "../../shared/helpers";

/**
 * A desk write's answer: where the item now stands, in the contract's shape; an id that names no question
 * is a 404 (thrown, so apiFailure says it), an edit on a curated item a 403 FORBIDDEN with its sentence (one bank,
 * 7 Nov 2026: its words are changed in its file and imported again), every other refusal a 422 with its sentence.
 */
export async function answer(result: BankResult<QuizBankStanding>): Promise<NextResponse> {
  if (!result.ok) {
    if (result.errorKey === "quizReview.noSuchItem") throw new AccessError("quizReview.noSuchItem", "NOT_FOUND");
    if (result.errorKey === "quizReview.refuseEditCurated") throw new AccessError("quizReview.refuseEditCurated", "FORBIDDEN");
    return refused(result.errorKey);
  }
  return ok(quizBankStandingSchema.parse(result));
}
