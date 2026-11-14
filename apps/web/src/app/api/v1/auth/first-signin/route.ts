import { firstSignInSchema } from "@edulink/contracts";
import { redeemFirstSignIn } from "@/lib/first-signin";
import { consumeByCaller, CODE_LOOKUPS } from "@/lib/rate-limit";
import { apiRefusal } from "@/lib/api-account";
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
    // A computer room's allowance per address, as the web form's (TA-278); five tries on each code are the guard.
    const gate = await consumeByCaller("first-signin", CODE_LOOKUPS);
    const t = await getT();
    if (!gate.allowed) {
      return NextResponse.json(
        { error: t("login.tooManyAttempts", { when: `${gate.retryAfterSeconds}s` }), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const result = await redeemFirstSignIn(parsed.data.handle, parsed.data.code, parsed.data.password);
    if (!result.ok) {
      // A password the rule refuses, after a right code, is the password's problem (TA-502): 422 against the field,
      // as the other account doors answer one; 401 stays for a wrong handle or code.
      if (result.field === "password") return apiRefusal({ errorKey: result.errorKey }, "password");
      return NextResponse.json({ error: refusalText(t, { errorKey: result.errorKey }), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    // A pupil, or a support worker the office gave a code (owner-batch-item2a).
    return issueApiSession(request, result.userId, { lastRole: result.role, lastSchoolId: result.schoolId }, "first-signin", parsed.data.device);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/first-signin");
  }
}
