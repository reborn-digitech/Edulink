import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { iqacCyclesSchema, iqacPredictorSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";
import { unitLabel } from "./home";

/**
 * The NAAC predictor on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /iqac/predictor read only: the open cycle (or the latest), its
 * CGPA and band and the distance to the next, each criterion with its score
 * and — one opened — its key indicators and how many of their metrics have a
 * score, the ten cheapest metrics, and the trend by term. Scoring a
 * qualitative metric with evidence, the entered figures and recomputing
 * stay on the web, with the insights and the simulator on their own
 * screens. The platform does not score for NAAC: every number is a reading.
 */
export function PredictorScreen() {
  const t = useT();
  const th = useTheme();
  const on = useModuleOn("IQAC");
  const [openCriterion, setOpenCriterion] = useState<string | null>(null);
  const cycles = useQuery({ queryKey: ["iqac", "cycles"], enabled: on, queryFn: async () => iqacCyclesSchema.parse(unwrap(await api().get("/api/v1/iqac/cycles"))) });
  const cycle = cycles.data?.items.find((c) => c.status === "OPEN") ?? cycles.data?.items[0] ?? null;
  const predictor = useQuery({ queryKey: ["iqac", "predictor", cycle?.id], enabled: Boolean(cycle), queryFn: async () => iqacPredictorSchema.parse(unwrap(await api().get(`/api/v1/iqac/cycles/${cycle!.id}`))) });
  if (!on) return <ModuleOffScreen title={t("iqac.predictorTitle")} module="IQAC" />;
  const p = predictor.data;
  return (
    <Screen title={t("iqac.predictorTitle")} description={t("iqac.predictorIntro")} refreshing={predictor.isRefetching} onRefresh={() => void predictor.refetch()}>
      <Text variant="sm" tone="muted">
        {t("iqac.notAScore")}
      </Text>
      {cycles.isPending || (cycle && predictor.isPending) ? <Loading /> : null}
      {cycles.isError ? <Failed message={cycles.error.message} onRetry={() => void cycles.refetch()} /> : null}
      {predictor.isError ? <Failed message={predictor.error.message} onRetry={() => void predictor.refetch()} /> : null}
      {cycles.data && !cycle ? <Empty icon="medal" title={t("iqac.noCycleTitle")} body={t("iqac.noCycleBodyReader")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void cycles.refetch()} />} /> : null}
      {p ? (
        <>
          <Card title={t("iqac.cycleTitle")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[3] }}>
              <Stat label={t("iqac.cgpaLabel")} value={p.cycle.cgpa?.toFixed(2) ?? "—"} />
              <Stat label={t("iqac.gradeLabel")} value={p.cycle.grade ?? "—"} />
            </View>
            <Text variant="sm" tone="muted">
              {[`${p.cycle.windowFrom} – ${p.cycle.windowTo}`, p.cycle.framework, t("iqac.metricsScored", { scored: p.cycle.scoredCount, total: p.cycle.metricCount })].join(" · ")}
            </Text>
            <Text variant="sm" tone="muted">
              {p.nextBand ? t("iqac.nextBandLine", { distance: p.nextBand.distance.toFixed(2), grade: p.nextBand.grade, min: p.nextBand.min.toFixed(2) }) : t("iqac.topBand")}
            </Text>
          </Card>
          <Card title={t("deskParity.criteriaTitle")}>
            {p.criteria.map((c) => {
              const open = openCriterion === c.code;
              return (
                <View key={c.code} style={{ gap: th.space[1] }}>
                  <Row title={`${c.code} ${c.name}`} caption={t("iqac.metricWeight", { weight: c.weight })} right={<Text bold>{t("iqac.criterionScore", { score: c.score.toFixed(2) })}</Text>} onPress={() => setOpenCriterion(open ? null : c.code)} />
                  {open
                    ? c.kis.map((ki) => (
                        <View key={ki.code} style={{ paddingLeft: th.space[3] }}>
                          <Row title={`${ki.code} ${ki.name}`} caption={t("iqac.metricsScored", { scored: ki.metrics.filter((m) => m.score !== null).length, total: ki.metrics.length })} right={<Text>{t("iqac.criterionScore", { score: ki.score.toFixed(2) })}</Text>} />
                        </View>
                      ))
                    : null}
                </View>
              );
            })}
          </Card>
          <Card title={t("iqac.cheapestTitle")}>
            {p.cheapest.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("iqac.cheapestEmpty")}
              </Text>
            ) : null}
            {p.cheapest.map((m) => (
              <Row key={m.code} title={`${m.code} ${m.text}`} caption={t("iqac.cheapestRow", { gain: m.gainPerUnit.toFixed(4), unit: unitLabel(t, m.unit) })} />
            ))}
          </Card>
          <Card title={t("iqac.trendTitle")}>
            {p.trend.length < 2 ? (
              <Text variant="sm" tone="muted">
                {t("iqac.trendEmpty")}
              </Text>
            ) : null}
            {p.trend.map((x) => (
              <Row key={x.term} title={x.term} right={<Text>{x.cgpa.toFixed(2)}</Text>} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
