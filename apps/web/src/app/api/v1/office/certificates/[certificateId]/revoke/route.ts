import { certificateRevokeSchema, issuedCertificateSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { revokeCertificate } from "@/lib/certificates";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/certificates/{certificateId}/revoke — mark it revoked with a reason. */
export async function POST(request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { certificateId } = await params;
    const parsed = certificateRevokeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(issuedCertificateSchema.parse(await revokeCertificate(ctx, certificateId, parsed.data.reason)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificates/[certificateId]/revoke");
  }
}
