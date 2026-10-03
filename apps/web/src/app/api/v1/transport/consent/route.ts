import { transportConsentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { consentToLocation } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/transport/consent — the driver's yes to the location sentence, once. */
export async function POST() {
  try {
    const ctx = await requireApiRole("DRIVER");
    return ok(transportConsentSchema.parse(await consentToLocation(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/transport/consent");
  }
}
