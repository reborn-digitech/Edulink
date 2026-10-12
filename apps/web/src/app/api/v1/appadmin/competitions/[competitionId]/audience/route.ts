import { competitionAudienceSetSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { setCompetitionAudience } from "@/lib/competition-audience";
import { ok, readJson } from "@/lib/api-v1";
import { deskFailure } from "../../../competition-crawl/_shared";

/**
 * POST /api/v1/appadmin/competitions/{competitionId}/audience — the content team or the operator sets who a platform
 * competition is for (SCHOOL, COLLEGE with streams, or null: everyone), in any status; audited (college-content, 12 Oct 2026).
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { competitionId } = await params;
    const result = await setCompetitionAudience(ctx, competitionId, await readJson(request));
    return ok(competitionAudienceSetSchema.parse({ ok: true, audience: result.audience, streams: result.streams, changed: result.changed }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competitions/[competitionId]/audience");
  }
}
