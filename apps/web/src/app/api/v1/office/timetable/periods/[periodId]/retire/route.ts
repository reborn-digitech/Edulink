import { officePeriodRetireBodySchema, savedIdSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { archivePeriod, restorePeriod } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/office/timetable/periods/{periodId}/retire — take a period off
 * the day (retired: true) or bring it back (false). Retiring keeps every
 * lesson that was in it; bringing it back puts them back on the grid.
 */
export async function POST(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { periodId } = await params;
    const parsed = officePeriodRetireBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const period = await db.timetablePeriod.findFirst({ where: { id: periodId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!period) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const result = parsed.data.retired ? await archivePeriod(ctx, period.id) : await restorePeriod(ctx, period.id);
    if (!result.ok) return apiRefused(result);
    return ok(savedIdSchema.parse({ ok: true, id: result.id }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/timetable/periods/[periodId]/retire");
  }
}
