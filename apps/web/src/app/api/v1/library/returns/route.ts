import { libraryReturnResultSchema, libraryReturnSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { returnCopy } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/returns — Take a copy back; a late one writes its fine. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryReturnSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryReturnResultSchema.parse(await returnCopy(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/returns");
  }
}
