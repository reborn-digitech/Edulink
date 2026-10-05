import { okSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { cancelCover } from "@/lib/register-duty";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * DELETE /api/v1/admin/classes/covers/{coverId} — cancel a register cover (the
 * web's removeCover on the class page, R-50): the colleague who was to mark
 * the class's register is told they no longer are; audited
 * attendance.cover.cancel. The office and the head, as on the web (arranging
 * cover is half of approving leave). A cover this school does not hold, or
 * one already cancelled, is a 404.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ coverId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { coverId } = await params;
    const result = await cancelCover(ctx, coverId);
    if (!result.ok) throw new AccessError(result.errorKey ?? "refusal.coverGone", "NOT_FOUND");
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/covers/[coverId]");
  }
}
