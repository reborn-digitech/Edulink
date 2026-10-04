import { iqacPredictorSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recomputeCycle } from "@/lib/iqac";
import { budget, HEAVY_READ_BUDGET, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/cycles/{cycleId}/compute — Recompute every quantitative metric from the records (a new score row each; the CGPA's one writer). */
export async function POST(_request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    const p = await params;
    return ok(iqacPredictorSchema.parse(await recomputeCycle(ctx, p.cycleId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles/[cycleId]/compute");
  }
}
