import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { toDisplayLoginName } from "@/lib/login-name";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MergeForm } from "./form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.joinAccounts") };
}

/**
 * The page a transferring family lands on.
 *
 * IT LIVES UNDER /account AND NOWHERE ELSE, because the actor is the person and
 * not a school. Putting it on an admin screen would mean building the thing this
 * feature must not have: a way for one school to reach into an account it cannot
 * otherwise see.
 */
export default async function MergeAccountsPage() {
  const session = await requireUser();

  const me = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, preferredName: true, email: true },
  });

  // Accounts already folded into this one. Shown because a person who has done
  // this once and comes back needs to know it worked — and because a merge that
  // leaves no trace on the surviving account is one nobody can check.
  const absorbed = await db.user.findMany({
    where: { mergedIntoUserId: session.user.id },
    orderBy: { mergedAt: "desc" },
    select: { id: true, name: true, email: true, mergedAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon weight="bold" className="size-4" aria-hidden="true" />
          Your account
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">Join two accounts</h1>
        <p className="mt-1 text-fg-muted">
          Changed school and started again with a new login? Bring the old one here and everything
          arrives on this account — {me.preferredName ?? me.name}
          {me.email && (
            <>
              {" "}
              (<span className="font-mono">{toDisplayLoginName(me.email)}</span>)
            </>
          )}
          .
        </p>
      </div>

      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title="What comes across"
          description="Your schools, your marks, and your record from the school you left"
        />
        <CardBody className="space-y-3 text-sm leading-relaxed text-fg-muted">
          <p>
            Every school the other account belonged to moves onto this one, and brings its registers,
            marks and report cards with it. So does your school record — the leaving certificate your
            old school wrote, which is what shows your new school where you came from.
          </p>
          <p>
            <strong className="font-semibold text-fg">The old login stops working.</strong> The
            account itself is not deleted: anything it has already posted or written stays exactly
            where it is, so nothing disappears from a class page.
          </p>
          <p>
            <strong className="font-semibold text-fg">Only you can do this.</strong> It needs the
            password for both accounts, so no school and no administrator can join accounts on
            somebody else&rsquo;s behalf — including yours.
          </p>
        </CardBody>
      </Card>

      {absorbed.length > 0 && (
        <Card>
          <CardHeader title="Already joined into this account" />
          <CardBody>
            <ul className="space-y-1.5">
              {absorbed.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-[--radius-sm] bg-surface-muted p-3 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-fg">{account.name}</span>
                  <span className="shrink-0 font-mono text-xs text-fg-muted">
                    {toDisplayLoginName(account.email)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <MergeForm />
    </div>
  );
}
