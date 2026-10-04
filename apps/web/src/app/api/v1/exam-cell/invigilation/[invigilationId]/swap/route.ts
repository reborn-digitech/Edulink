import { examActionResultSchema, invigilationSwapSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { swapInvigilator } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ invigilationId: string }> };

/** POST /api/v1/exam-cell/invigilation/{invigilationId}/swap — Swap a duty to another member of staff, with the reason. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = invigilationSwapSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await swapInvigilator(ctx, p.invigilationId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/invigilation/[invigilationId]/swap");
  }
}
