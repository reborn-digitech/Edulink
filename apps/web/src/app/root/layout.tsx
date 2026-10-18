import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: t("root.serverAdministration"), template: "%s · Shalaghar server" },
    robots: { index: false, follow: false },
  };
}

/**
 * The operator's area. Deliberately outside `(app)`.
 *
 * The signed-in shell needs a ROLE, and a role belongs to a school. Whoever runs
 * the server has neither by definition, so putting this inside that layout would
 * mean inventing a fake membership for them — which is exactly the shortcut that
 * turns "operator" into "member of every school".
 *
 * It also looks different on purpose. There is no school branding, no role
 * accent and no bottom bar: this is not a place inside a school, and it should
 * not feel like one.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await requireSuperuser();
  const t = await getT();

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
          <Link href="/root" className="flex min-w-0 items-center gap-2.5">
            <Wordmark size={24} />
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">
              {t("root.serverBadge")}
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-1">
            {/* The one other place in here. A trail written and never read is
                not a trail, and until this link existed there was no page at
                all that could show an operator what they had done. */}
            {/*
              The marketplace queue. An expert profile is invisible to every
              school until somebody here publishes it, and until this page
              existed nothing in the application could — only the seed wrote
              that column, so a finished feature stood behind a door with no
              handle.
            */}
            {/* The colleges beside the schools (4 Oct 2026): their health, the regulators' calendar, the recruiters. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/colleges">{t("operatorCollege.nav")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/experts">{t("root.experts")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/content-team">{t("root.contentTeam")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/gigs">{t("gigs.operatorNav")}</Link>
            </Button>
            {/* review-queue (10 Oct 2026): the operator stamps the generated bank too. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/quiz-review">{t("quizReview.nav")}</Link>
            </Button>
            {/* Vidura pass 2 (17 Oct 2026): the guide's Hindi and Marathi renderings, for the operator to approve, correct or reject. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/vidura-review">{t("viduraReview.nav")}</Link>
            </Button>
            {/* competitions-crawler (12 Oct 2026): the platform's competitions, those suggested from the web, and the crawler's sources. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/competitions">{t("appadmin.competitions")}</Link>
            </Button>
            {/* The global feed's take-down (4 Oct 2026): the operator is the actor above a school, and its desk is the moderation page. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/appadmin/moderation">{t("root.globalFeedModeration")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/audit">{t("root.serverLog")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/jobs">{t("root.jobs")}</Link>
            </Button>
            {/* website-builder B (15 Oct 2026): every published school website and school domain, read only. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/sites">{t("siteDomains.opNav")}</Link>
            </Button>
            {/* end website-builder B */}
            {/* feature-switches (15 Oct 2026): the platform's features, each off until the operator switches it on. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/features">{t("platformFeatures.nav")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/plans">{t("root.plans")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/partners">{t("root.partners")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/root/metrics">{t("root.metrics")}</Link>
            </Button>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                {t("shell.signOut")}
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
