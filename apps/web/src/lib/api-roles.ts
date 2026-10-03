import "server-only";
import { getSession, type ActiveContext } from "./session";
import { AccessError } from "./access-error";
import type { Role } from "./constants";

/**
 * A route handler's first line for a door several roles share (the library
 * and hostel modules, 3 Oct 2026): signed in, in one of `roles`, or refused
 * — 401 or 403 — BEFORE the body is read, so a role the catalog does not
 * name is answered 403 whatever it sends, as the API sweep expects. What
 * each role may then do is the library function's to decide; this only
 * keeps the door.
 */
export async function requireApiRoles(...roles: Role[]): Promise<ActiveContext> {
  const ctx = await getSession();
  if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  if (!ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return ctx;
}
