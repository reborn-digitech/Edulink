import { totpSignInSchema } from "@edulink/contracts";
import { NextResponse } from "next/server";
import { apiFailure, apiInvalid, issueApiSession, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { clientAddress } from "@/lib/rate-limit";
import { verifyTwoFactor } from "@/lib/two-factor";

/**
 * POST /api/v1/auth/totp — the second step of the phone's sign-in.
 *
 * The challenge a sign-in door answered with TWO_FACTOR, and a code from the
 * authenticator app or one recovery code. A right code mints the session the
 * door would have, through the same function; a wrong one is a 401 that
 * says how many tries are left, the fifth kills the challenge and the person
 * signs in again from the start. Limits by challenge and by address answer
 * 429 with Retry-After.
 */
export async function POST(request: Request) {
  try {
    const parsed = totpSignInSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await verifyTwoFactor(parsed.data.challenge, parsed.data.code, { caller: clientAddress(request.headers) });
    if (!result.ok) {
      const t = await getT();
      if (result.reason === "rate") {
        return NextResponse.json(
          { error: t("login.tooManyAttempts", { when: `${result.retryAfterSeconds}s` }), code: "RATE_LIMITED", retryAfterSeconds: result.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" } },
        );
      }
      const error = result.reason === "wrong" ? t("totp.wrongCodeLeft", { count: result.attemptsLeft }) : t("totp.stepExpired");
      return NextResponse.json({ error, code: "UNAUTHORIZED", ...(result.reason === "wrong" ? { issues: { code: error } } : {}) }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return issueApiSession(request, result.userId, result, `totp:${result.via}`, parsed.data.device);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/totp");
  }
}
