import { inviteResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { remindApplicants } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** POST /api/v1/placement/drives/{driveId}/remind — Remind the live applicants before the next round. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    return ok(inviteResultSchema.parse(await remindApplicants(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/drives/[driveId]/remind");
  }
}
