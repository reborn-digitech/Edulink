import { stockMovementSaveSchema, stockMovementSchema, stockMovementsQuerySchema, stockMovementsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { listMovements, recordMovement } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/movements?itemCode=&month= — newest first. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const params = new URL(request.url).searchParams;
    const parsed = stockMovementsQuerySchema.safeParse({ itemCode: params.get("itemCode") ?? undefined, month: params.get("month") ?? undefined });
    if (!parsed.success) return apiInvalid(parsed);
    return ok(stockMovementsSchema.parse(await listMovements(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/movements");
  }
}

/** POST /api/v1/admin/inventory/movements — an issue, a return, an adjustment or a write-off; never below nothing. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = stockMovementSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(stockMovementSchema.parse(await recordMovement(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/movements");
  }
}
