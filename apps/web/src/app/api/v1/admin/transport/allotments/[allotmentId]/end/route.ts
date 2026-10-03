import { requireApiRole } from "@/lib/tenancy";
import { endAllotment } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/admin/transport/allotments/{allotmentId}/end — the seat's last day is today; an ended one answers as it stands. */
export async function POST(_request: Request, { params }: { params: Promise<{ allotmentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { allotmentId } = await params;
    const { toDateKey } = await endAllotment(ctx, allotmentId);
    return ok({ ok: true as const, toDateKey });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/allotments/end");
  }
}
