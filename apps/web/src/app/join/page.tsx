import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  GraduationCapIcon,
  HandHeartIcon,
  TicketIcon,
} from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { pendingInvitesFor } from "@/lib/my-invites";
import { openMyInvite } from "./actions";
import { ROLE_META, type SchoolRole } from "@/lib/constants";
import { EnvelopeSimpleOpenIcon } from "@phosphor-icons/react/ssr";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.joinSchool"),
  description: t("join.metaDescription"),
};
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const t = await getT();
  const session = await getSession();
  const { first } = await searchParams;

  /**
   * SIGNED IN ALREADY? SAY SO — do not silently bounce them.
   *
   * This used to `redirect(ROLE_HOME[role])`, and the case that exposes it is
   * the ordinary one in a school: a shared laptop with a teacher still signed
   * in, and a child sent to join with a code. They followed "join with a code"
   * from the login page and landed on somebody else's dashboard, with nothing
   * saying why and no way forward. §7 says no dead ends; a silent redirect to
   * the wrong person's home is one.
   *
   * The deeper links (/join/student, /join/parent) still redirect, because they
   * are reached FROM here and this is the screen that explains it.
   */
  const signedInAs = session?.role
    ? (session.user.preferredName ?? session.user.name)
    : null;

  // The invitations waiting at this person's own (verified) address — the
  // screen that used to say "go back to your email" now offers them here.
  const waiting = session ? await pendingInvitesFor(session.user.id) : [];

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          {!session && (
            <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
              {t("login.title")}
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          {first === "1" ? t("join.almostThere") : t("join.letsGetYouIn")}
        </h1>
        <p className="mt-2 text-fg-muted">
          {first === "1" ? t("join.accountReady") : t("join.pickOne")}
        </p>

        {waiting.length > 0 && (
          <Card className="mt-6 border-accent/40 p-4" data-testid="waiting-invites">
            <p className="flex items-center gap-2 font-semibold text-fg">
              <EnvelopeSimpleOpenIcon weight="duotone" className="size-5 text-accent-strong" />
              {waiting.length === 1 ? t("join.waitingTitle") : t("join.waitingTitleMany", { count: waiting.length })}
            </p>
            <p className="mt-1 text-sm text-fg-muted">{t("join.waitingBody")}</p>
            <ul className="mt-3 space-y-2">
              {waiting.map((invite) => (
                <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border p-3">
                  <span className="text-sm font-medium text-fg">
                    {t("join.waitingAs", {
                      school: invite.schoolName,
                      role:
                        invite.role === "PARENT"
                          ? t("role.parent")
                          : ROLE_META[invite.role as SchoolRole]
                            ? t(ROLE_META[invite.role as SchoolRole].labelKey)
                            : invite.role,
                    })}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await openMyInvite(invite.id);
                    }}
                  >
                    <Button type="submit" size="sm" icon={<ArrowRightIcon weight="bold" />}>
                      {t("join.openInvite")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {signedInAs && (
          /* A SECTION named by its own first line, which gives the warning an
             accessible name it did not have — and makes `id="signed-in-warning"`
             load-bearing markup rather than a hook invented for a test. */
          <section
            aria-labelledby="signed-in-warning"
            className="mt-6 rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft p-4"
          >
            <p id="signed-in-warning" className="text-sm font-semibold text-fg">
              {t("join.signedInAs", { name: signedInAs })}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {t("join.signedInBody")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action="/api/auth/logout" method="post">
                <Button type="submit" size="sm" variant="secondary">
                  {t("join.signOutAndJoin")}
                </Button>
              </form>
              <Button asChild size="sm" variant="ghost">
                <Link href={ROLE_HOME[session!.role as Role]}>{t("join.backToDashboard")}</Link>
              </Button>
            </div>
          </section>
        )}

        <div className="mt-8 space-y-3">
          <JoinOption
            href="/join/student"
            role="student"
            icon={<GraduationCapIcon weight="duotone" className="size-8" />}
            title={t("join.imStudent")}
            body={t("join.imStudentBody")}
          />
          <JoinOption
            href="/join/parent"
            role="parent"
            icon={<HandHeartIcon weight="duotone" className="size-8" />}
            title={t("join.imParent")}
            body={t("join.imParentBody")}
          />
          <JoinOption
            href="/login"
            role="teacher"
            icon={<TicketIcon weight="duotone" className="size-8" />}
            title={t("join.wasInvited")}
            body={t("join.wasInvitedBody")}
          />
        </div>

        <p className="mt-8 text-center text-sm text-fg-muted">
          {t("join.settingUpSchool")}{" "}
          <Link
            href="/register"
            className="font-semibold text-accent-strong underline underline-offset-4"
          >
            {t("join.registerItHere")}
          </Link>
        </p>
      </main>
    </div>
  );
}

function JoinOption({
  href,
  role,
  icon,
  title,
  body,
}: {
  href: string;
  role: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card interactive data-role={role} className="overflow-hidden">
      <Link href={href} className="flex items-center gap-4 p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-fg">{title}</span>
          <span className="block text-sm text-fg-muted">{body}</span>
        </span>
        <ArrowRightIcon weight="bold" className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
      </Link>
    </Card>
  );
}
