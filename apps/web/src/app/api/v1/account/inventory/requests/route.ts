import { inventoryRequestAskSchema, inventoryRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { askForItem } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/account/inventory/requests — ask the office for an item. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN");
    const parsed = inventoryRequestAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(inventoryRequestSchema.parse(await askForItem(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/account/inventory/requests");
  }
}
