import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { requireAppAdmin } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { SignOutForm } from "@/components/sign-out-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: t("appadmin.areaTitle"), template: `%s · ${t("brand.name")}` },
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
  const session = await requireAppAdmin();
  const t = await getT();

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
          <Link href="/appadmin" className="flex min-w-0 items-center gap-2.5">
            <Wordmark size={24} />
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">
              {t("appadmin.badge")}
            </span>
          </Link>
          {/* The links wrap under the wordmark on a narrow screen instead of pushing the page sideways. */}
          <div className="flex flex-wrap items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin">{t("appadmin.competitions")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/bank">{t("appadmin.questionBank")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/contributions">{t("gigs.queueNav")}</Link>
            </Button>
            {/* review-queue (10 Oct 2026): the generated bank's items wait here for a stamp. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/quiz-review">{t("quizReview.nav")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/translations">{t("translationReview.nav")}</Link>
            </Button>
            {/* Vidura pass 2 (17 Oct 2026): the guide's Hindi and Marathi renderings, read only here. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/vidura-review">{t("viduraReview.nav")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/moderation">{t("moderation.nav")}</Link>
            </Button>
            {/* The operator arrives from /root; give them the way back. An app
                admin never sees this link and the page behind it would 404 on
                them anyway. */}
            {session.user.isSuperuser && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/root">{t("root.serverAdministration")}</Link>
              </Button>
            )}
            <SignOutForm>
              <Button type="submit" variant="ghost" size="sm">
                {t("suspended.signOut")}
              </Button>
            </SignOutForm>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
