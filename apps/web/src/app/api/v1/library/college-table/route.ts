import { libraryTableSchema, yearQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { libraryTableFor } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/library/college-table — The library's criterion-4 numbers for a year. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC");
    const parsed = yearQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryTableSchema.parse(await libraryTableFor(ctx, q.year)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/college-table");
  }
}
