import { staffSalariesSchema, staffSalarySaveSchema, staffSalarySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { listSalaries, saveSalary } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/salaries — every member of staff's salary; the sealed numbers as their last four only. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(staffSalariesSchema.parse(await listSalaries(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/salaries");
  }
}

/** POST /api/v1/admin/payroll/salaries — one person's salary from a date; PAN and account sealed on arrival. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = staffSalarySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffSalarySchema.parse(await saveSalary(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/salaries");
  }
}
