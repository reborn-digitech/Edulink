import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { RegisterWizard } from "./wizard";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.registerSchool"), description: t("register.metaDescription") };
}

export default async function RegisterPage() {
  const t = await getT();
  // Already signed in? Registering a second school from here would silently
  // replace their session. Send them home instead of creating a trap.
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
            {t("register.alreadyHaveAccount")}
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <RegisterWizard />
      </main>
      {/* expert-registration (15 Oct 2026): the same way in for an expert as on the login page. */}
      <footer className="border-t border-border px-4 py-6 text-center text-sm text-fg-muted sm:px-6">
        {t("expertApply.loginPrefix")}{" "}
        <Link href="/register/expert" className="font-semibold text-accent-strong underline underline-offset-4">
          {t("expertApply.loginLink")}
        </Link>
      </footer>
    </div>
  );
}
