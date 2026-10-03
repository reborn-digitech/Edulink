import { requireApiRole } from "@/lib/tenancy";
import { rosterExport } from "@/lib/transport";
import { exportResponse } from "@/lib/export-file";
import { apiFailure, budget } from "@/lib/api-v1";

/** GET /api/v1/admin/transport/buses/{busId}/roster?format=csv|xlsx — one bus's roster as a file, audited; the office's and the head's. */
export async function GET(request: Request, { params }: { params: Promise<{ busId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { busId } = await params;
    const refused = await budget(`export:${ctx.user.id}`, 60, 60 * 60 * 1000);
    if (refused) return refused;
    return exportResponse(request, await rosterExport(ctx, busId));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/roster");
  }
}
