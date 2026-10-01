import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { classAnalyticsSchema, type AnalyticsWindow, type ClassFlag } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { EXAM_KIND, Pill, type ExamKind } from "../family/shared";
import { Chips, formatDateKey, pct } from "../staff/shared";

/**
 * A class as numbers — the web's /teacher/classes/[classId]/analytics:
 * attendance and its weekly trend, each exam's average and spread, hand-ins
 * made and late, and the pupils the thresholds flag, by name and never
 * ranked. One GET, recomputed by the server on every read; the window chips
 * ask for the term or the last thirty days.
 */
export const ANALYTICS_KEY = ["teaching", "class-analytics"] as const;
export const analyticsPath = (classId: string, window: AnalyticsWindow) => `/api/v1/teaching/classes/${classId}/analytics?window=${window}`;

const FLAG_KEY: Record<ClassFlag, TranslationKey> = { ATTENDANCE: "classAnalytics.flagAttendance", MARKS_FALLING: "classAnalytics.flagMarksFalling", LATE_WORK: "classAnalytics.flagLateWork" };
const FLAG_TONE: Record<ClassFlag, "danger" | "warn" | "accent"> = { ATTENDANCE: "danger", MARKS_FALLING: "warn", LATE_WORK: "accent" };

export function ClassAnalytics() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [window, setWindow] = useState<AnalyticsWindow>("term");
  const query = useQuery({
    queryKey: [...ANALYTICS_KEY, classId, window],
    placeholderData: keepPreviousData,
    enabled: Boolean(classId),
    queryFn: async () => classAnalyticsSchema.parse(unwrap(await api().get(analyticsPath(classId!, window)))),
  });
  const d = query.data;
  if (!classId) {
    return (
      <Screen title={t("classAnalytics.metaTitle")}>
        <Failed message={t("teacher.classNotFound")} />
      </Screen>
    );
  }
  const day = (key: string) => formatDateKey(key, locale);
  const latest = d && d.exams.length > 0 ? d.exams[d.exams.length - 1]! : null;
  return (
    <Screen title={d ? t("classAnalytics.title", { className: d.className }) : t("classAnalytics.metaTitle")} description={t("classAnalytics.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Chips<AnalyticsWindow>
        label={t("classAnalytics.window")}
        value={window}
        options={[
          { value: "term", label: t("classAnalytics.windowTerm") },
          { value: "month", label: t("classAnalytics.windowMonth") },
        ]}
        onChange={setWindow}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="xs" tone="muted">
            {`${d.windowName ?? (d.window === "month" ? t("classAnalytics.windowMonth") : t("classAnalytics.windowNinetyDays"))} · ${t("classAnalytics.span", { from: day(d.fromDateKey), to: day(d.toDateKey) })}`}
          </Text>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("classAnalytics.attendance")} value={pct(d.attendance.percent)} tone={d.attendance.percent === null ? "fg" : d.attendance.percent < 75 ? "danger" : "ok"} />
            <Stat label={t("classAnalytics.exams")} value={d.exams.length} />
            <Stat label={t("classAnalytics.completion")} value={pct(d.work.completionPercent)} tone="accent" />
            <Stat label={t("classAnalytics.flagged")} value={d.flagged.length} tone={d.flagged.length > 0 ? "warn" : "ok"} />
          </View>

          <Card title={t("classAnalytics.trendTitle")}>
            {d.attendance.marks === 0 ? (
              <Text variant="sm" tone="muted">
                {t("classAnalytics.noRegisters")}
              </Text>
            ) : (
              <View accessibilityRole="image" accessibilityLabel={t("classAnalytics.trendTitle")} style={{ flexDirection: "row", alignItems: "flex-end", gap: th.space[1], height: 96 }}>
                {d.attendance.trend.map((p, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                    <Text variant="xs" bold>
                      {pct(p.percent)}
                    </Text>
                    <View style={{ width: "100%", height: p.percent === null ? 2 : Math.max(2, Math.round(p.percent * 0.5)), backgroundColor: th.accentSoft, borderTopLeftRadius: th.radius.sm, borderTopRightRadius: th.radius.sm }} />
                    <Text variant="xs" tone="muted">
                      {p.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card title={t("classAnalytics.examsTitle")}>
            {d.exams.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("classAnalytics.noExams")}
              </Text>
            ) : (
              d.exams.map((exam) => (
                <View key={exam.seriesId} style={{ gap: 2, paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                    <Text variant="base" bold style={{ flex: 1 }}>
                      {exam.name}
                    </Text>
                    <Text variant="base" bold>
                      {pct(exam.averagePercent)}
                    </Text>
                  </View>
                  <Text variant="xs" tone="muted">
                    {[t(EXAM_KIND[exam.kind as ExamKind] ?? "exams.kindUnitTest"), exam.dateKey ? day(exam.dateKey) : null, t("classAnalytics.markedOf", { count: exam.marked })].filter(Boolean).join(" · ")}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {t("classAnalytics.spreadLabel", exam.distribution)}
                  </Text>
                </View>
              ))
            )}
            {latest ? (
              <Text variant="xs" tone="subtle">
                {t("classAnalytics.latestAverage", { percent: pct(latest.averagePercent) })}
              </Text>
            ) : null}
          </Card>

          <Card title={t("classAnalytics.workTitle")}>
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Stat label={t("classAnalytics.assignments")} value={d.work.assignments} />
              <Stat label={t("classAnalytics.submitted")} value={d.work.submitted} tone="ok" />
              <Stat label={t("classAnalytics.late")} value={d.work.late} tone={d.work.late > 0 ? "warn" : "fg"} />
              <Stat label={t("classAnalytics.missing")} value={d.work.missing} tone={d.work.missing > 0 ? "danger" : "fg"} />
            </View>
          </Card>

          <Card title={t("classAnalytics.flaggedTitle")}>
            <Text variant="xs" tone="muted">
              {t("classAnalytics.flaggedHint", { attendance: 75, late: 3 })}
            </Text>
            {d.flagged.length === 0 ? (
              <Empty icon="checks" title={t("classAnalytics.nobodyFlagged")} body={t("classAnalytics.nobodyFlaggedBody")} action={<Button label={t("teacher.takeRegister")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/attendance", params: { classId } } as never)} />} />
            ) : (
              d.flagged.map((p) => (
                <View key={p.membershipId} style={{ gap: th.space[1], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
                  <Text variant="base" bold>
                    {p.name}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[1] }}>
                    {p.flags.map((f) => (
                      <Pill key={f} label={t(FLAG_KEY[f])} tone={FLAG_TONE[f]} />
                    ))}
                  </View>
                  <Text variant="xs" tone="muted">
                    {[
                      p.attendancePercent !== null ? t("classAnalytics.attendanceOf", { percent: p.attendancePercent }) : null,
                      p.recentPercents.length > 0 ? t("classAnalytics.marksOf", { marks: p.recentPercents.map((x) => `${x}%`).join(" → ") }) : null,
                      p.lateHandIns > 0 ? t("classAnalytics.lateOf", { count: p.lateHandIns }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
