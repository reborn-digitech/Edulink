import { academicsCountResultSchema, courseMappingSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveCourseMapping } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ courseId: string }> };

/** POST /api/v1/academics/courses/{courseId}/mapping — A course's CO–PO articulation matrix, replaced whole (the office, the HOD, or its faculty). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN", "HOD", "FACULTY");
    const p = await params;
    const parsed = courseMappingSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsCountResultSchema.parse(await saveCourseMapping(ctx, p.courseId, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/courses/[courseId]/mapping");
  }
}
