import { feeClaimsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { feesClaimsRead } from "@/lib/api-reads/fees";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/claims — UPI payments families say they made, oldest first, stale ones flagged. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    return ok(feeClaimsSchema.parse(await feesClaimsRead(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/claims");
  }
}
