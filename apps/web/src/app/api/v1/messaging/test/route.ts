import { messagingTestResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { sendTestMessage } from "@/lib/messaging";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/messaging/test — a text to the office's own number, forced past the caps and the event switches. */
export async function POST() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(messagingTestResultSchema.parse(await sendTestMessage(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/test");
  }
}
