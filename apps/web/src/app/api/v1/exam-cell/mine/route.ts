import { myExamsQuerySchema, myExamsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myExams } from "@/lib/exam-cell-after";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/exam-cell/mine — A student's own exams, or a guardian's child's under the RESULTS grant. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT");
    const parsed = myExamsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(myExamsSchema.parse(await myExams(ctx, q.childId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/mine");
  }
}
