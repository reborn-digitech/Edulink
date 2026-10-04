import { requireApiRoles } from "@/lib/api-roles";
import { myResume } from "@/lib/placement-student";
import { moduleFailure } from "@/lib/rule-refusal";
import { PDF_BUDGET, budget } from "@/lib/api-v1";

/** GET /api/v1/student/placement/resume — The student's resume as a PDF. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const doc = await myResume(ctx);
    return new Response(new Uint8Array(doc.pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${doc.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/resume");
  }
}
