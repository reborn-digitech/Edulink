import { examConductSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { conductView } from "@/lib/exam-cell-after";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** GET /api/v1/exam-cell/sessions/{sessionId}/conduct — An autonomous college's conduct: question papers, printing lists, assessment bundles. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(examConductSchema.parse(await conductView(ctx, p.sessionId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/conduct");
  }
}
