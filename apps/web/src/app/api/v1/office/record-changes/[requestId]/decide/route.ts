import { recordChangeDecideSchema, recordChangeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decideRecordChange } from "@/lib/record-changes";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/office/record-changes/{requestId}/decide — apply the family's values, or decline. */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { requestId } = await params;
    const parsed = recordChangeDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recordChangeSchema.parse(await decideRecordChange(ctx, requestId, parsed.data)));
  } catch (error) {
    // A value the save now refuses is a 422 naming its field (TA-602).
    return moduleFailure(error, "api/v1/office/record-changes/[requestId]/decide");
  }
}
