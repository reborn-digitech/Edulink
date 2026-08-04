import { redirect } from "next/navigation";
import { AppShell } from "@/components/nav/app-shell";
import { getSession, listContexts } from "@/lib/session";
import { hasRecord } from "@/lib/student-record";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import type { Role } from "@/lib/constants";

/**
 * Shell for every signed-in area.
 *
 * The role/school on the session has already been re-verified against a live
 * Membership row by `getSession`, so anything below this layout can trust
 * `session.schoolId` without re-checking membership. What it must still do is
 * scope each individual query by that id — see src/lib/tenancy.ts.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const contexts = await listContexts(session.user.id);
  const contextCount = contexts.memberships.length + (contexts.children.length > 0 ? 1 : 0);

  // Signed in but with no usable context. Two very different reasons, and
  // telling them apart is the whole point: a brand-new parent needs a join code,
  // and somebody whose school has paused them needs to be told that instead of
  // being handed a code that cannot help. (§7 no dead ends)
  if (!session.role) {
    if (contextCount === 0) {
      // Somebody who runs the server and teaches nowhere is the ORDINARY case
      // for a superuser, not an error state. Sending them to a join-code box
      // would be the third wrong answer this branch has given.
      if (session.user.isSuperuser) redirect("/root");

      const paused = await db.membership.count({
        where: { userId: session.user.id, status: "SUSPENDED", leftAt: null },
      });
      if (paused > 0) redirect("/suspended");

      /**
       * AN ALUMNUS IS NOT A NEW USER, and this branch used to treat them as one.
       *
       * Somebody who has left every school they were at — because they moved to
       * a school not on this platform, or finished school altogether — has no
       * active membership and landed here, on "join with a code". There is no
       * code that helps: they are not joining anything, and everything their
       * schools wrote about them was one redirect away and invisible.
       *
       * The same fourth-wrong-answer this branch has now given twice, once to a
       * paused member and once to a superuser. `hasRecord` is the question that
       * tells the cases apart.
       */
      if (await hasRecord(session)) redirect("/record");

      redirect("/join?first=1");
    }
    redirect("/switch");
  }

  const role = session.role as Role;
  const t = await getT();

  const [schoolName, unreadCount] = await Promise.all([
    session.schoolId
      ? db.school
          .findUnique({ where: { id: session.schoolId }, select: { name: true } })
          // "EduLink" is a name, so it is not translated. What sits in this slot
          // for a parent is a description of where they are, so it is.
          .then((s) => s?.name ?? "EduLink")
      : Promise.resolve(t("shell.yourChildren")),
    db.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);

  return (
    <AppShell
      user={{
        name: session.user.preferredName ?? session.user.name,
        avatarKey: session.user.avatarKey,
        role,
        schoolName,
        contextCount,
        isSuperuser: session.user.isSuperuser,
      }}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
