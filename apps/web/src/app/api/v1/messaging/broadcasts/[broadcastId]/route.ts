import { broadcastDetailSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { broadcastDetailRead } from "@/lib/api-reads/messaging";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/messaging/broadcasts/{broadcastId} — the delivery report, person by person, with every reason a text was not sent. */
export async function GET(_request: Request, { params }: { params: Promise<{ broadcastId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { broadcastId } = await params;
    return ok(broadcastDetailSchema.parse(await broadcastDetailRead(ctx, broadcastId)));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/broadcasts/[broadcastId]");
  }
}
