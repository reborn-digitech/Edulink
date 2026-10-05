import { requireApiRoles } from "@/lib/api-roles";
import { visitIndexCsv } from "@/lib/peer-visits";
import { toCsv } from "@/lib/csv";
import { moduleFailure } from "@/lib/rule-refusal";
import { budget, EXPORT_BUDGET } from "@/lib/api-v1";

type Params = { params: Promise<{ visitId: string }> };

/** GET /api/v1/iqac/visits/{visitId}/export — The schedule, the evidence index and the SAR pack as CSV (audited). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("IQAC", "HOD", "PRINCIPAL", "ADMIN");
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const p = await params;
    const sheet = await visitIndexCsv(ctx, p.visitId);
    return new Response(toCsv(sheet.rows, sheet.headers), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${sheet.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/visits/[visitId]/export");
  }
}
