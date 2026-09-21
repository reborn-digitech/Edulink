import { applicationSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { verifyDocuments } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/applications/{applicationId}/verify — mark the documents checked. */
export async function POST(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    return ok(applicationSchema.parse(await verifyDocuments(ctx, applicationId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/verify");
  }
}
