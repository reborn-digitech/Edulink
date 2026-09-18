import { broadcastCreateBodySchema, broadcastCreatedSchema, broadcastsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createBroadcast } from "@/lib/messaging";
import { broadcastsRead } from "@/lib/api-reads/messaging";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/messaging/broadcasts — every notice sent to many families, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(broadcastsSchema.parse(await broadcastsRead(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/broadcasts");
  }
}

/** POST /api/v1/messaging/broadcasts — a notice to an audience: queued and sent, small ones in this request. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = broadcastCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(broadcastCreatedSchema.parse(await createBroadcast(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/broadcasts");
  }
}
