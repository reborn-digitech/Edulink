import { nbaInsightsQuerySchema, nbaInsightsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { nbaInsights } from "@/lib/iqac-insights";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/insights/nba?year=&departmentId=&scenarioId= — an engineering department's SAR: which computed item's marks are cheapest to raise, the criteria still to write; an HOD their own department; 404 unless the college teaches engineering. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    const parsed = nbaInsightsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(nbaInsightsSchema.parse(await nbaInsights(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/insights/nba");
  }
}
