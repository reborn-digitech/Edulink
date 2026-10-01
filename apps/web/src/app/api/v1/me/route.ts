import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, meBody, ok } from "@/lib/api-v1";
import { withMetrics } from "@/lib/metrics";

/** GET /api/v1/me — who I am, where I belong, what is active. The phone's first call on every open, so it is one of the three routes the operator's counters time (src/lib/metrics.ts). */
const timed = withMetrics("me", async () => {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    return ok(await meBody(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/me");
  }
});

export async function GET(request?: Request) {
  return timed(request);
}
