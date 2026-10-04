import { stockTakeResultSchema, stockTakeSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { stockTake } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/inventory/stock-take — the counts at one place; each difference an adjustment. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = stockTakeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(stockTakeResultSchema.parse(await stockTake(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/stock-take");
  }
}
