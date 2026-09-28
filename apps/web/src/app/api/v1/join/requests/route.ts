import { joinRequestsSchema } from "@edulink/contracts";
import { myJoinRequests } from "@/lib/join-requests";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** GET /api/v1/join/requests — the asker's own requests to join: the ones waiting and the ones not accepted, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    const requests = await myJoinRequests(ctx.user.id);
    return ok(joinRequestsSchema.parse({ requests: requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/join/requests");
  }
}
