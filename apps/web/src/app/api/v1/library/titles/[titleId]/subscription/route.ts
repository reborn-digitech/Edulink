import { periodicalSubscriptionSaveSchema, periodicalViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { savePeriodicalSubscription } from "@/lib/library-periodicals";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/library/titles/{titleId}/subscription — a periodical's frequency and the days its subscription runs (G4-21). */
export async function POST(request: Request, { params }: { params: Promise<{ titleId: string }> }) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const { titleId } = await params;
    const parsed = periodicalSubscriptionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(periodicalViewSchema.parse(await savePeriodicalSubscription(ctx, titleId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles/[titleId]/subscription");
  }
}
