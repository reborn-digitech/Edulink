import { staffClassDetailSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffClassDetail } from "@/lib/api-reads/staff";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/classes/{classId} — the class page: roster with 28-day attendance, today's register, recent work, the grade weights. Another school's class, or one this teacher does not teach, is a 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { classId } = await params;
    return ok(staffClassDetailSchema.parse(await staffClassDetail(ctx, classId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/classes/[classId]");
  }
}
