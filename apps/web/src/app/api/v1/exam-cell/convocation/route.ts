import { convocationBuildSchema, examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { buildConvocation } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/convocation — Draw (or finalise) an autonomous college's convocation list for a year. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const parsed = convocationBuildSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await buildConvocation(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/convocation");
  }
}
