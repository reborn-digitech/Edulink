import { officeSubscriptionSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { officeSubscription } from "@/lib/school-terms";

/** GET /api/v1/office/subscription — this school's Shalaghar subscription and premium add-on, read only: both parts, free until, renews on, whether recording is paused. Nothing is paid in the app. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(officeSubscriptionSchema.parse(await officeSubscription(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/subscription");
  }
}
