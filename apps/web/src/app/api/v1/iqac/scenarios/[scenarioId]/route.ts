import { scenariosSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeScenario } from "@/lib/iqac-insights";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** DELETE /api/v1/iqac/scenarios/{scenarioId} — remove a saved scenario (the IQAC and the principal; an HOD their department's NBA ones, 404 for another's). Audited. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ scenarioId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "PRINCIPAL", "HOD");
    const p = await params;
    return ok(scenariosSchema.parse(await removeScenario(ctx, p.scenarioId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/scenarios/[scenarioId]");
  }
}
