import { certificateRequestSaveSchema, certificateRequestSchema, familyCertificateRequestsSchema, familyRecordQuerySchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { familyRequests, requestCertificate } from "@/lib/certificate-requests";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/family/certificate-requests?childId= — mine, with the kinds on offer. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyRecordQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyCertificateRequestsSchema.parse(await familyRequests(ctx, parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/certificate-requests");
  }
}

/** POST /api/v1/family/certificate-requests?childId= — ask. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiReader();
    const query = familyRecordQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return apiInvalid(query);
    const parsed = certificateRequestSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(certificateRequestSchema.parse(await requestCertificate(ctx, parsed.data, query.data.childId)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/family/certificate-requests");
  }
}
