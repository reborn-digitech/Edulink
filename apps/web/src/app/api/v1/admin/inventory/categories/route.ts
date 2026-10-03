import { inventoryCategorySaveSchema, inventorySetupSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { inventorySetup, saveCategory } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/inventory/categories — make or rewrite a category; answers the whole setup. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = inventoryCategorySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveCategory(ctx, parsed.data);
    return ok(inventorySetupSchema.parse(await inventorySetup(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/categories");
  }
}
