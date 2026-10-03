import { libraryStockTakeSchema, libraryStockTakeSeenSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { stockTakeSeen } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/stocktake/seen — Mark a copy seen in the running stock-take. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryStockTakeSeenSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryStockTakeSchema.parse(await stockTakeSeen(ctx, b.accession)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/stocktake/seen");
  }
}
