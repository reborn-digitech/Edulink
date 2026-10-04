import { examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { returnAllocation } from "@/lib/exam-cell-after";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ allocationId: string }> };

/** POST /api/v1/exam-cell/assessment/{allocationId}/return — A bundle back from its assessor (autonomous). */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    return ok(examActionResultSchema.parse(await returnAllocation(ctx, p.allocationId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/assessment/[allocationId]/return");
  }
}
