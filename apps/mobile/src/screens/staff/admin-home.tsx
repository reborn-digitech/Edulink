import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminOverviewSchema, type AdminOverview } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Icon, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, openWeb, pct } from "./shared";

/**
 * The office's overview: the year and what comes next, the setup checklist
 * until it is done, today's counts, and the staffing gap. Each checklist
 * step and the heavy pages it points at open on the web.
 */
export function AdminHome() {
  const t = useT();
  const query = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => adminOverviewSchema.parse(unwrap(await api().get("/api/v1/admin/overview"))),
  });
  const d = query.data;
  return (
    <Screen title={t("nav.overview")} description={d ? `${d.school.name} · ${t("admin.schoolCode")} ${d.school.code}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? <Overview d={d} /> : null}
    </Screen>
  );
}

function Overview({ d }: { d: AdminOverview }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const { counts, checklist } = d;
  return (
    <>
      {d.academicYear ? (
        <Card title={d.academicYear.name}>
          <Text variant="sm" tone="muted">
            {d.nextUp ? t("admin.nextUp", { name: d.nextUp.name, date: formatDateKey(d.nextUp.startDateKey, locale) }) : t("admin.nothingAhead")}
          </Text>
          <Button label={t("admin.updateCalendar")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />
        </Card>
      ) : (
        <Card title={t("admin.startYear")}>
          <Text variant="sm" tone="muted">
            {t("admin.startYearBody")}
          </Text>
          <Button label={t("admin.setUpYear")} onPress={() => openWeb("/admin/calendar")} />
        </Card>
      )}
      {checklist.complete ? null : (
        <Card title={t("admin.finishSetup")}>
          <Text variant="sm" tone="muted">
            {t("admin.setupCount", { done: checklist.done, total: checklist.total })}
          </Text>
          {checklist.steps.map((s) => (
            <Row
              key={s.id}
              title={t(s.titleKey as TranslationKey)}
              caption={t(s.descriptionKey as TranslationKey, s.descriptionVars)}
              right={<Icon name={s.done ? "check" : "dots"} color={s.done ? th.ok : th.fgSubtle} size={22} weight="bold" />}
              onPress={s.done || s.blockedBy ? undefined : () => openWeb(s.href)}
            />
          ))}
        </Card>
      )}
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("admin.registerTaken")} value={counts.classes === 0 ? t("admin.noClassesYet") : t("admin.takenToday", { done: counts.registersTakenToday, total: counts.classes })} tone={d.attendanceTakenPercent === null ? "fg" : d.attendanceTakenPercent >= 100 ? "ok" : "warn"} />
        <Stat label={t("principal.attendance")} value={pct(d.attendanceTakenPercent)} />
      </View>
      <Card title={t("nav.people")} action={<Button label={t("admin.invitePeople")} variant="ghost" onPress={() => router.push("/(app)/people" as never)} />}>
        <Text variant="sm" tone="muted">
          {t("admin.peopleSummary", { teachers: counts.teachers, students: counts.students, classes: counts.classes })}
        </Text>
        {counts.pendingInvites > 0 ? (
          <Text variant="sm" tone="accent" bold>
            {t("admin.invitesPending", { count: counts.pendingInvites })}
          </Text>
        ) : null}
        {counts.teachers === 0 ? (
          <>
            <Text variant="sm" bold>
              {t("admin.noTeachersYet")}
            </Text>
            <Text variant="sm" tone="muted">
              {t("admin.noTeachersBody")}
            </Text>
          </>
        ) : null}
      </Card>
      <Card title={t("exams.adminCardTitle")} action={<Button label={t("exams.scheduleExams")} variant="ghost" onPress={() => openWeb("/admin/exams")} />}>
        <Text variant="sm" tone="muted">
          {counts.examSeries === 0 ? t("exams.adminCardNone") : t("exams.adminCardBody", { scheduled: counts.examSeries, published: counts.examSeriesPublished, cards: counts.reportCardsPublished })}
        </Text>
      </Card>
      {d.staffingGap.slots > 0 ? (
        <Card title={t("admin.staffingGapTitle")}>
          <Text variant="sm" tone="muted">
            {d.staffingGap.classes === 1 ? t("admin.staffingGapBodyOne", { slots: d.staffingGap.slots }) : t("admin.staffingGapBody", { slots: d.staffingGap.slots, classes: d.staffingGap.classes })}
          </Text>
          <Button label={t("admin.staffingOpenTimetable")} variant="secondary" onPress={() => openWeb("/admin/timetable")} />
        </Card>
      ) : null}
      {d.jobStory.attention ? (
        <Card title={t("admin.jobStoryTitle")}>
          <Text variant="sm" tone="warn">
            {t("admin.jobStoryStuck")}
          </Text>
        </Card>
      ) : null}
    </>
  );
}
