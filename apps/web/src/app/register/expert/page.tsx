import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ExpertApplicationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("expertApply.title") };
}

/**
 * An expert applies from the login page (the owner's ask of 15 October 2026). No account and no password: the
 * application is a row the operator reads at /root/experts, and only an approval makes an account, whose
 * invitation link sets the password. Open to anybody, signed in or not — applying signs nobody in and replaces
 * no session, so unlike the school and recruiter registrations there is nobody to send home.
 */
export default async function ExpertApplicationPage() {
  const t = await getT();
  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
            {t("register.alreadyHaveAccount")}
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader title={t("expertApply.title")} description={t("expertApply.intro")} />
        <ExpertApplicationForm />
      </main>
    </div>
  );
}
