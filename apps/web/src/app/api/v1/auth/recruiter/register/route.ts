import { NextResponse } from "next/server";
import { recruiterRegisterSchema, signupSentSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { registerRecruiter } from "@/lib/recruiters";
import { afterResponse } from "@/lib/after-response";
import { getLocale, getT } from "@/lib/i18n/server";

/**
 * POST /api/v1/auth/recruiter/register — a recruiter's own account from the
 * phone (4 Oct 2026), the web's /register/recruiter. 422 with the field for a
 * refusal of the form, 429 with Retry-After at the sign-up limit.
 *
 * A form in order is answered 202 {sent: true} and NO SESSION, the same
 * whether or not the address already had an account (QA-25, 24 Oct 2026): the
 * account is made (or the holder of a taken address told by email) after the
 * response, and a new recruiter signs in with the password once the
 * confirmation link is opened.
 */
export async function POST(request: Request) {
  try {
    const parsed = recruiterRegisterSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const made = await registerRecruiter(parsed.data, await getLocale(), { defer: afterResponse("recruiter-register") });
    const t = await getT();
    if (!made.ok) {
      if (made.retryAfterSeconds) {
        return NextResponse.json(
          { error: t(made.errorKey), code: "RATE_LIMITED", retryAfterSeconds: made.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(made.retryAfterSeconds), "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json(
        { error: t(made.errorKey), code: "BAD_REQUEST", ...(made.field ? { issues: { [made.field]: t(made.errorKey) } } : {}) },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    return ok(signupSentSchema.parse({ sent: true }), 202);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/recruiter/register");
  }
}
