import { certificatesListSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { familyCertificates } from "@/lib/certificates";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/certificates — the pupil's own, or each child's. */
export async function GET() {
  try {
    const ctx = await requireApiReader();
    return ok(certificatesListSchema.parse(await familyCertificates(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/certificates");
  }
}
