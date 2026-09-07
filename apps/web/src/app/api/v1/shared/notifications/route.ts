import { notificationsQuerySchema, notificationsSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { asNotificationKind, listNotifications, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/** GET /api/v1/shared/notifications — mine, newest first, `?filter=unread`, `?kind=`, cursor paged. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    const parsed = notificationsQuerySchema.safeParse({
      cursor: text(params, "cursor"),
      limit: params.get("limit") ?? undefined,
      filter: params.get("filter") === "unread" ? "unread" : undefined,
      // An unknown kind is nobody's filter, as on the page.
      kind: asNotificationKind(params.get("kind")),
    });
    if (!parsed.success) return apiInvalid(parsed);
    const { filter, kind, cursor, limit } = parsed.data;
    return ok(notificationsSchema.parse(await listNotifications(ctx, { unreadOnly: filter === "unread", kind, cursor, limit })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/notifications");
  }
}
