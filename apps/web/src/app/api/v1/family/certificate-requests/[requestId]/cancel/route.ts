import { certificateRequestSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { cancelRequest } from "@/lib/certificate-requests";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/family/certificate-requests/{requestId}/cancel — take it back. */
export async function POST(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiReader();
    const { requestId } = await params;
    return ok(certificateRequestSchema.parse(await cancelRequest(ctx, requestId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/certificate-requests/[requestId]/cancel");
  }
}
