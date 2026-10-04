import { libraryMineQuerySchema, libraryMineSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myLibrary } from "@/lib/library";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/library/mine — A member's own library, or a guardian's child's: loans, dues, queue. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    const parsed = libraryMineQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryMineSchema.parse(await myLibrary(ctx, q.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/mine");
  }
}
