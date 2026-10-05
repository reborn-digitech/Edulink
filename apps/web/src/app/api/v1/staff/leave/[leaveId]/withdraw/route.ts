import { okSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { cancelLeave, LEAVE_APPLICANT_ROLES } from "@/lib/leave";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/staff/leave/{leaveId}/withdraw — withdraw a leave request (the
 * web's withdraw, A3-inventory-7), before or after approval; the cover it
 * caused is released and the colleagues named on it are told. The roles the
 * action takes: every applicant's and the office. The library binds the
 * person: only the one who asked, the head or the office (anyone else 403).
 * One already withdrawn or declined is a 422; an id this school does not hold
 * is a 404. No body: the call is the act.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ leaveId: string }> }) {
  try {
    const ctx = await requireApiRole(...LEAVE_APPLICANT_ROLES, "ADMIN");
    const { leaveId } = await params;
    const result = await cancelLeave(ctx, leaveId);
    if (!result.ok) {
      if (result.errorKey === "leaveKind.notInSchool") throw new AccessError(result.errorKey, "NOT_FOUND");
      return apiRefused(result);
    }
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/leave/[leaveId]/withdraw");
  }
}
