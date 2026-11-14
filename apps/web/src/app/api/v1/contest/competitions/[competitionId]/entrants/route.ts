import { contestAddEntrantSchema, contestEntrantAddedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { addEntrant } from "@/lib/competitions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/contest/competitions/{competitionId}/entrants — TA-104 (decision 0007 as amended 14 November
 * 2026): the office or a teacher adds a pupil of the school as an entrant of the school's own competition, as the
 * web's entries page does. Where the competition asks for a guardian's consent the entry waits for a guardian's
 * yes (the school's stand-in for a pupil with no family on the app); adding a pupil already entered answers that
 * entry. Audited in addEntrant.
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const { competitionId } = await params;
    const parsed = contestAddEntrantSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const added = await addEntrant(ctx, competitionId, parsed.data.studentMembershipId);
    return ok(contestEntrantAddedSchema.parse({ ok: true, ...added }));
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions/[competitionId]/entrants");
  }
}
