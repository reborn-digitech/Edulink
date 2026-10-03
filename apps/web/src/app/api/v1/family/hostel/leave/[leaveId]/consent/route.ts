import { familyHostelConsentSchema, hostelLeaveRowSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { consentLeave } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ leaveId: string }> };

/** POST /api/v1/family/hostel/leave/{leaveId}/consent — A guardian's yes or no to their child's own ask. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PARENT");
    const p = await params;
    const parsed = familyHostelConsentSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelLeaveRowSchema.parse(await consentLeave(ctx, p.leaveId, b.approve)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/hostel/leave/[leaveId]/consent");
  }
}
