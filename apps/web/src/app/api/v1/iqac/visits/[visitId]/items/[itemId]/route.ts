import { visitDetailSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeVisitItem } from "@/lib/peer-visits";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ visitId: string; itemId: string }> };

/** DELETE /api/v1/iqac/visits/{visitId}/items/{itemId} — A line taken off the file. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD");
    const p = await params;
    return ok(visitDetailSchema.parse(await removeVisitItem(ctx, p.visitId, p.itemId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits/[visitId]/items/[itemId]");
  }
}
