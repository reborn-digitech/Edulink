import { getSession, revokeSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";

/** DELETE /api/v1/me/sessions/{sessionId} — sign one of my devices out. Only mine: another person's id is a 404. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const { sessionId } = await params;
    const done = await revokeSession(sessionId, ctx.user.id);
    if (!done) throw new AccessError("access.sessionNotFound", "NOT_FOUND");
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/me/sessions/[sessionId]");
  }
}
