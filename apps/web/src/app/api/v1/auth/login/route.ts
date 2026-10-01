import { passwordLoginSchema } from "@edulink/contracts";
import { signInWithPassword } from "@/lib/auth-login";
import { apiFailure, apiInvalid, issueApiSession, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { twoFactorGate } from "@/lib/api-two-factor";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/auth/login — the phone's password sign-in.
 *
 * The same check as the login form (rate limit, constant-time refusal, audit
 * on a wrong password), then a bearer token instead of a cookie. A refusal
 * says "no match" for an unknown account and a wrong password alike; the
 * rate limit says when to try again, in seconds, because the app will show a
 * countdown rather than a sentence.
 */
export async function POST(request: Request) {
  try {
    const parsed = passwordLoginSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await signInWithPassword(parsed.data.identifier, parsed.data.password);
    if (!result.ok) {
      const t = await getT();
      if (result.reason === "rate") {
        return NextResponse.json(
          { error: t("login.tooManyAttempts", { when: `${result.retryAfterSeconds}s` }), code: "RATE_LIMITED", retryAfterSeconds: result.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json({ error: t("login.noMatch"), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    // Two-step sign-in: the session waits for a code (POST /api/v1/auth/totp).
    const second = await twoFactorGate(result.userId, "password");
    if (second) return second;
    return issueApiSession(request, result.userId, result, "password", parsed.data.device);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/login");
  }
}
