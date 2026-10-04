import { iqacCyclesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { closeCycle } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/cycles/{cycleId}/close — Close a cycle: it reads as it stands from then on. */
export async function POST(_request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const p = await params;
    return ok(iqacCyclesSchema.parse(await closeCycle(ctx, p.cycleId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles/[cycleId]/close");
  }
}
