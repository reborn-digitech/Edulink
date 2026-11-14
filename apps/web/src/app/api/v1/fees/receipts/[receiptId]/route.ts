import { feeReceiptSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { getSession } from "@/lib/session";
import { feesReceiptRead } from "@/lib/api-reads/fees";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/fees/receipts/{receiptId} — the frozen document. Signed out is
 * 401; a role with no door here (teacher, pupil, head, expert) is 403 before
 * any id is looked at; the office of another school or a guardian of another
 * child gets 404, the same as a guessed id.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    // ACCOUNTS too (TA-337): a college's accounts desk issues receipts at the counter, and receiptFor admits it for its own college.
    if (ctx.role !== "ADMIN" && ctx.role !== "ACCOUNTS" && ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
    const { receiptId } = await params;
    return ok(feeReceiptSchema.parse(await feesReceiptRead(ctx, receiptId)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/receipts/[receiptId]");
  }
}
