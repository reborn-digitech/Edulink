import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { ClaimChildForm } from "./form";
import { getSession, listContexts } from "@/lib/session";
import { myClaims } from "@/lib/guardian-claims";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.linkChild") };
}

/**
 * Deliberately OUTSIDE the (app) group.
 *
 * A parent who has just signed up has no children yet, so the app shell — which
 * requires a usable role — would bounce them straight back here. This page has
 * to work for someone with no context at all. (§7 no dead ends)
 */
export default async function ParentLinkPage() {
  const session = await getSession();
  const t = await getT();
  if (!session) redirect("/join/parent");

  const [{ children }, claims] = await Promise.all([listContexts(session.user.id), myClaims(session.user.id)]);

  return (
    <div data-role="parent" className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link href="/" aria-label={t("shell.homeLink")}>
            <Wordmark size={26} />
          </Link>
          {children.length > 0 && (
            <Link href="/parent" className="text-sm font-medium text-accent-strong hover:underline">
              {t("parent.goToDashboard")}
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          {children.length > 0 ? t("parent.addAnotherChild") : t("parent.linkToYourChild")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("parent.linkNeedCode")}</p>

        {children.length > 0 && (
          <div className="mt-6 rounded-[--radius-lg] border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              {t("parent.alreadyLinked")}
            </p>
            <ul className="mt-2 space-y-1">
              {children.map((child) => (
                <li key={child.guardianshipId} className="text-sm text-fg">
                  <strong>{child.name}</strong>{" "}
                  <span className="text-fg-muted">· {child.schoolName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What this person has asked for and not been given: that it waits, or
            was not accepted, and at which school. Never whose child it was. */}
        {claims.length > 0 && (
          <ul className="mt-6 space-y-2" data-testid="my-claims">
            {claims.map((claim) => (
              <li key={claim.id} className="rounded-[--radius-md] border border-border bg-surface px-4 py-3 text-sm text-fg">
                {claim.status === "PENDING"
                  ? t("joinRequests.claimWaiting", { school: claim.schoolName })
                  : t("joinRequests.claimDeclined", { school: claim.schoolName })}
              </li>
            ))}
          </ul>
        )}

        <ClaimChildForm className="mt-7" hasChildren={children.length > 0} />
      </main>
    </div>
  );
}
