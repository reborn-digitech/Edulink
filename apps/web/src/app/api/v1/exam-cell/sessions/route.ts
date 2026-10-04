import { examActionResultSchema, examSessionSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createSession } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/sessions — A new exam session for a term. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const parsed = examSessionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await createSession(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions");
  }
}
