import { okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { revokeInvite } from "@/app/(app)/admin/invites/actions";

/** POST /api/v1/admin/people/invites/{inviteId}/revoke — withdraw a pending invitation. Another school's id is a 404. */
export async function POST(_request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { inviteId } = await params;
    const invite = await db.invite.findFirst({ where: { id: inviteId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!invite) throw new AccessError("access.thatInvitationCannotBeUsed", "NOT_FOUND");
    const result = await revokeInvite(invite.id);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/invites/[inviteId]/revoke");
  }
}
