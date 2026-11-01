import { hostelLeaveRowSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { gateOut } from "@/lib/hostel";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ leaveId: string }> };

/** POST /api/v1/hostel/leave/{leaveId}/out — The gate: out on approved leave. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const p = await params;
    return ok(hostelLeaveRowSchema.parse(await gateOut(ctx, p.leaveId)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/leave/[leaveId]/out");
  }
}
