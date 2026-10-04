import { examAfterSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { afterView } from "@/lib/exam-cell-after";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/exam-cell/after — After results: revaluations, backlogs, papers issued, credits, the convocation. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    return ok(examAfterSchema.parse(await afterView(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/after");
  }
}
