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

export const metadata: Metadata = { title: "Choose where to go" };

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

    const paused = await db.membership.count({
      where: { userId: session.user.id, status: "SUSPENDED", leftAt: null },
    });
    if (paused > 0) redirect("/suspended");

    return (
      <main id="main" className="mx-auto max-w-md px-4 py-16">
        <Wordmark className="mb-8" />
        <EmptyState
          title="You are not part of a school yet"
          description="Join with a school or class code, or ask an admin to invite you."
          action={
            <Button asChild>
              <Link href="/join">Join with a code</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto max-w-md px-4 py-12">
      <Wordmark className="mb-8" />
      <h1 className="text-2xl font-bold tracking-tight text-fg">Where would you like to go?</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        You can switch at any time from your account menu.
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
                title={children.length === 1 ? children[0]!.name : `${children.length} children`}
                subtitle={
                  children.length === 1
                    ? `Parent · ${children[0]!.schoolName}`
                    : `Parent · ${new Set(children.map((c) => c.schoolName)).size} schools`
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
      {session.user.isSuperuser && (
        <Link
          href="/root"
          className="mt-3 flex items-center gap-3 rounded-[--radius-md] border border-dashed border-border p-4 text-left transition-colors hover:bg-surface-muted"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-[--radius-md] bg-surface-muted text-fg-muted">
            <BuildingsIcon weight="duotone" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-fg">Server administration</span>
            <span className="block text-sm text-fg-muted">Every school on this server</span>
          </span>
          <CaretRightIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
        </Link>
      )}

      <form action="/api/auth/logout" method="post" className="mt-8">
        <Button type="submit" variant="ghost" block>
          Sign out
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
      <button type="submit" className="flex w-full items-center gap-3 p-4 text-left">
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
