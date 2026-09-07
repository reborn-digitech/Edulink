import { sessionsListSchema } from "@edulink/contracts";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/me/sessions — my signed-in devices, this one marked. */
export async function GET() {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const rows = await db.session.findMany({
      where: { userId: ctx.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, userAgent: true, createdAt: true, lastSeenAt: true },
    });
    return ok(
      sessionsListSchema.parse({
        sessions: rows.map((r) => ({
          id: r.id,
          device: r.userAgent,
          createdAt: r.createdAt.toISOString(),
          lastSeenAt: r.lastSeenAt.toISOString(),
          current: r.id === ctx.sessionId,
        })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/me/sessions");
  }
}
