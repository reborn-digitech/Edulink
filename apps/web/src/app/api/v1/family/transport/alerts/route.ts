import { transportAlertsResultSchema, transportAlertsSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { setNearAlerts } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/family/transport/alerts — switch the "bus is near" notification for one child, for this guardian. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = transportAlertsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(transportAlertsResultSchema.parse(await setNearAlerts(ctx, parsed.data.childId, parsed.data.nearAlerts)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/transport/alerts");
  }
}
