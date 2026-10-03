import { hostelLeaveRowSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { cancelLeave } from "@/lib/hostel";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ leaveId: string }> };

/** POST /api/v1/family/hostel/leave/{leaveId}/cancel — Take a leave ask back before going out. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT");
    const p = await params;
    return ok(hostelLeaveRowSchema.parse(await cancelLeave(ctx, p.leaveId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/hostel/leave/[leaveId]/cancel");
  }
}
