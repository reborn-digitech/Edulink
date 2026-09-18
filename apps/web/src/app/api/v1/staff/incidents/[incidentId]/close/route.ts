import { incidentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { closeIncident } from "@/lib/incidents";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/staff/incidents/{incidentId}/close — the office or the head closes it once follow-up is done. */
export async function POST(_request: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { incidentId } = await params;
    return ok(incidentSchema.parse(await closeIncident(ctx, incidentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/incidents/close");
  }
}
