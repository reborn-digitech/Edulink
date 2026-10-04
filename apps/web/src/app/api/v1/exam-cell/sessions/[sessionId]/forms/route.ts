import { examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { generateForms } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/forms — Generate every student's draft form from registrations and open backlogs; idempotent. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    return ok(examActionResultSchema.parse(await generateForms(ctx, p.sessionId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/forms");
  }
}
