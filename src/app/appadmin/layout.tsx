import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { requireAppAdmin } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: t("appadmin.areaTitle"), template: "%s · EduLink" },
    robots: { index: false, follow: false },
  };
}

/**
 * The content team's area. Deliberately outside `(app)`, for the same reason
 * the operator's is: the signed-in shell needs a role, a role belongs to a
 * school, and an app admin has neither by definition. What they curate — the
 * question bank, platform competitions — belongs to every school at once.
 */
export default async function AppAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAppAdmin();
  const t = await getT();

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <Link href="/appadmin" className="flex min-w-0 items-center gap-2.5">
            <Wordmark size={24} />
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">
              {t("appadmin.badge")}
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin">{t("appadmin.competitions")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/bank">{t("appadmin.questionBank")}</Link>
            </Button>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                {t("suspended.signOut")}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
