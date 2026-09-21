import { certificateVerifySchema } from "@edulink/contracts";
import { verifyByCode } from "@/lib/certificates";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/public/certificates/{code} — is the paper real; nothing about the pupil. */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    return ok(certificateVerifySchema.parse(await verifyByCode(code)));
  } catch (error) {
    return apiFailure(error, "api/v1/public/certificates/[code]");
  }
}
