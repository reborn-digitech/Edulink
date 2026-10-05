import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { naacInsightsSchema, type InsightCta, type NaacInsights } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { ApiRefused, unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { openWeb } from "@/screens/family/shared";

/**
 * Actionable insights on the phone (5 Oct 2026, the accreditation insights
 * batch): the web's section on /iqac/predictor, read from
 * GET /api/v1/iqac/insights — the next band's target with the cheapest steps
 * that reach it, every quantitative metric ranked by CGPA per unit of effort,
 * the qualitative ones to score with evidence, and what the desk did last.
 * Every sentence comes translated from the server; each call to action opens
 * the web page where the change is made (the pattern the college desks use),
 * because the records are kept there. The platform does not score for NAAC:
 * the server's `notAScore` sentence is always on the screen.
 */
export const INSIGHTS_KEY = ["iqac", "insights"] as const;

/** The insights for the open cycle; `enabled` false makes no request. A 404 (no open cycle) is an answer, not a failure. */
export function useInsights(enabled = true) {
  return useQuery({
    queryKey: INSIGHTS_KEY,
    enabled,
    queryFn: async () => naacInsightsSchema.parse(unwrap(await api().get("/api/v1/iqac/insights"))),
  });
}

/** True when the door said there is no open cycle to read. */
export const noCycle = (error: unknown) => error instanceof ApiRefused && error.status === 404;

/** A call to action as a row: the sentence, where the change is made and by whom, opening the web page. */
function ActionRow({ sentence, cta, extra }: { sentence: string; cta: InsightCta; extra?: string }) {
  const t = useT();
  return <Row title={sentence} caption={[cta.label, extra, t("mobile.openOnWeb")].filter(Boolean).join(" · ")} onPress={() => openWeb(cta.href)} />;
}

export function InsightsBody({ d }: { d: NaacInsights }) {
  const t = useT();
  const th = useTheme();
  const top = d.paths.length === 0 && d.ranked.length === 0 && d.qualitative.length === 0;
  return (
    <>
      <Text variant="sm" tone="muted">
        {d.notAScore}
      </Text>
      <Card title={d.scenarioName ? t("insightsPhone.nowLineScenario", { name: d.scenarioName, cgpa: d.cgpa.toFixed(2), grade: d.grade }) : t("insightsPhone.nowLine", { cgpa: d.cgpa.toFixed(2), grade: d.grade })}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[3] }}>
          <Stat label={t("iqac.cgpaLabel")} value={d.cgpa.toFixed(2)} />
          <Stat label={t("iqac.gradeLabel")} value={d.grade} />
        </View>
        {top ? <Text tone="ok">{t("insightsPhone.topBand")}</Text> : null}
      </Card>
      {d.paths.map((p) => (
        <Card key={p.grade} title={t("insightsPhone.pathTitle", { grade: p.grade })}>
          <Text variant="sm">{p.sentence}</Text>
          {p.reachable ? null : (
            <Text variant="sm" tone="warn">
              {t("insightsPhone.pathNotReached", { grade: p.grade })}
            </Text>
          )}
          {p.steps.map((s) => (
            <ActionRow key={s.code} sentence={s.sentence} cta={s.cta} extra={t("insightsPhone.stepPoints", { points: s.points.toFixed(4) })} />
          ))}
        </Card>
      ))}
      {d.ranked.length ? (
        <Card title={t("insightsPhone.rankedTitle")}>
          {d.ranked.slice(0, 12).map((m) => (
            <ActionRow key={m.code} sentence={m.sentence} cta={m.cta} />
          ))}
        </Card>
      ) : null}
      {d.qualitative.length ? (
        <Card title={t("insightsPhone.qualitativeTitle")}>
          {d.qualitative.slice(0, 12).map((m) => (
            <ActionRow key={m.code} sentence={m.sentence} cta={m.cta} />
          ))}
        </Card>
      ) : null}
      {d.lastDone.length ? (
        <Card title={t("insightsPhone.lastDoneTitle")}>
          {d.lastDone.slice(0, 8).map((x) => (
            <Row key={`${x.action}${x.at}`} title={x.label} caption={`${x.at.slice(0, 10)}${x.by ? ` · ${x.by}` : ""} · ${x.sinceCompute ? t("insightsPhone.lastDoneNew") : t("insightsPhone.lastDoneCounted")}`} />
          ))}
        </Card>
      ) : null}
    </>
  );
}

/** The screen under the IQAC home (and the head's More). */
export function InsightsScreen() {
  const t = useT();
  const router = useRouter();
  const q = useInsights();
  const d = q.data;
  return (
    <Screen title={t("insightsPhone.title")} description={t("insightsPhone.intro")} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isPending ? <Loading /> : null}
      {q.isError && noCycle(q.error) ? (
        <Empty icon="medal" title={t("iqac.noCycleTitle")} body={t("insightsPhone.noCycleBody")} action={<Button label={t("mobile.openOnWeb")} variant="secondary" onPress={() => openWeb("/iqac/predictor")} />} />
      ) : null}
      {q.isError && !noCycle(q.error) ? <Failed message={q.error.message} onRetry={() => void q.refetch()} /> : null}
      {d ? <InsightsBody d={d} /> : null}
      {d ? (
        <Card>
          <Row title={t("insightsPhone.scenariosButton")} onPress={() => router.push("/(app)/iqac-scenarios" as never)} />
          <Row title={t("insightsPhone.simulatorButton")} caption={t("mobile.openOnWeb")} onPress={() => openWeb("/iqac/simulator")} />
        </Card>
      ) : null}
    </Screen>
  );
}
