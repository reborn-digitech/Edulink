import { recordChangesListSchema, recordChangesQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officeRecordChanges } from "@/lib/record-changes";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/record-changes?status= — what families have asked to have changed, the waiting ones first. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = recordChangesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recordChangesListSchema.parse(await officeRecordChanges(ctx, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/record-changes");
  }
}
