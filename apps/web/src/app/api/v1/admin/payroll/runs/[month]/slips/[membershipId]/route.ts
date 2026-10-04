import { payslipEditSchema, payslipSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { editSlip } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs/{month}/slips/{membershipId} — the office's review of one slip in a DRAFT run. */
export async function POST(request: Request, { params }: { params: Promise<{ month: string; membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = payslipEditSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { month, membershipId } = await params;
    return ok(payslipSchema.parse(await editSlip(ctx, month, membershipId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/slips/[membershipId]");
  }
}
