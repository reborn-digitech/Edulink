import { substitutionAssignedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { deletePlanTemplate } from "@/lib/syllabus";
import { apiFailure, ok } from "@/lib/api-v1";

/** DELETE /api/v1/teaching/plan-templates/{id} — the author or the office removes a template; plans copied from it stand. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { id } = await params;
    return ok(substitutionAssignedSchema.parse(await deletePlanTemplate(ctx, id)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/plan-templates/template");
  }
}
