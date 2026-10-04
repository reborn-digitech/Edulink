import { feePupilLedgerSchema, feePupilQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { feesPupilRead } from "@/lib/api-reads/fees";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/pupils/{studentMembershipId} — one pupil's ledger: plan, instalments, payments, concessions, receipts, and the heads and structures the forms need. */
export async function GET(request: Request, { params }: { params: Promise<{ studentMembershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const { studentMembershipId } = await params;
    const parsed = feePupilQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feePupilLedgerSchema.parse(await feesPupilRead(ctx, studentMembershipId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/pupils/[studentMembershipId]");
  }
}
