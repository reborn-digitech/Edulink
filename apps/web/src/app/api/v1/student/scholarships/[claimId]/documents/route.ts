import { scholarshipClaimSchema, scholarshipDocumentBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addClaimDocument } from "@/lib/scholarships";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ claimId: string }> };

/** POST /api/v1/student/scholarships/{claimId}/documents — A document for the student's own claim, from their own upload. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const { claimId } = await params;
    const parsed = scholarshipDocumentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(scholarshipClaimSchema.parse(await addClaimDocument(ctx, claimId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/student/scholarships/[claimId]/documents");
  }
}
