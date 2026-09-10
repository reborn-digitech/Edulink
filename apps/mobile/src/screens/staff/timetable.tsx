import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { principalTimetableSchema, type PrincipalTimetable } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatTimeRange, weekdayName } from "../family/shared";
import { addDaysToKey, Chips, formatDateKey } from "./shared";

type Grid = NonNullable<PrincipalTimetable["grid"]>;
type Slot = Grid["slots"][number];

function timetableQuery(classId: string | null, week: string | null): string {
  const p = new URLSearchParams();
  if (classId) p.set("classId", classId);
  if (week) p.set("week", week);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Any class's week, read-only — the web's /principal/timetable, which the
 * office reads too: dated, so the uncovered lessons are real ones, with the
 * gaps counted above the grid rather than left to be spotted in forty cells.
 * The office builds the week (periods, slots) in the timetable editor.
 */
export function StaffTimetable() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [classId, setClassId] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["principal", "timetable", classId, week],
    placeholderData: keepPreviousData,
    queryFn: async () => principalTimetableSchema.parse(unwrap(await api().get(`/api/v1/staff/principal/timetable${timetableQuery(classId, week)}`))),
  });
  const d = query.data;
  const grid = d?.grid ?? null;
  const selected = d ? (d.classes.find((k) => k.id === d.selectedClassId) ?? null) : null;
  const className = (k: { name: string; section: string | null }) => (k.section && !k.name.toLowerCase().includes(k.section.toLowerCase()) ? `${k.name} ${k.section}` : k.name);
  const weekOf = d ? formatDateKey(d.weekOf, locale, { day: "numeric", month: "long" }) : "";
  const editTimetable = () => router.push({ pathname: "/(app)/timetable-editor", params: d?.selectedClassId ? { classId: d.selectedClassId } : {} } as never);
  return (
    <Screen title={t("principal.classTimetables")} description={t("principal.classTimetablesBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {role === "ADMIN" ? <Button label={t("admin.staffingOpenTimetable")} variant="secondary" onPress={editTimetable} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.classes.length === 0 ? (
          <Empty
            title={t("principal.noClasses")}
            body={t("principal.nothingToTimetable")}
            action={role === "ADMIN" ? <Button label={t("timetable.createClass")} variant="secondary" onPress={() => router.push("/(app)/class-new" as never)} /> : <Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />}
          />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Stat label={t("principal.arrangeCover")} value={d.gaps} tone={d.gaps > 0 ? "danger" : "ok"} />
              <Stat label={t("timetable.noTeacherYet2")} value={d.unstaffed} tone={d.unstaffed > 0 ? "warn" : "ok"} />
            </View>
            <Chips label={t("principal.chooseClass")} value={d.selectedClassId ?? classId ?? ""} options={d.classes.map((k) => ({ value: k.id, label: className(k) }))} onChange={setClassId} />
            <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap", alignItems: "center" }}>
              <Button variant="secondary" label={t("principal.previous")} onPress={() => setWeek(addDaysToKey(d.weekOf, -7))} />
              {!d.isThisWeek ? <Button variant="ghost" label={t("principal.thisWeek")} onPress={() => setWeek(null)} /> : null}
              <Button variant="secondary" label={t("principal.next")} onPress={() => setWeek(addDaysToKey(d.weekOf, 7))} />
            </View>
            <Text variant="sm" bold>
              {t("principal.weekOf", { date: weekOf })}
            </Text>
            {d.gaps > 0 ? (
              <View accessibilityRole="alert" style={{ backgroundColor: th.dangerSoft, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[2] }}>
                <Text variant="sm" bold tone="danger">
                  {d.gaps === 1 ? t("principal.gapsOne") : t("principal.gapsMany", { count: d.gaps })}
                </Text>
                <Button label={t("principal.arrangeCover")} variant="danger" onPress={() => router.push("/(app)/leave" as never)} />
              </View>
            ) : null}
            {grid === null || grid.periods.length === 0 ? (
              <Empty
                title={t("timetable.noTimetableYet")}
                body={t("timetable.noPeriodsSetUp")}
                action={role === "ADMIN" ? <Button label={t("admin.staffingOpenTimetable")} variant="secondary" onPress={editTimetable} /> : <Button label={t("nav.calendar")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />}
              />
            ) : grid.slots.length === 0 ? (
              <Empty
                title={t("timetable.nothingYet")}
                body={t("timetable.nothingYetBody")}
                action={d.isThisWeek ? <Button label={t("principal.next")} variant="secondary" onPress={() => setWeek(addDaysToKey(d.weekOf, 7))} /> : <Button label={t("principal.thisWeek")} variant="secondary" onPress={() => setWeek(null)} />}
              />
            ) : (
              <>
                <Card title={selected ? className(selected) : t("principal.week")}>
                  <Text variant="sm" tone={d.unstaffed > 0 ? "warn" : "muted"}>
                    {d.unstaffed === 0 ? t("principal.everyLessonStaffed") : d.unstaffed === 1 ? t("principal.unstaffedOne") : t("principal.unstaffedMany", { count: d.unstaffed })}
                  </Text>
                  <Text variant="xs" tone="subtle">
                    {t("timetable.coverInTheirPlace")}
                  </Text>
                </Card>
                {grid.days.map((day) => (
                  <DayCard key={day.weekday} day={day} grid={grid} />
                ))}
              </>
            )}
          </>
        )
      ) : null}
    </Screen>
  );
}

function DayCard({ day, grid }: { day: Grid["days"][number]; grid: Grid }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const rows = grid.periods.map((period) => ({ period, entries: grid.slots.filter((slot) => slot.weekday === day.weekday && slot.periodId === period.id) }));
  const hasLessons = rows.some((row) => row.entries.length > 0);
  const onThisDay = hasLessons ? rows.filter((row) => row.entries.length > 0 || row.period.kind === "BREAK") : [];
  const heading = [day.dateKey ? formatDateKey(day.dateKey, locale) + (day.isToday ? t("timetable.today") : "") : null, day.closed ? (day.closedName ?? t("timetable.schoolShut")) : null].filter(Boolean).join(" · ");
  return (
    <Card title={weekdayName(day.weekday, locale)}>
      {heading ? (
        <Text variant="xs" bold={day.isToday} tone={day.isToday ? "accent" : "muted"}>
          {heading}
        </Text>
      ) : null}
      {onThisDay.length === 0 ? (
        <Text variant="sm" tone="muted">
          {day.closed ? t("timetable.schoolIsShut") : t("timetable.nothingOnThisDay")}
        </Text>
      ) : (
        onThisDay.map(({ period, entries }) => (
          <View key={period.id} style={{ flexDirection: "row", gap: th.space[3], padding: th.space[2], borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted }}>
            <View style={{ width: 88 }}>
              <Text variant="sm" bold>
                {period.name}
              </Text>
              <Text variant="xs" tone="muted">
                {formatTimeRange(period.startMinute, period.endMinute)}
              </Text>
            </View>
            <View style={{ flex: 1, gap: th.space[2] }}>
              {period.kind === "BREAK" ? (
                <Text variant="sm" tone="muted">
                  {period.name}
                </Text>
              ) : entries.length === 0 ? (
                <Text variant="sm" tone="muted">
                  {t("timetable.free")}
                </Text>
              ) : (
                entries.map((slot) => <SlotBody key={slot.id} slot={slot} />)
              )}
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

/** What a lesson says — the web's SlotBody with the teacher shown, in whole sentences about cover. */
function SlotBody({ slot }: { slot: Slot }) {
  const t = useT();
  return (
    <View>
      <Text variant="sm" bold>
        {slot.subject}
      </Text>
      {slot.teacherName && !slot.coveringName && !slot.uncovered ? (
        <Text variant="xs" tone="muted">
          {slot.teacherName}
        </Text>
      ) : null}
      {slot.coveringName ? (
        <Text variant="xs" bold tone="accent">
          {`${t("timetable.someoneCovering", { name: slot.coveringName })}${slot.teacherName ? t("timetable.forSomeone", { name: slot.teacherName }) : ""}`}
        </Text>
      ) : null}
      {slot.uncovered ? (
        <Text variant="xs" bold tone="danger">
          {`${slot.teacherName ? t("timetable.someoneAway", { name: slot.teacherName }) : t("timetable.teacherAway")} ${t("timetable.noCoverArranged")}`}
        </Text>
      ) : null}
      {!slot.teacherName && !slot.coveringName ? (
        <Text variant="xs" tone="muted">
          {t("timetable.noTeacherYet2")}
        </Text>
      ) : null}
      {slot.room ? (
        <Text variant="xs" tone="muted">
          {slot.room}
        </Text>
      ) : null}
    </View>
  );
}
