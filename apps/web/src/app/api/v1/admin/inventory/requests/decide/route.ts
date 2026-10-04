import { inventoryRequestDecideSchema, inventoryRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { decideRequest } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/inventory/requests/decide — fulfil (issuing the item) or decline an ask. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = inventoryRequestDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(inventoryRequestSchema.parse(await decideRequest(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/requests/decide");
  }
}
