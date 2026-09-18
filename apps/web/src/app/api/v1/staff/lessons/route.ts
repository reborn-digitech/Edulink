import { lessonPlanSaveSchema, lessonPlanSavedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveLessonPlan } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/lessons — plan or log a lesson. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = lessonPlanSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(lessonPlanSavedSchema.parse(await saveLessonPlan(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/staff/lessons");
  }
}
