import { marksGridQuerySchema, marksGridSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffMarksGrid } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/exams/grid?classId=&slotId= — one class's marks for one paper; the first paper self-selects when none is named. Saving is POST /api/v1/marks. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = marksGridQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(marksGridSchema.parse(await staffMarksGrid(ctx, parsed.data.classId, parsed.data.slotId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/exams/grid");
  }
}
