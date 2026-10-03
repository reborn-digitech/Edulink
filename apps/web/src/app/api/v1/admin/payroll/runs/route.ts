import { payrollRunDraftSchema, payrollRunSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { draftRun } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs — draft the month's run, or draw a DRAFT afresh. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = payrollRunDraftSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(payrollRunSchema.parse(await draftRun(ctx, parsed.data.month)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs");
  }
}
