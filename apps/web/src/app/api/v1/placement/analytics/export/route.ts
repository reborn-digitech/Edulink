import { placementExportQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { placementExport } from "@/lib/placement-analytics";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid } from "@/lib/api-v1";

/** GET /api/v1/placement/analytics/export — A sheet as CSV: NBA, NIRF or the batch's offers. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL", "IQAC");
    const parsed = placementExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    const sheet = await placementExport(ctx, q.kind, q.batchYear);
    return new Response(sheet.csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${sheet.filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/analytics/export");
  }
}
