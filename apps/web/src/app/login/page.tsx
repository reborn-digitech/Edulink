import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "./form";
import { LanguageSwitch } from "@/components/language-switch";
import { getSession } from "@/lib/session";
import { enabledProviders, type SsoProviderId } from "@/lib/sso";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

/** Brand names are proper nouns; the sentence around them translates. */
const SSO_BRAND: Record<SsoProviderId, string> = {
  google: "Google",
  microsoft: "Microsoft",
  apple: "Apple",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.logIn") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string; reset?: string; link?: string; sso?: string; step?: string }>;
}) {
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);

  const { expired, reset, link, sso, step } = await searchParams;
  const t = await getT();
  const ssoProviders = enabledProviders();

  return (
    <div className="grid min-h-safe bg-bg lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
            <Wordmark />
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-fg">{t("login.welcome")}</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            {t("login.subtitlePrefix")}{" "}
            <Link href="/join" className="font-medium text-accent-strong underline underline-offset-4">
              {t("login.joinWithCode")}
            </Link>
            .{" "}
            <Link href="/first-signin" className="font-medium text-accent-strong underline underline-offset-4">
              {t("firstSignin.fromLogin")}
            </Link>
          </p>

          {expired === "1" && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn"
            >
              {t("login.expired")}
            </p>
          )}

          {/*
            A sign-in link that did not work, explained beside the password box
            that still does. `/magic` is a route handler and cannot render, so
            it sends the reason here rather than to a page of its own.

            ONE MESSAGE PER REASON AND NO ACCOUNT NAMED. This is reachable by
            anybody holding any string, so saying whose link it was would turn a
            guessed token into a lookup.
          */}
          {link && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn"
            >
              {link === "expired"
                ? t("login.linkExpired")
                : link === "used"
                  ? t("login.linkUsed")
                  : t("login.linkBroken")}
            </p>
          )}

          {/* An SSO attempt that went nowhere, explained the same way a dead
              magic link is: beside the form that still works, one message per
              reason, no account named. */}
          {sso && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn"
            >
              {sso === "unverified"
                ? t("sso.unverifiedEmail")
                : sso === "denied"
                ? t("login.ssoDenied")
                : sso === "noaccount"
                  ? t("login.ssoNoAccount")
                  : sso === "disabled"
                    ? t("login.ssoDisabled")
                    : t("login.ssoFailed")}
            </p>
          )}

          {/* The second step of a two-step sign-in died (five minutes, five
              wrong codes, or no challenge at all): one sentence, start again. */}
          {step === "expired" && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn"
            >
              {t("totp.stepExpired")}
            </p>
          )}

          {reset === "1" && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-ok/30 bg-ok-soft px-4 py-3 text-sm font-medium text-ok"
            >
              {t("login.passwordChangedNotice")}
            </p>
          )}

          <LoginForm className="mt-7" />

          {/* Rendered only for providers whose credentials exist — with none
              configured this whole block is invisible, not half-working. Brand
              names stay untranslated; the sentence around them does not. */}
          {ssoProviders.length > 0 && (
            <div className="mt-5 space-y-2">
              {ssoProviders.map((provider) => (
                <a
                  key={provider}
                  href={`/api/sso/${provider}/start`}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[--radius-md] border border-border bg-surface px-4 text-sm font-semibold text-fg hover:border-accent"
                >
                  {t("login.ssoContinue", { provider: SSO_BRAND[provider] })}
                </a>
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-sm text-fg-muted">
            {t("login.newSchoolPrefix")}{" "}
            <Link href="/register" className="font-semibold text-accent-strong underline underline-offset-4">
              {t("login.registerHere")}
            </Link>
          </p>
          {/* A recruiter registers itself (4 Oct 2026): an outside account that reaches a college only through a drive. */}
          <p className="mt-2 text-center text-sm text-fg-muted">
            {t("recruiter.loginPrefix")}{" "}
            <Link href="/register/recruiter" className="font-semibold text-accent-strong underline underline-offset-4">
              {t("recruiter.loginLink")}
            </Link>
          </p>

          {/*
            THE ONE PAGE THAT MOST NEEDS THIS, and it was the one page without
            it. `setLocale` has always written the cookie whether or not there
            is a session — its own comment says it exists "so the login page can
            be read in the language the reader picked on the way in" — and this
            page is fully translated. What was missing was the control: the
            switcher was mounted only inside the signed-in shell, so a reader
            who arrived to a page in a language they do not read had no way to
            change it, and no session with which to try.

            The case is ordinary rather than exotic: a shared school computer
            keeps the last person's cookie, and the next person meets Marathi.
            Found by opening /login in a browser and being unable to read it.
          */}
          <div className="mt-8 flex justify-center border-t border-border pt-6">
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* Decorative panel — hidden on phones where it would just push the form
          below the fold. */}
      <div
        aria-hidden="true"
        className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-[#4f8dfb] to-[#7e22ce] p-12 lg:flex"
      >
        <blockquote className="max-w-md text-white">
          <p className="text-2xl font-semibold leading-snug">
            {t("login.quote")}
          </p>
          <footer className="mt-4 text-sm text-white/80">{t("login.quoteAttribution")}</footer>
        </blockquote>
      </div>
    </div>
  );
}
