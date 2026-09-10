import { okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { resendInviteFor } from "@/lib/invites";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/office/invites/{inviteId}/resend — a fresh link by email; the old one stops working. Another school's id is a 404. */
export async function POST(_request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { inviteId } = await params;
    const invite = await db.invite.findFirst({ where: { id: inviteId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!invite) throw new AccessError("access.thatInvitationCannotBeUsed", "NOT_FOUND");
    const result = await resendInviteFor(ctx, invite.id);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/invites/[inviteId]/resend");
  }
}
