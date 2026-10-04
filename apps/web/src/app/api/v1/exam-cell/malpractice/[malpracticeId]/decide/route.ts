import { examActionResultSchema, malpracticeDecideSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideMalpractice } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ malpracticeId: string }> };

/** POST /api/v1/exam-cell/malpractice/{malpracticeId}/decide — The unfair-means committee's decision, recorded once. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = malpracticeDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await decideMalpractice(ctx, p.malpracticeId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/malpractice/[malpracticeId]/decide");
  }
}
