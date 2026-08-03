import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PauseCircleIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getSession, listContexts } from "@/lib/session";
import { suspendedSchoolsFor } from "@/lib/membership";
import { getT } from "@/lib/i18n/server";
import { ROLE_HOME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Access paused",
  robots: { index: false, follow: false },
};

/**
 * What somebody sees when their school has paused their access.
 *
 * THIS PAGE EXISTS BECAUSE THE ALTERNATIVE WAS A LIE. Before it, a suspended
 * teacher's context resolved to nothing and they were sent to `/switch`, which
 * told them "You are not part of a school yet — join with a code". They are part
 * of a school. There is no code that will fix it. Being told the wrong thing by
 * software is worse than being told nothing, and this is exactly the moment
 * somebody is already worried.
 *
 * OUTSIDE `(app)` on purpose: the shell needs a role, and not having one is the
 * entire situation. It reads only the person's own Membership rows, which stay
 * self-readable through `app.user_id` when their tenant set is empty — so this
 * page works precisely when nothing else does.
 */
export default async function SuspendedPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const t = await getT();
  const [suspended, contexts] = await Promise.all([
    suspendedSchoolsFor(session.user.id),
    listContexts(session.user.id),
  ]);

  // Nothing is paused — they arrived here by URL, or it was just restored.
  // Send them where they should be rather than showing a worrying page.
  if (suspended.length === 0) {
    if (session.role) redirect(ROLE_HOME[session.role]);
    redirect(contexts.memberships.length + contexts.children.length > 0 ? "/switch" : "/join");
  }

  // Somewhere else still works: a second school, or their own children. Say so,
  // and give them the way back to it.
  const hasOther = contexts.memberships.length > 0 || contexts.children.length > 0;

  return (
    <main id="main" className="mx-auto max-w-md px-4 py-16">
      <Wordmark className="mb-8" />

      <div className="grid size-14 place-items-center rounded-full bg-warn-soft text-warn">
        <PauseCircleIcon weight="duotone" className="size-7" />
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-fg">{t("suspended.title")}</h1>

      {suspended.length === 1 ? (
        <p className="mt-2 text-fg-muted">
          {t("suspended.one", { school: suspended[0]!.schoolName })}
        </p>
      ) : (
        <>
          <p className="mt-2 text-fg-muted">{t("suspended.many")}</p>
          <ul className="mt-3 space-y-1.5">
            {suspended.map((entry) => (
              <li
                key={entry.schoolId}
                className="rounded-[--radius-sm] bg-surface-muted px-3.5 py-2.5 text-sm font-medium text-fg"
              >
                {entry.schoolName}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The reassurance comes before the instruction, deliberately. "Have I
          lost my work?" is the question actually being asked. */}
      <p className="mt-5 text-sm leading-relaxed text-fg-muted">{t("suspended.nothingLost")}</p>
      <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t("suspended.whatToDo")}</p>

      {hasOther && (
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t("suspended.stillYours")}</p>
      )}

      <div className="mt-8 space-y-2">
        {hasOther && (
          <Button asChild block>
            <a href="/switch">{t("palette.switchContext")}</a>
          </Button>
        )}
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="secondary" block>
            {t("suspended.signOut")}
          </Button>
        </form>
      </div>
    </main>
  );
}
