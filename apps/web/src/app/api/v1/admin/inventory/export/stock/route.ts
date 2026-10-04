import { inventoryExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { stockExport } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/export/stock — stock on hand by item and place as CSV text for the phone's share sheet. Audited. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    return ok(inventoryExportSchema.parse(await stockExport(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/export/stock");
  }
}
