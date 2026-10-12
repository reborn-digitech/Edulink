import { competitionDraftEditSchema, competitionDraftEditedSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskEditDraft } from "@/lib/competition-crawl-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { deskFailure } from "../../../competition-crawl/_shared";

/** POST /api/v1/appadmin/competitions/{competitionId}/edit — edit a platform competition's DRAFT in place; 409 for a published one. */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { competitionId } = await params;
    const parsed = competitionDraftEditSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { changed } = await deskEditDraft(ctx, competitionId, parsed.data);
    return ok(competitionDraftEditedSchema.parse({ ok: true, changed }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competitions/[competitionId]/edit");
  }
}
