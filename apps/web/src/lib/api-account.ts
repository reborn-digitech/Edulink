import "server-only";
import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { refusalText, type Refusal } from "@/lib/i18n/refusal";

/**
 * A lib refusal, as the /api/v1/account handlers answer it.
 *
 * The libs behind the account page (lib/account.ts, lib/passwords.ts) refuse
 * with a KEY and, for the code steps, a retry-after — the same shape the
 * server actions turn into a sentence with `refusalText`. This is that
 * boundary for the phone: a limit is a 429 with Retry-After, anything else a
 * 422 with the sentence against the field it is about, so the phone can put
 * it under the right input.
 */
export async function apiRefusal(refusal: Refusal, field?: string): Promise<NextResponse> {
  const t = await getT();
  const sentence = refusalText(t, refusal);
  if (refusal.retryAfterSeconds !== undefined) {
    const retryAfterSeconds = Math.max(1, Math.ceil(refusal.retryAfterSeconds));
    return NextResponse.json(apiErrorSchema.parse({ error: sentence, code: "RATE_LIMITED", retryAfterSeconds }), {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" },
    });
  }
  return NextResponse.json(apiErrorSchema.parse({ error: sentence, code: "BAD_REQUEST", ...(field ? { issues: { [field]: sentence } } : {}) }), {
    status: 422,
    headers: { "Cache-Control": "no-store" },
  });
}
