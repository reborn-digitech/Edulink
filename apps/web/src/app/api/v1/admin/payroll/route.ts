import { payrollSummarySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { payrollSummary } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll — the summary: settings, runs, cost by month and department, headcount (the office and the head). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(payrollSummarySchema.parse(await payrollSummary(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll");
  }
}
