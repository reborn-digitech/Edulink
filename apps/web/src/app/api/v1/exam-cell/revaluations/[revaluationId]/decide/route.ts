import { examActionResultSchema, revaluationDecideSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideRevaluation } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ revaluationId: string }> };

/** POST /api/v1/exam-cell/revaluations/{revaluationId}/decide — Decide a photocopy or revaluation; a changed mark is a new version. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = revaluationDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await decideRevaluation(ctx, p.revaluationId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/revaluations/[revaluationId]/decide");
  }
}
