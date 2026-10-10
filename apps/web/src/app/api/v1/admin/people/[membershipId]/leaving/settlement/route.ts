import { leavingSettleBodySchema, leavingSettlementViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { leavingSettlementFor, settleOnLeaving } from "@/lib/leaving-settlement";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/admin/people/{membershipId}/leaving/settlement — what a leaver still owes, what the departure cancelled, what is out, and the office's decision once made (R-61 Q2). */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const { membershipId } = await params;
    return ok(leavingSettlementViewSchema.parse(await leavingSettlementFor(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/leaving/settlement");
  }
}

/** POST — the office's choice on every owed line, once: cancel the balance or keep it owed. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = leavingSettleBodySchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(leavingSettlementViewSchema.parse(await settleOnLeaving(ctx, membershipId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/leaving/settlement");
  }
}
