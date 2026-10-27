import { salaryPaymentAnswerSchema, salaryPaymentRecordSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { recordSalaryPayment } from "@/lib/salary-payments";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs/{month}/payments/{membershipId} — the school records how it paid one slip of a locked run (the whole net; the same press twice is one payment). */
export async function POST(request: Request, { params }: { params: Promise<{ month: string; membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = salaryPaymentRecordSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { month, membershipId } = await params;
    return ok(salaryPaymentAnswerSchema.parse(await recordSalaryPayment(ctx, month, membershipId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/payments/[membershipId]");
  }
}
