import { expertInviteBodySchema, expertInvitedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { inviteExpert } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/staff/experts/invite — invite an outside expert to the
 * marketplace (the web's experts invite action, R-50). The office or a
 * teacher, as on the web; audited expert.invite. 201.
 *
 * ⚠ BY ADDRESS, AND THE ANSWER NEVER CARRIES THE LINK (QA-01, 24 Oct 2026).
 * The answer used to be the link, "the one copy of the invitation's token":
 * any staff member at any school could invite somebody else's address and
 * hold a working link to it, and the invite page reclaimed an unproved
 * account under that address for whoever opened it. Now the link goes to the
 * invited mailbox only; the answer is the invitation's id, whether the mail
 * went, and when the invitation lapses. A body without an address is a 422
 * and never mints an invitation.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const parsed = expertInviteBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const created = await inviteExpert(ctx, { email: parsed.data.email, name: parsed.data.name });
    return ok(expertInvitedSchema.parse({ inviteId: created.inviteId, sent: created.sent, expiresAt: created.expiresAt.toISOString() }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/staff/experts/invite");
  }
}
