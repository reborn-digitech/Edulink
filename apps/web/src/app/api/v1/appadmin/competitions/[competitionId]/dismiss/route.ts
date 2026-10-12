import { competitionDismissSchema, competitionSuggestionReadSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskDismiss } from "@/lib/competition-crawl-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { deskFailure } from "../../../competition-crawl/_shared";

/** POST /api/v1/appadmin/competitions/{competitionId}/dismiss — dismiss a suggestion with a coded reason; not suggested again unless its page changes. */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { competitionId } = await params;
    const parsed = competitionDismissSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(competitionSuggestionReadSchema.parse({ suggestion: await deskDismiss(ctx, competitionId, parsed.data.reason) }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competitions/[competitionId]/dismiss");
  }
}
