import { leavingBodySchema, leavingResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordOrScheduleLeaving } from "@/lib/leaving";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/leaving — record that a pupil has left and issue their certificate, or keep a later last day until it comes; the rule is lib/leaving.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = leavingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await recordOrScheduleLeaving(ctx, membershipId, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(leavingResultSchema.parse({ recordId: result.recordId, scheduledFor: result.scheduledFor }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/leaving");
  }
}
