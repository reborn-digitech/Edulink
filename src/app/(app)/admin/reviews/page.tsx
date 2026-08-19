import type { Metadata } from "next";
import { StarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listReviewRounds, teacherReviewAggregate } from "@/lib/reviews";
import { todayKey } from "@/lib/dates";
import { REVIEW_QUESTIONS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { OpenRoundForm } from "./open-round-form";
import { CloseRoundButton } from "./close-button";
import { QUESTION_KEY, AUDIENCE_KEY } from "@/lib/review-questions";
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

  const [rounds, teachers, school] = await Promise.all([
    listReviewRounds(ctx),
    db.membership.findMany({
      where: { schoolId: ctx.schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId! }, select: { timezone: true } }),
  ]);

  const teacherOptions = teachers.map((teacher) => ({
    membershipId: teacher.id,
    name: teacher.user.preferredName ?? teacher.user.name,
  }));

  // Two weeks out — a round needs long enough for a busy family to notice it.
  const today = todayKey(school.timezone);
  const defaultClose = new Date(Date.parse(`${today}T00:00:00Z`) + 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const aggregates = await Promise.all(
    teacherOptions.map(async (teacher) => ({
      ...teacher,
      agg: await teacherReviewAggregate(ctx, teacher.membershipId),
    })),
  );
  const rated = aggregates.filter((row) => row.agg.responseCount > 0);

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
        {rated.length === 0 ? (
          <p className="mt-2 rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">
            {t("reviews.noRatingsYet")}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rated.map((row) => (
              <li key={row.membershipId} className="rounded-[--radius-md] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-fg">{row.name}</p>
                  <p className="text-sm text-fg-muted">
                    {row.agg.overall !== null && (
                      <span className="mr-2 inline-flex items-center gap-1 font-semibold text-fg">
                        <StarIcon weight="fill" className="size-4 text-warn" />
                        {row.agg.overall}
                      </span>
                    )}
                    {row.agg.responseCount === 1
                      ? t("reviews.answersSoFarOne")
                      : t("reviews.answersSoFar", { count: row.agg.responseCount })}
                  </p>
                </div>
                <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {REVIEW_QUESTIONS.map((question) => (
                    <li key={question} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-fg-muted">{t(QUESTION_KEY[question])}</span>
                      <span className="font-semibold tabular-nums text-fg">
                        {row.agg.byQuestion[question] ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
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
