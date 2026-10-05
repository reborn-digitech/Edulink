import type { Metadata } from "next";
import { StarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listReviewRounds, schoolReviewDashboard } from "@/lib/reviews";
import { formatDateKey, todayKey } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { OpenRoundForm } from "./open-round-form";
import { CloseRoundButton } from "./close-button";
import { AUDIENCE_KEY } from "@/lib/review-questions";
import { ReviewDashboard } from "@/components/reviews/review-dashboard";
import { getT, getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.reviews") };
}

/**
 * The admin's review desk: open a round, watch the rounds run, read the
 * aggregates. Never a single person's answer — see reviews.ts, which is where
 * that promise is enforced rather than merely displayed.
 */
export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const { status: rawStatus } = await searchParams;
  const status = rawStatus === "closed" ? "CLOSED" : rawStatus === "all" ? undefined : "OPEN";

  const [rounds, allRounds, dashboard, school] = await Promise.all([
    listReviewRounds(ctx, { status }),
    listReviewRounds(ctx),
    schoolReviewDashboard(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId! }, select: { timezone: true } }),
  ]);

  const teacherOptions = dashboard.map((row) => ({
    membershipId: row.membershipId,
    name: row.name,
  }));

  // Two weeks out — a round needs long enough for a busy family to notice it.
  const today = todayKey(school.timezone);
  const defaultClose = new Date(Date.parse(`${today}T00:00:00Z`) + 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("reviews.title")} description={t("reviews.intro")} />

      {/* READ FIRST, WRITE LAST. The ratings are what an admin comes back
          for; opening a round happens once a term. The form used to sit on
          top and push both lists below the fold every visit. */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("reviews.ratings")}
        </h2>
        <div className="mt-2">
          <ReviewDashboard rows={dashboard} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("reviews.roundsHeading")}
        </h2>
        <DataToolbar
          facets={[
            {
              key: "status",
              label: t("reviews.roundsHeading"),
              value: status === "OPEN" ? "" : status === "CLOSED" ? "closed" : "all",
              options: [
                { value: "", label: t("reviews.statusOpen"), count: allRounds.filter((r) => r.status === "OPEN").length },
                { value: "closed", label: t("reviews.statusClosed"), count: allRounds.filter((r) => r.status !== "OPEN").length },
                { value: "all", label: t("vacancies.filterAll") },
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
        {rounds.length === 0 && allRounds.length > 0 ? (
          <EmptyState
            icon={<StarIcon weight="duotone" className="size-8" />}
            title={status === "OPEN" ? t("reviews.noOpenRoundsTitle") : t("common.noResultsTitle")}
            description={status === "OPEN" ? t("reviews.noRoundsBody") : t("common.noResultsBody")}
          />
        ) : rounds.length === 0 ? (
          <EmptyState
            icon={<StarIcon weight="duotone" className="size-8" />}
            title={t("reviews.noRoundsTitle")}
            description={t("reviews.noRoundsBody")}
          />
        ) : (
          <ul className="space-y-1.5">
            {rounds.map((round) => (
              <li
                key={round.id}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">
                    {t(AUDIENCE_KEY[round.audience])} · {t("reviews.openUntil", { date: formatDateKey(round.closesDateKey, undefined, locale) })}
                  </span>
                  <span className="block text-xs text-fg-muted">
                    {t("reviews.teachersN", { count: round.teacherCount })} ·{" "}
                    {round.responseCount === 1
                      ? t("reviews.answersOne")
                      : t("reviews.answersN", { count: round.responseCount })}
                  </span>
                </span>
                <Badge tone={round.status === "OPEN" ? "ok" : "neutral"} size="sm">
                  {round.status === "OPEN" ? t("reviews.statusOpen") : t("reviews.statusClosed")}
                </Badge>
                {round.status === "OPEN" && <CloseRoundButton roundId={round.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="open-round">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{t("reviews.openRoundHeading")}</h2>
        <div className="mt-2">
          <OpenRoundForm teachers={teacherOptions} defaultCloseKey={defaultClose} />
        </div>
      </section>
    </div>
  );
}
