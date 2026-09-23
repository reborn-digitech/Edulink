import { penChangesListSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { familyPenChanges } from "@/lib/pen-changes";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/pen-changes — the proposals on a guardian's children. */
export async function GET() {
  try {
    const ctx = await requireApiParent();
    return ok(penChangesListSchema.parse(await familyPenChanges(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/pen-changes");
  }
}
