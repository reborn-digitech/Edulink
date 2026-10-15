import { operatorRevokeSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { revokeEntitlement } from "@/lib/person-plans";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/operator/entitlements/{id}/revoke — end one entitlement now; audited, a no-op on one already revoked (16 Oct 2026). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const r = await revokeEntitlement(ctx, (await params).id);
    return ok(operatorRevokeSchema.parse({ ...r, revokedAt: r.revokedAt.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/entitlements/{id}/revoke");
  }
}
