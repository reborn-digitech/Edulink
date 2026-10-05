import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { FirstSignInForm } from "./form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.firstSignin") };
}

/**
 * A pupil's first sign-in, with the handle and code the school gave them.
 * Outside every shell, like /login and /forgot: nobody here has a session yet.
 * The handle may arrive in the URL from a printed QR or the office's link —
 * a convenience, never proof; the code is what proves anything.
 */
export default async function FirstSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ handle?: string }>;
}) {
  const t = await getT();
  const { handle } = await searchParams;

  return (
    <main id="main" className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("firstSignin.title")}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("firstSignin.subtitle")}</p>

        <FirstSignInForm className="mt-7" initialHandle={(handle ?? "").slice(0, 80)} />

        <p className="mt-8 text-center text-sm text-fg-muted">
          {t("firstSignin.haveOne")}{" "}
          <Link href="/login" className="font-semibold text-accent-strong underline underline-offset-4">
            {t("firstSignin.signIn")}
          </Link>
        </p>

        <div className="mt-8 flex justify-center border-t border-border pt-6">
          <LanguageSwitch />
        </div>
      </div>
    </main>
  );
}
