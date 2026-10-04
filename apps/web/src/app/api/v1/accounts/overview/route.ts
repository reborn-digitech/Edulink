import { accountsOverviewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { accountsOverview } from "@/lib/accounts";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/accounts/overview — Collection against demand by programme and term, defaulters, the scholarship receivable by age, income and expense. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    return ok(accountsOverviewSchema.parse(await accountsOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/overview");
  }
}
