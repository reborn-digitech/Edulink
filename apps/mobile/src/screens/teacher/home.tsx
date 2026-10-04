import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { QUICK } from "@/lib/nav";
import { myStaffAttendanceSchema, staffTodaySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, QuickActions, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { clock, dayLabel, relativeTime } from "./support";
import { MY_KEY, MY_PATH, todayLine, useCheckIn } from "./my-attendance";
import { periodLine } from "../staff/substitutions";

/**
 * The teacher's Today, the web's /teacher: the registers still to take, the
 * lessons in period order, the papers sat and not yet marked, and the work
 * due soon in the form classes. One GET, the same page the web draws.
 */
export function TeacherHome() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["staff", "today"],
    queryFn: async () => staffTodaySchema.parse(unwrap(await api().get("/api/v1/staff/today"))),
  });
  const data = query.data;
  const form = data?.formClasses ?? null;
  // A cover from the office is a day, even for a teacher with no lesson of their own.
  const nothingAtAll = data && !form && data.lessons.items.length === 0 && data.marksTodo.length === 0 && !(data.covers && data.covers.length > 0);
  // A Sunday or a closing holiday is no school, never "0 left" or "every register taken" (B-11); an older server says it only through the timetable's closed day.
  const noSchool = data ? (data.noSchool ?? (data.lessons.closed ? { holidayName: data.lessons.closedName } : null)) : null;
  const noSchoolLine = noSchool ? (noSchool.holidayName ? t("common.noSchoolTodayHoliday", { name: noSchool.holidayName }) : t("common.noSchoolToday")) : null;

  return (
    <Screen title={t("teacher.today")} description={data ? `${data.schoolName} · ${dayLabel(data.dateKey, locale)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <CheckInCard />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {nothingAtAll ? (
        <Empty
          title={t("teacher.noClassesYet")}
          body={t("teacher.noClassesBody")}
          action={
            data.lessons.classesTaughtThisWeek > 0 ? (
              <Button label={t("teacher.openTimetable")} variant="secondary" onPress={() => router.push("/(app)/timetable" as never)} />
            ) : (
              <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />
            )
          }
        />
      ) : null}
      {data && !nothingAtAll ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            {form && !noSchool ? <Stat label={t("teacher.registersLeft")} value={form.registersLeft} tone={form.registersLeft > 0 ? "warn" : "ok"} /> : null}
            {form ? <Stat label={t("teacher.toGrade")} value={form.toGrade} /> : null}
            <Stat label={t("teacher.acrossTheWeek")} value={data.lessons.classesTaughtThisWeek} />
            {data.lessons.coveringToday > 0 ? <Stat label={t("teacher.covering")} value={data.lessons.coveringToday} tone="accent" /> : null}
          </View>
          <QuickActions actions={QUICK.TEACHER ?? []} onOpen={(href) => router.push(href as never)} />

          {form && noSchoolLine ? (
            <Card title={t("teacher.registers")}>
              <Text variant="sm" tone="muted" accessibilityLiveRegion="polite">
                {noSchoolLine}
              </Text>
            </Card>
          ) : null}
          {form && !noSchoolLine ? (
            <Card title={t("teacher.registers")}>
              <Text variant="sm" tone={form.registersLeft === 0 ? "ok" : "muted"}>
                {form.registersLeft === 0 ? t("teacher.everyRegisterTaken") : form.registersLeft === 1 ? t("teacher.stillToTakeOne") : t("teacher.stillToTakeMany", { count: form.registersLeft })}
              </Text>
              {form.classes.map((c) => (
                <Row
                  key={c.id}
                  title={c.name}
                  caption={`${c.students === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: c.students })} · ${c.registerTaken ? t("teacher.done") : t("teacher.toDo")}`}
                  right={
                    <Text variant="sm" bold tone={c.registerTaken ? "ok" : "accent"}>
                      {c.registerTaken ? t("teacher.done") : t("teacher.takeIt")}
                    </Text>
                  }
                  onPress={() => router.push({ pathname: "/(app)/attendance", params: { classId: c.id } } as never)}
                />
              ))}
            </Card>
          ) : null}

          <Card title={t("teacher.yourLessons")}>
            {data.lessons.closed ? (
              <Text variant="sm" tone="muted">
                {t("teacher.closedToday", { name: data.lessons.closedName ?? "" })}
              </Text>
            ) : data.lessons.items.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("teacher.noLessonsToday")}
              </Text>
            ) : (
              data.lessons.items.map((l) => (
                <Row
                  key={l.slotId}
                  title={`${l.subject} · ${l.className}`}
                  caption={[l.periodName, l.startMinute !== null ? `${clock(l.startMinute)}–${clock(l.endMinute)}` : null, l.room].filter(Boolean).join(" · ")}
                  right={l.borrowed ? <Text variant="xs" bold tone="accent">{t("teacher.covering")}</Text> : null}
                />
              ))
            )}
            <Button label={t("teacher.openTimetable")} variant="ghost" onPress={() => router.push("/(app)/timetable" as never)} />
          </Card>

          {data.covers && data.covers.length > 0 ? (
            <Card title={t("substitutions.myCoversTitle")} action={<Button label={t("teacher.seeAll")} variant="ghost" onPress={() => router.push("/(app)/my-covers" as never)} accessibilityLabel={`${t("teacher.seeAll")}: ${t("substitutions.myCoversTitle")}`} />}>
              {data.covers.map((c) => (
                <Row key={c.slotId} title={`${c.subject} · ${c.className}`} caption={[periodLine(t, c), c.room, t("substitutions.coveringFor", { name: c.absentName })].filter(Boolean).join(" · ")} onPress={() => router.push("/(app)/my-covers" as never)} />
              ))}
            </Card>
          ) : null}

          {data.marksTodo.length > 0 ? (
            <Card title={t("exams.marksTodoTitle")}>
              <Text variant="sm" tone="muted">
                {t("exams.marksTodoBody")}
              </Text>
              {data.marksTodo.map((m) => (
                <Row
                  key={`${m.classId}:${m.slotId}`}
                  title={`${m.subject} · ${m.seriesName}`}
                  caption={`${m.className} · ${t("teacher.markedOf", { marked: m.marked, total: m.classSize })}`}
                  onPress={() => router.push({ pathname: "/(app)/marks", params: { classId: m.classId, slotId: m.slotId } } as never)}
                />
              ))}
            </Card>
          ) : null}

          {form ? (
            <Card title={t("teacher.comingUp")}>
              {form.dueSoon.length === 0 ? (
                <Text variant="sm" tone="muted">
                  {t("teacher.nothingDue")}
                </Text>
              ) : (
                form.dueSoon.map((a) => (
                  <Row key={a.id} title={a.title} caption={`${a.className} · ${a.dueAt ? t("teacher.dueWhen", { when: relativeTime(a.dueAt, locale) }) : t("teacher.noDueDate")}`} />
                ))
              )}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/**
 * "I'm in" at the top of the day, or today's line once it is recorded: one
 * light GET of the staff member's own days. Nothing is drawn while it loads
 * or if the server refuses, so the Today screen never waits on it.
 */
function CheckInCard() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({
    queryKey: [...MY_KEY, "home"],
    queryFn: async () => myStaffAttendanceSchema.parse(unwrap(await api().get(MY_PATH))),
  });
  const checkIn = useCheckIn();
  const d = query.data;
  if (!d) return null;
  const line = todayLine(t, locale, d);
  if (!d.canCheckIn && !line) return null;
  return (
    <Card title={t("staffAttendance.myTitle")} action={<Button label={t("staffAttendance.month")} variant="ghost" onPress={() => router.push("/(app)/my-attendance" as never)} />}>
      {d.canCheckIn ? (
        <Button label={t("staffAttendance.checkIn")} busy={checkIn.isPending} onPress={() => checkIn.mutate({ checkInMinute: d.checkInMinute, lateGraceMinutes: d.lateGraceMinutes })} />
      ) : (
        <Text variant="base" bold tone={d.todayStatus === "LATE" ? "warn" : d.todayStatus === "ON_LEAVE" ? "accent" : "ok"} accessibilityLiveRegion="polite">
          {line}
        </Text>
      )}
    </Card>
  );
}
