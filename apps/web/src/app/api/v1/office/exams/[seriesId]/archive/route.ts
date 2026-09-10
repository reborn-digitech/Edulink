import { okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { archiveSeries } from "@/lib/exams";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/office/exams/{seriesId}/archive — send an exam series to the archive. Its papers and marks are kept; another school's series is a 404. */
export async function POST(_request: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { seriesId } = await params;
    const series = await db.examSeries.findFirst({ where: { id: seriesId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!series) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    await archiveSeries(ctx, series.id);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/exams/[seriesId]/archive");
  }
}
