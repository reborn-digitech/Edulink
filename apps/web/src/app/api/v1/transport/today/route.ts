import { driverTodaySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { driverToday } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/transport/today — the driver's (or attendant's) trips today with stops and roster. */
export async function GET() {
  try {
    const ctx = await requireApiRole("DRIVER");
    return ok(driverTodaySchema.parse(await driverToday(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/transport/today");
  }
}
