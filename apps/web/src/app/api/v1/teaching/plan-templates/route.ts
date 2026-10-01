import { planTemplateSaveSchema, planTemplateSavedSchema, planTemplatesQuerySchema, planTemplatesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { listPlanTemplates, savePlanTemplate } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/teaching/plan-templates?subject= — the school's lesson plan templates, the caller's own first. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = planTemplatesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(planTemplatesSchema.parse(await listPlanTemplates(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/plan-templates");
  }
}

/** POST /api/v1/teaching/plan-templates {lessonId, title?} — keep a lesson plan of a class I teach as a template. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = planTemplateSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(planTemplateSavedSchema.parse(await savePlanTemplate(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/plan-templates");
  }
}
