import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { trendsSchema, type TrendTerm } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, pct } from "./shared";

/**
 * The school across terms and years — the web's /principal/trends: a row
 * per term with attendance, the exam average, the share over the pass
 * line, fees collected and incidents; the average by subject and by teacher
 * under each term; and this year's grades beside last year's. One GET,
 * recomputed by the server on every read; nothing is ranked.
 */
export const TRENDS_KEY = ["principal", "trends"] as const;
export const trendsPath = (years: Years) => `/api/v1/principal/trends?years=${years}`;
type Years = "1" | "2" | "3";

/** A number and a bar beside it: the bar is decorative, the number is what a reader hears. */
function Line({ label, percent, tone }: { label: string; percent: number | null; tone: "accent" | "ok" | "warn" }) {
  const th = useTheme();
  const colour = { accent: th.accent, ok: th.ok, warn: th.warn }[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
      <Text variant="xs" tone="muted" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="sm" bold style={{ width: 44, textAlign: "right" }}>
        {pct(percent)}
      </Text>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flex: 1, height: 6, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted, overflow: "hidden" }}>
        <View style={{ width: `${percent ?? 0}%`, height: "100%", backgroundColor: colour }} />
      </View>
    </View>
  );
}

function TermBlock({ term }: { term: TrendTerm }) {
  const t = useT();
  const th = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Text variant="base" bold>
        {term.termName === term.yearName ? t("trends.wholeYearNamed", { year: term.yearName }) : `${term.termName} · ${term.yearName}`}
      </Text>
      <Line label={t("trends.attendance")} percent={term.attendancePercent} tone="accent" />
      <Line label={t("trends.examAverage")} percent={term.examAveragePercent} tone="ok" />
      <Line label={t("trends.passRate")} percent={term.passPercent} tone="ok" />
      <Line label={t("trends.feeCollection")} percent={term.feeCollectionPercent} tone="warn" />
      <Text variant="xs" tone="muted">
        {[t("trends.incidentsCount", { count: term.incidents }), t("trends.pupilsWithMarks", { count: term.pupilsWithMarks })].join(" · ")}
      </Text>
      {term.bySubject.length > 0 || term.byTeacher.length > 0 ? (
        <Button label={open ? t("trends.hideBreakdown") : t("trends.showBreakdown")} accessibilityLabel={`${open ? t("trends.hideBreakdown") : t("trends.showBreakdown")}: ${term.termName} ${term.yearName}`} variant="ghost" onPress={() => setOpen((o) => !o)} />
      ) : null}
      {open ? (
        <View style={{ gap: th.space[2] }}>
          <Text variant="xs" tone="subtle" bold>
            {t("trends.bySubject")}
          </Text>
          {term.bySubject.map((row) => (
            <Line key={row.subject} label={row.subject} percent={row.averagePercent} tone="ok" />
          ))}
          <Text variant="xs" tone="subtle" bold>
            {t("trends.byTeacher")}
          </Text>
          {term.byTeacher.map((row) => (
            <Line key={row.membershipId} label={row.name} percent={row.averagePercent} tone="ok" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function StaffTrends() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [years, setYears] = useState<Years>("2");
  const query = useQuery({
    queryKey: [...TRENDS_KEY, years],
    placeholderData: keepPreviousData,
    queryFn: async () => trendsSchema.parse(unwrap(await api().get(trendsPath(years)))),
  });
  const d = query.data;
  return (
    <Screen title={t("trends.title")} description={d ? t("trends.intro", { passLine: d.passLinePercent }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Chips<Years>
        label={t("trends.yearsLabel")}
        value={years}
        options={(["1", "2", "3"] as const).map((n) => ({ value: n, label: t("trends.lastYears", { count: Number(n) }) }))}
        onChange={setYears}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.terms.length === 0 ? (
          <Empty icon="chartLine" title={t("trends.empty")} body={t("trends.emptyBody")} action={<Button label={t("nav.calendar")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />} />
        ) : (
          <>
            <Card title={t("trends.termsTitle")}>
              {d.terms.map((term) => (
                <TermBlock key={term.termId} term={term} />
              ))}
            </Card>
            <Card title={t("trends.cohortsTitle")}>
              <Text variant="xs" tone="muted">
                {t("trends.cohortsHint")}
              </Text>
              {d.cohorts.length === 0 ? (
                <Text variant="sm" tone="muted">
                  {t("trends.noMarks")}
                </Text>
              ) : (
                d.cohorts.map((c) => (
                  <View key={c.gradeLevel} style={{ gap: th.space[1], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
                    <Text variant="base" bold>
                      {t("trends.gradeN", { grade: c.gradeLevel })}
                    </Text>
                    {[c.thisYear, c.lastYear].map((y) =>
                      y ? (
                        <View key={y.yearName} style={{ gap: 2 }}>
                          <Text variant="xs" tone="muted">
                            {`${y.yearName} · ${t("trends.pupilsSatCount", { count: y.pupils })}`}
                          </Text>
                          <Line label={t("trends.attendance")} percent={y.attendancePercent} tone="accent" />
                          <Line label={t("trends.examAverage")} percent={y.examAveragePercent} tone="ok" />
                        </View>
                      ) : null,
                    )}
                  </View>
                ))
              )}
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}
