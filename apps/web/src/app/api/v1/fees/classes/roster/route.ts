import { feeClassRosterQuerySchema, feeClassRosterSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { classFeeRoster } from "@/lib/fees";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/classes/roster?classId — a class's pupils with their plan and totals. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = feeClassRosterQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
    return ok(feeClassRosterSchema.parse(await classFeeRoster(ctx, parsed.data.classId, todayKey(school.timezone))));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/classes/roster");
  }
}
