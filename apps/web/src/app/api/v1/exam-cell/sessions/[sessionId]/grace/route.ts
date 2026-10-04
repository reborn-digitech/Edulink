import { examActionResultSchema, graceProposeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { proposeGrace } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/grace — Propose grace marks under the scheme's rule; the principal decides. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = graceProposeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await proposeGrace(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/grace");
  }
}
