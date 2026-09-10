import { NextResponse } from "next/server";
import { apiErrorSchema, joinCodeBodySchema, joinLookupSchema } from "@edulink/contracts";
import { lookupJoinCode } from "@/lib/join";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/join/lookup — what a school or class code is, before anybody
 * joins it: the web's "Check my code" through the same lookupJoinCode, which
 * counts every lookup against the web's allowance for guessing codes
 * (CODE_LOOKUPS, per caller). Too short, too long or not found is a 422 with
 * the sentence on `code`; the limit is a 429 with Retry-After.
 */
export async function POST(request: Request) {
  try {
    await requireApiSession();
    const parsed = joinCodeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const found = await lookupJoinCode(parsed.data.code, await getT());
    if (!found.ok) {
      if (found.retryAfterSeconds !== undefined) {
        const retryAfterSeconds = Math.max(1, Math.ceil(found.retryAfterSeconds));
        return NextResponse.json(apiErrorSchema.parse({ error: found.error, code: "RATE_LIMITED", retryAfterSeconds }), {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" },
        });
      }
      return NextResponse.json(apiErrorSchema.parse({ error: found.error, code: "BAD_REQUEST", issues: { code: found.error } }), {
        status: 422,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return ok(joinLookupSchema.parse({ kind: found.kind, schoolName: found.schoolName, className: found.kind === "class" ? found.className : null }));
  } catch (error) {
    return apiFailure(error, "api/v1/join/lookup");
  }
}
