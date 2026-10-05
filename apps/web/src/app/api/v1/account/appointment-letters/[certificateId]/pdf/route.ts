import { requireApiRoles } from "@/lib/api-roles";
import { certificateView } from "@/lib/certificates";
import { isStaffKind } from "@/lib/certificate-rules";
import { AccessError } from "@/lib/access-error";
import { renderCertificatePdf } from "@/lib/certificate-pdf";
import { apiFailure, budget, PDF_BUDGET } from "@/lib/api-v1";

/** GET /api/v1/account/appointment-letters/{certificateId}/pdf — a member of staff's own appointment letter as a PDF, in the language it was issued in. */
export async function GET(request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const ctx = await requireApiRoles("TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS");
    const { certificateId } = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    // certificateView answers 404 to anyone the letter is not for (the office and its member of staff alone).
    const cert = await certificateView(ctx, certificateId);
    if (!isStaffKind(cert.kind)) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
    const bytes = await renderCertificatePdf(cert, `${new URL(request.url).origin}/certificates/check`);
    const name = `${cert.serial} - ${cert.studentName}`.replace(/[^\w .-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/account/appointment-letters/[certificateId]/pdf");
  }
}
