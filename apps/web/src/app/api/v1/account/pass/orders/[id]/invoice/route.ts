import { passInvoiceView } from "@/lib/pass-orders";
import { renderPassInvoicePdf } from "@/lib/gig-invoice-pdf";
import { apiFailure, budget, PDF_BUDGET } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/account/pass/orders/{id}/invoice — a paid pass's tax invoice as a PDF, in the payer's language: the payer's own, the operator's any (17 Oct 2026). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiSession();
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const inv = await passInvoiceView(ctx, (await params).id);
    const bytes = await renderPassInvoicePdf(inv);
    const name = inv.number.replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass/orders/[id]/invoice");
  }
}
