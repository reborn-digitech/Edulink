import { nbaInsightsQuerySchema, nbaInsightsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { nbaInsights } from "@/lib/iqac-insights";
import { apiInvalid, ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/insights/nba?year=&departmentId=&scenarioId= — an engineering department's SAR: which computed item's marks are cheapest to raise, the criteria still to write; an HOD their own department; 404 unless the college teaches engineering. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = nbaInsightsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(nbaInsightsSchema.parse(await nbaInsights(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/insights/nba");
  }
}
