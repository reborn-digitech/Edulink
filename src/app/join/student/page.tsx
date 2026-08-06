import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { StudentJoinFlow } from "./flow";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.joinWithCode") };
}

export default async function StudentJoinPage() {
  const t = await getT();
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);

  return (
    <div data-role="student" className="min-h-safe bg-bg">
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

      <main id="main" className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <StudentJoinFlow />
      </main>
    </div>
  );
}
