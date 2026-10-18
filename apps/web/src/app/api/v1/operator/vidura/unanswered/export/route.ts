import { requireApiOperator } from "@/lib/tenancy";
import { unansweredCsv } from "@/lib/assistant/gaps";
import { apiFailure, budget, EXPORT_BUDGET } from "@/lib/api-v1";

/** GET /api/v1/operator/vidura/unanswered/export — the same report as CSV (text/csv); audited. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const sheet = await unansweredCsv(ctx);
    return new Response(sheet.csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${sheet.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/operator/vidura/unanswered/export");
  }
}
