import { parentInviteBodySchema, parentInvitedSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { inviteParent } from "@/lib/parent-link";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/people/{membershipId}/parents — invite one parent or
 * guardian to a pupil by email (the web's inviteParentAction on the person
 * page, R-50). The library the page calls: the address is mailed a link that
 * joins them to this child once accepted; audited parent.invite. The office's
 * alone. A pupil this school does not hold (or not a pupil) is a 404; a bad
 * address, the child's own address, a parent already linked or already
 * invited is a 422 in words. 201 with the invitation's id.
 */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = parentInviteBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await inviteParent(ctx, membershipId, { email: parsed.data.email, name: parsed.data.name, relation: parsed.data.relation });
    if (!result.ok) {
      if (result.errorKey === "refusal.notPupilsHere") throw new AccessError(result.errorKey, "NOT_FOUND");
      return apiRefused(result);
    }
    return ok(parentInvitedSchema.parse({ inviteId: result.inviteId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/parents");
  }
}
