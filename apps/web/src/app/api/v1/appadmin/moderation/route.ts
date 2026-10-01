import { moderationQuerySchema, moderationSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { listPlatformModeration } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/moderation?status=live|takenDown|restored&page= — every school's global posts, the web's /appadmin/moderation. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = moderationQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const list = await listPlatformModeration(ctx, parsed.data);
    return ok(
      moderationSchema.parse({
        ...list,
        items: list.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          takedown: item.takedown ? { ...item.takedown, at: item.takedown.at.toISOString(), restoredAt: item.takedown.restoredAt?.toISOString() ?? null } : null,
        })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/moderation");
  }
}
