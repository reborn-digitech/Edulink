import { requireApiRoles } from "@/lib/api-roles";
import { hallTicketForPdf } from "@/lib/exam-cell-after";
import { renderHallTicketPdf } from "@/lib/exam-cell-pdf";
import { getT } from "@/lib/i18n/server";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ ticketId: string }> };

/** GET /api/v1/exam-cell/hall-tickets/{ticketId}/pdf — A hall ticket as a PDF (application/pdf) with the photo and a QR to the public check. */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const doc = await hallTicketForPdf(ctx, p.ticketId);
    const bytes = await renderHallTicketPdf(doc, await getT(), new URL(request.url).origin);
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${`hall-ticket-${doc.ticket.number}.pdf`}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/hall-tickets/[ticketId]/pdf");
  }
}
