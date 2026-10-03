import { libraryImportResultSchema, libraryImportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { importCatalogue } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/import — The catalogue from a pasted sheet. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryImportSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryImportResultSchema.parse(await importCatalogue(ctx, b.text)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/import");
  }
}
