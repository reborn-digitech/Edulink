import { familyGuardiansSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { familyGuardiansOf } from "@/lib/guardianship";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/admin/people/{membershipId}/guardians — the pupil's family guardians on the app (TA-177), oldest link
 * first, for the office to choose the one to end; never the school's stand-in. The office's alone; a pupil this
 * school does not hold on its roll is a 404. The rule is lib/guardianship.ts.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const rows = await familyGuardiansOf(ctx, membershipId);
    return ok(familyGuardiansSchema.parse({ guardians: rows.map((g) => ({ ...g, since: g.since.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/guardians");
  }
}
