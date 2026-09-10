import { okSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { dismissAppAdmin } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** DELETE /api/v1/operator/content-team/{userId} — take the flag off; the account stays. Audited as superuser.appadmin.dismiss. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { userId } = await params;
    const result = await dismissAppAdmin(ctx, userId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/content-team/[userId]");
  }
}
