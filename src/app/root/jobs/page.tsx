import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { jobStatuses } from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInZone } from "@/lib/dates";
import { getT, getRelativeTime } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("root.jobs") };
}

/**
 * Did Friday's digest go out? The page that answers it. One row a job:
 * the schedule it is meant to run on, when it last did, whether that
 * worked, and OVERDUE in red when the last success is older than the job
 * expects — which is the only line an operator actually needs.
 */
/** The one-line summary without its per-school map — that story has its own page. */
function summaryLine(summary: string): string {
  try {
    const parsed: unknown = JSON.parse(summary);
    if (parsed && typeof parsed === "object" && "perSchool" in parsed) {
      const rest = { ...(parsed as Record<string, unknown>) };
      delete rest.perSchool;
      return JSON.stringify(rest);
    }
  } catch {
    /* an old row; show it as it is */
  }
  return summary;
}

export default async function JobsPage() {
  const t = await getT();
  const relativeTime = await getRelativeTime();
  await requireSuperuser();
  const statuses = await jobStatuses();
  const overdue = statuses.filter((s) => s.overdue).length;
  const failed = statuses.filter((s) => !s.overdue && s.lastFailed).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("root.jobs")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
          {overdue === 0 && failed > 0
            ? failed === 1
              ? t("root.jobsFailedOne")
              : t("root.jobsFailedMany", { count: failed })
            : overdue === 0
            ? t("root.jobsAllRunning")
            : overdue === 1
              ? t("root.jobsOverdueOne")
              : t("root.jobsOverdueMany", { count: overdue })}
          </p>
        </div>
        <Button asChild variant="secondary" icon={<BuildingsIcon weight="bold" />}>
          <Link href="/root/jobs/schools">{t("root.jobsPerSchool")}</Link>
        </Button>
      </div>

      <p className="rounded-[--radius-md] bg-surface-muted p-3.5 text-sm leading-relaxed text-fg-muted">
        {t("root.jobsHow")} <code className="rounded bg-surface px-1.5 py-0.5 font-semibold text-fg">npm run cron:install</code>
      </p>

      <ul className="space-y-3" data-testid="jobs">
        {statuses.map((job) => (
          <li key={job.name}>
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-fg">
                    <code className="font-mono">{job.name}</code>
                    {job.running ? (
                      <Badge tone="info" size="sm">{t("root.jobRunning")}</Badge>
                    ) : job.overdue ? (
                      <Badge tone="danger" size="sm">{t("root.jobOverdue")}</Badge>
                    ) : job.lastFailed ? (
                      <Badge tone="warn" size="sm">{t("root.jobFailedLast")}</Badge>
                    ) : (
                      <Badge tone="ok" size="sm">{t("root.jobOnTime")}</Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-fg-muted">{t(job.describeKey)}</p>
                </div>
                <p className="flex items-center gap-1.5 font-mono text-xs text-fg-muted">
                  <ClockIcon className="size-4" aria-hidden="true" />
                  {job.schedule}
                </p>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="text-fg-muted">{t("root.jobLastRun")}</dt>
                <dd className="text-fg">
                  {job.lastRun ? (
                    <>
                      {formatInZone(job.lastRun.startedAt, "UTC")} UTC · {relativeTime(job.lastRun.startedAt)}
                      {job.lastRun.ok === true && (
                        <span className="text-fg-muted"> · {t("root.jobOk")} · <code className="font-mono text-xs">{summaryLine(job.lastRun.summary)}</code></span>
                      )}
                      {job.lastRun.ok === false && (
                        <span className="text-danger"> · {t("root.jobFailed")}{job.lastRun.error ? ` · ${job.lastRun.error}` : ""}</span>
                      )}
                      {job.lastRun.host ? <span className="text-fg-subtle"> · {job.lastRun.host}</span> : null}
                    </>
                  ) : (
                    t("root.jobNever")
                  )}
                </dd>
                <dt className="text-fg-muted">{t("root.jobLastSuccess")}</dt>
                <dd className="text-fg">{job.lastSuccessAt ? relativeTime(job.lastSuccessAt) : t("root.jobNever")}</dd>
              </dl>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
