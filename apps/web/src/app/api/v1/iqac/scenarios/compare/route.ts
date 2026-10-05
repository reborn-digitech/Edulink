import { scenarioCompareQuerySchema, scenarioCompareSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { compareScenarios } from "@/lib/iqac-insights";
import { apiInvalid, ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/scenarios/compare?a=&b= — two scenarios of one kind side by side: the figures and scores that differ, and the result, b − a. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = scenarioCompareQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(scenarioCompareSchema.parse(await compareScenarios(ctx, parsed.data.a, parsed.data.b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/scenarios/compare");
  }
}
