import { inviteResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { inviteEligible } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** POST /api/v1/placement/drives/{driveId}/invite — Tell the eligible students about an OPEN drive. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    return ok(inviteResultSchema.parse(await inviteEligible(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives/[driveId]/invite");
  }
}
