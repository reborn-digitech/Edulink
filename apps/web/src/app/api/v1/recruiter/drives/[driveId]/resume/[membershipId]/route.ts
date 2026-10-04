import { requireApiRoles } from "@/lib/api-roles";
import { recruiterResume } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { PDF_BUDGET, budget } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string; membershipId: string }> };

/** GET /api/v1/recruiter/drives/{driveId}/resume/{membershipId} — A consented applicant's watermarked resume. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const p = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const doc = await recruiterResume(ctx, p.driveId, p.membershipId);
    return new Response(new Uint8Array(doc.pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${doc.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/drives/[driveId]/resume/[membershipId]");
  }
}
