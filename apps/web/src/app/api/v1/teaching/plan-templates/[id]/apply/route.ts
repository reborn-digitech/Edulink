import { planTemplateAppliedSchema, planTemplateApplySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { applyPlanTemplate } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/teaching/plan-templates/{id}/apply {classId, unitId?, dateKey?} — copy the template into a new plan for a class I teach. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { id } = await params;
    const parsed = planTemplateApplySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(planTemplateAppliedSchema.parse(await applyPlanTemplate(ctx, id, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/plan-templates/apply");
  }
}
