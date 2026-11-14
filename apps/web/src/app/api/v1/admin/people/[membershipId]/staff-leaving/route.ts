import { staffLeavingBodySchema, staffLeavingResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordStaffLeaving } from "@/lib/staff-leaving";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/staff-leaving — a member of staff's last working day with a coded reason (TA-046): recorded at once when past, kept until the morning after it otherwise; the rule is lib/staff-leaving.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = staffLeavingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await recordStaffLeaving(ctx, membershipId, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(staffLeavingResultSchema.parse({ leftOn: result.leftOn, scheduledFor: result.scheduledFor }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/staff-leaving");
  }
}
