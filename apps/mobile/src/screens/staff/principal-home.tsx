import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { principalOverviewSchema, type PrincipalOverview } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { DEFAULT_SPAN, formatDateKey, pct, WindowPicker, type Span } from "./shared";

/**
 * The head's dashboard: what can still be fixed today first — attendance
 * not marked, leave waiting — then the term's shape over a window the
 * picker chooses. Classes carry figures; no pupil is ranked here.
 */
export function PrincipalHome() {
  const t = useT();
  const { locale } = useLocale();
  const [span, setSpan] = useState<Span>(DEFAULT_SPAN);
  const query = useQuery({
    queryKey: ["principal", "overview", span],
    placeholderData: keepPreviousData,
    queryFn: async () => principalOverviewSchema.parse(unwrap(await api().get(`/api/v1/staff/principal/overview?days=${span}`))),
  });
  const d = query.data;
  const description = d
    ? [
        t("principal.rangeTo", { from: formatDateKey(d.window.fromDateKey, locale), to: formatDateKey(d.window.toDateKey, locale) }),
        d.runningTerm ? t("principal.termRuns", { name: d.runningTerm.name, date: formatDateKey(d.runningTerm.endDateKey, locale) }) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  return (
    <Screen title={t("principal.dashboard")} description={description} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <WindowPicker value={span} onChange={setSpan} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? <Overview d={d} /> : null}
    </Screen>
  );
}

function Overview({ d }: { d: PrincipalOverview }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { summary } = d;
  const openClass = (classId: string) => router.push({ pathname: "/(app)/classes/detail", params: { classId } } as never);
  const caption = (c: PrincipalOverview["classes"][number]) =>
    [c.pupils === 1 ? t("principal.pupilsOne") : t("principal.pupilsMany", { count: c.pupils }), `${t("principal.attendance")} ${pct(c.attendance.percent)}`, `${t("principal.progress")} ${pct(c.progress.percent)}`].join(" · ");
  return (
    <>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("principal.registersMissing")} value={summary.registersMissingToday} tone={summary.registersMissingToday > 0 ? "warn" : "ok"} />
        <Stat label={t("principal.attendance")} value={pct(summary.attendancePercent)} tone={summary.attendancePercent === null ? "fg" : "accent"} />
      </View>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("principal.pupils")} value={summary.pupils} />
        <Stat label={t("principal.classes")} value={summary.classes} />
      </View>
      <Card>
        <Row
          title={summary.pendingLeave === 1 ? t("principal.leaveWaitingOne") : t("principal.leaveWaitingMany", { count: summary.pendingLeave })}
          caption={t("principal.approvingArranges")}
          right={<Text variant="lg" bold tone={summary.pendingLeave > 0 ? "warn" : "muted"}>{summary.pendingLeave}</Text>}
          onPress={() => router.push("/(app)/leave" as never)}
        />
      </Card>
      {d.classes.length === 0 ? (
        <Empty title={t("principal.noClasses")} body={t("principal.noClassesBody")} />
      ) : (
        <>
          <Card title={t("principal.classesWorthALook")}>
            {d.concerns.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("principal.nothingBelowLine")}
              </Text>
            ) : (
              d.concerns.map((c) => <Row key={c.classId} title={c.name} caption={caption(c)} right={<Text variant="base" bold tone="danger">{pct(c.attendance.percent)}</Text>} onPress={() => openClass(c.classId)} />)
            )}
          </Card>
          <Card title={t("principal.classes")} action={<Button label={t("principal.allOf", { count: d.classes.length })} variant="ghost" onPress={() => router.push("/(app)/classes" as never)} />}>
            {d.classes.map((c) => (
              <Row key={c.classId} title={c.section ? `${c.name} · ${c.section}` : c.name} caption={caption(c)} right={<Text variant="base" bold>{pct(c.attendance.percent)}</Text>} onPress={() => openClass(c.classId)} />
            ))}
            <Text variant="xs" tone="subtle">
              {t("principal.denominatorNote")}
            </Text>
          </Card>
        </>
      )}
      {d.reviews.length > 0 ? (
        <Card title={t("reviews.title")} action={<Button label={t("reviews.manageRounds")} variant="ghost" onPress={() => router.push("/(app)/reviews" as never)} />}>
          {d.reviews.map((r) => (
            <Row
              key={r.membershipId}
              title={r.name}
              caption={r.allTime.responseCount === 1 ? t("reviews.answersOne") : t("reviews.answersN", { count: r.allTime.responseCount })}
              right={<Text variant="base" bold tone="accent">{r.allTime.overall === null ? "—" : r.allTime.overall.toFixed(1)}</Text>}
            />
          ))}
        </Card>
      ) : null}
    </>
  );
}
