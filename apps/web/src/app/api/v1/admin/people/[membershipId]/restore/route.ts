import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { reinstateMembership } from "@/lib/membership";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/restore — paused access restored; somebody not paused is a 422. No body. */
export async function POST(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const result = await reinstateMembership(ctx, membershipId);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/restore");
  }
}
