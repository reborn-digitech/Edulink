import { payrollStatementSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { myStatement } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/account/payslips/statement?year= — my yearly earnings statement. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN");
    const year = new URL(request.url).searchParams.get("year") ?? undefined;
    return ok(payrollStatementSchema.parse(await myStatement(ctx, year)));
  } catch (error) {
    return moduleFailure(error, "api/v1/account/payslips/statement");
  }
}
