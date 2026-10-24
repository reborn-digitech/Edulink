import "server-only";
import { db } from "./db";
import { forUser } from "./tenant-context";
import { ROLE_HOME, type Role } from "./constants";
import { homeFor } from "./role-home";

/**
 * Picks the role/school to open a session with.
 *
 * MOVED OUT OF app/login/actions.ts. It was exported from a "use server" file
 * because the magic link and the SSO callback needed the same logic — and an
 * export from a "use server" file is a server action, callable by any browser
 * as a POST with arguments of its choosing. This one takes a user id and
 * answers which schools that person belongs to. It is a lib now: importable by
 * the three routes that need it and reachable by nothing else.
 */
export async function resolveContext(
  userId: string,
  preferredRole?: string | null,
  preferredSchoolId?: string | null,
): Promise<{ role: Role | null; schoolId: string | null; redirectTo: string }> {
  // THE ONE PLACE WITH NO SCHOOL TO SCOPE TO, and the reason `forUser` exists.
  //
  // This has to ask which schools somebody belongs to, and the answer lives in a
  // table scoped by school. There is no session yet either — it is created from
  // what this returns. So it binds the USER instead, and the Membership policy
  // answers "your own rows" without needing a school.
  //
  // Inside the wrapper rather than at the call sites (password login, magic
  // link, SSO, the phone's sign-in) on purpose: a call site that has to remember
  // is a call site that eventually forgets, and forgetting here means everyone
  // lands on "Join your school" holding a perfectly good password.
  const context = await forUser(userId, () => resolveContextForUser(userId, preferredRole, preferredSchoolId));
  // A college's head lands on the college's dashboard, not on the school's that would send them on (QA-57).
  if (context.role && context.redirectTo === ROLE_HOME[context.role]) return { ...context, redirectTo: await homeFor(context.role, context.schoolId) };
  return context;
}

async function resolveContextForUser(
  userId: string,
  preferredRole?: string | null,
  preferredSchoolId?: string | null,
): Promise<{ role: Role | null; schoolId: string | null; redirectTo: string }> {
  if (preferredRole === "RECRUITER") {
    const profile = await db.recruiterProfile.findUnique({ where: { userId }, select: { disabledAt: true } });
    if (profile && !profile.disabledAt) return { role: "RECRUITER", schoolId: null, redirectTo: ROLE_HOME.RECRUITER };
  }
  if (preferredRole && preferredRole !== "PARENT" && preferredSchoolId) {
    const membership = await db.membership.findFirst({
      where: {
        userId,
        schoolId: preferredSchoolId,
        role: preferredRole,
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true },
    });
    if (membership) {
      return {
        role: preferredRole as Role,
        schoolId: preferredSchoolId,
        redirectTo: ROLE_HOME[preferredRole as Role],
      };
    }
  }

  const all = await db.membership.findMany({
    where: { userId, status: "ACTIVE", leftAt: null },
    select: { role: true, schoolId: true },
    orderBy: { joinedAt: "asc" },
  });
  /**
   * AN ALUMNUS ROW IS A WAY BACK, NOT A WAY IN (3 Oct 2026). A pupil who left
   * keeps an ALUMNUS membership at the old school; one who moved to another
   * school on the platform is a STUDENT there as well. Counting the alumnus
   * row would send every transferred pupil to the chooser at every sign-in,
   * so it is set aside: the person lands where they are now, and reaches
   * the old school from the chooser. Only somebody with nothing else lands
   * on their alumni home.
   */
  const memberships = all.filter((m) => m.role !== "ALUMNUS");
  const alumni = all.filter((m) => m.role === "ALUMNUS");

  const guardianships = await db.guardianship.count({
    where: { parentUserId: userId, status: "ACTIVE" },
  });

  // An expert has no Membership and no Guardianship, so without this branch they
  // authenticate successfully and are then sent to "join a school" — which is
  // the one thing they must never do. Counted into `total` as well, because a
  // teacher who is also an expert has two ways in and should be asked which.
  // A disabled expert has no way in (G4-28, risks batch 5 Oct 2026), as a disabled recruiter has none.
  const expertProfile = await db.expertProfile.findFirst({
    where: { userId, disabledAt: null },
    select: { id: true },
  });
  // A recruiter is the same shape (4 Oct 2026): no Membership, no Guardianship, its own home. A disabled one has no way in.
  const recruiterProfile = await db.recruiterProfile.findUnique({ where: { userId }, select: { disabledAt: true } });
  const isRecruiter = recruiterProfile !== null && recruiterProfile.disabledAt === null;

  const total =
    memberships.length + (guardianships > 0 ? 1 : 0) + (expertProfile ? 1 : 0) + (isRecruiter ? 1 : 0);

  // More than one way in? Let them choose rather than guessing wrong.
  if (total > 1) return { role: null, schoolId: null, redirectTo: "/switch" };

  const only = memberships[0];
  if (only) {
    return {
      role: only.role as Role,
      schoolId: only.schoolId,
      redirectTo: ROLE_HOME[only.role as Role],
    };
  }
  if (guardianships > 0) return { role: "PARENT", schoolId: null, redirectTo: "/parent" };
  // No school on the session, deliberately: an expert's schools are derived from
  // their confirmed bookings on every request, never carried on the cookie.
  if (expertProfile) return { role: "EXPERT", schoolId: null, redirectTo: "/expert" };
  if (isRecruiter) return { role: "RECRUITER", schoolId: null, redirectTo: ROLE_HOME.RECRUITER };

  // Runs the server, teaches nowhere. Checked LAST, after every school-shaped
  // way in, because somebody who is both an operator and a teacher should land
  // in their classroom — the flag is an extra door, not a replacement for one.
  const operator = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperuser: true, isAppAdmin: true },
  });
  if (operator?.isSuperuser) return { role: null, schoolId: null, redirectTo: "/root" };

  // Curates the bank, teaches nowhere. Same shape as the operator branch and
  // for the same reason — and it was missing: a content-team appointment with
  // no school membership signed in to "Almost there — connect it to a school
  // or a child", which is the one page that has nothing for them. Below the
  // superuser check because an operator's own appadmin flag is inherited, not
  // their front door.
  if (operator?.isAppAdmin) return { role: null, schoolId: null, redirectTo: "/appadmin" };

  // Left every school, and at least one keeps a place for them as an alumnus.
  if (alumni.length > 1) return { role: null, schoolId: null, redirectTo: "/switch" };
  if (alumni[0]) return { role: "ALUMNUS", schoolId: alumni[0].schoolId, redirectTo: ROLE_HOME.ALUMNUS };

  /**
   * AN ALUMNUS BELONGS TO NOTHING AND IS NOT NEW, which is the distinction this
   * branch kept failing to draw — first for experts, then for operators, and
   * now for the person it matters most to.
   *
   * Somebody who has left every school they were at, because they moved to one
   * that is not on this platform or finished school altogether, has no active
   * membership at all. Sending them to "join with a code" is the same wrong
   * answer a suspended member used to get: there is no code that helps, and
   * everything their schools wrote about them was sitting one redirect away.
   *
   * Left-and-gone memberships only — `leftAt` is deliberately not filtered, so
   * this asks "were you ever a pupil" rather than "are you one now".
   */
  const everAPupil = await db.membership.count({ where: { userId, role: "STUDENT" } });
  if (everAPupil > 0) return { role: null, schoolId: null, redirectTo: "/record" };

  // Signed in, but belongs to nothing yet.
  return { role: null, schoolId: null, redirectTo: "/join?first=1" };
}

/**
 * WHY A RIGHT PASSWORD OPENS NOTHING (G4-28, risks batch 5 Oct 2026): the outside account the operator closed, when it
 * was the person's only way in. A recruiter or an expert holds no membership; once the operator sets `disabledAt`
 * they used to sign in to the "join a school" page with no word of why. The sign-in paths (auth-login.ts) ask this
 * after the password matches and answer with a sentence instead of a session. Null when the person has any other way
 * in (a school, a child, the operator's or the content team's flag), which still opens as before.
 */
export async function closedOutsideAccount(userId: string): Promise<"RECRUITER" | "EXPERT" | null> {
  return forUser(userId, async () => {
    const [recruiter, expert] = await Promise.all([
      db.recruiterProfile.findUnique({ where: { userId }, select: { disabledAt: true } }),
      db.expertProfile.findUnique({ where: { userId }, select: { disabledAt: true } }),
    ]);
    const closed = recruiter?.disabledAt ? "RECRUITER" : expert?.disabledAt ? "EXPERT" : null;
    if (!closed) return null;
    if ((recruiter && !recruiter.disabledAt) || (expert && !expert.disabledAt)) return null;
    const [memberships, guardianships, flags] = await Promise.all([
      db.membership.count({ where: { userId, status: "ACTIVE", leftAt: null } }),
      db.guardianship.count({ where: { parentUserId: userId, status: "ACTIVE" } }),
      db.user.findUnique({ where: { id: userId }, select: { isSuperuser: true, isAppAdmin: true } }),
    ]);
    if (memberships > 0 || guardianships > 0 || flags?.isSuperuser || flags?.isAppAdmin) return null;
    return closed;
  });
}
