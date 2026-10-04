import { examActionResultSchema, examResultPublishSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { publishRun } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/results/publish — Publish a run: the one before is superseded and kept; backlogs and credits follow. */
export async function POST(request: Request, { params }: Params) {
  try {
    // The principal publishes a run that changes a published result (exam-cell-marks.ts publishRun).
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "PRINCIPAL");
    const p = await params;
    const parsed = examResultPublishSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await publishRun(ctx, p.sessionId, b.runId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/results/publish");
  }
}
