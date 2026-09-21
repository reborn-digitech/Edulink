import { slotCancelledSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { cancelSlot } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/slots/{slotId}/cancel — cancel a sitting and release its families. */
export async function POST(_request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { slotId } = await params;
    const { released } = await cancelSlot(ctx, slotId);
    return ok(slotCancelledSchema.parse({ ok: true, released }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/slots/[slotId]/cancel");
  }
}
