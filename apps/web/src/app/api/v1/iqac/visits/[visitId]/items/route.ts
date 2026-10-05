import { visitDetailSchema, visitItemSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addVisitItem } from "@/lib/peer-visits";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ visitId: string }> };

/** POST /api/v1/iqac/visits/{visitId}/items — A schedule slot or an evidence line. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD");
    const p = await params;
    const parsed = visitItemSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(visitDetailSchema.parse(await addVisitItem(ctx, p.visitId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits/[visitId]/items");
  }
}
