import { okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { closePosting } from "@/lib/vacancies";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/vacancies/{postingId}/close — take a vacancy off the board. Another school's posting is a 404; one already closed is a 422. */
export async function POST(_request: Request, { params }: { params: Promise<{ postingId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { postingId } = await params;
    const posting = await db.jobPosting.findFirst({ where: { id: postingId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!posting) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const result = await closePosting(ctx, posting.id);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/vacancies/[postingId]/close");
  }
}
