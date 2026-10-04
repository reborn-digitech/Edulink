import { researchRegisterSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeResearchItem } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/research/{itemId}/remove — Remove a research item: a teacher their own, the desk any. */
export async function POST(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "FACULTY", "HOD");
    const p = await params;
    return ok(researchRegisterSchema.parse(await removeResearchItem(ctx, p.itemId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/research/[itemId]/remove");
  }
}
