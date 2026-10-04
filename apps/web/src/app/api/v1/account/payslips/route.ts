import { myPayslipsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { ok } from "@/lib/api-v1";
import { myPayslips } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/account/payslips — my locked slips, my structure, my advances. Any member of staff, their own only. */
export async function GET() {
  try {
    const ctx = await requireApiRole(...SCHOOL_STAFF_ROLES);
    return ok(myPayslipsSchema.parse(await myPayslips(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/account/payslips");
  }
}
