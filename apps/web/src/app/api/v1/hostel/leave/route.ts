import { hostelLeaveListQuerySchema, hostelLeaveListSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listLeave } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/hostel/leave — Leave: open, today's, or all. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    const parsed = hostelLeaveListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(hostelLeaveListSchema.parse(await listLeave(ctx, q.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/leave");
  }
}
