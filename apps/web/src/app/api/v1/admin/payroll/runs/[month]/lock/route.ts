import { payrollRunLockSchema, payrollRunSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { lockRun } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs/{month}/lock — freeze the run ({ confirm: true }). */
export async function POST(request: Request, { params }: { params: Promise<{ month: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = payrollRunLockSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { month } = await params;
    return ok(payrollRunSchema.parse(await lockRun(ctx, month)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/lock");
  }
}
