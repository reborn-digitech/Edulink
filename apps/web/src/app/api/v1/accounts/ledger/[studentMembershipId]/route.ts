import { studentLedgerSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { officeLedger } from "@/lib/college-fees";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ studentMembershipId: string }> };

/** GET /api/v1/accounts/ledger/{studentMembershipId} — One student's ledger: each term's demand, the scholarship receivable, paid and net due. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    const { studentMembershipId } = await params;
    return ok(studentLedgerSchema.parse(await officeLedger(ctx, studentMembershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/ledger/[studentMembershipId]");
  }
}
