import { familyReceipt } from "@/lib/gig-payments";
import { renderReceiptPdf } from "@/lib/gig-invoice-pdf";
import { getLocale } from "@/lib/i18n/server";
import { apiFailure, budget, PDF_BUDGET } from "@/lib/api-v1";
import { requireGigRole } from "../../../guard";

/** GET /api/v1/gigs/payments/{paymentId}/receipt — the family's receipt for a paid seat as a PDF (application/pdf) in the reader's language: the gross, who collected it on whose behalf, and the refund when there was one. */
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    const { paymentId } = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const receipt = await familyReceipt(ctx, paymentId);
    const bytes = await renderReceiptPdf(receipt, await getLocale());
    const name = receipt.receiptNumber.replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/payments/[paymentId]/receipt");
  }
}
