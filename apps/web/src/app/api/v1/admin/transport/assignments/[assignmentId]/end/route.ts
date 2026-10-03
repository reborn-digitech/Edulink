import { requireApiRole } from "@/lib/tenancy";
import { endAssignment } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/admin/transport/assignments/{assignmentId}/end — its last day is today; an ended one answers as it stands. */
export async function POST(_request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { assignmentId } = await params;
    const { toDateKey } = await endAssignment(ctx, assignmentId);
    return ok({ ok: true as const, toDateKey });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/assignments/end");
  }
}
