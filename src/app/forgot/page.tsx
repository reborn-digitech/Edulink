import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { ForgotForm } from "./form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.setPassword") };
}

/**
 * Getting back in.
 *
 * OUTSIDE EVERY SHELL, like `/login`, because nobody here has a session — and
 * unlike `/login` it must also work for somebody whose sessions were just
 * revoked by their own reset.
 *
 * THE IDENTIFIER CAN ARRIVE IN THE URL, from the "forgotten your password?"
 * link on the login form, so a person who has already typed their number does
 * not type it again. It is a convenience and nothing more: the code is what
 * proves anything, and an identifier in a query string proves nothing and
 * discloses nothing that the person following the link did not type.
 */
export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const t = await getT();
  const { id } = await searchParams;

  return (
    <div className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("forgot.title")}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("forgot.subtitle")}</p>

        <ForgotForm className="mt-7" initialIdentifier={(id ?? "").slice(0, 320)} />

        <p className="mt-8 text-center text-sm text-fg-muted">
          {t("forgot.rememberedIt")}{" "}
          <Link href="/login" className="font-semibold text-accent-strong underline underline-offset-4">
            {t("forgot.backToLogIn")}
          </Link>
        </p>

        <div className="mt-8 flex justify-center border-t border-border pt-6">
          <LanguageSwitch />
        </div>
      </div>
    </div>
  );
}
