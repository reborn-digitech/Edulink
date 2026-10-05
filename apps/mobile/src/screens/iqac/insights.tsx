import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { naacInsightsSchema, type InsightCta, type NaacInsights, type RoleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { ApiRefused, unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { openWeb, Pill } from "@/screens/family/shared";
import { roleLabel } from "@/screens/staff/shared";
import { formatDate, formatDateTime } from "@/lib/dates";

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

type Tr = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Who makes a change, in the phone's language: at a college the office is "College office", as the server's ROLE_KEY says. */
function whoLabel(t: Tr, role: RoleCode): string {
  return role === "ADMIN" ? t("role.collegeAdmin") : roleLabel(t, role);
}

/**
 * "Page — who", built here from the call to action's code and roles rather
 * than read from `cta.label`: the server writes that in the account's
 * language, and the phone may be set to another (A3-states-16).
 */
export function ctaLabel(t: Tr, cta: InsightCta): string {
  return t("insights.ctaLabel", { page: t(`insights.cta.${cta.code}` as TranslationKey), who: cta.roles.map((r) => whoLabel(t, r)).join(", ") });
}

/**
 * A call to action as a row, as the web's CtaLink: the viewer's own step opens
 * the web page where the change is made; another role's step says whom to
 * ask, with no link, because that page sends this viewer away (A3-journeys-23).
 */
function ActionRow({ sentence, cta, extra }: { sentence: string; cta: InsightCta; extra?: string }) {
  const t = useT();
  const role = useRole();
  const label = ctaLabel(t, cta);
  if (role && (cta.roles as string[]).includes(role)) {
    return <Row title={sentence} caption={[label, extra, t("mobile.openOnWeb")].filter(Boolean).join(" · ")} onPress={() => openWeb(cta.href)} />;
  }
  return <Row title={sentence} caption={[t("insights.ctaAsk", { label }), extra].filter(Boolean).join(" · ")} />;
}

/**
 * G4-15 (risks batch, 5 Oct 2026): every figure here is measured against the platform's benchmark list, so it is
 * "Provisional" until the college's IQAC coordinator signs that list on the web; once signed, who signed it and when.
 * Worded from the phone's own dictionary (the server's `sentence` is in the account's language). An older server
 * sends no status, and the screen says nothing more than `notAScore` already does.
 */
export function BenchmarksLine({ status }: { status: NaacInsights["benchmarks"] }) {
  const t = useT();
  const th = useTheme();
  if (!status) return null;
  if (status.provisional) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
        <Pill tone="warn" label={t("iqac.provisional")} />
        <Text variant="sm" tone="muted" style={{ flex: 1, minWidth: 200 }}>
          {t("riskDecisions.benchmarksProvisional")}
        </Text>
      </View>
    );
  }
  return (
    <Text variant="xs" tone="muted">
      {t("riskDecisions.benchmarksSigned", { name: status.signedByName ?? "—", date: status.signedAt ? formatDate(status.signedAt) : "—" })}
    </Text>
  );
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
      <BenchmarksLine status={d.benchmarks} />
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
            <Row key={`${x.action}${x.at}`} title={x.labelKey ? t(x.labelKey as TranslationKey) : x.label} caption={`${formatDateTime(x.at)}${x.by ? ` · ${x.by}` : ""} · ${x.sinceCompute ? t("insightsPhone.lastDoneNew") : t("insightsPhone.lastDoneCounted")}`} />
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
