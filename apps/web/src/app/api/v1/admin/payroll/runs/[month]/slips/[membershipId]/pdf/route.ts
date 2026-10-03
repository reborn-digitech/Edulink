import { requireApiRole } from "@/lib/tenancy";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { payslipDocument } from "@/lib/payroll";
import { renderPayslipPdf } from "@/lib/payslip-pdf";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/runs/{month}/slips/{membershipId}/pdf — one slip as a PDF in its owner's language; the head only from a shared run. */
export async function GET(_request: Request, { params }: { params: Promise<{ month: string; membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const { month, membershipId } = await params;
    const doc = await payslipDocument(ctx, month, membershipId);
    const bytes = await renderPayslipPdf(doc);
    const name = `payslip-${month}-${doc.slip.name}`.replace(/[^\w.-]+/g, "_");
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/slips/[membershipId]/pdf");
  }
}
