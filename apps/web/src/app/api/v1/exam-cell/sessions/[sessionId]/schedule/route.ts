import { examActionResultSchema, examScheduleSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveSchedule } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/schedule — Put a course's paper on the date sheet, or move it. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examScheduleSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await saveSchedule(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/schedule");
  }
}
