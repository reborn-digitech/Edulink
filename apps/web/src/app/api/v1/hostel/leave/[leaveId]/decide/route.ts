import { hostelLeaveDecideSchema, hostelLeaveRowSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideLeave } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ leaveId: string }> };

/** POST /api/v1/hostel/leave/{leaveId}/decide — Approve or decline leave; a minor's only after a guardian's consent. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const p = await params;
    const parsed = hostelLeaveDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelLeaveRowSchema.parse(await decideLeave(ctx, p.leaveId, b.approve, b.note)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/leave/[leaveId]/decide");
  }
}
