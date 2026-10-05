import { nirfInsightsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { nirfInsights } from "@/lib/iqac-insights";
import { ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/insights/nirf — NIRF's published sub-parameters from the rows, the platform's rank-band estimate and what moves it. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    return ok(nirfInsightsSchema.parse(await nirfInsights(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/insights/nirf");
  }
}
