import { expertInviteBodySchema, expertInvitedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { inviteExpert } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/staff/experts/invite — invite an outside expert to the
 * marketplace (the web's experts invite action, R-50). The office or a
 * teacher, as on the web; audited expert.invite. The answer is the link, the
 * one copy of the invitation's token, as the web shows it; an address given is
 * also mailed it, best effort. The door asks for a name or an address (the
 * library would take neither), so an empty body is a 422 and never mints an
 * invitation. 201.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const parsed = expertInviteBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const created = await inviteExpert(ctx, { email: parsed.data.email, name: parsed.data.name });
    const app = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return ok(expertInvitedSchema.parse({ link: `${app}/expert/invite/${created.token}`, expiresAt: created.expiresAt.toISOString() }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/staff/experts/invite");
  }
}
