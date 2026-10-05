import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.deleteAccount"), description: t("deletion.intro") };
}

/**
 * How an account is closed — public, because Google Play requires a
 * deletion page reachable without signing in (ACCOUNT_DELETION_URL in the
 * store listing), and outside /account, whose layout sends a signed-out
 * visitor to the login form.
 *
 * There is deliberately no button. The school is the data fiduciary
 * (docs/decisions/0002, "Rights and requests"): a register or a report card
 * that names a pupil is the school's record, and the office ends a membership
 * with recordLeaving or removes a history-less account with removeMembership.
 * A self-service delete that silently took a child out of last term's register
 * would be the wrong answer dressed as the convenient one.
 */
export default async function DeleteAccountPage() {
  const [t, session] = await Promise.all([getT(), getSession()]);
  const email = process.env.SUPPORT_EMAIL?.trim() || null;

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          {!session && (
            <Link href="/login" className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-fg-muted hover:text-fg">
              {t("login.title")}
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{t("deletion.title")}</h1>
        <p className="mt-4 text-fg-muted">{t("deletion.intro")}</p>

        <section aria-labelledby="how-title" className="mt-9 space-y-3 text-fg">
          <h2 id="how-title" className="text-xl font-semibold tracking-tight">{t("deletion.howTitle")}</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>{t("deletion.step1")}</li>
            <li>{t("deletion.step2")}</li>
            <li>{t("deletion.step3")}</li>
            <li>{t("deletion.step4")}</li>
          </ol>
        </section>

        <section aria-labelledby="what-title" className="mt-9 space-y-3 text-fg">
          <h2 id="what-title" className="text-xl font-semibold tracking-tight">{t("deletion.whatTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{t("deletion.removedTitle")}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>{t("deletion.removed1")}</li>
                <li>{t("deletion.removed2")}</li>
                <li>{t("deletion.removed3")}</li>
              </ul>
            </div>
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{t("deletion.keptTitle")}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>{t("deletion.kept1")}</li>
                <li>{t("deletion.kept2")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="phone-title" className="mt-9 space-y-3 text-fg">
          <h2 id="phone-title" className="text-xl font-semibold tracking-tight">{t("deletion.phoneTitle")}</h2>
          <p>{t("deletion.phone1")}</p>
          {session && (
            <p>
              <Link href="/account?tab=devices" className="font-medium text-accent-strong underline underline-offset-4">
                {t("deletion.phone2")}
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="escalate-title" className="mt-9 space-y-3 text-fg">
          <h2 id="escalate-title" className="text-xl font-semibold tracking-tight">{t("deletion.notResolvedTitle")}</h2>
          {email ? (
            <p>
              <WithEmail sentence={t("deletion.notResolved", { email: "\u0000" })} email={email} />
            </p>
          ) : (
            <p>{t("deletion.notResolvedNoEmail")}</p>
          )}
          <p>
            <Link href="/privacy" className="font-medium text-accent-strong underline underline-offset-4">
              {t("deletion.privacyLink")}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

/** The translated sentence with the address rendered as a link where {email} sits, whatever the language's word order. */
function WithEmail({ sentence, email }: { sentence: string; email: string }) {
  const [before, after] = sentence.split("\u0000");
  return (
    <>
      {before}
      <a href={`mailto:${email}`} className="font-medium text-accent-strong underline underline-offset-4">
        {email}
      </a>
      {after}
    </>
  );
}
