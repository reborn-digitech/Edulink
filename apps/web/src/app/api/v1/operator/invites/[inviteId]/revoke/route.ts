import { okSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { revokeInvite } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/invites/{inviteId}/revoke — withdraw a pending admin invitation; one no longer pending is a 422. Audited as superuser.invite.revoke. */
export async function POST(_request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { inviteId } = await params;
    const result = await revokeInvite(ctx, inviteId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/invites/[inviteId]/revoke");
  }
}
