import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { staffTimetableSchema, type WeekGridBody } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatDateKey } from "../staff/shared";
import { weekdayName } from "../family/shared";
import { clock } from "./support";

/**
 * The teacher's own week, the web's /timetable: dated, always — this Tuesday
 * in particular, with who is away and who is covering. One day at a time on
 * a phone, today first, the lessons in period order with time, room, class
 * and subject; a lesson taken on for somebody else is marked as cover.
 */

/** YYYY-MM-DD moved by whole days, on the calendar and never through a time zone. */
export function addDaysToKey(key: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}

/** Today's chip first, then the rest of the week in order after it. */
export function dayOrder<T extends { isToday: boolean }>(days: T[]): T[] {
  const i = days.findIndex((d) => d.isToday);
  return i <= 0 ? days : [...days.slice(i), ...days.slice(0, i)];
}

export function TeacherTimetable() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const [week, setWeek] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["staff", "timetable", week],
    placeholderData: keepPreviousData,
    queryFn: async () => staffTimetableSchema.parse(unwrap(await api().get(`/api/v1/staff/timetable${week ? `?week=${week}` : ""}`))),
  });
  const d = query.data;
  const days = d ? dayOrder(d.grid.days) : [];
  const day = days.find((x) => x.weekday === picked) ?? days[0] ?? null;
  const covering = d ? d.grid.slots.filter((s) => s.borrowed).length : 0;
  const move = (next: string | null) => {
    setWeek(next);
    setPicked(null);
  };

  return (
    <Screen title={t("timetable.myTitle")} description={t("timetable.myTeacherBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="secondary" label={t("principal.previous")} onPress={() => move(addDaysToKey(d.weekOf, -7))} />
            {!d.isThisWeek ? <Button variant="ghost" label={t("principal.thisWeek")} onPress={() => move(null)} /> : null}
            <Button variant="secondary" label={t("principal.next")} onPress={() => move(addDaysToKey(d.weekOf, 7))} />
          </View>
          <Text variant="sm" bold>
            {t("principal.weekOf", { date: formatDateKey(d.weekOf, locale, { day: "numeric", month: "long" }) })}
          </Text>
        </>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.grid.periods.length === 0 ? (
          <Empty title={t("timetable.noTimetableYet")} body={t("timetable.noTimetableYetBody")} action={<Button label={t("nav.today")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
        ) : d.grid.slots.length === 0 ? (
          <Empty
            title={t("timetable.nothingForYou")}
            body={t("timetable.nothingForYouBody")}
            action={d.isThisWeek ? <Button label={t("principal.next")} variant="secondary" onPress={() => move(addDaysToKey(d.weekOf, 7))} /> : <Button label={t("principal.thisWeek")} variant="secondary" onPress={() => move(null)} />}
          />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Stat label={t("teacher.acrossTheWeek")} value={d.grid.slots.length} />
              {covering > 0 ? <Stat label={t("teacher.covering")} value={covering} tone="accent" /> : null}
            </View>
            <Chips
              label={t("principal.week")}
              value={String(day?.weekday ?? "")}
              options={days.map((x) => ({ value: String(x.weekday), label: `${weekdayName(x.weekday, locale)}${x.dateKey ? ` ${formatDateKey(x.dateKey, locale)}` : ""}${x.isToday ? t("timetable.today") : ""}` }))}
              onChange={(v) => setPicked(Number(v))}
            />
            <Text variant="xs" tone="muted">
              {t("timetable.coverShowsHere")}
            </Text>
            {day ? <DayLessons day={day} grid={d.grid} /> : null}
          </>
        )
      ) : null}
    </Screen>
  );
}

function DayLessons({ day, grid }: { day: WeekGridBody["days"][number]; grid: WeekGridBody }) {
  const t = useT();
  const { locale } = useLocale();
  const lessons = [...grid.periods]
    .sort((a, b) => a.position - b.position)
    .filter((p) => p.kind === "LESSON")
    .flatMap((period) => grid.slots.filter((s) => s.weekday === day.weekday && s.periodId === period.id).map((slot) => ({ period, slot })));
  const title = `${weekdayName(day.weekday, locale)}${day.dateKey ? ` · ${formatDateKey(day.dateKey, locale)}` : ""}`;
  return (
    <Card title={title}>
      {day.closed ? (
        <Text variant="sm" tone="muted">
          {day.closedName ?? t("timetable.schoolIsShut")}
        </Text>
      ) : lessons.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("timetable.nothingOnThisDay")}
        </Text>
      ) : (
        lessons.map(({ period, slot }) => (
          <Row
            key={slot.id}
            title={`${slot.subject} · ${slot.className}`}
            caption={[period.name, `${clock(period.startMinute)}–${clock(period.endMinute)}`, slot.room].filter(Boolean).join(" · ")}
            right={
              slot.borrowed ? (
                <Text variant="xs" bold tone="accent">
                  {t("teacher.covering")}
                </Text>
              ) : slot.coveringName ? (
                <Text variant="xs" bold tone="accent">
                  {t("timetable.someoneCovering", { name: slot.coveringName })}
                </Text>
              ) : slot.uncovered ? (
                <Text variant="xs" bold tone="danger">
                  {`${t("timetable.teacherAway")} ${t("timetable.noCoverArranged")}`}
                </Text>
              ) : null
            }
          />
        ))
      )}
    </Card>
  );
}
