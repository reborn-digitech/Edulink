import "server-only";
import { NextResponse } from "next/server";
import { apiErrorSchema, twoFactorResponseSchema } from "@edulink/contracts";
import { twoFactorChallengeFor } from "@/lib/two-factor";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The /api/v1/account/totp refusals, as the phone reads them: a limit is a
 * 429 with Retry-After; the server missing its sealing key is a 403 with
 * the same sentence the fees settings give; a wrong code is a 422 against
 * the `code` field so the phone can put it under the box; the rest are 409s
 * for a step taken out of order (already on, nothing pending, not on).
 */
export type TotpRefusal = "ineligible" | "unavailable" | "alreadyOn" | "nothingPending" | "notOn" | "wrongCode" | "rate";

const KEYS: Record<Exclude<TotpRefusal, "rate">, { key: TranslationKey; status: number; code: "FORBIDDEN" | "CONFLICT" | "BAD_REQUEST"; field?: string }> = {
  ineligible: { key: "totp.ineligible", status: 403, code: "FORBIDDEN" },
  unavailable: { key: "totp.unavailable", status: 403, code: "FORBIDDEN" },
  alreadyOn: { key: "totp.alreadyOn", status: 409, code: "CONFLICT" },
  nothingPending: { key: "totp.nothingPending", status: 409, code: "CONFLICT" },
  notOn: { key: "totp.notOn", status: 409, code: "CONFLICT" },
  wrongCode: { key: "totp.wrongCode", status: 422, code: "BAD_REQUEST", field: "code" },
};

export async function totpRefusal(reason: TotpRefusal, retryAfterSeconds?: number): Promise<NextResponse> {
  const t = await getT();
  if (reason === "rate") {
    const seconds = Math.max(1, Math.ceil(retryAfterSeconds ?? 60));
    return NextResponse.json(apiErrorSchema.parse({ error: t("login.tooManyAttempts", { when: `${seconds}s` }), code: "RATE_LIMITED", retryAfterSeconds: seconds }), {
      status: 429,
      headers: { "Retry-After": String(seconds), "Cache-Control": "no-store" },
    });
  }
  const spec = KEYS[reason];
  const sentence = t(spec.key);
  return NextResponse.json(apiErrorSchema.parse({ error: sentence, code: spec.code, ...(spec.field ? { issues: { [spec.field]: sentence } } : {}) }), {
    status: spec.status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * The gate every API sign-in door passes once the person is known: null
 * means mint the session; a response means hand this back instead — 200
 * with TWO_FACTOR and the challenge POST /api/v1/auth/totp will spend.
 */
export async function twoFactorGate(userId: string, via: string): Promise<NextResponse | null> {
  const challenge = await twoFactorChallengeFor(userId, via);
  if (!challenge) return null;
  return NextResponse.json(twoFactorResponseSchema.parse({ code: "TWO_FACTOR", challenge }), { status: 200, headers: { "Cache-Control": "no-store" } });
}
