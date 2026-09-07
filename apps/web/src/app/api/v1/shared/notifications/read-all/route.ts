import { notificationsReadAllSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { markAllNotificationsRead, requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/notifications/read-all — every unread notification of mine, read. */
export async function POST() {
  try {
    const ctx = await requireApiSession();
    return ok(notificationsReadAllSchema.parse({ count: await markAllNotificationsRead(ctx) }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/notifications/read-all");
  }
}
