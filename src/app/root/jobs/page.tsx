import type { Metadata } from "next";
import Link from "next/link";
import {
  BuildingsIcon,
  CheckCircleIcon,
  ClockIcon,
  HourglassIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { jobStatuses, type JobStatus } from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInZone } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("root.jobs") };
}

/**
 * Did Friday's digest go out? The page that answers it.
 *
 * READ IN TWO SECONDS OR NOT AT ALL. An operator opens this after an alert
 * or on a quiet Monday, and either way the first thing they want is one
 * number: how many jobs need a hand. So the page leads with three tiles —
 * on time, overdue, failed — and then one card per job whose left edge is
 * the same colour as its badge, so the eye finds the red one without reading
 * five identical headings. The detail (when, how long, what it counted,
 * where it ran) stays, under the headline rather than in place of it.
 */

/** The one-line summary without its per-school map — that story has its own page. */
function summaryPairs(summary: string): [string, string][] {
  try {
    const parsed: unknown = JSON.parse(summary);
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>)
        .filter(([key]) => key !== "perSchool")
        .map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : String(value)]);
    }
  } catch {
    /* an old row; show it as it is */
  }
  return summary ? [["summary", summary]] : [];
}

type Tone = "running" | "overdue" | "failed" | "ok";

function toneOf(job: JobStatus): Tone {
  if (job.running) return "running";
  if (job.overdue) return "overdue";
  if (job.lastFailed) return "failed";
  return "ok";
}

const STRIPE: Record<Tone, string> = {
  running: "border-l-info",
  overdue: "border-l-danger",
  failed: "border-l-warn",
  ok: "border-l-ok",
};

function StatusBadge({ tone, t }: { tone: Tone; t: Translate }) {
  if (tone === "running") return <Badge tone="info" size="sm">{t("root.jobRunning")}</Badge>;
  if (tone === "overdue") return <Badge tone="danger" size="sm">{t("root.jobOverdue")}</Badge>;
  if (tone === "failed") return <Badge tone="warn" size="sm">{t("root.jobFailedLast")}</Badge>;
  return <Badge tone="ok" size="sm">{t("root.jobOnTime")}</Badge>;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: rawState } = await searchParams;
  const state = rawState === "ok" || rawState === "overdue" || rawState === "failed" ? rawState : null;
  const t = await getT();
  const relativeTime = await getRelativeTime();
  await requireSuperuser();
  const statuses = await jobStatuses();
  const overdue = statuses.filter((s) => s.overdue).length;
  const failed = statuses.filter((s) => !s.overdue && s.lastFailed).length;
  const onTime = statuses.length - overdue - failed;

  const headline =
    overdue === 0 && failed > 0
      ? failed === 1
        ? t("root.jobsFailedOne")
        : t("root.jobsFailedMany", { count: failed })
      : overdue === 0
        ? t("root.jobsAllRunning")
        : overdue === 1
          ? t("root.jobsOverdueOne")
          : t("root.jobsOverdueMany", { count: overdue });

  // Each tile narrows the list to its own jobs; pressing the lit one clears it.
  const shownStatuses = statuses.filter((job) => {
    if (state === "ok") return !job.overdue && !job.lastFailed;
    if (state === "overdue") return job.overdue;
    if (state === "failed") return !job.overdue && job.lastFailed;
    return true;
  });
  const tiles: { key: "ok" | "overdue" | "failed"; label: string; value: number; icon: React.ReactNode; className: string }[] = [
    {
      key: "ok",
      label: t("root.jobOnTime"),
      value: onTime,
      icon: <CheckCircleIcon weight="fill" className="size-5" />,
      className: "text-ok",
    },
    {
      key: "overdue",
      label: t("root.jobOverdue"),
      value: overdue,
      icon: <WarningCircleIcon weight="fill" className="size-5" />,
      className: overdue > 0 ? "text-danger" : "text-fg-subtle",
    },
    {
      key: "failed",
      label: t("root.jobFailedLast"),
      value: failed,
      icon: <XCircleIcon weight="fill" className="size-5" />,
      className: failed > 0 ? "text-warn" : "text-fg-subtle",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("root.jobs")} description={headline} />
        <Button asChild variant="secondary" icon={<BuildingsIcon weight="bold" />}>
          <Link href="/root/jobs/schools">{t("root.jobsPerSchool")}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5" role="group" aria-label={t("root.stateFilter")}>
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            href={state === tile.key ? "/root/jobs" : `/root/jobs?state=${tile.key}`}
            aria-pressed={state === tile.key}
            className="block rounded-[--radius-lg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Card className={cn("p-3.5", state === tile.key && "ring-2 ring-accent")}>
              <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide", tile.className)}>
                {tile.icon}
                {tile.label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-fg">{tile.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {shownStatuses.length === 0 && state && (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      )}

      <ul className="space-y-3" data-testid="jobs">
        {shownStatuses.map((job) => {
          const tone = toneOf(job);
          const pairs = job.lastRun?.ok === true ? summaryPairs(job.lastRun.summary) : [];
          return (
            <li key={job.name}>
              <Card className={cn("border-l-4 p-4", STRIPE[tone])}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                      <code className="font-mono">{job.name}</code>
                      <StatusBadge tone={tone} t={t} />
                    </p>
                    <p className="mt-0.5 text-sm text-fg-muted">{t(job.describeKey)}</p>
                  </div>
                  <p className="flex items-center gap-1.5 font-mono text-xs text-fg-muted" title={t("root.jobSchedule")}>
                    <ClockIcon className="size-4" aria-hidden="true" />
                    {job.schedule}
                  </p>
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                  <dt className="text-fg-muted">{t("root.jobLastRun")}</dt>
                  <dd className="text-fg">
                    {job.lastRun ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{relativeTime(job.lastRun.startedAt)}</span>
                        <span className="text-fg-subtle">· {formatInZone(job.lastRun.startedAt, "UTC")} UTC</span>
                        {job.lastRun.ok === true && (
                          <Badge tone="ok" size="sm">{t("root.jobOk")}</Badge>
                        )}
                        {job.lastRun.ok === false && (
                          <Badge tone="danger" size="sm">{t("root.jobFailed")}</Badge>
                        )}
                        {job.lastRun.ok === null && (
                          <Badge tone="info" size="sm">
                            <HourglassIcon weight="fill" className="mr-1 size-3" />
                            {t("root.jobRunning")}
                          </Badge>
                        )}
                        {job.lastRun.host ? <span className="text-fg-subtle">· {job.lastRun.host}</span> : null}
                      </span>
                    ) : (
                      t("root.jobNever")
                    )}
                  </dd>
                  {job.lastRun?.ok === false && job.lastRun.error && (
                    <>
                      <dt className="text-fg-muted">{t("root.jobErrorLabel")}</dt>
                      <dd>
                        <code className="block whitespace-pre-wrap rounded-[--radius-sm] bg-danger-soft px-2 py-1 font-mono text-xs text-danger">
                          {job.lastRun.error}
                        </code>
                      </dd>
                    </>
                  )}
                  {pairs.length > 0 && (
                    <>
                      <dt className="text-fg-muted">{t("root.jobCountedLabel")}</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {pairs.map(([key, value]) => (
                          <span key={key} className="rounded-full bg-surface-muted px-2.5 py-0.5 font-mono text-xs text-fg">
                            {key} <strong>{value}</strong>
                          </span>
                        ))}
                      </dd>
                    </>
                  )}
                  <dt className="text-fg-muted">{t("root.jobLastSuccess")}</dt>
                  <dd className="text-fg">{job.lastSuccessAt ? relativeTime(job.lastSuccessAt) : t("root.jobNever")}</dd>
                </dl>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="rounded-[--radius-md] bg-surface-muted p-3.5 text-sm leading-relaxed text-fg-muted">
        {t("root.jobsHow")}{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-semibold text-fg">npm run cron:install</code>
      </p>
    </div>
  );
}
