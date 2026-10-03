import { libraryCopySaveSchema, libraryTitleViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addCopy } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/copies — Another copy of a title. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryCopySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryTitleViewSchema.parse(await addCopy(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/copies");
  }
}
