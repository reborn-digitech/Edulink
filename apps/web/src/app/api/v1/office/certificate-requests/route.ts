import { officeCertificateRequestsQuerySchema, officeCertificateRequestsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officeRequests } from "@/lib/certificate-requests";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/certificate-requests?status= — the queue. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeCertificateRequestsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(officeCertificateRequestsSchema.parse(await officeRequests(ctx, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificate-requests");
  }
}
