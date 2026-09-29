import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { cancelScheduledDeparture } from "@/lib/school-record";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/leaving/cancel — a last day kept for later is given up before it comes. No body. */
export async function POST(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const result = await cancelScheduledDeparture(ctx, membershipId);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/leaving/cancel");
  }
}
