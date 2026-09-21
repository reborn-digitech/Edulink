import { certificateIssueSchema, certificatesListSchema, issuedCertificateSchema, officeCertificatesQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { issueCertificate, listCertificates } from "@/lib/certificates";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/certificates?membershipId= — everything issued, newest first. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeCertificatesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(certificatesListSchema.parse(await listCertificates(ctx, parsed.data.membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificates");
  }
}

/** POST /api/v1/office/certificates — issue one. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = certificateIssueSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(issuedCertificateSchema.parse(await issueCertificate(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificates");
  }
}
