import { placementSummarySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { placementHome } from "@/lib/placement-analytics";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/placement/summary — The cell's home. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(placementSummarySchema.parse(await placementHome(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/summary");
  }
}
