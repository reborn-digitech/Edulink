import { examActionResultSchema, myRevaluationAskSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { askRevaluation } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/mine/revaluations — Ask for a photocopy or a revaluation within the window; the fee becomes a demand. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const parsed = myRevaluationAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await askRevaluation(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/mine/revaluations");
  }
}
