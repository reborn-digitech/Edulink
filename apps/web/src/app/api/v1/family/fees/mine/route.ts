import { pupilFeesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { pupilFees } from "@/lib/fees-family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/fees/mine — a pupil's own dues, paid and next due date, only while the school lets pupils of their age see fees. Never a way to pay. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(pupilFeesSchema.parse(await pupilFees(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/fees/mine");
  }
}
