import { naacSimulationSchema, simulateQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { simulateNaacDoor } from "@/lib/iqac-insights";
import { apiInvalid, ok, budget, HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/simulate?cycleId=&scenarioId= — today's figures (or a saved scenario's) recomputed with the functions the simulator page ships: the CGPA, the grade, each metric's score, the NIRF estimate. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    // A whole recompute per call (A3-S-7): counted as the filing generate and the cycle compute are (S-18).
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = simulateQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(naacSimulationSchema.parse(await simulateNaacDoor(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/simulate");
  }
}
