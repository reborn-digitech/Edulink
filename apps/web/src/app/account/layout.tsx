import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { SignedInShell } from "@/components/nav/signed-in-shell";
import { getSession } from "@/lib/session";
import { hasRecord } from "@/lib/student-record";
import { getT } from "@/lib/i18n/server";
import { SignOutForm } from "@/components/sign-out-form";

/**
 * Your own settings, which belong to YOU rather than to a school.
 *
 * DELIBERATELY OUTSIDE `(app)`, and the reason is the bug this closes. `(app)`
 * requires an active role, and `/account` sat under it — so the moment somebody
 * had no role they could not reach their own language, their own password, their
 * own notification preferences or their own sign-out. Three separate populations
 * hit that, and none of them is exotic:
 *
 *   AN ALUMNUS, who left the only school they were at. The leaving-certificate
 *   work created a whole population of people who legitimately have no role,
 *   and every one of them was locked out of their own account.
 *
 *   A PAUSED MEMBER, whose school suspended them. `/suspended` had to carry its
 *   own sign-out button precisely because this page was unreachable.
 *
 *   A PARENT MID-SWITCH, or anybody else between contexts.
 *
 * The page itself never needed a role — it has always been `requireUser` — so
 * this was the layout refusing on behalf of a page that would have been happy
 * to render. Nothing about the page's authorisation changed.
 *
 * TWO CHROMES, ONE PAGE. With a role, the ordinary shell, so this still feels
 * like part of the app and the nav still works. Without one, a bare header —
 * the same shape `/record` uses, and for the same reason: there is nowhere to
 * navigate to, so rendering navigation to a school they are not in would be
 * offering doors that all refuse.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role) {
    return (
      <SignedInShell session={session as typeof session & { role: string }}>
        {children}
      </SignedInShell>
    );
  }

  // No role: their own account, and the one or two places they can actually go.
  const [showRecord, t] = await Promise.all([hasRecord(session), getT()]);

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4">
          <Link href="/account" aria-label={t("shell.yourAccount")}>
            <Wordmark size={26} />
          </Link>
          <div className="flex items-center gap-2">
            {/* Offered only when there IS one. A link to an empty record is the
                dead end this whole area exists to avoid. */}
            {showRecord && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/record">{t("account.yourRecordLink")}</Link>
              </Button>
            )}
            <SignOutForm>
              <Button type="submit" size="sm" variant="secondary">
                {t("shell.signOut")}
              </Button>
            </SignOutForm>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
