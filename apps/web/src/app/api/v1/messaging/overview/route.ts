import { messagingOverviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { messagingOverviewRead } from "@/lib/api-reads/messaging";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/messaging/overview — channels, the month's counts against the cap, template readiness, recent notices and automatic texts. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(messagingOverviewSchema.parse(await messagingOverviewRead(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/overview");
  }
}
