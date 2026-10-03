import { payrollStatementSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { statementFor } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/statement/{membershipId}?year= — a member of staff's yearly earnings statement. */
export async function GET(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const year = new URL(request.url).searchParams.get("year") ?? undefined;
    return ok(payrollStatementSchema.parse(await statementFor(ctx, membershipId, year)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/statement/[membershipId]");
  }
}
