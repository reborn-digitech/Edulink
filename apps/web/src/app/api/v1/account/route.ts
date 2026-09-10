import { accountOverviewSchema } from "@edulink/contracts";
import { accountOverview } from "@/lib/account";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/account — the account page: names, how I sign in, my preferences, whether there is a record to open. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(accountOverviewSchema.parse(await accountOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/account");
  }
}
