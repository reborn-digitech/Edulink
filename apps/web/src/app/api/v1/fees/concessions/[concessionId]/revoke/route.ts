import { feeOkSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { revokeConcession } from "@/lib/fees";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/fees/concessions/{concessionId}/revoke */
export async function POST(_request: Request, { params }: { params: Promise<{ concessionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { concessionId } = await params;
    await revokeConcession(ctx, concessionId);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/concessions/[concessionId]/revoke");
  }
}
