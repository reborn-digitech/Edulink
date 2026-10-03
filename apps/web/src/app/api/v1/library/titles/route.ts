import { libraryCatalogueQuerySchema, libraryCatalogueSchema, libraryTitleCreateSchema, libraryTitleViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createTitle, searchCatalogue } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/titles — The catalogue, searched by title, author, subject or ISBN. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN");
    const parsed = libraryCatalogueQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryCatalogueSchema.parse(await searchCatalogue(ctx, q)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles");
  }
}

/** POST /api/v1/library/titles — A new title, with the copies in hand. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryTitleCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryTitleViewSchema.parse(await createTitle(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles");
  }
}
