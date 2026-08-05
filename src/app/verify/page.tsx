import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, WarningCircleIcon, ClockCountdownIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { verifyEmailByToken } from "@/lib/passwords";
import { getSession } from "@/lib/session";
import { ResendButton } from "./resend-button";

export const metadata: Metadata = { title: "Confirm your email" };

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
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await verifyEmailByToken(token);

  // Where to send them next. Somebody already signed in has somewhere to be;
  // somebody who opened this on a different device does not, and gets the door.
  const session = await getSession();
  const onwards = session ? { href: "/account", label: "Go to your account" } : null;

  return (
    <div className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label="EduLink home">
          <Wordmark />
        </Link>

        {result.ok && (
          <>
            <CheckCircleIcon weight="duotone" className="size-9 text-ok" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">Email confirmed</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              <strong className="break-all font-semibold text-fg">{result.email}</strong> is
              confirmed. Password resets and school notices will reach you there.
            </p>
          </>
        )}

        {!result.ok && result.reason === "USED" && (
          <>
            {/* Not an error. Somebody pressed back, or their mail client
                prefetched the link before they clicked it. Saying "invalid"
                here would worry a person whose address is perfectly fine. */}
            <CheckCircleIcon weight="duotone" className="size-9 text-ok" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">Already confirmed</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              That link has been used. Nothing more to do — your address is confirmed.
            </p>
          </>
        )}

        {!result.ok && result.reason === "EXPIRED" && (
          <>
            <ClockCountdownIcon weight="duotone" className="size-9 text-warn" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">That link has expired</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Confirmation links last 48 hours. We can send a new one to
              {result.email ? (
                <>
                  {" "}
                  <strong className="break-all font-semibold text-fg">{result.email}</strong>.
                </>
              ) : (
                " the address on your account."
              )}
            </p>
            {/* The TOKEN goes back, never the user id — see the note on the
                action. It is expired, so it is not a credential; it is only a
                receipt proving which inbox already received a link. */}
            <ResendButton token={token ?? ""} />
          </>
        )}

        {!result.ok && result.reason === "STALE" && (
          <>
            <WarningCircleIcon weight="duotone" className="size-9 text-warn" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">
              That address has changed
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              This link confirms an address the account no longer uses, so it cannot be applied.
              Sign in and confirm the current address from your account page.
            </p>
          </>
        )}

        {!result.ok && result.reason === "UNKNOWN" && (
          <>
            <WarningCircleIcon weight="duotone" className="size-9 text-danger" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">
              That link does not work
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              It may have been mistyped or cut in half by a mail app. Sign in and send yourself a
              fresh one from your account page.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {onwards ? (
            <Button asChild size="sm">
              <Link href={onwards.href}>{onwards.label}</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
