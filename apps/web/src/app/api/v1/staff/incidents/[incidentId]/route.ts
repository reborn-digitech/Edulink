import { incidentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { incidentFor } from "@/lib/incidents";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/incidents/{incidentId} — one incident with its notes. */
export async function GET(_request: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { incidentId } = await params;
    return ok(incidentSchema.parse(await incidentFor(ctx, incidentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/incidents/one");
  }
}
