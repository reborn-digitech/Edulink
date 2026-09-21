import { applicationSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { applicationView } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/admissions/applications/{applicationId} — one application. */
export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    return ok(applicationSchema.parse(await applicationView(ctx, applicationId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]");
  }
}
