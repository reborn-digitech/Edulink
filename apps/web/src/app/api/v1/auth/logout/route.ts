import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/auth/logout — revoke the session this request came with. */
export async function POST() {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    await db.session.updateMany({ where: { id: ctx.sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/auth/logout");
  }
}
