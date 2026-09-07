import { okSchema } from "@edulink/contracts";
import { removeSlot } from "@/lib/experts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpert } from "@/lib/api-reads/shared";

/** DELETE /api/v1/shared/expert/availability/{slotId} — withdraw an unbooked window; a booked one has to be cancelled instead. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const ctx = await requireApiExpert();
    const { slotId } = await params;
    await removeSlot(ctx, slotId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/expert/availability/[slotId]");
  }
}
