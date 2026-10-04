import { issuedCertificateSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { getSession } from "@/lib/session";
import { certificateView } from "@/lib/certificates";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/shared/certificates/{certificateId} — the document for anyone who may read it. */
export async function GET(_request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const session = await getSession();
    if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    // A former pupil reads the papers of their own stay as an alumnus (G-6); mayRead in certificates.ts holds them to those.
    const ctx = session.role === "PARENT" || session.role === "STUDENT" || session.role === "ALUMNUS" ? session : await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { certificateId } = await params;
    return ok(issuedCertificateSchema.parse(await certificateView(ctx, certificateId)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/certificates/[certificateId]");
  }
}
