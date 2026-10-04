import { requireApiRoles } from "@/lib/api-roles";
import { documentForPdf } from "@/lib/exam-cell-after";
import { renderExamDocumentPdf } from "@/lib/exam-cell-pdf";
import { getT } from "@/lib/i18n/server";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ documentId: string }> };

/** GET /api/v1/exam-cell/documents/{documentId}/pdf — A grade card, transcript or degree certificate as a PDF (application/pdf). */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const doc = await documentForPdf(ctx, p.documentId);
    const bytes = await renderExamDocumentPdf(doc, await getT(), new URL(request.url).origin);
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${`${doc.row.serial.replace(/[^\w-]+/g, "-")}.pdf`}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/documents/[documentId]/pdf");
  }
}
