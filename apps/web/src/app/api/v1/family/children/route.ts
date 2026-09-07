import { familyChildrenSchema } from "@edulink/contracts";
import { listContexts } from "@/lib/session";
import { childRows, requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/children — the guardian's children, first claimed first, as the child switcher lists them. */
export async function GET() {
  try {
    const ctx = await requireApiParent();
    const { children } = await listContexts(ctx.user.id);
    return ok(familyChildrenSchema.parse({ children: childRows(children) }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/children");
  }
}
