import { PulseIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { snapshot } from "@/lib/metrics";
import { jobStatuses } from "@/lib/jobs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.metricsMeta"), robots: { index: false, follow: false } };
}

const KIND_KEYS: Record<string, TranslationKey> = {
  unauthenticated: "root.metricsKindUnauthenticated",
  forbidden: "root.metricsKindForbidden",
  "not-found": "root.metricsKindNotFound",
  "too-large": "root.metricsKindTooLarge",
  "rate-limited": "root.metricsKindRateLimited",
  unexpected: "root.metricsKindUnexpected",
  render: "root.metricsKindRender",
};

/**
 * This process's counters, read straight from memory (src/lib/metrics.ts):
 * nothing here is stored, and the page says what is and is not counted so
 * the numbers are read for what they are.
 */
export default async function MetricsPage() {
  const t = await getT();
  const relativeTime = await getRelativeTime();
  await requireSuperuser();
  const [m, jobs] = await Promise.all([snapshot(), jobStatuses()]);
  const jobsOverdue = jobs.filter((j) => j.overdue).length;
  const nothing = m.requests.length === 0 && m.errors.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader title={t("root.metrics")} description={t("root.metricsIntro")} />
      <p className="text-xs text-fg-muted">
        {t("root.metricsSince", { when: relativeTime(new Date(m.since)) })} · {t("root.metricsCovered")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("root.metricsErrorsLastHour")} value={m.errorsLastHour} tone={m.errorsLastHour > 0 ? "danger" : "ok"} />
        <StatTile label={t("root.metricsP95")} value={m.p95Ms === null ? "—" : t("root.metricsMs", { ms: m.p95Ms })} />
        <StatTile label={t("root.metricsOutboxReplays")} value={m.outboxReplays} />
        <StatTile label={t("root.metricsJobsOverdue")} value={jobsOverdue} tone={jobsOverdue > 0 ? "warn" : "ok"} />
      </div>

      <Card>
        <CardHeader
          icon={<PulseIcon weight="duotone" className="size-5" />}
          title={t("root.metricsTracker")}
          description={m.errorTracker ? t("root.metricsTrackerOn") : t("root.metricsTrackerOff")}
          action={<Badge tone={m.errorTracker ? "ok" : "neutral"} size="sm">{m.errorTracker ? "SENTRY_DSN" : "log"}</Badge>}
        />
      </Card>

      {nothing ? (
        <EmptyState icon={<PulseIcon weight="duotone" className="size-8" />} title={t("root.metricsNothingYet")} description={t("root.metricsNothingYetBody")} />
      ) : (
        <>
          <Card>
            <CardHeader title={t("root.metricsRequests")} />
            <CardBody>
              {m.requests.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("root.metricsNothingYet")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
                        <th className="py-1 pr-3">{t("root.metricsGroup")}</th>
                        <th className="py-1 pr-3 text-right">{t("root.metricsTotal")}</th>
                        <th className="py-1 pr-3 text-right">{t("root.metricsP50")}</th>
                        <th className="py-1 pr-3 text-right">{t("root.metricsP95")}</th>
                        <th className="py-1">{t("root.metricsByStatus")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.requests.map((r) => (
                        <tr key={r.group} className="border-t border-border">
                          <td className="py-1.5 pr-3 font-mono text-xs">{r.group}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums">{r.total}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums">{r.p50Ms === null ? "—" : t("root.metricsMs", { ms: r.p50Ms })}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums">{r.p95Ms === null ? "—" : t("root.metricsMs", { ms: r.p95Ms })}</td>
                          <td className="py-1.5">
                            <span className="flex flex-wrap gap-1">
                              {Object.entries(r.byStatus).map(([status, count]) => (
                                <Badge key={status} size="sm" tone={Number(status) >= 500 ? "danger" : Number(status) >= 400 ? "warn" : "ok"}>
                                  {status} · {count}
                                </Badge>
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("root.metricsErrors")} />
            <CardBody>
              {m.errors.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("root.metricsNothingYet")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {m.errors.map((e) => (
                    <li key={e.kind} className="flex items-center justify-between py-1.5 text-sm">
                      <span>{KIND_KEYS[e.kind] ? t(KIND_KEYS[e.kind]!) : e.kind}</span>
                      <span className="tabular-nums font-semibold">{e.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
