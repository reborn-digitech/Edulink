import { familyReportCardSchema } from "@edulink/contracts";
import { familyReportCard, requireApiReader } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/report-cards/{cardId} — one published card as it will be printed; a card the reader may not see is 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const ctx = await requireApiReader();
    const { cardId } = await params;
    return ok(familyReportCardSchema.parse(await familyReportCard(ctx, cardId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/report-cards/[cardId]");
  }
}
