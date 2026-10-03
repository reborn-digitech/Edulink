import { libraryFineSchema, libraryFineWaiveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { waiveFine } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ fineId: string }> };

/** POST /api/v1/library/fines/{fineId}/waive — Waive a fine, with a reason. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const p = await params;
    const parsed = libraryFineWaiveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryFineSchema.parse(await waiveFine(ctx, p.fineId, b.reason)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/fines/[fineId]/waive");
  }
}
