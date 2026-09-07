import { adminAttendanceQuerySchema, adminAttendanceSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminAttendance } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/attendance — eight weeks of the whole school, and the children quietly slipping over the chosen window. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = adminAttendanceQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const days = parsed.data.window === "60" ? 60 : parsed.data.window === "90" ? 90 : 30;
    return ok(adminAttendanceSchema.parse(await adminAttendance(ctx, { days, sort: parsed.data.sort })));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/attendance");
  }
}
