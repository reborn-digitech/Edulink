import { cyclePurgedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { purgeCycle } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/cycles/{cycleId}/purge — forget the families a closed cycle did not admit. */
export async function POST(_request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { cycleId } = await params;
    const { removed } = await purgeCycle(ctx, cycleId);
    return ok(cyclePurgedSchema.parse({ ok: true, removed }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles/[cycleId]/purge");
  }
}
