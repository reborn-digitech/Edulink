import { invoiceView } from "@/lib/gig-payments";
import { renderInvoicePdf } from "@/lib/gig-invoice-pdf";
import { apiFailure, budget, PDF_BUDGET } from "@/lib/api-v1";
import { requireApiExpertRole } from "../../../guard";

/** GET /api/v1/expert/invoices/{invoiceId}/pdf — one of the expert's own invoices as a PDF (application/pdf) in the language it was issued in; anybody else's is not found. */
export async function GET(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireApiExpertRole();
    const { invoiceId } = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const inv = await invoiceView(ctx, invoiceId);
    const bytes = await renderInvoicePdf(inv);
    const name = inv.number.replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/expert/invoices/[invoiceId]/pdf");
  }
}
