import { iqacOverviewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { iqacOverview } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/overview — The IQAC home: the open cycle's CGPA and band, the ten cheapest metrics, the registers' counts, the regulators' calendar, the NIRF estimate. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(iqacOverviewSchema.parse(await iqacOverview(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/overview");
  }
}
