import { libraryLookupQuerySchema, libraryLookupSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { lookup } from "@/lib/library";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/library/lookup — A scanned or typed code: a copy's accession, a member's card, or an ISBN. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    const parsed = libraryLookupQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryLookupSchema.parse(await lookup(ctx, q.code)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/lookup");
  }
}
