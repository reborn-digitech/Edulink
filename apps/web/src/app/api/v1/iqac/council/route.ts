import { councilOverviewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilOverview } from "@/lib/council-filings";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/council — which filings the college's streams bring, the ones they do not with the streams that would, and the councils not built yet. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    return ok(councilOverviewSchema.parse(await councilOverview(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/council");
  }
}
