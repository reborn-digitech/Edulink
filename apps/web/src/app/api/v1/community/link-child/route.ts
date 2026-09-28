import { NextResponse } from "next/server";
import { apiErrorSchema, communityChildLinkedSchema, communityLinkChildPageSchema, communityLinkChildSchema } from "@edulink/contracts";
import { claimChildFor } from "@/lib/claim-child";
import { listContexts } from "@/lib/session";
import { myClaims } from "@/lib/guardian-claims";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * GET /api/v1/community/link-child — the children this account already hears
 * about, for the web's "Already linked" list, and the claims it has waiting. Any signed-in person: a guardian
 * who has just signed up has no role yet, which is why the web page sits
 * outside the app shell.
 */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    const [{ children }, claims] = await Promise.all([listContexts(ctx.user.id), myClaims(ctx.user.id)]);
    return ok(
      communityLinkChildPageSchema.parse({
        children: children.map((c) => ({ guardianshipId: c.guardianshipId, name: c.name, schoolName: c.schoolName })),
        claims: claims.map((claim) => ({ ...claim, createdAt: claim.createdAt.toISOString() })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/community/link-child");
  }
}

/**
 * POST /api/v1/community/link-child — the web's claimChild, through the same
 * claimChildFor: both factors, both rate limits (per caller, then per code,
 * counted before any lookup), failures indistinguishable. A mismatch is a
 * 422 with the one sentence; a limit is a 429 with Retry-After. A right pair
 * files a claim and is a 202: nobody is linked until the office, or a
 * guardian the child already has, approves it.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = communityLinkChildSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const result = await claimChildFor(ctx, parsed.data, t);
    if (result.ok && result.pending) return ok(communityChildLinkedSchema.parse({ pending: result.pending }), 202);
    const { _form: sentence, ...fields } = result.errors;
    if (result.retryAfterSeconds) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: sentence ?? t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: result.retryAfterSeconds }),
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const issues = Object.keys(fields).length > 0 ? fields : undefined;
    return NextResponse.json(apiErrorSchema.parse({ error: sentence ?? Object.values(fields)[0] ?? t("common.checkTheForm"), code: "BAD_REQUEST", ...(issues ? { issues } : {}) }), {
      status: 422,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiFailure(error, "api/v1/community/link-child");
  }
}
