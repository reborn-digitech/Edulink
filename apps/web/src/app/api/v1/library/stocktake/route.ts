import { libraryStockTakeActionSchema, libraryStockTakeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { stockTake, stockTakeAction } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/stocktake — The running stock-take: copies seen and not yet seen. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    return ok(libraryStockTakeSchema.parse(await stockTake(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/stocktake");
  }
}

/** POST /api/v1/library/stocktake — Start or finish a stock-take. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryStockTakeActionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryStockTakeSchema.parse(await stockTakeAction(ctx, b.action)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/stocktake");
  }
}
