import { NextResponse } from "next/server";
import { apiErrorSchema, joinCodeBodySchema, joinFiledSchema } from "@edulink/contracts";
import { joinWithAccount } from "@/lib/join";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/join — ASK to join the school (and class) a code names, as a
 * pupil, on the account that is signed in: the web's joinWithMyAccount through
 * the same joinWithAccount. The request is filed and the session is left as
 * it was; the office, or the class's teacher, lets them in, and the phone
 * finds the school in /me once they have.
 * A refusal is a 422 with the sentence (on `code` when it is about the code);
 * the code-guessing limit is a 429 with Retry-After.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = joinCodeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const joined = await joinWithAccount(ctx, parsed.data.code, t);
    if (!joined.ok) {
      const { _form: sentence, ...fields } = joined.errors;
      const error = sentence ?? Object.values(fields)[0] ?? t("common.checkTheForm");
      if (joined.retryAfterSeconds !== undefined) {
        const retryAfterSeconds = Math.max(1, Math.ceil(joined.retryAfterSeconds));
        return NextResponse.json(apiErrorSchema.parse({ error, code: "RATE_LIMITED", retryAfterSeconds }), {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" },
        });
      }
      const issues = Object.keys(fields).length > 0 ? fields : undefined;
      return NextResponse.json(apiErrorSchema.parse({ error, code: "BAD_REQUEST", ...(issues ? { issues } : {}) }), {
        status: 422,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return ok(
      joinFiledSchema.parse({ requestId: joined.requestId, schoolName: joined.schoolName, className: joined.className, alreadyWaiting: joined.alreadyWaiting }),
      202,
    );
  } catch (error) {
    return apiFailure(error, "api/v1/join");
  }
}
