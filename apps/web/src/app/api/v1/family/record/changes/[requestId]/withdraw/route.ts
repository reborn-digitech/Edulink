import { recordChangeSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { withdrawRecordChange } from "@/lib/record-changes";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/family/record/changes/{requestId}/withdraw — the family takes a waiting ask back. */
export async function POST(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiReader();
    const { requestId } = await params;
    return ok(recordChangeSchema.parse(await withdrawRecordChange(ctx, requestId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/record/changes/[requestId]/withdraw");
  }
}
