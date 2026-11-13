import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { PlanRequiredError } from "@/lib/access-error";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The page's `if (error instanceof AccessError) notFound()`, for a handler:
 * a refusal on an id somebody else owns is a 404, never a 403 that confirms
 * the row exists. Only for reads and for writes whose every thrown refusal
 * is an ownership one — a "closed" or "wrong role" refusal must stay a 403.
 */
export async function asNotFound<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    // TA-322: a plan this person lacks is not an id somebody else owns: it goes to apiFailure as it is, a 402
    // PLAN_REQUIRED naming the plan and the feature, which the phone draws its plan card from.
    if (error instanceof PlanRequiredError) throw error;
    if (error instanceof AccessError && error.code === "FORBIDDEN") throw new AccessError(error.key, "NOT_FOUND", error.vars);
    throw error;
  }
}

/** A lib result of `{ ok: false, errorKey }` — the form's whole-form refusal — as a 422 in the envelope. */
export async function refused(key: TranslationKey, vars?: Record<string, string | number>): Promise<NextResponse> {
  const t = await getT();
  return NextResponse.json(apiErrorSchema.parse({ error: t(key, vars), code: "BAD_REQUEST" }), {
    status: 422,
    headers: { "Cache-Control": "no-store" },
  });
}

export function query(request: Request): URLSearchParams {
  return new URL(request.url).searchParams;
}

/** `?x=` and a missing `x` are both "not given". */
export function text(params: URLSearchParams, name: string): string | undefined {
  return params.get(name)?.trim() || undefined;
}
