import { practiceJourneySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { journey } from "@/lib/practice-insights";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/practice/journey — the pupil's own "how far I've come" (the
 * web's /student/practice/journey, A3-inventory-14, audit of 5 October 2026):
 * every badge newest first (sixty at most), the tier badges of the last six
 * months, the weeks in a row with practice and the totals. One membership's
 * rows, compared with that pupil's own past only. STUDENT alone.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    const view = await journey(ctx);
    return ok(practiceJourneySchema.parse({ ...view, badges: view.badges.map((b) => ({ ...b, earnedAt: b.earnedAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/journey");
  }
}
