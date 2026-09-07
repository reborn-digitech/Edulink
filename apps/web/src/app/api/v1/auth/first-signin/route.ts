import { firstSignInSchema } from "@edulink/contracts";
import { redeemFirstSignIn } from "@/lib/first-signin";
import { consumeByCaller, LOGIN_ATTEMPTS } from "@/lib/rate-limit";
import { apiFailure, apiInvalid, issueApiSession, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { refusalText } from "@/lib/i18n/refusal";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/auth/first-signin — a pupil's first sign-in with the handle
 * and one-time code the school issued, setting their password on the way.
 * Same redemption as the web form (the code is spent once, the password
 * rules are the library's), rate-limited by caller.
 */
export async function POST(request: Request) {
  try {
    const parsed = firstSignInSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const gate = await consumeByCaller("first-signin", LOGIN_ATTEMPTS);
    const t = await getT();
    if (!gate.allowed) {
      return NextResponse.json(
        { error: t("login.tooManyAttempts", { when: `${gate.retryAfterSeconds}s` }), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const result = await redeemFirstSignIn(parsed.data.handle, parsed.data.code, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: refusalText(t, { errorKey: result.errorKey }), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return issueApiSession(request, result.userId, { lastRole: "STUDENT", lastSchoolId: result.schoolId }, "first-signin", parsed.data.device);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/first-signin");
  }
}
