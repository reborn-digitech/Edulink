import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { undoDeparture } from "@/lib/school-record";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/leaving/undo — a leaving recorded by mistake: the pupil is back on the roll and the certificate withdrawn. No body. */
export async function POST(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const result = await undoDeparture(ctx, membershipId);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/leaving/undo");
  }
}
