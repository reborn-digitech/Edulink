import { requireApiRole, AccessError } from "@/lib/tenancy";
import { getSession } from "@/lib/session";
import { certificateView } from "@/lib/certificates";
import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { apiFailure } from "@/lib/api-v1";

/** GET /api/v1/shared/certificates/{certificateId}/pdf — the document as a PDF in the language it was issued in. */
export async function GET(request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const session = await getSession();
    if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const ctx = session.role === "PARENT" || session.role === "STUDENT" ? session : await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { certificateId } = await params;
    const cert = await certificateView(ctx, certificateId);
    const verifyUrl = `${new URL(request.url).origin}/certificates/check`;
    const bytes = await renderCertificatePdf(cert, verifyUrl);
    const name = `${cert.serial} - ${cert.studentName}`.replace(/[^\w .-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/shared/certificates/[certificateId]/pdf");
  }
}
