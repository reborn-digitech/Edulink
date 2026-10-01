import { okSchema, operatorResendInviteBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { resendAdminInvite } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/schools/{schoolId}/support/resend-invite — send one of the school's pending admin invitations again with a fresh link. Audited as superuser.invite.resend; the school's office is told. */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorResendInviteBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await resendAdminInvite(ctx, schoolId, parsed.data.inviteId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/support/resend-invite");
  }
}
