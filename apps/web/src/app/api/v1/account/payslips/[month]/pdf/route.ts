import { requireApiRole } from "@/lib/tenancy";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { payslipDocument } from "@/lib/payroll";
import { renderPayslipPdf } from "@/lib/payslip-pdf";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/account/payslips/{month}/pdf — my slip for a locked month, as a PDF in my language. */
export async function GET(_request: Request, { params }: { params: Promise<{ month: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN");
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const { month } = await params;
    const doc = await payslipDocument(ctx, month, "self");
    const bytes = await renderPayslipPdf(doc);
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="payslip-${month}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/account/payslips/[month]/pdf");
  }
}
