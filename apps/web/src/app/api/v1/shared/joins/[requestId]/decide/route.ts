import { joinDecisionBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decideJoin } from "@/lib/join-requests";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/shared/joins/{requestId}/decide — let somebody who typed a code in, or decline, with a sentence for them if the decider has one; who may is `decideJoin`'s rule. */
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { requestId } = await params;
    const parsed = joinDecisionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await decideJoin(ctx, requestId, parsed.data.decision, parsed.data.reason);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/joins/[requestId]/decide");
  }
}
