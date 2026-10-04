import { examActionResultSchema, moderationNoteSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addModerationNote } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/moderation — The moderation committee's note. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = moderationNoteSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await addModerationNote(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/moderation");
  }
}
