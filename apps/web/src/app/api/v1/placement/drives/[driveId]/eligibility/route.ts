import { driveEligibilitySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { driveEligibility } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** GET /api/v1/placement/drives/{driveId}/eligibility — Who qualifies, and why not. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(driveEligibilitySchema.parse(await driveEligibility(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives/[driveId]/eligibility");
  }
}
