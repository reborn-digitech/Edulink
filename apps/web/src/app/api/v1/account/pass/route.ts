import { passOverviewSchema } from "@edulink/contracts";
import { passOverview } from "@/lib/pass-orders";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/account/pass — the plans I hold, and each pass I may buy, for whom and at what price (17 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(passOverviewSchema.parse(await passOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass");
  }
}
