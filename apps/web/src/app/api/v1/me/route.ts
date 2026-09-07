import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, meBody, ok } from "@/lib/api-v1";

/** GET /api/v1/me — who I am, where I belong, what is active. */
export async function GET() {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    return ok(await meBody(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/me");
  }
}
