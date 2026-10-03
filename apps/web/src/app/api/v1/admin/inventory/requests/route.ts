import { inventoryRequestsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { listRequests } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/requests — staff asks, the waiting ones first. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(inventoryRequestsSchema.parse(await listRequests(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/requests");
  }
}
