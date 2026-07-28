import { redirect } from "next/navigation";
import { AppShell } from "@/components/nav/app-shell";
import { getSession, listContexts } from "@/lib/session";
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

  // Signed in but with no usable context — e.g. a brand-new parent who has not
  // linked a child yet. Send them somewhere that can fix it. (§7 no dead ends)
  if (!session.role) {
    if (contextCount === 0) redirect("/join?first=1");
    redirect("/switch");
  }

  const role = session.role as Role;

  const [schoolName, unreadCount] = await Promise.all([
    session.schoolId
      ? db.school
          .findUnique({ where: { id: session.schoolId }, select: { name: true } })
          .then((s) => s?.name ?? "EduLink")
      : Promise.resolve("Your children"),
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
      }}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
