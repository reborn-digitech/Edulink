import { examActionResultSchema, examRoomSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveRoom } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/rooms — A hall for a paper, with its capacity. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examRoomSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await saveRoom(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/rooms");
  }
}
