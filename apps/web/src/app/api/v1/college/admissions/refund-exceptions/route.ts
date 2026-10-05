import { refundExceptionsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { refundExceptions } from "@/lib/head-approvals";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/college/admissions/refund-exceptions — refunds asked outside the slab, those waiting for the principal first (5 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(refundExceptionsSchema.parse(await refundExceptions(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/refund-exceptions");
  }
}
