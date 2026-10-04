import { examActionResultSchema, examFormDecideSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideForm } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ formId: string }> };

/** POST /api/v1/exam-cell/forms/{formId}/decide — Approve a submitted form (the fee waived with a reason) or refuse it. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examFormDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await decideForm(ctx, p.formId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/forms/[formId]/decide");
  }
}
