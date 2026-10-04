import { inventoryReportsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { inventoryReports } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/reports — stock on hand, consumption, assets by place and custodian. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(inventoryReportsSchema.parse(await inventoryReports(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/reports");
  }
}
