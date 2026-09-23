import { penChangeRequestSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { withdrawPenChange } from "@/lib/pen-changes";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/office/pen-changes/{requestId}/withdraw — the admin takes a proposal back. */
export async function POST(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { requestId } = await params;
    return ok(penChangeRequestSchema.parse(await withdrawPenChange(ctx, requestId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pen-changes/[requestId]/withdraw");
  }
}
