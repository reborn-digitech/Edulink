import { invoiceView } from "@/lib/gig-payments";
import { renderInvoicePdf } from "@/lib/gig-invoice-pdf";
import { apiFailure, budget, PDF_BUDGET } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * GET /api/v1/account/gig-invoices/{invoiceId}/pdf — a commission tax invoice as a PDF (application/pdf) in the
 * language it was issued in, to the person it is addressed to whatever role they are signed in as: a teacher paid for
 * guidance seats as well as an expert (TA-189). The operator's own door is /api/v1/operator/gigs/invoices/{id}/pdf;
 * anybody else's is not found. Under either session feature and plan-free (the catalog, role-gate.ts).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { invoiceId } = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const inv = await invoiceView(ctx, invoiceId);
    const bytes = await renderInvoicePdf(inv);
    const name = inv.number.replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/account/gig-invoices/[invoiceId]/pdf");
  }
}
