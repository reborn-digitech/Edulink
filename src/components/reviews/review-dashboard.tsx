import { StarIcon, TrendUpIcon, TrendDownIcon, EqualsIcon } from "@phosphor-icons/react/ssr";
import { REVIEW_QUESTIONS } from "@/lib/constants";
import { QUESTION_KEY } from "@/lib/review-questions";
import type { TeacherReviewRow } from "@/lib/reviews";
import { getT } from "@/lib/i18n/server";

/**
 * The teacher-review dashboard, rendered identically on the admin's review
 * desk and the principal's dashboard — one component so the two rooms read
 * the same numbers. Each card: the all-time picture per question, and when a
 * second rated round exists, THE DIRECTION — latest round against the one
 * before, which is what "did the feedback change anything" actually asks.
 */
export async function ReviewDashboard({ rows }: { rows: TeacherReviewRow[] }) {
  const t = await getT();
  const rated = rows.filter((row) => row.allTime.responseCount > 0);

  if (rated.length === 0) {
    return (
      <p className="rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">
        {t("reviews.noRatingsYet")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rated.map((row) => (
        <li key={row.membershipId} className="rounded-[--radius-md] border border-border bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-fg">{row.name}</p>
            <p className="flex items-baseline gap-2 text-sm text-fg-muted">
              {row.allTime.overall !== null && (
                <span className="inline-flex items-center gap-1 font-semibold text-fg">
                  <StarIcon weight="fill" className="size-4 text-warn" />
                  {row.allTime.overall}
                </span>
              )}
              <span>
                {row.allTime.responseCount === 1
                  ? t("reviews.answersSoFarOne")
                  : t("reviews.answersSoFar", { count: row.allTime.responseCount })}
              </span>
            </p>
          </div>

          {/* The change, only when there is one to report: two rated rounds.
              A first round has no direction, and pretending otherwise with a
              "+4.6" would read as a rocket rather than a baseline. */}
          {row.delta !== null && row.latest && row.previous && (
            <p
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                row.delta > 0
                  ? "bg-ok-soft text-ok"
                  : row.delta < 0
                    ? "bg-danger-soft text-danger"
                    : "bg-surface-muted text-fg-muted"
              }`}
            >
              {row.delta > 0 ? (
                <TrendUpIcon weight="bold" className="size-3.5" />
              ) : row.delta < 0 ? (
                <TrendDownIcon weight="bold" className="size-3.5" />
              ) : (
                <EqualsIcon weight="bold" className="size-3.5" />
              )}
              {row.delta === 0
                ? t("reviews.trendFlat", { latest: row.latest.overall })
                : t(row.delta > 0 ? "reviews.trendUp" : "reviews.trendDown", {
                    delta: Math.abs(row.delta),
                    latest: row.latest.overall,
                    previous: row.previous.overall,
                  })}
            </p>
          )}

          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {REVIEW_QUESTIONS.map((question) => (
              <li key={question} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-fg-muted">{t(QUESTION_KEY[question])}</span>
                <span className="font-semibold tabular-nums text-fg">
                  {row.allTime.byQuestion[question] ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
