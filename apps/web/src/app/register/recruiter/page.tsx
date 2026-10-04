import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { RecruiterRegisterForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("recruiter.registerTitle") };
}

/**
 * A recruiter registers itself (4 Oct 2026): never invited, never a member of
 * a college. Signed in already? Home, as the school registration does, so a
 * second account cannot silently replace the session.
 */
export default async function RecruiterRegisterPage() {
  const t = await getT();
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);
  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
            {t("register.alreadyHaveAccount")}
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader title={t("recruiter.registerTitle")} description={t("recruiter.registerIntro")} />
        <RecruiterRegisterForm />
      </main>
    </div>
  );
}
