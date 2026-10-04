import { examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { submitForm } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ formId: string }> };

/** POST /api/v1/exam-cell/forms/{formId}/submit — Submit a form: refused without attendance eligibility or no-dues; the fee becomes a demand. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT", "EXAM_CONTROLLER");
    const p = await params;
    return ok(examActionResultSchema.parse(await submitForm(ctx, p.formId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/forms/[formId]/submit");
  }
}
