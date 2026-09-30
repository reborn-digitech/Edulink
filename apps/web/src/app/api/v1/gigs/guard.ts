import type { Role } from "@/lib/constants";
import { AccessError } from "@/lib/tenancy";
import { requireApiSession } from "@/lib/api-reads/shared";
import type { ActiveContext } from "@/lib/session";

/**
 * The gig doors are shared by people with a school (a pupil, a teacher, the
 * office) and people without one (a guardian, an expert), so the gate is the
 * role alone; which pupil, which booking and which slot are theirs is settled
 * in src/lib/gig-sessions.ts. The role is checked before the body is read, so
 * a role the door refuses is told 403 and not what was wrong with its body.
 */
export async function requireGigRole(...roles: Role[]): Promise<ActiveContext> {
  const ctx = await requireApiSession();
  if (!ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return ctx;
}
