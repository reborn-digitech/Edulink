import { officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { outstandingExport } from "@/lib/fees-reports";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/export/outstanding — everyone with something outstanding this year, with ageing, as CSV text. Audited. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const file = await outstandingExport(ctx);
    return ok(officeCsvExportSchema.parse({ ...file, rows: Math.max(0, file.csv.split("\n").filter(Boolean).length - 1) }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/export/outstanding");
  }
}
