import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { familyTimetableSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { ChildLeftBanner, ChildSwitcher, childQuery, formatDateKey, formatTimeRange, param, weekdayName } from "./shared";

type Grid = z.infer<typeof familyTimetableSchema>["grid"];
type Slot = Grid["slots"][number];

/**
 * The week — dated, always: the pupil's own (the web's /timetable) or a
 * guardian's child's (/parent/timetable), one section per day the way the
 * web lays it out on a phone. Who is away and who is covering is said in
 * whole sentences, never a name quietly swapped.
 */
export function FamilyTimetable() {
  const role = useRole();
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [week, setWeek] = useState<string | null>(param(params.week) ?? null);
  const isParent = role === "PARENT";
  const query = useQuery({
    queryKey: ["family", "timetable", role, isParent ? childId : null, week],
    queryFn: async () => familyTimetableSchema.parse(unwrap(await api().get(`/api/v1/family/timetable${childQuery(isParent ? childId : null, { week })}`))),
    enabled: role !== null,
  });
  const d = query.data;
  const name = d?.child?.name ?? "";
  const weekOf = d ? formatDateKey(d.weekOf, locale, { day: "numeric", month: "long" }) : "";
  return (
    <Screen
      title={isParent ? (d ? t("parent.childsTimetable", { name }) : t("nav.timetable")) : t("timetable.myTitle")}
      description={isParent ? d?.child?.schoolName : t("timetable.myBody")}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {isParent && d ? <ChildSwitcher pupils={d.children} selectedId={d.child?.studentMembershipId ?? childId} onSelect={setChildId} /> : null}
      {d?.child?.leftAt ? <ChildLeftBanner name={name} leftAt={d.child.leftAt} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="secondary" label={isParent ? t("parent.previousWeek") : t("principal.previous")} onPress={() => setWeek(d.previous)} />
            {!d.isThisWeek ? <Button variant="ghost" label={isParent ? t("parent.thisWeek") : t("principal.thisWeek")} onPress={() => setWeek(null)} /> : null}
            <Button variant="secondary" label={isParent ? t("parent.nextWeek") : t("principal.next")} onPress={() => setWeek(d.next)} />
          </View>
          <Text variant="sm" bold>
            {isParent ? t("parent.weekOf", { date: weekOf }) : t("principal.weekOf", { date: weekOf })}
          </Text>
        </>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.grid.periods.length === 0 ? (
          <Empty title={isParent ? t("parent.noTimetableYet") : t("timetable.noTimetableYet")} body={isParent ? t("parent.noSchoolDay", { school: d.child?.schoolName ?? "" }) : t("timetable.noTimetableYetBody")} />
        ) : d.grid.slots.length === 0 ? (
          <Empty title={isParent ? t("parent.nothingTimetabled") : t("timetable.nothingYet")} body={isParent ? t("parent.noLessonsThisWeek", { name }) : t("timetable.nothingYetBody")} />
        ) : (
          <>
            <Text variant="xs" tone="muted">
              {isParent ? t("parent.coverNote") : t("timetable.coverInTheirPlace")}
            </Text>
            {d.grid.days.map((day) => (
              <DayCard key={day.weekday} day={day} grid={d.grid} showClass={d.spansClasses} />
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}

function DayCard({ day, grid, showClass }: { day: Grid["days"][number]; grid: Grid; showClass: boolean }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const rows = grid.periods.map((period) => ({ period, entries: grid.slots.filter((slot) => slot.weekday === day.weekday && slot.periodId === period.id) }));
  // A day with no lessons shows no breaks either — it reads as a day with nothing on, not a page that failed.
  const hasLessons = rows.some((row) => row.entries.length > 0);
  const onThisDay = hasLessons ? rows.filter((row) => row.entries.length > 0 || row.period.kind === "BREAK") : [];
  const heading = [day.dateKey ? formatDateKey(day.dateKey, locale, { day: "numeric", month: "short" }) + (day.isToday ? t("timetable.today") : "") : null, day.closed ? (day.closedName ?? t("timetable.schoolShut")) : null].filter(Boolean).join(" · ");
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
                entries.map((slot) => <SlotBody key={slot.id} slot={slot} showClass={showClass} />)
              )}
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

/** What a lesson says — the web's SlotBody, with whole sentences about cover. */
function SlotBody({ slot, showClass }: { slot: Slot; showClass: boolean }) {
  const t = useT();
  return (
    <View>
      <Text variant="sm" bold>
        {slot.subject}
      </Text>
      {showClass ? (
        <Text variant="xs" tone="muted">
          {slot.className}
        </Text>
      ) : null}
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
