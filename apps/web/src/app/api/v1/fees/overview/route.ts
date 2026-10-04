import { feeOverviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { feeOverview } from "@/lib/fees-reports";
import { feesOverviewShape } from "@/lib/api-reads/fees";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/overview — asked, collected, outstanding and overdue this year, by grade and by age, with the claims queue. The head reads it too. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(feeOverviewSchema.parse(feesOverviewShape(await feeOverview(ctx))));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/overview");
  }
}
