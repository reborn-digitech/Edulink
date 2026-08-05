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
  return {
  title: t("meta.registerSchool"),
  description: "Set up your school on EduLink in about five minutes.",
};
}

export default async function RegisterPage() {
  // Already signed in? Registering a second school from here would silently
  // replace their session. Send them home instead of creating a trap.
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="EduLink home">
            <Wordmark size={26} />
          </Link>
          <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
            Already have an account?
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <RegisterWizard />
      </main>
    </div>
  );
}
