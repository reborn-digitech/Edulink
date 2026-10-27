import { salaryPaymentAnswerSchema, salaryPaymentVoidSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { voidSalaryPayment } from "@/lib/salary-payments";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs/{month}/payments/{membershipId}/void — a recorded payment set aside with a reason; a PAID run goes back to LOCKED. */
export async function POST(request: Request, { params }: { params: Promise<{ month: string; membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = salaryPaymentVoidSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { month, membershipId } = await params;
    return ok(salaryPaymentAnswerSchema.parse(await voidSalaryPayment(ctx, month, membershipId, parsed.data.reason)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/payments/[membershipId]/void");
  }
}
