import { iqacPredictorSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { predictorFor } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/cycles/{cycleId} — The predictor: criteria, key indicators and metrics with value, score, why and evidence; the band, the distance to the next, the ten cheapest metrics, the trend by term. */
export async function GET(_request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(iqacPredictorSchema.parse(await predictorFor(ctx, p.cycleId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles/[cycleId]");
  }
}
