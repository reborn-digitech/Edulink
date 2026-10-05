import { periodicalViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeVolume } from "@/lib/library-periodicals";
import { apiFailure, ok } from "@/lib/api-v1";

/** DELETE /api/v1/library/titles/{titleId}/volumes/{volumeId} — a volume recorded by mistake, removed by the desk (G4-21). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ titleId: string; volumeId: string }> }) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const { titleId, volumeId } = await params;
    return ok(periodicalViewSchema.parse(await removeVolume(ctx, titleId, volumeId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles/[titleId]/volumes/[volumeId]");
  }
}
