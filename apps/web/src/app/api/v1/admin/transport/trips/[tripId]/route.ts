import { tripDetailSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { tripDetail } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/admin/transport/trips/{tripId} — one trip with its stops passed, the bus's track and the roster. */
export async function GET(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { tripId } = await params;
    return ok(tripDetailSchema.parse(await tripDetail(ctx, tripId)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/trips/detail");
  }
}
