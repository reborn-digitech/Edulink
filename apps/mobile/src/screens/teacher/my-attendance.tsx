import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { myStaffAttendanceSchema, staffCheckInSchema, type StaffAttendanceStatus } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Pill } from "../family/shared";
import { formatDateKey } from "../staff/shared";
import { clock } from "./support";

/**
 * My own attendance — the web's /staff/attendance/me for every member of
 * staff: "I'm in" while the day still allows it, today's line once it does
 * not, the month's figures, and every day of the month with how it was
 * recorded. The check-in is one tap and one POST; the server decides
 * present or late from the school's clock, not the phone's.
 */
export const MY_PATH = "/api/v1/staff/attendance/me";
export const CHECK_IN_PATH = "/api/v1/staff/attendance/check-in";
export const MY_KEY = ["staff", "my-attendance"] as const;

export const STATUS_KEY: Record<StaffAttendanceStatus, TranslationKey> = {
  PRESENT: "attendance.present",
  LATE: "attendance.late",
  HALF_DAY: "staffAttendance.halfDay",
  ABSENT: "attendance.absent",
  ON_LEAVE: "staffAttendance.onLeave",
};
const STATUS_TONE: Record<StaffAttendanceStatus, "ok" | "warn" | "danger" | "accent" | "muted"> = { PRESENT: "ok", LATE: "warn", HALF_DAY: "warn", ABSENT: "danger", ON_LEAVE: "accent" };
const SOURCE_KEY = { OFFICE: "staffAttendance.sourceOffice", SELF: "staffAttendance.sourceSelf", LEAVE: "staffAttendance.sourceLeave" } as const;

/** "09:04" from an instant, in the reader's language. */
export function timeOf(iso: string, locale: string): string {
  return formatInstant(iso, locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** The one POST behind "I'm in", with the toast the server's answer earns and the screens that must reread. */
export function useCheckIn() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { checkInMinute: number; lateGraceMinutes: number }) => ({ ...staffCheckInSchema.parse(unwrap(await api().post(CHECK_IN_PATH))), lateAfter: input.checkInMinute + input.lateGraceMinutes }),
    onSuccess: (r) => {
      toast.show(r.late ? t("staffAttendance.checkInLateDone", { time: clock(r.lateAfter) }) : t("staffAttendance.checkInDone"), r.late ? "info" : "ok");
      void qc.invalidateQueries({ queryKey: MY_KEY });
      void qc.invalidateQueries({ queryKey: ["staff", "today"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
}

/** Today's sentence once the button is gone: on leave, checked in at a time, recorded some other way, or a closed day. */
export function todayLine(t: (key: TranslationKey, vars?: Record<string, string | number>) => string, locale: string, d: { today: string; todayStatus: StaffAttendanceStatus | null; days: { dateKey: string; checkedInAt: string | null; closed: boolean }[] }): string | null {
  const today = d.days.find((day) => day.dateKey === d.today);
  if (d.todayStatus === "ON_LEAVE") return t("staffAttendance.onLeave");
  if (today?.checkedInAt) return d.todayStatus === "LATE" ? t("staffAttendance.checkedInLate", { time: timeOf(today.checkedInAt, locale) }) : t("staffAttendance.checkedInAt", { time: timeOf(today.checkedInAt, locale) });
  if (d.todayStatus) return t("staffAttendance.alreadyToday");
  if (today?.closed) return t("staffAttendance.refuseClosed");
  return null;
}

export function MyAttendance() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [month, setMonth] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...MY_KEY, month ?? "this"],
    placeholderData: keepPreviousData,
    queryFn: async () => myStaffAttendanceSchema.parse(unwrap(await api().get(`${MY_PATH}${month ? `?month=${month}` : ""}`))),
  });
  const checkIn = useCheckIn();
  const d = query.data;
  const line = d ? todayLine(t, locale, d) : null;
  return (
    <Screen title={t("staffAttendance.myTitle")} description={t("staffAttendance.myIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("staffAttendance.today")}>
            {d.canCheckIn ? (
              <Button label={t("staffAttendance.checkIn")} busy={checkIn.isPending} onPress={() => checkIn.mutate({ checkInMinute: d.checkInMinute, lateGraceMinutes: d.lateGraceMinutes })} />
            ) : line ? (
              <Text variant="base" bold tone={d.todayStatus === "LATE" ? "warn" : d.todayStatus === "ON_LEAVE" ? "accent" : "ok"} accessibilityLiveRegion="polite">
                {line}
              </Text>
            ) : null}
            <Text variant="xs" tone="subtle">
              {`${t("staffAttendance.dayStart")} ${clock(d.checkInMinute)} · ${t("staffAttendance.lateAfter", { time: clock(d.checkInMinute + d.lateGraceMinutes) })}`}
            </Text>
          </Card>

          <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
            <Button label={t("staffAttendance.previousMonth")} variant="secondary" onPress={() => setMonth(d.previousMonth)} />
            <Text variant="base" bold style={{ flex: 1, textAlign: "center" }}>
              {formatDateKey(`${d.month}-01`, locale, { month: "long", year: "numeric" })}
            </Text>
            <Button label={t("staffAttendance.nextMonth")} variant="secondary" disabled={d.nextMonth === null} onPress={() => setMonth(d.nextMonth)} />
          </View>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("staffAttendance.columnPresent")} value={d.summary.present} tone="ok" />
            <Stat label={t("staffAttendance.columnLate")} value={d.summary.late} tone={d.summary.late > 0 ? "warn" : "fg"} />
            <Stat label={t("staffAttendance.columnAbsent")} value={d.summary.absent} tone={d.summary.absent > 0 ? "danger" : "fg"} />
            <Stat label={t("staffAttendance.columnLeave")} value={d.summary.onLeave} />
            <Stat label={t("staffAttendance.columnPercent")} value={d.summary.percent === null ? "—" : `${Math.round(d.summary.percent)}%`} />
          </View>
          <Text variant="xs" tone="subtle">
            {t("staffAttendance.workingDays", { count: d.summary.workingDays })}
          </Text>

          {d.days.length === 0 ? (
            <Empty icon="checks" title={t("staffAttendance.nothingThisMonth")} action={<Button label={t("staffAttendance.today")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
          ) : (
            <Card>
              {d.days.map((day) => {
                const caption = day.closed
                  ? t("calendar.closed")
                  : day.source
                    ? `${t("staffAttendance.source")} ${t(SOURCE_KEY[day.source])}${day.checkedInAt ? ` · ${timeOf(day.checkedInAt, locale)}` : ""}${day.note ? ` · ${day.note}` : ""}`
                    : t("staffAttendance.unmarked");
                return (
                  <View key={day.dateKey} style={{ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border, opacity: day.closed ? 0.55 : 1 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="base" bold={day.dateKey === d.today}>
                        {formatDateKey(day.dateKey, locale, { weekday: "short", day: "numeric", month: "short" })}
                      </Text>
                      <Text variant="xs" tone="muted">
                        {caption}
                      </Text>
                    </View>
                    {day.status ? <Pill label={t(STATUS_KEY[day.status])} tone={STATUS_TONE[day.status]} /> : null}
                  </View>
                );
              })}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}
