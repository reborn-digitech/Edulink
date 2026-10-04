import { examActionResultSchema, examMarkCorrectSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { correctMark } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/marks/correct — A mark changed after publication: a new version with its reason. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examMarkCorrectSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await correctMark(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/marks/correct");
  }
}
