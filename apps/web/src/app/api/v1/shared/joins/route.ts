import { waitingQueueSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { readWaitingQueue, requireApiSession } from "@/lib/api-reads/shared";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/shared/joins — everybody waiting on the reader for a yes, oldest first; whose they are is the two libraries' rule. */
export async function GET() {
  try {
    // A guardian has no school of their own: theirs are the claims on their children.
    const session = await requireApiSession();
    const ctx = session.role === "PARENT" ? session : await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    return ok(waitingQueueSchema.parse(await readWaitingQueue(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/joins");
  }
}
