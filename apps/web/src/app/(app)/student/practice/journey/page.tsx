import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, MedalIcon, FlameIcon, SparkleIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { journey } from "@/lib/practice-insights";
import { relativeTime } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("journey.title") };
}

/**
 * The child's own "how far I've come": badge timeline, tier badges by month,
 * weeks-in-a-row. Everything on this page compares the child with their own
 * past and nobody else — the copy says so out loud.
 */
export default async function JourneyPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const data = await journey(ctx);

  const maxMonthly = Math.max(1, ...data.monthly.map((m) => m.tiers));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/student/practice"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("feature.practice")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("journey.title")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("journey.intro")}</p>
      </div>

      {/* ---- the three numbers that are only yours ---- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-3">
            <FlameIcon weight="duotone" className="size-8 shrink-0 text-accent" />
            <div>
              <p className="text-2xl font-bold tabular-nums text-fg">{data.practiceWeeks}</p>
              <p className="text-xs text-fg-muted">{t("journey.weeksInARow")}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <MedalIcon weight="duotone" className="size-8 shrink-0 text-accent" />
            <div>
              <p className="text-2xl font-bold tabular-nums text-fg">{data.totalTiers}</p>
              <p className="text-xs text-fg-muted">{t("journey.tierBadges")}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <SparkleIcon weight="duotone" className="size-8 shrink-0 text-accent" />
            <div>
              <p className="text-2xl font-bold tabular-nums text-fg">{data.totalAnswers}</p>
              <p className="text-xs text-fg-muted">{t("journey.questionsAnswered")}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ---- climbs per month ---- */}
      <Card>
        <CardHeader
          icon={<MedalIcon weight="duotone" className="size-5" />}
          title={t("journey.monthlyTitle")}
          description={t("journey.monthlyHint")}
        />
        <CardBody>
          <div className="flex items-end gap-3" role="img" aria-label={t("journey.monthlyTitle")}>
            {data.monthly.map((month, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums text-fg">
                  {month.tiers > 0 ? month.tiers : ""}
                </span>
                <div
                  className="w-full rounded-t-md bg-accent-soft"
                  style={{ height: `${Math.max(4, (month.tiers / maxMonthly) * 96)}px` }}
                />
                <span className="text-xs text-fg-muted">{month.label}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ---- the timeline ---- */}
      <Card>
        <CardHeader
          icon={<SparkleIcon weight="duotone" className="size-5" />}
          title={t("journey.timelineTitle")}
        />
        <CardBody>
          {data.badges.length === 0 ? (
            <EmptyState
              icon={<MedalIcon weight="duotone" className="size-8" />}
              title={t("journey.emptyTitle")}
              description={t("journey.emptyBody")}
            />
          ) : (
            <ol className="space-y-3">
              {data.badges.map((badge, index) => (
                <li key={index} className="flex items-start gap-3">
                  <MedalIcon
                    weight={badge.isTier ? "fill" : "duotone"}
                    className="mt-0.5 size-5 shrink-0 text-accent"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg">{badge.label}</p>
                    {badge.description && (
                      <p className="text-xs text-fg-muted">{badge.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-fg-muted">{relativeTime(badge.earnedAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-fg-muted">{t("journey.privateNote")}</p>
    </div>
  );
}
