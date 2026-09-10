import { NextResponse } from "next/server";
import { apiErrorSchema, joinCodeBodySchema } from "@edulink/contracts";
import { joinWithAccount } from "@/lib/join";
import { getSession, setActiveContext } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, meBody, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/join — join the school (and class) a code names, as a pupil, on
 * the account that is signed in: the web's joinWithMyAccount through the same
 * joinWithAccount. The web then sets a fresh cookie; a bearer session cannot
 * be handed a cookie, so THIS session's active context moves to the school as
 * STUDENT instead and the fresh /me comes back — the phone's tab bar follows.
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
    const switched = await setActiveContext(ctx.sessionId, ctx.user.id, { schoolId: joined.schoolId, role: "STUDENT" });
    if (!switched) throw new AccessError("access.wrongRoleForThisAction");
    const fresh = await getSession();
    return ok(await meBody(fresh ?? ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/join");
  }
}
