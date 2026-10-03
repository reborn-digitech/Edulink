import { libraryCopyUpdateSchema, libraryTitleViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { updateCopy } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ copyId: string }> };

/** POST /api/v1/library/copies/{copyId} — A copy's rack, or its status: on the shelf, for repair, lost or withdrawn. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const p = await params;
    const parsed = libraryCopyUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryTitleViewSchema.parse(await updateCopy(ctx, p.copyId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/copies/[copyId]");
  }
}
