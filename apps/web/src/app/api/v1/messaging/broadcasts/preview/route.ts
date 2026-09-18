import { broadcastPreviewBodySchema, broadcastPreviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { previewBroadcast } from "@/lib/messaging";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/messaging/broadcasts/preview — who a notice reaches and on which channel. Writes nothing. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = broadcastPreviewBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(broadcastPreviewSchema.parse(await previewBroadcast(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/broadcasts/preview");
  }
}
