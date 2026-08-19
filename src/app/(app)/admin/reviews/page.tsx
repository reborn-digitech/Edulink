import type { Metadata } from "next";
import { StarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listReviewRounds, schoolReviewDashboard } from "@/lib/reviews";
import { todayKey } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { OpenRoundForm } from "./open-round-form";
import { CloseRoundButton } from "./close-button";
import { AUDIENCE_KEY } from "@/lib/review-questions";
import { ReviewDashboard } from "@/components/reviews/review-dashboard";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.reviews") };
}

/**
 * The admin's review desk: open a round, watch the rounds run, read the
 * aggregates. Never a single person's answer — see reviews.ts, which is where
 * that promise is enforced rather than merely displayed.
 */
export default async function AdminReviewsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");

  const [rounds, dashboard, school] = await Promise.all([
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("reviews.title")}</h1>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-fg-muted">{t("reviews.intro")}</p>
      </div>

      <OpenRoundForm teachers={teacherOptions} defaultCloseKey={defaultClose} />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("reviews.ratings")}
        </h2>
        <div className="mt-2">
          <ReviewDashboard rows={dashboard} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("reviews.title")}
        </h2>
        {rounds.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={<StarIcon weight="duotone" className="size-8" />}
              title={t("reviews.noRoundsTitle")}
              description={t("reviews.noRoundsBody")}
            />
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {rounds.map((round) => (
              <li
                key={round.id}
                className="flex flex-wrap items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">
                    {t(AUDIENCE_KEY[round.audience])} · {t("reviews.openUntil", { date: round.closesDateKey })}
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
    </div>
  );
}
