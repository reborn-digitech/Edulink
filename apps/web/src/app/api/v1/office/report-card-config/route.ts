import { reportCardConfigSchema, reportCardConfigViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { reportCardConfigView, saveReportCardConfig } from "@/lib/report-card-config";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/report-card-config — the rules, the presets and the year's terms. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(reportCardConfigViewSchema.parse(await reportCardConfigView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/report-card-config");
  }
}

/** POST /api/v1/office/report-card-config — replace the rules. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = reportCardConfigSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(reportCardConfigSchema.parse(await saveReportCardConfig(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/report-card-config");
  }
}
