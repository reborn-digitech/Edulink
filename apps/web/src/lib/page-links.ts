import "server-only";
import { isDutyRole, parseDuties } from "@edulink/contracts";
import { db } from "./db";
import { isLimitedRole } from "./constants";
import { enabledModules } from "./modules";
import { modulePagePermitted } from "./role-gate";
import type { ActiveContext } from "./session";

/**
 * WHICH PAGES THIS READER MAY OPEN, for drawing links (QA-19, 24 Oct 2026).
 *
 * A limited role — a driver, the library desk, a warden, an alumnus, the college
 * desks — reaches only its own pages on the school's working surface (role-gate.ts,
 * rule 1); anywhere else there it is served as if it had no school and lands on
 * "Where would you like to go?". Pages shared with the older roles (the feeds,
 * the placement analytics, the people list) drew every link anyway: the global
 * feed's "Our school's feed", "Upcoming birthdays" and Comment, the placement tab
 * strip, a person's name. A page asks here with the gate's own page rule
 * (`modulePagePermitted`) and leaves a refused link out or draws it as text.
 *
 * Every other role is answered yes: its pages are gated by their own guards,
 * which this does not second-guess. A query string is not part of the path.
 */
export async function pageOpener(ctx: Pick<ActiveContext, "role" | "schoolId" | "membershipId">): Promise<(href: string) => boolean> {
  const role = ctx.role;
  if (!isLimitedRole(role)) return () => true;
  const modulesOn = await enabledModules(ctx.schoolId);
  const duties =
    isDutyRole(role) && ctx.membershipId
      ? parseDuties((await db.membership.findUnique({ where: { id: ctx.membershipId }, select: { dutiesJson: true } }))?.dutiesJson)
      : [];
  return (href: string) => modulePagePermitted(role, href.split(/[?#]/)[0]!, modulesOn, duties);
}
