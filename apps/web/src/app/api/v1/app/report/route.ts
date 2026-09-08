import { NextResponse } from "next/server";
import { apiErrorSchema, appReportBodySchema, appReportResultSchema } from "@edulink/contracts";
import { recordAppReport, ReportRateLimited } from "@/lib/app-release";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/app/report — "Report a problem", and the app's crash report.
 *
 * Parse, record, answer: the rules (which audit action, who is told, how
 * many an hour) are in app-release.ts where the suite proves them. The
 * reference in the answer is what the person quotes to the office.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = appReportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    try {
      return ok(appReportResultSchema.parse(await recordAppReport(ctx, parsed.data)));
    } catch (error) {
      if (error instanceof ReportRateLimited) {
        const t = await getT();
        return NextResponse.json(
          apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: error.retryAfterSeconds }),
          { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds), "Cache-Control": "no-store" } },
        );
      }
      throw error;
    }
  } catch (error) {
    return apiFailure(error, "api/v1/app/report");
  }
}
