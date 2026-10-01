import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { operatorMetricsSchema, type OperatorMetrics as Metrics } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, relativeTime } from "../family/shared";

const KIND_KEYS: Record<string, TranslationKey> = {
  unauthenticated: "root.metricsKindUnauthenticated",
  forbidden: "root.metricsKindForbidden",
  "not-found": "root.metricsKindNotFound",
  "too-large": "root.metricsKindTooLarge",
  "rate-limited": "root.metricsKindRateLimited",
  unexpected: "root.metricsKindUnexpected",
  render: "root.metricsKindRender",
};

/** "200 · 12, 401 · 1": a group's statuses on one line. */
export function statusLine(byStatus: Record<string, number>): string {
  return Object.entries(byStatus)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([status, count]) => `${status} · ${count}`)
    .join(", ");
}

/**
 * The web's /root/metrics on a phone: the four headline counts, the error
 * tracker's state, the timed route groups with their p50 and p95, and the
 * failures by kind — this process's memory since it started, read live.
 */
export function OperatorMetrics() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["operator", "metrics"],
    queryFn: async () => operatorMetricsSchema.parse(unwrap(await api().get("/api/v1/operator/metrics"))),
  });
  const m = query.data;
  const ms = (value: number | null) => (value === null ? "—" : t("root.metricsMs", { ms: value }));
  return (
    <Screen title={t("root.metrics")} description={t("root.metricsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {m ? <Body m={m} ms={ms} locale={locale} onRefresh={() => void query.refetch()} /> : null}
      {m ? (
        <Text variant="xs" tone="subtle" style={{ paddingHorizontal: th.space[1] }}>
          {t("root.metricsCovered")}
        </Text>
      ) : null}
    </Screen>
  );
}

function Body({ m, ms, locale, onRefresh }: { m: Metrics; ms: (v: number | null) => string; locale: string; onRefresh: () => void }) {
  const t = useT();
  const th = useTheme();
  const nothing = m.requests.length === 0 && m.errors.length === 0;
  return (
    <>
      <Text variant="xs" tone="muted">
        {t("root.metricsSince", { when: relativeTime(m.since, locale) })}
      </Text>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("root.metricsErrorsLastHour")} value={m.errorsLastHour} tone={m.errorsLastHour > 0 ? "danger" : "ok"} />
        <Stat label={t("root.metricsP95")} value={ms(m.p95Ms)} />
        <Stat label={t("root.metricsOutboxReplays")} value={m.outboxReplays} />
        <Stat label={t("root.metricsJobsOverdue")} value={m.jobsOverdue} tone={m.jobsOverdue > 0 ? "warn" : "ok"} />
      </View>
      <Card title={t("root.metricsTracker")} action={<Pill label={m.errorTracker ? "SENTRY_DSN" : "log"} tone={m.errorTracker ? "ok" : "muted"} />}>
        <Text variant="sm" tone="muted">
          {m.errorTracker ? t("root.metricsTrackerOn") : t("root.metricsTrackerOff")}
        </Text>
      </Card>
      {nothing ? (
        <Empty icon="chartLine" title={t("root.metricsNothingYet")} body={t("root.metricsNothingYetBody")} action={<Button label={t("ui.refresh")} variant="secondary" onPress={onRefresh} />} />
      ) : (
        <>
          <Card title={t("root.metricsRequests")}>
            {m.requests.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("root.metricsNothingYet")}
              </Text>
            ) : (
              m.requests.map((r) => (
                <View key={r.group} style={{ gap: 2, borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: th.space[2] }}>
                    <Text variant="sm" bold>
                      {r.group}
                    </Text>
                    <Text variant="sm">{`${t("root.metricsTotal")}: ${r.total}`}</Text>
                  </View>
                  <Text variant="xs" tone="muted">{`${t("root.metricsP50")} ${ms(r.p50Ms)} · ${t("root.metricsP95")} ${ms(r.p95Ms)}`}</Text>
                  <Text variant="xs" tone="subtle">{`${t("root.metricsByStatus")}: ${statusLine(r.byStatus)}`}</Text>
                </View>
              ))
            )}
          </Card>
          <Card title={t("root.metricsErrors")}>
            {m.errors.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("root.metricsNothingYet")}
              </Text>
            ) : (
              m.errors.map((e) => (
                <View key={e.kind} style={{ flexDirection: "row", justifyContent: "space-between", gap: th.space[2] }}>
                  <Text variant="sm">{KIND_KEYS[e.kind] ? t(KIND_KEYS[e.kind]!) : e.kind}</Text>
                  <Text variant="sm" bold>
                    {e.count}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </>
  );
}
