import type { Role } from "@/lib/constants";
import { AccessError } from "@/lib/access-error";
import { requireApiSession } from "@/lib/api-reads/shared";
import type { ActiveContext } from "@/lib/session";

/** The roles a pass is bought on (src/lib/pass-orders.ts): oneself as a student, a teacher or an expert, or a guardian for a child. */
export const PASS_BUYER_ROLES: Role[] = ["STUDENT", "PARENT", "TEACHER", "EXPERT"];

/** The role alone, checked before the body is read, so a role the door refuses is told 403 and not what was wrong with its body. */
export async function requirePassRole(...roles: Role[]): Promise<ActiveContext> {
  const ctx = await requireApiSession();
  if (!ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return ctx;
}
