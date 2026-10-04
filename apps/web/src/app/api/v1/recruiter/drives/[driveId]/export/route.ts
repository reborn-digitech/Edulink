import { requireApiRoles } from "@/lib/api-roles";
import { recruiterExport } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ driveId: string }> };

/** GET /api/v1/recruiter/drives/{driveId}/export — The consented applicants as a watermarked CSV. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const p = await params;
    const sheet = await recruiterExport(ctx, p.driveId);
    return new Response(sheet.csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${sheet.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/drives/[driveId]/export");
  }
}
