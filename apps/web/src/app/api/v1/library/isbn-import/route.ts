import { isbnImportBodySchema, isbnImportResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { importIsbnList } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/isbn-import — A publisher's ISBN list, pasted: titles added once by ISBN, bad check digits named. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = isbnImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(isbnImportResultSchema.parse(await importIsbnList(ctx, b.text)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/isbn-import");
  }
}
