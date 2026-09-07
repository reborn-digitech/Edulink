import { okSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { markNotificationRead, requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/notifications/{notificationId}/read — one of mine, read; somebody else's is a 404. */
export async function POST(_request: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { notificationId } = await params;
    await markNotificationRead(ctx, notificationId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/notifications/[notificationId]/read");
  }
}
