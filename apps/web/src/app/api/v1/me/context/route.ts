import { switchContextSchema } from "@edulink/contracts";
import { getSession, setActiveContext } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, apiInvalid, meBody, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/me/context — switch the active school and role, the same
 * rule as the account page's "Where you belong" rows: only a school the
 * person actually belongs to, in a role they hold there.
 */
export async function POST(request: Request) {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const parsed = switchContextSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const switched = await setActiveContext(ctx.sessionId, ctx.user.id, parsed.data);
    if (!switched) throw new AccessError("access.wrongRoleForThisAction");
    const fresh = await getSession();
    return ok(await meBody(fresh ?? ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/me/context");
  }
}
