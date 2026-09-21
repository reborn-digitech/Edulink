import { certificateRequestDeclineSchema, certificateRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { declineRequest } from "@/lib/certificate-requests";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/certificate-requests/{requestId}/decline — with a reason. */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { requestId } = await params;
    const parsed = certificateRequestDeclineSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(certificateRequestSchema.parse(await declineRequest(ctx, requestId, parsed.data.reason)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificate-requests/[requestId]/decline");
  }
}
