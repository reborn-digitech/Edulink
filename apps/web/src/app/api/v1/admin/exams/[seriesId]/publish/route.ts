import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { publishSeries } from "@/lib/exams";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/admin/exams/{seriesId}/publish — put the date sheet out. Publishing twice is a no-op; a series with no papers is refused. */
export async function POST(_request: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { seriesId } = await params;
    await publishSeries(ctx, seriesId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/exams/[seriesId]/publish");
  }
}
