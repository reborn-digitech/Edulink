import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { ParentSignupForm } from "./form";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.parentSignUp") };
}

export default async function ParentJoinPage() {
  const t = await getT();
  const session = await getSession();
  // Already signed in but with no children linked yet -> straight to the claim.
  if (session?.role) redirect(ROLE_HOME[session.role]);
  if (session) redirect("/parent/link");

  return (
    <div data-role="parent" className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            <ArrowLeftIcon weight="bold" className="size-4" />
            {t("common.back")}
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{t("join.createAccountTitle")}</h1>
        <p className="mt-2 text-fg-muted">{t("join.createAccountBody")}</p>

        <ParentSignupForm className="mt-8" />

        <p className="mt-8 text-center text-sm text-fg-muted">
          {t("register.alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-semibold text-accent-strong underline underline-offset-4">
            {t("login.title")}
          </Link>
        </p>
      </main>
    </div>
  );
}
