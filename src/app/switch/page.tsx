import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BuildingsIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { getSession, listContexts } from "@/lib/session";
import { db } from "@/lib/db";
import { Wordmark } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { switchContext } from "./actions";
import { getT } from "@/lib/i18n/server";
import { ROLE_META, type Role } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.chooseWhere") };
}

/**
 * Role/school picker.
 *
 * Reached whenever a person legitimately has more than one way in — a head of
 * year who is also an admin, or a teacher who is also a parent at the same
 * school. Guessing for them and being wrong is worse than one extra tap.
 */
export default async function SwitchPage() {
  const t = await getT();
  const session = await getSession();
  if (!session) redirect("/login");

  const { memberships, children } = await listContexts(session.user.id);

  if (memberships.length === 0 && children.length === 0) {
    // "You are not part of a school yet" is FALSE for somebody who has been
    // paused — they are part of one, it is closed to them, and no join code
    // will open it. Send them to the page that says so.
    if (session.user.isSuperuser) redirect("/root");
    if (session.user.isAppAdmin) redirect("/appadmin");

    const paused = await db.membership.count({
      where: { userId: session.user.id, status: "SUSPENDED", leftAt: null },
    });
    if (paused > 0) redirect("/suspended");

    return (
      <main id="main" className="mx-auto max-w-md px-4 py-16">
        <Wordmark className="mb-8" />
        <EmptyState
          title={t("switch.notPartOfSchool")}
          description={t("switch.notPartBody")}
          action={
            <Button asChild>
              <Link href="/join">{t("switch.joinWithCode")}</Link>
            </Button>
          }
        />
      </main>
    );
  }

  // One school is named, several are counted. "Parent · 1 schools" is what a
  // count-only subtitle produced for the ordinary stand-in guardian with six
  // children at one school — and when there is exactly one school, its name is
  // strictly more useful than the number anyway.
  const parentSchoolNames = new Set(children.map((child) => child.schoolName));

  return (
    <main id="main" className="mx-auto max-w-md px-4 py-12">
      <Wordmark className="mb-8" />
      <h1 className="text-2xl font-bold tracking-tight text-fg">{t("switch.whereToGo")}</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        {t("switch.switchAnyTime")}
      </p>

      <ul className="mt-7 space-y-2">
        {memberships.map((membership) => (
          <li key={membership.membershipId}>
            <form action={switchContext}>
              <input type="hidden" name="schoolId" value={membership.schoolId} />
              <input type="hidden" name="role" value={membership.role} />
              <ContextButton
                title={membership.schoolName}
                subtitle={t(ROLE_META[membership.role].labelKey)}
                role={membership.role}
              />
            </form>
          </li>
        ))}

        {children.length > 0 && (
          <li>
            <form action={switchContext}>
              <input type="hidden" name="role" value="PARENT" />
              <ContextButton
                title={
                  children.length === 1
                    ? children[0]!.name
                    : t("switch.childrenCount", { count: children.length })
                }
                subtitle={
                  parentSchoolNames.size === 1
                    ? t("switch.parentAt", { school: children[0]!.schoolName })
                    : t("switch.parentSchools", { count: parentSchoolNames.size })
                }
                role="PARENT"
              />
            </form>
          </li>
        )}
      </ul>

      {/*
        THE ONE PLACE ONLY THEY CAN GO, on the page that asks where they would
        like to go. The redirect to /root at the top of this file fires only for
        an operator with NO school context; one who also runs a school — the
        ordinary case on a small deployment — reached this list and found every
        destination except the operator area. A side-rail link was added for
        them last release and this page, which is literally titled "Where would
        you like to go?", was missed.

        Set apart from the school cards on purpose: it is not a school, and
        picking it does not switch role. It leaves the school entirely.
      */}
      {(session.user.isAppAdmin || session.user.isSuperuser) && (
        <Link
          href="/appadmin"
          className="mt-3 flex items-center gap-3 rounded-[--radius-md] border border-dashed border-border p-4 text-left transition-colors hover:bg-surface-muted"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-[--radius-md] bg-surface-muted text-fg-muted">
            <BuildingsIcon weight="duotone" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-fg">
              {t("appadmin.areaTitle")}
            </span>
            <span className="block text-sm text-fg-muted">{t("appadmin.switchHint")}</span>
          </span>
          <CaretRightIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
        </Link>
      )}

      {session.user.isSuperuser && (
        <Link
          href="/root"
          className="mt-3 flex items-center gap-3 rounded-[--radius-md] border border-dashed border-border p-4 text-left transition-colors hover:bg-surface-muted"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-[--radius-md] bg-surface-muted text-fg-muted">
            <BuildingsIcon weight="duotone" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-fg">{t("shell.serverAdmin")}</span>
            <span className="block text-sm text-fg-muted">{t("switch.everySchool")}</span>
          </span>
          <CaretRightIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
        </Link>
      )}

      <form action="/api/auth/logout" method="post" className="mt-8">
        <Button type="submit" variant="ghost" block>
          {t("suspended.signOut")}
        </Button>
      </form>
    </main>
  );
}

function ContextButton({
  title,
  subtitle,
  role,
}: {
  title: string;
  subtitle: string;
  role: Role;
}) {
  return (
    <Card interactive data-role={role.toLowerCase()} className="overflow-hidden">
      {/* Explicit name, not contents: the walk's accessibility pass read these
          two buttons as nameless. Joined from two already-translated values —
          there is no English here for the i18n audit to find. */}
      <button
        type="submit"
        aria-label={[subtitle, title].join(" — ")}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-[--radius-md] bg-accent-soft text-sm font-bold uppercase text-accent-strong">
          {title.slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-fg">{title}</span>
          <span className="block text-sm text-fg-muted">{subtitle}</span>
        </span>
        <CaretRightIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
      </button>
    </Card>
  );
}
