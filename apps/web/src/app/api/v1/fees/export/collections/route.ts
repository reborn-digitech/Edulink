import { feeExportQuerySchema, officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { collectionsExport } from "@/lib/fees-reports";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/export/collections?fromKey&toKey — the collection register between two days, as CSV text. Audited. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const file = await collectionsExport(ctx, parsed.data);
    return ok(officeCsvExportSchema.parse({ ...file, rows: Math.max(0, file.csv.split("\n").filter(Boolean).length - 1) }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/export/collections");
  }
}
