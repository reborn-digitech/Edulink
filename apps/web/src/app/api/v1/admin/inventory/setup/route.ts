import { inventorySetupSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { inventorySetup } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/setup — categories, vendors, places and staff, for the office's forms. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(inventorySetupSchema.parse(await inventorySetup(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/setup");
  }
}
