import { councilOverviewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilOverview } from "@/lib/council-filings";
import { ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council — which filings the college's streams bring, the ones they do not with the streams that would, and the councils not built yet. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    return ok(councilOverviewSchema.parse(await councilOverview(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council");
  }
}
