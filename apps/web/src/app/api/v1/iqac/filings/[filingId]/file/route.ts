import { requireApiRoles } from "@/lib/api-roles";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { filingFile } from "@/lib/iqac-filings";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/filings/{filingId}/file — The filing itself: its CSV as generated, or its PDF drawn from the frozen record (audited). */
export async function GET(_request: Request, { params }: { params: Promise<{ filingId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const { filingId } = await params;
    const f = await filingFile(ctx, filingId);
    return new Response(new Uint8Array(f.bytes), { headers: { "content-type": f.mime, "content-disposition": `attachment; filename="${f.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/filings/[filingId]/file");
  }
}
