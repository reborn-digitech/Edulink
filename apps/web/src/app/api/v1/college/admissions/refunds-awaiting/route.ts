import { refundsAwaitingSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { refundsAwaiting } from "@/lib/college-admissions";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/college/admissions/refunds-awaiting — cancelled seats whose refund the bank has not yet paid (R-60, risks batch 5 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "ACCOUNTS");
    return ok(refundsAwaitingSchema.parse(await refundsAwaiting(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/refunds-awaiting");
  }
}
