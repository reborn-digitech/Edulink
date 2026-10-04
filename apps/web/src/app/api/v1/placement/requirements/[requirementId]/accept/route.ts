import { driveViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { acceptRequirement } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ requirementId: string }> };

/** POST /api/v1/placement/requirements/{requirementId}/accept — The TPO turns a requirement into a DRAFT drive. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    return ok(driveViewSchema.parse(await acceptRequirement(ctx, p.requirementId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/requirements/[requirementId]/accept");
  }
}
