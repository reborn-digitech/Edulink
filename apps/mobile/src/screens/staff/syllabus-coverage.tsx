import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { syllabusCoverageSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { formatDateKey } from "./shared";

/**
 * Syllabus coverage — the web's /admin/syllabus/coverage for the office and
 * the head: done chapters over all chapters, class by class and subject by
 * subject, against how far the year has gone. A row opens the class's own
 * syllabus, where its teacher ticks the chapters. The chapter lists
 * themselves are written on the web; the phone reads.
 */
export const COVERAGE_PATH = "/api/v1/office/syllabus/coverage";
export const COVERAGE_KEY = ["office", "syllabus", "coverage"] as const;

export function SyllabusCoverage() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: COVERAGE_KEY, queryFn: async () => syllabusCoverageSchema.parse(unwrap(await api().get(COVERAGE_PATH))) });
  const d = query.data;
  return (
    <Screen title={t("syllabus.coverageTitle")} description={t("syllabus.coverageIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("syllabus.overall")} value={d.overallPercent === null ? "—" : `${d.overallPercent}%`} tone={d.overallPercent === null ? "fg" : "accent"} />
            <Stat label={t("syllabus.behind")} value={d.classesBehind} tone={d.classesBehind > 0 ? "warn" : "ok"} />
          </View>
          <Text variant="xs" tone="muted">
            {[d.yearName, t("syllabus.yearElapsed", { percent: d.yearElapsedPercent }), d.classesBehind === 0 ? t("syllabus.noneBehind") : t("syllabus.classesBehind", { count: d.classesBehind })].filter(Boolean).join(" · ")}
          </Text>
          {d.rows.length === 0 ? (
            <Empty icon="books" title={t("syllabus.noLists")} body={t("syllabus.noCoverageBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
          ) : (
            <Card>
              {d.rows.map((r) => (
                <Row
                  key={`${r.classId}:${r.subject}`}
                  title={t("syllabus.classTitle", { className: r.className, subject: r.subject })}
                  caption={[`${r.done}/${r.units}`, t("syllabus.expectedBy", { expected: r.expected, units: r.units }), r.lastTaughtOn ? t("syllabus.lastTaught", { date: formatDateKey(r.lastTaughtOn, locale) }) : t("syllabus.neverTaught")].join(" · ")}
                  right={
                    <View style={{ alignItems: "flex-end", gap: 2 }}>
                      <Text variant="base" bold tone={r.behind ? "warn" : "fg"}>
                        {`${r.percent}%`}
                      </Text>
                      <Pill label={r.behind ? t("syllabus.behind") : t("syllabus.onTrack")} tone={r.behind ? "warn" : "ok"} />
                    </View>
                  }
                  onPress={() => router.push({ pathname: "/(app)/syllabus", params: { classId: r.classId, subject: r.subject } } as never)}
                />
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}
