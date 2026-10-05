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
  const t = await getT();

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
          {t("shell.yourAccount")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">{t("merge.heading")}</h1>
        <p className="mt-1 text-fg-muted">
          {/* Whole sentences with placeholders — the name and login land
              mid-sentence, and the mono styling went with the fragments. */}
          {me.email
            ? t("merge.introNamed", {
                name: me.preferredName ?? me.name,
                login: toDisplayLoginName(me.email),
              })
            : t("merge.intro", { name: me.preferredName ?? me.name })}
        </p>
      </div>

      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("merge.whatComesTitle")}
          description={t("merge.whatComesDescription")}
        />
        <CardBody className="space-y-3 text-sm leading-relaxed text-fg-muted">
          <p>{t("merge.body1")}</p>
          {/* The bold lead and its follow-on are separate SENTENCES, so two
              keys per paragraph is safe — unlike splitting inside one. */}
          <p>
            <strong className="font-semibold text-fg">{t("merge.oldLoginStops")}</strong>{" "}
            {t("merge.oldLoginStopsBody")}
          </p>
          <p>
            <strong className="font-semibold text-fg">{t("merge.onlyYou")}</strong>{" "}
            {t("merge.onlyYouBody")}
          </p>
        </CardBody>
      </Card>

      {absorbed.length > 0 && (
        <Card>
          <CardHeader title={t("merge.alreadyJoined")} />
          <CardBody>
            <ul className="space-y-1.5">
              {absorbed.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3 text-sm"
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
