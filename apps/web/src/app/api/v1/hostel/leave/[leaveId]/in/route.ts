import { hostelLeaveRowSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { gateIn } from "@/lib/hostel";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ leaveId: string }> };

/** POST /api/v1/hostel/leave/{leaveId}/in — The gate: back in; late is flagged. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const p = await params;
    return ok(hostelLeaveRowSchema.parse(await gateIn(ctx, p.leaveId)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/leave/[leaveId]/in");
  }
}
