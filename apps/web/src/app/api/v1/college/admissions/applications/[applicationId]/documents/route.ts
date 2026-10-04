import { collegeApplicationSchema, collegeDocumentBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { setDocument } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/documents — A document's file and its scrutiny; verified needs a file. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { applicationId } = await params;
    const parsed = collegeDocumentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await setDocument(ctx, applicationId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications/[applicationId]/documents");
  }
}
