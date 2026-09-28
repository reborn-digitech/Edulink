import { joinDecisionBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decideClaim } from "@/lib/guardian-claims";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/claims/{claimId}/decide — make a claimant a child's guardian, or decline; who may is `decideClaim`'s rule. */
export async function POST(request: Request, { params }: { params: Promise<{ claimId: string }> }) {
  try {
    // A guardian has no school of their own; whether the child is theirs is the library's question.
    const session = await requireApiSession();
    const ctx = session.role === "PARENT" ? session : await requireApiRole("ADMIN", "PRINCIPAL");
    const { claimId } = await params;
    const parsed = joinDecisionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await decideClaim(ctx, claimId, parsed.data.decision);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/claims/[claimId]/decide");
  }
}
