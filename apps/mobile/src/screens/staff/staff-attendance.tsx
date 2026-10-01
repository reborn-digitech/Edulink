import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { okSchema, staffMonthSchema, staffRegisterMarkedSchema, staffRegisterSchema, type StaffAttendanceStatus } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note, Tabs } from "../family/shared";
import { timeOf } from "../teacher/my-attendance";
import { clock } from "../teacher/support";
import { addDaysToKey, formatDateKey, parseClock, pct, roleLabel } from "./shared";

/**
 * The staff register — the web's /admin/staff-attendance for the office and
 * the head. A day at a time: who was in, marked here at the desk or by the
 * person's own check-in, with an approved leave showing itself; the month
 * per person as a second segment; and, folded away, when the staff day
 * starts and how many minutes of grace a check-in gets before it is late.
 * Saving sends only the rows changed on this screen — a person left alone
 * is left as they were, which is the server's rule too.
 */
const PATH = "/api/v1/office/staff-attendance";
const STATUSES: StaffAttendanceStatus[] = ["PRESENT", "LATE", "HALF_DAY", "ABSENT", "ON_LEAVE"];
const STATUS_KEY: Record<StaffAttendanceStatus, TranslationKey> = {
  PRESENT: "attendance.present",
  LATE: "attendance.late",
  HALF_DAY: "staffAttendance.halfDay",
  ABSENT: "attendance.absent",
  ON_LEAVE: "staffAttendance.onLeave",
};
const SOURCE_KEY = { OFFICE: "staffAttendance.sourceOffice", SELF: "staffAttendance.sourceSelf", LEAVE: "staffAttendance.sourceLeave" } as const;

type StaffRegister = z.infer<typeof staffRegisterSchema>;
type Segment = "day" | "month";
type Local = Record<string, { status: StaffAttendanceStatus; note?: string }>;

export function StaffAttendance() {
  const t = useT();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("day");
  const [date, setDate] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  return (
    <Screen title={t("staffAttendance.title")}>
      <Text variant="sm" tone="muted">
        {t("staffAttendance.intro")}
      </Text>
      <Tabs<Segment>
        label={t("staffAttendance.title")}
        current={segment}
        onChange={setSegment}
        tabs={[
          { key: "day", label: t("staffAttendance.register") },
          { key: "month", label: t("staffAttendance.month") },
        ]}
      />
      {segment === "day" ? <DayRegister date={date} onDate={setDate} onStaff={() => router.push("/(app)/staff" as never)} /> : <MonthView month={month} onMonth={setMonth} onStaff={() => router.push("/(app)/staff" as never)} />}
    </Screen>
  );
}

function DayRegister({ date, onDate, onStaff }: { date: string | null; onDate: (next: string | null) => void; onStaff: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["staff", "staff-attendance", "day", date ?? "today"],
    placeholderData: keepPreviousData,
    queryFn: async () => staffRegisterSchema.parse(unwrap(await api().get(`${PATH}${date ? `?date=${date}` : ""}`))),
  });
  const d = query.data;
  const dateKey = d?.dateKey;
  // What was tapped, kept with the day it was tapped for: a fresh day is a fresh slate, so Monday's taps are never carried to Tuesday.
  const [tapped, setTapped] = useState<{ dateKey: string; marks: Local }>({ dateKey: "", marks: {} });
  const local: Local = tapped.dateKey === dateKey ? tapped.marks : {};
  const setLocal = (update: (prev: Local) => Local) => setTapped((prev) => ({ dateKey: dateKey ?? "", marks: update(prev.dateKey === dateKey ? prev.marks : {}) }));

  const save = useMutation({
    mutationFn: async (input: { date: string; entries: { membershipId: string; status: StaffAttendanceStatus; note?: string }[] }) => staffRegisterMarkedSchema.parse(unwrap(await api().post(PATH, input))),
    onSuccess: () => {
      toast.show(t("staffAttendance.saved"), "ok");
      setLocal(() => ({}));
      void qc.invalidateQueries({ queryKey: ["staff", "staff-attendance"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });

  const statusOf = (row: StaffRegister["rows"][number]) => local[row.membershipId]?.status ?? row.status;
  const unmarked = d ? d.rows.filter((row) => !statusOf(row)) : [];
  const dirty = Object.entries(local);
  const markEveryonePresent = () => {
    const next: Local = {};
    for (const row of unmarked) next[row.membershipId] = { status: "PRESENT", note: row.note ?? undefined };
    setLocal((prev) => ({ ...prev, ...next }));
  };
  const submit = () => {
    if (!d || dirty.length === 0) return;
    save.mutate({ date: d.dateKey, entries: dirty.map(([membershipId, m]) => ({ membershipId, status: m.status, ...(m.note ? { note: m.note } : {}) })) });
  };
  const canGoForward = d ? d.dateKey < d.today : false;

  return (
    <>
      {d ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("staffAttendance.previousDay")} variant="secondary" onPress={() => onDate(addDaysToKey(d.dateKey, -1))} />
          <Text variant="base" bold style={{ flex: 1, textAlign: "center" }} accessibilityLabel={`${t("staffAttendance.date")}: ${formatDateKey(d.dateKey, locale, { weekday: "short", day: "numeric", month: "short" })}`}>
            {formatDateKey(d.dateKey, locale, { weekday: "short", day: "numeric", month: "short" })}
          </Text>
          <Button label={t("staffAttendance.nextDay")} variant="secondary" disabled={!canGoForward} onPress={() => onDate(addDaysToKey(d.dateKey, 1))} />
          {d.dateKey !== d.today ? <Button label={t("staffAttendance.today")} variant="ghost" onPress={() => onDate(null)} /> : null}
        </View>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {/* On its soft box, as the family screens put a warning: the warn ink
              straight on the light frame's tinted canvas measured under 4.5:1
              (CI run 36924208500, on Gandhi Jayanti, the first closed day the
              gate had seen). */}
          {d.closed ? (
            <Note tone="warn">
              <Text variant="sm" tone="warn">
                {t("staffAttendance.closedDay", { name: d.closedName ?? t("staffAttendance.sunday") })}
              </Text>
            </Note>
          ) : null}
          <Text variant="sm" bold accessibilityLiveRegion="polite">
            {t("staffAttendance.counts", { present: d.counts.present, late: d.counts.late, absent: d.counts.absent, onLeave: d.counts.onLeave })}
            {d.counts.unmarked > 0 ? ` · ${d.counts.unmarked} ${t("staffAttendance.unmarked").toLowerCase()}` : ""}
          </Text>
          {unmarked.length > 0 ? <Button label={t("staffAttendance.everyonePresent")} variant="secondary" onPress={markEveryonePresent} /> : null}
          {d.rows.length === 0 ? (
            <Empty icon="users" title={t("staffAttendance.nobody")} body={t("staffAttendance.nobodyBody")} action={<Button label={t("nav.staff")} variant="secondary" onPress={onStaff} />} />
          ) : (
            <Card>
              {d.rows.map((row) => {
                const current = statusOf(row);
                const changed = Boolean(local[row.membershipId]);
                const source = !changed && row.source ? `${t("staffAttendance.source")} ${t(SOURCE_KEY[row.source])}${row.checkedInAt ? ` · ${timeOf(row.checkedInAt, locale)}` : ""}` : null;
                return (
                  <View key={row.membershipId} style={{ gap: th.space[2], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
                    <Text variant="base" bold>
                      {row.name}
                    </Text>
                    <Text variant="xs" tone="muted">
                      {[roleLabel(t, row.role), source ?? (current ? null : t("staffAttendance.unmarked"))].filter(Boolean).join(" · ")}
                    </Text>
                    {row.onLeave ? (
                      <Text variant="xs" tone="accent">
                        {t("staffAttendance.onLeaveHint")}
                      </Text>
                    ) : null}
                    {row.note ? (
                      <Text variant="xs" tone="muted">
                        {t("staffAttendance.note")}: {row.note}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                      {STATUSES.map((s) => (
                        <StatusChip key={s} status={s} selected={current === s} name={row.name} label={t(STATUS_KEY[s])} onPress={() => setLocal((prev) => ({ ...prev, [row.membershipId]: { status: s, note: row.note ?? undefined } }))} />
                      ))}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
          <Button label={t("staffAttendance.save")} busy={save.isPending} disabled={dirty.length === 0} onPress={submit} />
          <Settings checkInMinute={d.checkInMinute} lateGraceMinutes={d.lateGraceMinutes} />
        </>
      ) : null}
    </>
  );
}

function StatusChip({ status, selected, name, label, onPress }: { status: StaffAttendanceStatus; selected: boolean; name: string; label: string; onPress: () => void }) {
  const th = useTheme();
  const colour = {
    PRESENT: [th.attPresent, th.attPresentSoft],
    LATE: [th.attLate, th.attLateSoft],
    HALF_DAY: [th.attExcused, th.attExcusedSoft],
    ABSENT: [th.attAbsent, th.attAbsentSoft],
    ON_LEAVE: [th.accentStrong, th.accentSoft],
  }[status] as [string, string];
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={`${label}: ${name}`}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: th.tap, paddingHorizontal: th.space[3], alignItems: "center", justifyContent: "center", borderRadius: th.radius.md, borderWidth: 2, borderColor: selected ? colour[0] : th.border, backgroundColor: selected ? colour[1] : th.surface, opacity: pressed ? 0.8 : 1 })}
    >
      <Text variant="sm" bold style={{ color: selected ? colour[0] : th.fgMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** When the staff day starts and the grace before a check-in is late, folded away behind one button. */
function Settings({ checkInMinute, lateGraceMinutes }: { checkInMinute: number; lateGraceMinutes: number }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(clock(checkInMinute));
  const [grace, setGrace] = useState(String(lateGraceMinutes));
  const startMinute = parseClock(start);
  const graceMinutes = /^\d{1,3}$/.test(grace.trim()) ? Number(grace.trim()) : null;
  const graceError = graceMinutes === null ? t("refusal.notValid") : graceMinutes > 180 ? t("refusal.numberAtMost", { max: 180 }) : null;
  const save = useMutation({
    mutationFn: async (input: { checkInMinute: number; lateGraceMinutes: number }) => okSchema.parse(unwrap(await api().post(`${PATH}/settings`, input))),
    onSuccess: () => {
      toast.show(t("staffAttendance.settingsSaved"), "ok");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["staff", "staff-attendance"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const summary = `${t("staffAttendance.dayStart")} ${clock(checkInMinute)} · ${t("staffAttendance.grace")} ${t("staffAttendance.graceMinutes", { count: lateGraceMinutes })} · ${t("staffAttendance.lateAfter", { time: clock(checkInMinute + lateGraceMinutes) })}`;
  return (
    <Card>
      <Text variant="xs" tone="subtle">
        {summary}
      </Text>
      {open ? (
        <View style={{ gap: th.space[3] }}>
          <Field label={t("staffAttendance.dayStart")} value={start} onChangeText={setStart} error={startMinute === null ? t("refusal.useHHMM") : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" />
          <Field label={t("staffAttendance.grace")} value={grace} onChangeText={setGrace} error={graceError} hint={startMinute !== null && graceMinutes !== null ? t("staffAttendance.lateAfter", { time: clock(startMinute + graceMinutes) }) : undefined} keyboardType="number-pad" />
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("common.save")} busy={save.isPending} disabled={startMinute === null || graceMinutes === null || Boolean(graceError)} onPress={() => save.mutate({ checkInMinute: startMinute!, lateGraceMinutes: graceMinutes! })} />
            <Button label={t("common.cancel")} variant="secondary" disabled={save.isPending} onPress={() => setOpen(false)} />
          </View>
        </View>
      ) : (
        <Button label={t("staffAttendance.changeSettings")} variant="secondary" onPress={() => setOpen(true)} />
      )}
    </Card>
  );
}

function MonthView({ month, onMonth, onStaff }: { month: string | null; onMonth: (next: string | null) => void; onStaff: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["staff", "staff-attendance", "month", month ?? "this"],
    placeholderData: keepPreviousData,
    queryFn: async () => staffMonthSchema.parse(unwrap(await api().get(`${PATH}/month${month ? `?month=${month}` : ""}`))),
  });
  const d = query.data;
  return (
    <>
      {d ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("staffAttendance.previousMonth")} variant="secondary" onPress={() => onMonth(d.previousMonth)} />
          <Text variant="base" bold style={{ flex: 1, textAlign: "center" }}>
            {formatDateKey(`${d.month}-01`, locale, { month: "long", year: "numeric" })}
          </Text>
          <Button label={t("staffAttendance.nextMonth")} variant="secondary" disabled={d.nextMonth === null} onPress={() => onMonth(d.nextMonth)} />
        </View>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <Card title={t("staffAttendance.monthTitle")}>
          <Text variant="xs" tone="subtle">
            {t("staffAttendance.workingDays", { count: d.workingDays })}
          </Text>
          {d.rows.length === 0 ? (
            <Empty icon="users" title={t("staffAttendance.nobody")} body={t("staffAttendance.nobodyBody")} action={<Button label={t("nav.staff")} variant="secondary" onPress={onStaff} />} />
          ) : (
            d.rows.map((row) => (
              <Row
                key={row.membershipId}
                title={row.name}
                caption={`${roleLabel(t, row.role)} · ${t("attendance.presentShort")} ${row.present} · ${t("attendance.lateShort")} ${row.late} · ${t("attendance.absentShort")} ${row.absent} · ${t("staffAttendance.columnLeave")} ${row.onLeave}`}
                right={
                  <Text variant="base" bold tone={row.percent === null ? "subtle" : row.percent < 75 ? "danger" : "fg"}>
                    {pct(row.percent)}
                  </Text>
                }
              />
            ))
          )}
        </Card>
      ) : null}
    </>
  );
}
