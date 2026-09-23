import { penChangesListSchema, penChangesQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officePenChanges } from "@/lib/pen-changes";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/pen-changes?status= — the school's proposals, pending first. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = penChangesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(penChangesListSchema.parse(await officePenChanges(ctx, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pen-changes");
  }
}
