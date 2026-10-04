import { notFound, redirect } from "next/navigation";
import { getSession, isModuleOffPage, listContexts } from "@/lib/session";
import { hasRecord } from "@/lib/student-record";
import { SignedInShell } from "@/components/nav/signed-in-shell";
import { db } from "@/lib/db";
import { myJoinRequests } from "@/lib/join-requests";
import { myClaims } from "@/lib/guardian-claims";

/**
 * Shell for every signed-in area THAT BELONGS TO A SCHOOL.
 *
 * The role/school on the session has already been re-verified against a live
 * Membership row by `getSession`, so anything below this layout can trust
 * `session.schoolId` without re-checking membership. What it must still do is
 * scope each individual query by that id — see src/lib/tenancy.ts.
 *
 * THE GATE IS THE POINT OF THIS FILE, and it is why `/account` is no longer
 * under it. Everything below here is a school's working surface and needs a
 * school; a person's own settings are not, and requiring a role to reach them
 * locked alumni and paused members out of their own account. The chrome itself
 * moved to `SignedInShell` so both places render the same thing.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  // A librarian's or a warden's own menu page behind a module this school has off — the college no-dues at a
  // school (B-12): not here, rather than "Where would you like to go?".
  if (isModuleOffPage(session)) notFound();

  // Signed in but with no usable context. Several very different reasons, and
  // telling them apart is the whole point: a brand-new parent needs a join code,
  // and somebody whose school has paused them needs to be told that instead of
  // being handed a code that cannot help. (§7 no dead ends)
  if (!session.role) {
    const contexts = await listContexts(session.user.id);
    const contextCount = contexts.memberships.length + (contexts.children.length > 0 ? 1 : 0);

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

      // Somebody who typed a code and waits for a yes, or asked to be linked
      // to a child: the page that says so, not the box they already filled.
      const [joins, claims] = await Promise.all([myJoinRequests(session.user.id), myClaims(session.user.id)]);
      if (joins.length > 0) redirect("/join/waiting");
      if (claims.length > 0) redirect("/parent/link");

      redirect("/join?first=1");
    }
    redirect("/switch");
  }

  return (
    <SignedInShell session={session as typeof session & { role: string }}>{children}</SignedInShell>
  );
}
