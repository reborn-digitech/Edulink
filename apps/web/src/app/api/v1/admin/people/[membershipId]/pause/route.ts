import { okSchema, pauseBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { suspendMembership } from "@/lib/membership";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/pause — access paused with a reason the audit log keeps; not the office's own; the rule is lib/membership.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = pauseBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await suspendMembership(ctx, membershipId, parsed.data.reason);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/pause");
  }
}
