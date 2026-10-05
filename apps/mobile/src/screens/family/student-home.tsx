import { View } from "react-native";
import { useRouter } from "expo-router";
import { QUICK } from "@/lib/nav";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyStudentOverviewSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, QuickActions, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { CompleteRecordCard } from "./record";
import { CelebrationsCard } from "../shared/celebrations";
import { ATTENDANCE, ExamMarksCards, formatDateKey, LessonList, Pill, relativeTime } from "./shared";

/** The pupil's Today — the web's /student: attendance, the day's lessons, what is due, the latest exam marks. */
export function StudentHome() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["family", "student", "overview"],
    queryFn: async () => familyStudentOverviewSchema.parse(unwrap(await api().get("/api/v1/family/student/overview"))),
  });
  const qc = useQueryClient();
  // Put away on the account, so it stays away on the web too; the card leaves at once either way.
  const putAway = useMutation({
    mutationFn: async () => api().post("/api/v1/family/student/welcomed", {}),
    onMutate: () => qc.setQueryData(["family", "student", "overview"], (old: typeof query.data) => (old ? { ...old, welcome: null } : old)),
  });
  const d = query.data;
  const today = d ? formatDateKey(d.today, locale, { weekday: "long", day: "numeric", month: "long" }) : null;
  const streak = d?.streak ?? 0;
  return (
    <Screen
      title={d ? t("student.hiName", { name: d.name }) : t("nav.today")}
      description={d ? [today, d.className].filter(Boolean).join(" · ") : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {d.welcome ? (
            <Card title={t("student.youreInName", { name: d.name })} accessibilityLiveRegion="polite">
              <Text variant="sm" tone="muted">
                {t("student.welcomeBody")}
              </Text>
              {d.welcome.handle ? (
                <View style={{ gap: th.space[1], backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3] }}>
                  <Text variant="xs" tone="muted" bold>
                    {t("student.saveLogin")}
                  </Text>
                  <Text variant="base" bold selectable>
                    {d.welcome.handle}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {t("student.useThis")}
                  </Text>
                </View>
              ) : null}
              <Button label={t("student.hideMessage")} variant="secondary" onPress={() => putAway.mutate()} />
            </Card>
          ) : null}
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat
              label={t("student.today")}
              value={d.todayStatus ? t(ATTENDANCE[d.todayStatus].label) : t("student.notYet")}
              tone={!d.todayStatus ? "fg" : d.todayStatus === "PRESENT" ? "ok" : d.todayStatus === "LATE" ? "warn" : "danger"}
            />
            <Stat label={t("student.streak")} value={streak} tone={streak >= 5 ? "ok" : "fg"} />
            <Stat label={t("student.attendance")} value={d.attendance.percent === null ? "—" : `${d.attendance.percent}%`} tone={d.attendance.percent !== null && d.attendance.percent >= 95 ? "ok" : "fg"} />
          </View>
          <QuickActions actions={QUICK.STUDENT ?? []} onOpen={(href) => router.push(href as never)} />
          {/* Birthdays and anniversaries (A3-inventory-14): the web wears the same door on a pupil's Today. */}
          <CelebrationsCard />
          <Text variant="xs" tone="muted">
            {[
              d.todayStatus ? t("student.registerTaken") : t("student.registerNotTakenYet"),
              streak === 0 ? t("student.streakStartHint") : streak >= 5 ? t("student.onARoll") : streak === 1 ? t("student.streakDaysOne") : t("student.streakDaysMany", { count: streak }),
              t("student.lastFourWeeks"),
            ].join(" · ")}
          </Text>

          {/* While a certificate field is still blank on the pupil's own record, the nudge to fill it; gone once it is complete. */}
          <CompleteRecordCard />

          <Card title={t("student.todayLessons")} action={<Button variant="ghost" label={t("teacher.openTimetable")} onPress={() => router.push("/(app)/timetable" as never)} />}>
            <Text variant="sm" tone="muted">
              {d.closedToday ? t("teacher.closedToday", { name: d.closedName ?? "" }) : t("student.todayLessonsBody")}
            </Text>
            <LessonList lessons={d.lessonsToday} closedToday={d.closedToday} closedName={d.closedName} />
          </Card>

          <Card title={t("student.whatIsDue")} action={<Button variant="ghost" label={t("agenda.link")} onPress={() => router.push("/(app)/agenda" as never)} />}>
            <Text variant="sm" tone="muted">
              {d.upcoming.length === 0 ? t("student.nothingDueShort") : d.upcoming.length === 1 ? t("student.toDoCountOne") : t("student.toDoCountMany", { count: d.upcoming.length })}
            </Text>
            {d.upcoming.length === 0 ? (
              <Empty title={t("student.nothingDue")} body={t("student.nothingDueBody")} action={<Button label={t("nav.practice")} variant="secondary" onPress={() => router.push("/(app)/practice" as never)} />} />
            ) : (
              d.upcoming.map((item) => (
                <Row
                  key={item.id}
                  title={item.title}
                  caption={item.className}
                  right={<Pill tone={item.dueSoon ? "warn" : "muted"} label={item.dueAt ? relativeTime(item.dueAt, locale) : t("student.noDate")} />}
                  onPress={() => router.push("/(app)/assignments" as never)}
                />
              ))
            )}
          </Card>

          {d.examMarks.map((m) => (
            <ExamMarksCards key={m.studentMembershipId} marks={m} compact onSeeAll={() => router.push("/(app)/exams" as never)} />
          ))}

          {/* The fortnight ahead on one dated list, and the pupil's own fees (shown only when the school allows their age). */}
          <Card>
            <Row icon="calendar" title={t("agenda.title")} caption={t("agenda.introPupil", { days: 14 })} onPress={() => router.push("/(app)/agenda" as never)} />
            <Row icon="receipt" title={t("fees.myFeesTitle")} caption={t("fees.pupilIntro")} onPress={() => router.push("/(app)/fees" as never)} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
