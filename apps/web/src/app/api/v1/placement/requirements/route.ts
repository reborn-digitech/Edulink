import { requirementListSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listRequirements } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/placement/requirements — The requirements addressed to this college. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(requirementListSchema.parse(await listRequirements(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/requirements");
  }
}
