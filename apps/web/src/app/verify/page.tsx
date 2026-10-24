import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, WarningCircleIcon, ClockCountdownIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { inspectVerifyToken } from "@/lib/passwords";
import { getSession } from "@/lib/session";
import { ResendButton } from "./resend-button";
import { confirmEmail } from "./actions";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.confirmEmail") };
}

/**
 * The route registration has been emailing links to since day one.
 *
 * ⚠ IT DID NOT EXIST. `register/actions.ts` minted an `EMAIL_VERIFY` token and
 * sent `${APP_URL}/verify?token=…`; nothing consumed one. Every school admin who
 * ever signed up got a welcome email whose button led to a 404, and their
 * address has sat unverified ever since.
 *
 * OUTSIDE EVERY SHELL and with no session required, like `/login` and
 * `/forgot`. The token is 32 random bytes sent to one inbox — holding it is the
 * proof, and it is ordinary for this link to be opened on a phone, in a mail app
 * that launches a browser signed in to nothing. Requiring a session here would
 * fail the common case to protect against nothing.
 *
 * FOUR OUTCOMES, EACH SAYING SOMETHING DIFFERENT AND TRUE. Confirmed; already
 * done (which is a success, not an error — it is usually the back button);
 * expired, with a way to get another; and a link that names an address the
 * account has since moved away from, which is the one nobody would guess and the
 * one that only became possible when addresses became changeable.
 *
 * ⚠ A GET SHOWS A BUTTON; THE BUTTON'S POST SPENDS THE TOKEN (QA-13, QA campaign
 * of 24 October 2026). This page used to spend the token while it rendered, and
 * a GET is what a mail scanner, a messaging app's preview and a prefetch do: an
 * account squatted under somebody's address was marked verified the moment their
 * mail provider looked at the link, and SSO then links to a verified account
 * without reclaiming it. Now the render only reads the token
 * (`inspectVerifyToken`), and a live one is answered with "Confirm my address",
 * a form whose server action (`confirmEmail`) spends it and comes back here
 * marked done — the pattern the magic link took in assessment item 22.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const t = await getT();
  const { token, done } = await searchParams;
  const look = await inspectVerifyToken(token);
  // A spent link straight after this page's own button is the confirmation itself; any other spent link was used before.
  const confirmedNow = look.state === "USED" && done === "1";

  // Where to send them next. Somebody already signed in has somewhere to be;
  // somebody who opened this on a different device does not, and gets the door.
  const session = await getSession();
  const onwards = session ? { href: "/account", label: t("verify.goToAccount") } : null;

  return (
    <main id="main" className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>

        {look.state === "READY" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{t("verify.confirmTitle")}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("verify.confirmBody", { email: look.email ?? "" })}</p>
            <form action={confirmEmail} className="mt-5">
              <input type="hidden" name="token" value={token ?? ""} />
              <Button type="submit" className="w-full">
                {t("verify.confirmButton")}
              </Button>
            </form>
          </>
        )}

        {confirmedNow && (
          <>
            <CheckCircleIcon weight="duotone" className="size-9 text-ok" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">{t("verify.confirmed")}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              {t("verify.confirmedBody", { email: look.email ?? "" })}
            </p>
          </>
        )}

        {look.state === "USED" && !confirmedNow && (
          <>
            {/* Not an error. Somebody pressed back, or opened the link again
                after confirming. Saying "invalid"
                here would worry a person whose address is perfectly fine. */}
            <CheckCircleIcon weight="duotone" className="size-9 text-ok" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">{t("verify.alreadyConfirmed")}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("verify.alreadyConfirmedBody")}</p>
          </>
        )}

        {look.state === "EXPIRED" && (
          <>
            <ClockCountdownIcon weight="duotone" className="size-9 text-warn" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">{t("verify.expired")}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              {look.email
                ? t("verify.expiredBodyWithEmail", { email: look.email })
                : t("verify.expiredBodyNoEmail")}
            </p>
            {/* The TOKEN goes back, never the user id — see the note on the
                action. It is expired, so it is not a credential; it is only a
                receipt proving which inbox already received a link. */}
            <ResendButton token={token ?? ""} />
          </>
        )}

        {look.state === "STALE" && (
          <>
            <WarningCircleIcon weight="duotone" className="size-9 text-warn" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">
              {t("verify.changed")}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("verify.changedBody")}</p>
          </>
        )}

        {look.state === "UNKNOWN" && (
          <>
            <WarningCircleIcon weight="duotone" className="size-9 text-danger" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">
              {t("verify.broken")}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("verify.brokenBody")}</p>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {onwards ? (
            <Button asChild size="sm">
              <Link href={onwards.href}>{onwards.label}</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">{t("login.title")}</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
