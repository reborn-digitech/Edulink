import { officePeriodBodySchema, savedIdSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { updatePeriod } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/office/timetable/periods/{periodId} — change a period's name, times or kind. The day re-sorts by the clock; backwards times are refused with the reason. */
export async function POST(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { periodId } = await params;
    const parsed = officePeriodBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const period = await db.timetablePeriod.findFirst({ where: { id: periodId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!period) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const result = await updatePeriod(ctx, period.id, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(savedIdSchema.parse({ ok: true, id: result.id }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/timetable/periods/[periodId]");
  }
}
