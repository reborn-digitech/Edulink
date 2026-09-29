import { recordChangeDecideSchema, recordChangeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decideRecordChange } from "@/lib/record-changes";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/record-changes/{requestId}/decide — apply the family's values, or decline. */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { requestId } = await params;
    const parsed = recordChangeDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recordChangeSchema.parse(await decideRecordChange(ctx, requestId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/record-changes/[requestId]/decide");
  }
}
