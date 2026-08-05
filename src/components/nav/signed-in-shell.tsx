import { AppShell } from "./app-shell";
import { listContexts, type ActiveContext } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import type { Role } from "@/lib/constants";

/**
 * The signed-in chrome, for a session that HAS a role.
 *
 * Extracted from `(app)/layout.tsx` when `/account` moved out from behind the
 * role gate, and extracted rather than copied for the obvious reason: the school
 * name, the context count and the unread badge are live queries, and two copies
 * of them would drift the first time one was changed. `(app)` gates and then
 * calls this; `/account` calls it only when there is a role to call it with.
 *
 * IT DOES NOT GATE. Every caller decides for itself what a missing role means —
 * which is the whole point of the split, because `(app)` and `/account` answer
 * that question differently and both answers are right.
 */
export async function SignedInShell({
  session,
  children,
}: {
  session: ActiveContext & { role: string };
  children: React.ReactNode;
}) {
  const role = session.role as Role;
  const t = await getT();

  const contexts = await listContexts(session.user.id);
  const contextCount = contexts.memberships.length + (contexts.children.length > 0 ? 1 : 0);

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
