import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "./form";
import { LanguageSwitch } from "@/components/language-switch";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.logIn") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string; reset?: string; link?: string }>;
}) {
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);

  const { expired, reset, link } = await searchParams;
  const t = await getT();

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
            .
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
                ? "That sign-in link has expired — they last 20 minutes. Ask for another below, or use your password."
                : link === "used"
                  ? "That sign-in link has already been used. They work once. Ask for another below, or use your password."
                  : "That sign-in link did not work. It may have been cut in half by a mail app. Ask for another below, or use your password."}
            </p>
          )}

          {reset === "1" && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-ok/30 bg-ok-soft px-4 py-3 text-sm font-medium text-ok"
            >
              Your password has been changed, and everything that was signed in has been signed
              out. Log in with the new one.
            </p>
          )}

          <LoginForm className="mt-7" />

          <p className="mt-8 text-center text-sm text-fg-muted">
            {t("login.newSchoolPrefix")}{" "}
            <Link href="/register" className="font-semibold text-accent-strong underline underline-offset-4">
              {t("login.registerHere")}
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
