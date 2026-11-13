import { penChangeDecideSchema, penChangeRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decidePenChange } from "@/lib/pen-changes";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/office/pen-changes/{requestId}/decide — the head approves or rejects. */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("PRINCIPAL");
    const { requestId } = await params;
    const parsed = penChangeDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(penChangeRequestSchema.parse(await decidePenChange(ctx, requestId, parsed.data)));
  } catch (error) {
    // A number another account took meanwhile is a 409 (TA-602).
    return moduleFailure(error, "api/v1/office/pen-changes/[requestId]/decide");
  }
}
