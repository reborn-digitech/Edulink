import { invoiceView } from "@/lib/gig-payments";
import { renderInvoicePdf } from "@/lib/gig-invoice-pdf";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, budget, PDF_BUDGET } from "@/lib/api-v1";

/** GET /api/v1/operator/gigs/invoices/{invoiceId}/pdf — any commission tax invoice the company issued, as a PDF (application/pdf) in the language it was issued in, for the operator (TA-189); an id no invoice holds is not found. */
export async function GET(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { invoiceId } = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const inv = await invoiceView(ctx, invoiceId);
    const bytes = await renderInvoicePdf(inv);
    const name = inv.number.replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/invoices/[invoiceId]/pdf");
  }
}
