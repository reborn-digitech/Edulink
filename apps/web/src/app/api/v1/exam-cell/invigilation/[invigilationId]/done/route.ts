import { examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { markDutyDone } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ invigilationId: string }> };

/** POST /api/v1/exam-cell/invigilation/{invigilationId}/done — Mark a duty done. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    return ok(examActionResultSchema.parse(await markDutyDone(ctx, p.invigilationId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/invigilation/[invigilationId]/done");
  }
}
