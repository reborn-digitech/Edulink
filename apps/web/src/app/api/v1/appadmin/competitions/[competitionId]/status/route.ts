import { contestStatusSchema, contestStatusSetSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { setPlatformCompetitionStatus } from "@/lib/app-admin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/appadmin/competitions/{competitionId}/status — publish,
 * withdraw or re-draft a PLATFORM competition. A school's own matches
 * nothing here (organizerSchoolId null in the WHERE): 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { competitionId } = await params;
    const parsed = contestStatusSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setPlatformCompetitionStatus(ctx, competitionId, parsed.data.status);
    return ok(contestStatusSetSchema.parse({ ok: true, status: parsed.data.status }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/competitions/[competitionId]/status");
  }
}
