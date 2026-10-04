import { creditPushSendSchema, examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { pushCredits } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/credits/push — Send the credits waiting for the Academic Bank (a stub transport; real ABC untested). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const parsed = creditPushSendSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await pushCredits(ctx, b.termId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/credits/push");
  }
}
