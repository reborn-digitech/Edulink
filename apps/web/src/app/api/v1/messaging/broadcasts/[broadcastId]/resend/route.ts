import { broadcastResentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { resendBroadcastFailures } from "@/lib/messaging";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/messaging/broadcasts/{broadcastId}/resend — the failed and undelivered rows, tried again. */
export async function POST(_request: Request, { params }: { params: Promise<{ broadcastId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { broadcastId } = await params;
    return ok(broadcastResentSchema.parse(await resendBroadcastFailures(ctx, broadcastId)));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/broadcasts/[broadcastId]/resend");
  }
}
