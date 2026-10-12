import { competitionSuggestionReadSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskMarkReviewed } from "@/lib/competition-crawl-desk";
import { ok } from "@/lib/api-v1";
import { deskFailure } from "../../../competition-crawl/_shared";

/** POST /api/v1/appadmin/competitions/{competitionId}/reviewed — a published one the crawler found changed has been looked at: the flag comes off, the diff goes to the audit line. */
export async function POST(_request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { competitionId } = await params;
    return ok(competitionSuggestionReadSchema.parse({ suggestion: await deskMarkReviewed(ctx, competitionId) }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competitions/[competitionId]/reviewed");
  }
}
