import { examActionResultSchema, examResultRunSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { runResults } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/results/run — Compute the results under the schemes (a new run; a reason after publication). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examResultRunSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await runResults(ctx, p.sessionId, b.reason)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/results/run");
  }
}
