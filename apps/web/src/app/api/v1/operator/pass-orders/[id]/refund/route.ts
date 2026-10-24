import { operatorPassRefundSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { refundPassOrder } from "@/lib/pass-orders";
import { apiFailure, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/pass-orders/{id}/refund — the whole total back within seven days of payment, the pass's entitlements revoked; audited (17 Oct 2026). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const result = await refundPassOrder(ctx, (await params).id);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(operatorPassRefundSchema.parse({ order: result.order, revoked: result.revoked, ...(result.already ? { already: true } : {}) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/pass-orders/[id]/refund");
  }
}
