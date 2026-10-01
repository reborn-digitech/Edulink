import { officeUsageSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { officeUsage } from "@/lib/plans";

/** GET /api/v1/office/usage — this school's running month against its plan, and the months before it; the office's own and nobody else's. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const usage = await officeUsage(ctx);
    return ok(officeUsageSchema.parse({ ...usage, computedAt: usage.computedAt?.toISOString() ?? null }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/usage");
  }
}
