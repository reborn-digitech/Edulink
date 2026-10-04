import { examResultsQuerySchema, examResultsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { resultsView } from "@/lib/exam-cell-marks";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** GET /api/v1/exam-cell/sessions/{sessionId}/results — A run's results (the latest when none is named). */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const parsed = examResultsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(examResultsSchema.parse(await resultsView(ctx, p.sessionId, q.runId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/results");
  }
}
