import { insightsQuerySchema, naacInsightsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { naacInsights } from "@/lib/iqac-insights";
import { apiInvalid, ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/insights?cycleId=&scenarioId= — the NAAC insights: the paths to the next bands, the ranked steps with their calls to action, the qualitative metrics to score, what was done since the last compute; a saved scenario's gap with `scenarioId`. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = insightsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(naacInsightsSchema.parse(await naacInsights(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/insights");
  }
}
