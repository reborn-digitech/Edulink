import { payrollRunSchema, payrollRunShareSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { shareRun } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/payroll/runs/{month}/share — whether the head reads the run's slips. */
export async function POST(request: Request, { params }: { params: Promise<{ month: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = payrollRunShareSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { month } = await params;
    return ok(payrollRunSchema.parse(await shareRun(ctx, month, parsed.data.shared)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/runs/[month]/share");
  }
}
