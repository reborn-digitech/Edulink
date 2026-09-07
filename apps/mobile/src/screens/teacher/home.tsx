import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { staffTodaySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { clock, dayLabel, relativeTime } from "./support";

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
  const nothingAtAll = data && !form && data.lessons.items.length === 0 && data.marksTodo.length === 0;

  return (
    <Screen title={t("teacher.today")} description={data ? `${data.schoolName} · ${dayLabel(data.dateKey, locale)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {nothingAtAll ? <Empty title={t("teacher.noClassesYet")} body={t("teacher.noClassesBody")} /> : null}
      {data && !nothingAtAll ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            {form ? <Stat label={t("teacher.registersLeft")} value={form.registersLeft} tone={form.registersLeft > 0 ? "warn" : "ok"} /> : null}
            {form ? <Stat label={t("teacher.toGrade")} value={form.toGrade} /> : null}
            <Stat label={t("teacher.acrossTheWeek")} value={data.lessons.classesTaughtThisWeek} />
            {data.lessons.coveringToday > 0 ? <Stat label={t("teacher.covering")} value={data.lessons.coveringToday} tone="accent" /> : null}
          </View>

          {form ? (
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
