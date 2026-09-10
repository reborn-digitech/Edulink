import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { attendanceHistorySchema, officeCsvExportSchema, type AttendanceHistoryResponse } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { shareCsv } from "./attendance";
import { Chips, formatDateKey, pct, shiftMonth, thisMonthKey } from "./shared";

type History = NonNullable<AttendanceHistoryResponse["history"]>;

function historyQuery(classId: string | null, month: string | null): string {
  const p = new URLSearchParams();
  if (classId) p.set("classId", classId);
  if (month) p.set("month", month);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Past registers, on screen — the web's /attendance/history: one class, one
 * month at a time, the days and then each pupil's month. The office and the
 * head read any class of the school's; a blank is "not marked", never an
 * absence. The office's CSV of the month goes to the share sheet.
 */
export function AttendanceHistory({ initialClassId = null }: { initialClassId?: string | null }) {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [classId, setClassId] = useState<string | null>(initialClassId);
  const [month, setMonth] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["admin", "attendance", "history", classId, month],
    placeholderData: keepPreviousData,
    queryFn: async () => attendanceHistorySchema.parse(unwrap(await api().get(`/api/v1/admin/attendance/history${historyQuery(classId, month)}`))),
  });
  const d = query.data;
  const h = d?.history ?? null;
  const shown = d?.month ?? month ?? thisMonthKey();
  const monthLabel = formatDateKey(`${shown}-01`, locale, { month: "long", year: "numeric" });
  const canGoForward = shiftMonth(shown, 1) <= thisMonthKey();
  const className = (k: { name: string; archived: boolean }) => (k.archived ? t("attendanceHistory.archivedName", { name: k.name }) : k.name);
  return (
    <Screen title={t("attendanceHistory.title")} description={t("attendanceHistory.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.classes.length === 0 ? (
          <Empty title={t("attendanceHistory.noClasses")} body={t("attendanceHistory.noClassesBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
        ) : (
          <>
            <Chips label={t("attendanceHistory.fieldClass")} value={h?.class.id ?? classId ?? ""} options={d.classes.map((k) => ({ value: k.id, label: className(k) }))} onChange={setClassId} />
            <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap", alignItems: "center" }}>
              <Button variant="secondary" label={t("attendanceHistory.previousMonth")} onPress={() => setMonth(shiftMonth(shown, -1))} />
              <Text variant="sm" bold style={{ flex: 1, textAlign: "center" }}>
                {monthLabel}
              </Text>
              <Button variant="secondary" label={t("attendanceHistory.nextMonth")} disabled={!canGoForward} onPress={() => setMonth(shiftMonth(shown, 1))} />
            </View>
            {h === null ? (
              <Card title={t("attendanceHistory.chooseClass")}>
                {d.classes.map((k) => (
                  <Row key={k.id} title={className(k)} onPress={() => setClassId(k.id)} />
                ))}
              </Card>
            ) : h.days.length === 0 ? (
              <Empty title={t("attendanceHistory.nothingTaken", { className: h.class.name, month: monthLabel })} action={<Button label={t("attendanceHistory.previousMonth")} variant="secondary" onPress={() => setMonth(shiftMonth(shown, -1))} />} />
            ) : (
              <Month history={h} monthLabel={monthLabel} exportMonth={role === "ADMIN" ? shown : null} />
            )}
          </>
        )
      ) : null}
    </Screen>
  );
}

function Month({ history, monthLabel, exportMonth }: { history: History; monthLabel: string; exportMonth: string | null }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const { locale } = useLocale();
  const exportCsv = useMutation({
    mutationFn: async (month: string) => officeCsvExportSchema.parse(unwrap(await api().get(`/api/v1/office/attendance/export/register?classId=${encodeURIComponent(history.class.id)}&month=${month}`))),
    onSuccess: shareCsv,
    onError: (e) => toast.show(e.message, "danger"),
  });
  const totals = history.days.reduce((acc, day) => ({ present: acc.present + day.present, late: acc.late + day.late, absent: acc.absent + day.absent, excused: acc.excused + day.excused }), { present: 0, late: 0, absent: 0, excused: 0 });
  const counts = (row: { present: number; late: number; absent: number; excused: number }) =>
    [`${t("attendance.presentShort")} ${row.present}`, `${t("attendance.lateShort")} ${row.late}`, `${t("attendance.absentShort")} ${row.absent}`, `${t("attendance.excusedShort")} ${row.excused}`].join(" · ");
  const rateTone = (percent: number | null): "subtle" | "danger" | "warn" | "fg" => (percent === null ? "subtle" : percent < 75 ? "danger" : percent < 90 ? "warn" : "fg");
  return (
    <>
      <Text variant="lg" bold accessibilityRole="header">
        {[history.class.name, monthLabel].join(" · ")}
      </Text>
      <Text variant="sm" tone="muted">
        {[history.days.length === 1 ? t("attendanceHistory.registersTakenOne") : t("attendanceHistory.registersTaken", { count: history.days.length }), t("attendanceHistory.monthRate", { percent: history.percent ?? 0 })].join(" · ")}
      </Text>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("attendanceHistory.rate")} value={pct(history.percent)} tone={history.percent !== null && history.percent < 75 ? "danger" : "fg"} />
        <Stat label={t("attendance.present")} value={totals.present} tone="ok" />
        <Stat label={t("attendance.late")} value={totals.late} tone="warn" />
        <Stat label={t("attendance.absent")} value={totals.absent} tone={totals.absent > 0 ? "danger" : "fg"} />
        <Stat label={t("attendance.excused")} value={totals.excused} />
      </View>
      <Card title={t("attendanceHistory.dayTotals")}>
        {history.days.map((day) => (
          <Row key={day.dateKey} title={formatDateKey(day.dateKey, locale, { weekday: "short", day: "numeric", month: "short" })} caption={counts(day)} right={<Text variant="base" bold>{pct(day.percent)}</Text>} />
        ))}
      </Card>
      <Card title={t("attendanceHistory.pupil")}>
        {history.pupils.map((pupil) => (
          <Row
            key={pupil.membershipId}
            title={pupil.name}
            caption={counts(pupil)}
            right={
              <Text variant="base" bold tone={rateTone(pupil.percent)}>
                {pct(pupil.percent)}
              </Text>
            }
          />
        ))}
        <Text variant="xs" tone="subtle">
          {t("attendanceHistory.legend")}
        </Text>
        {exportMonth ? <Button label={t("attendanceHistory.exportCsv")} variant="secondary" busy={exportCsv.isPending} onPress={() => exportCsv.mutate(exportMonth)} /> : null}
      </Card>
    </>
  );
}
