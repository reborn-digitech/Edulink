import { applicationSchema } from "@edulink/contracts";
import { requireApiFamily } from "@/lib/api-reads/family";
import { applicationView } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/applications/{applicationId} — one of mine. */
export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiFamily();
    const { applicationId } = await params;
    return ok(applicationSchema.parse(await applicationView(ctx, applicationId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/applications/[applicationId]");
  }
}
