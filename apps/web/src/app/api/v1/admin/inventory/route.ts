import { inventorySummarySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { inventorySummary } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory — the stores and the asset register at a glance (the office and the head). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(inventorySummarySchema.parse(await inventorySummary(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory");
  }
}
