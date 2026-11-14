import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { SignOutForm } from "@/components/sign-out-form";

/**
 * The record area, deliberately OUTSIDE `(app)`.
 *
 * `(app)` needs an active role, and the whole point of this area is that it
 * works when there is not one — an alumnus at a school that is not on this
 * platform has no membership, so no tenant, so no nav shell.
 *
 * BEING OUTSIDE THE SHELL IS ALSO THE RESTRICTION, and that is why it is worth
 * doing this way rather than by hiding links. There is no route from here to
 * the bulletin, to practice, to messages or to a class, because this layout
 * renders no navigation to them at all — and every one of those pages
 * independently requires a live membership. A leaver keeps their record and
 * gets nothing else, enforced twice and by construction rather than by a
 * hidden button.
 */
export default async function RecordLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const t = await getT();

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        {/* Wraps under the wordmark at phone width: three buttons on one 16 px-gutter line once pushed Sign out off the screen. */}
        <div className="mx-auto flex min-h-16 max-w-2xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
          <Link href="/record" aria-label={t("record.yourRecord")}>
            <Wordmark size={26} />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {/*
              A door back into a school, for the ordinary case where somebody
              with a live membership arrived here from their account page.
              `/switch` sends them onward, and turns them away if they have
              nowhere to go — so this is never a dead end either way.
            */}
            {session.role && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/switch">{t("record.backToSchool")}</Link>
              </Button>
            )}
            {/* Their own settings — language, password, sign-out on every
                device. Offered to everybody here, because the people most
                likely to be on this page are the ones with no role, and until
                `/account` moved out of the role-gated shell it was the one
                thing they could not reach. */}
            <Button asChild size="sm" variant="ghost">
              <Link href="/account">{t("record.account")}</Link>
            </Button>
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
