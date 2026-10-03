import { payrollRunSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { runView } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/runs/{month} — the run; its slips for the head only once shared. */
export async function GET(_request: Request, { params }: { params: Promise<{ month: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { month } = await params;
    return ok(payrollRunSchema.parse(await runView(ctx, month)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]");
  }
}
