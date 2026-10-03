import { transportTripsQuerySchema, transportTripsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { dayTrips } from "@/lib/transport";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/admin/transport/trips?date= — a day's trips with their status and the bus's last position. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = transportTripsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(transportTripsSchema.parse(await dayTrips(ctx, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/trips");
  }
}
