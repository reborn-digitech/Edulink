import { guardianEndBodySchema, guardianEndedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { endFamilyGuardianship } from "@/lib/guardianship";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/people/{membershipId}/guardians/{guardianshipId}/end — the office ends a family guardian's link
 * to a pupil on its roll for a coded reason (TA-177): audited in the same transaction, the head told with the reason,
 * the guardian told only that the link has ended and to contact the office, the other guardians told, and the school
 * stands in when no family guardian is left. A link already ended is answered ended: false; a pupil not on the roll,
 * a link that is not this pupil's or the school's own stand-in is a 404. The rule is lib/guardianship.ts.
 */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string; guardianshipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId, guardianshipId } = await params;
    const parsed = guardianEndBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await endFamilyGuardianship(ctx, membershipId, guardianshipId, parsed.data.reason);
    if (!result.ok) return apiRefused(result);
    return ok(guardianEndedSchema.parse({ ended: result.ended, schoolStandsIn: result.schoolStandsIn }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/guardians/[guardianshipId]/end");
  }
}
