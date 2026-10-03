import { inventoryItemSaveSchema, inventoryItemSchema, inventoryItemsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { listItems, saveItem } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/items — every item with its stock at each place. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(inventoryItemsSchema.parse(await listItems(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/items");
  }
}

/** POST /api/v1/admin/inventory/items — an item by its code, made or rewritten. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = inventoryItemSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(inventoryItemSchema.parse(await saveItem(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/items");
  }
}
