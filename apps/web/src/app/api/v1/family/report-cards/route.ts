import { familyReportCardsSchema } from "@edulink/contracts";
import { familyReportCards, requireApiReader } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/report-cards — the pupil's own published cards, or each child's. */
export async function GET() {
  try {
    const ctx = await requireApiReader();
    return ok(familyReportCardsSchema.parse(await familyReportCards(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/report-cards");
  }
}
