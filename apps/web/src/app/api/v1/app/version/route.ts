import { appVersionSchema } from "@edulink/contracts";
import { appVersionPolicy } from "@/lib/app-release";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/app/version — the kill switch, open to anyone.
 *
 * No session, because the phone asks before it has one, and no caching
 * (`ok` sets no-store), because the whole point is that an operator's change
 * to APP_MIN_VERSION_* reaches the next start of every phone rather than the
 * one after a cache expires.
 */
export async function GET() {
  try {
    return ok(appVersionSchema.parse(appVersionPolicy()));
  } catch (error) {
    return apiFailure(error, "api/v1/app/version");
  }
}
