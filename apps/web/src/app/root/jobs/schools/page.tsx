import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, BuildingsIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { crossSchoolJobHealth, JOB_COUNT_LABELS, JOB_ATTENTION_KEYS } from "@/lib/job-health";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT, getRelativeTime } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("root.jobHealthTitle") };
}

/**
 * Which school did the night's machinery actually touch — and which one is
 * it failing? One card a school, chips per job, and only schools some run
 * had work for: absence here is health, said in one line instead of three
 * hundred empty rows. `stuck` turns a card red because it is the one count
 * that accumulates a real leaver nobody executes.
 */
export default async function JobHealthBySchoolPage() {
  const t = await getT();
  const relativeTime = await getRelativeTime();
  const session = await requireSuperuser();
  const { schools, quiet, runs } = await crossSchoolJobHealth(session);
  const attention = schools.filter((s) => s.attention).length;
  const has = (key: string) => schools.some((s) => s.jobs.some((j) => (j.counts[key] ?? 0) > 0));
  const hasStuck = has("stuck");
  const hasMissing = has("missing");

  return (
    <div className="space-y-5">
      <div>
        <Link href="/root/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {t("root.jobs")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("root.jobHealthTitle")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {attention > 0
            ? attention === 1
              ? t("root.jobHealthAttentionOne")
              : t("root.jobHealthAttentionMany", { count: attention })
            : t("root.jobHealthIntro")}
        </p>
      </div>

      <div className="rounded-[--radius-md] bg-surface-muted p-3.5 text-sm leading-relaxed text-fg-muted">
        <p>{t("root.jobHealthAsOf")}</p>
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
          {runs.map((r) => (
            <span key={r.job}>
              {r.job} · {r.at ? relativeTime(r.at) : t("root.jobNever")}
            </span>
          ))}
        </p>
      </div>

      {hasStuck && (
        <p className="flex items-start gap-2 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm leading-relaxed text-fg">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          {t("root.jobHealthStuckHint")}
        </p>
      )}
      {hasMissing && (
        <p className="flex items-start gap-2 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm leading-relaxed text-fg">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          {t("root.jobHealthMissingHint")}
        </p>
      )}

      {schools.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon weight="duotone" className="size-8" />}
          title={t("root.jobHealthAllQuietTitle")}
          description={t("root.jobHealthAllQuietBody")}
        />
      ) : (
        <>
          <ul className="space-y-3" data-testid="job-health-schools">
            {schools.map((school) => (
              <li key={school.schoolId}>
                <Card className="p-4">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                    {school.name ? (
                      <Link href={`/root/${school.schoolId}`} className="hover:underline">{school.name}</Link>
                    ) : (
                      <code className="font-mono text-sm text-fg-muted">{school.schoolId}</code>
                    )}
                    {school.attention && <Badge tone="danger" size="sm">{t("root.jobHealthAttention")}</Badge>}
                    {school.removedAt && <Badge tone="neutral" size="sm">{t("root.removedBadge")}</Badge>}
                    {school.name === null && <Badge tone="neutral" size="sm">{t("root.jobHealthGoneSchool")}</Badge>}
                  </p>
                  <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                    {school.jobs.map((entry) => (
                      <div key={entry.job} className="contents">
                        <dt className="font-mono text-xs leading-6 text-fg-muted">{entry.job}</dt>
                        <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 text-fg">
                          {Object.entries(entry.counts).map(([key, value]) => (
                            <span
                              key={key}
                              className={
                                JOB_ATTENTION_KEYS.has(key)
                                  ? "inline-flex items-center gap-1 font-semibold text-danger"
                                  : "inline-flex items-center gap-1"
                              }
                            >
                              {JOB_ATTENTION_KEYS.has(key) && <WarningIcon weight="fill" className="size-3.5" aria-hidden="true" />}
                              <span className="font-semibold tabular-nums">{value}</span>
                              <span className={JOB_ATTENTION_KEYS.has(key) ? "" : "text-fg-muted"}>
                                {JOB_COUNT_LABELS[key] ? t(JOB_COUNT_LABELS[key]) : key}
                              </span>
                            </span>
                          ))}
                          <span className="text-xs text-fg-subtle">{relativeTime(entry.at)}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
          {quiet > 0 && (
            <p className="text-sm text-fg-muted">
              {quiet === 1 ? t("root.jobHealthQuietOne") : t("root.jobHealthQuietMany", { count: quiet })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
