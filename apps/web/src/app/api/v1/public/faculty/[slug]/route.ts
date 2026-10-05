import { NextResponse } from "next/server";
import { apiErrorSchema, publicFacultySchema } from "@edulink/contracts";
import { publicFaculty } from "@/lib/faculty-profile";
import { apiFailure, ok } from "@/lib/api-v1";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/v1/public/faculty/{slug} — a college's published faculty pages, signed out (5 Oct 2026). An unknown slug
 * is an empty list. Counted by address like every other signed-out door (A3-S-8: 130 calls in a row met no limit):
 * a hundred and twenty a quarter-hour, the certificate check's budget.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const gate = await consumeByCaller("public-faculty", CODE_LOOKUPS);
    if (!gate.allowed) {
      const t = await getT();
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds }),
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const { slug } = await params;
    return ok(publicFacultySchema.parse(await publicFaculty(slug)));
  } catch (error) {
    return apiFailure(error, "api/v1/public/faculty/[slug]");
  }
}
