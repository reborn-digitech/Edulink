import { examActionResultSchema, examSignatureSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveControllerSignature } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/signature — The controller's own signature for the papers they issue (a PNG data URL). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const parsed = examSignatureSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await saveControllerSignature(ctx, b.image)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/signature");
  }
}
