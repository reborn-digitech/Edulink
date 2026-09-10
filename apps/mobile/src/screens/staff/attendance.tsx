import { useState } from "react";
import { Share, View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAttendanceSchema, officeAbsenceAlertSchema, officeCsvExportSchema, type AdminAttendance as AdminAttendanceData, type OfficeCsvExport } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatDateKey, pct, shiftMonth, thisMonthKey } from "./shared";

type Window = "30" | "60" | "90";
type Sort = "percent" | "run" | "name";

/** A compliance file to the system share sheet — saved to Files, mailed, or sent on: the same bytes the web downloads. */
export function shareCsv(file: OfficeCsvExport): void {
  void Share.share({ title: file.filename, message: file.csv }).catch(() => {});
}

/**
 * The office's attendance landing — the web's /admin/attendance, read for the
 * child rather than the day: eight weeks of the whole school, the children
 * quietly slipping over the chosen window with the audited "tell the family"
 * (one tap per child, never twice in a week), the classes whose register the
 * office may take itself, and the compliance files through the share sheet.
 */
export function AdminAttendance({ onOpenRegister, onOpenHistory }: { onOpenRegister?: (classId: string) => void; onOpenHistory?: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [window, setWindow] = useState<Window>("30");
  const [sort, setSort] = useState<Sort>("percent");
  const query = useQuery({
    queryKey: ["admin", "attendance", window, sort],
    placeholderData: keepPreviousData,
    queryFn: async () => adminAttendanceSchema.parse(unwrap(await api().get(`/api/v1/admin/attendance?window=${window}&sort=${sort}`))),
  });
  const d = query.data;
  const history = onOpenHistory ?? (() => router.push({ pathname: "/(app)/attendance", params: { view: "history" } } as never));
  const latest = d ? [...d.trend].reverse().find((p) => p.percent !== null) : undefined;
  return (
    <Screen title={t("attendanceIntel.title")} description={t("attendanceIntel.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Button label={t("attendanceHistory.link")} variant="secondary" onPress={history} />
      <Chips
        label={t("attendanceIntel.windowLabel")}
        value={window}
        options={[
          { value: "30", label: t("attendanceIntel.days30") },
          { value: "60", label: t("attendanceIntel.days60") },
          { value: "90", label: t("attendanceIntel.days90") },
        ]}
        onChange={setWindow}
      />
      <Chips
        label={t("common.sortBy")}
        value={sort}
        options={[
          { value: "percent", label: t("attendanceIntel.sortLowest") },
          { value: "run", label: t("attendanceIntel.sortRun") },
          { value: "name", label: t("common.byName") },
        ]}
        onChange={setSort}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("principal.attendance")} value={pct(latest?.percent)} tone={latest?.percent !== undefined && latest.percent !== null && latest.percent < 75 ? "danger" : "fg"} />
            <Stat label={t("attendanceIntel.flagsTitle")} value={d.flags.length} tone={d.flags.length > 0 ? "warn" : "ok"} />
          </View>
          <Card title={t("attendanceIntel.trendTitle")}>
            <Text variant="xs" tone="subtle">
              {t("attendanceIntel.trendHint")}
            </Text>
            {d.trend.map((point, i) => (
              <Row
                key={`${point.label}:${i}`}
                title={point.label}
                caption={t("attendanceIntel.marksCount", { n: point.marks })}
                right={
                  <Text variant="base" bold tone={point.percent === null ? "subtle" : "fg"}>
                    {pct(point.percent)}
                  </Text>
                }
              />
            ))}
          </Card>
          <Card title={t("attendanceIntel.flagsTitle")}>
            <Text variant="xs" tone="subtle">
              {t("attendanceIntel.flagsHint")}
            </Text>
            {d.flags.length === 0 ? (
              <Empty title={t("attendanceIntel.flagsEmpty")} action={<Button label={t("attendanceHistory.link")} variant="secondary" onPress={history} />} />
            ) : (
              d.flags.map((flag) => <FlagRow key={flag.studentMembershipId} flag={flag} />)
            )}
          </Card>
          <Card title={t("principal.classes")}>
            {d.classes.length === 0 ? (
              <Empty title={t("principal.noClasses")} body={t("principal.noClassesBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
            ) : (
              d.classes.map((c) => (
                <Row key={c.id} title={c.name} caption={t("teacher.takeRegister")} right={onOpenRegister ? <Icon name="caretRight" color={th.fgSubtle} size={20} /> : null} onPress={onOpenRegister ? () => onOpenRegister(c.id) : undefined} />
              ))
            )}
          </Card>
          <Exports classes={d.classes} />
        </>
      ) : null}
    </Screen>
  );
}

/** One child worth a conversation: the chips the web shows, and "tell the family" — one audited tap, and a family told this week is not told again. */
function FlagRow({ flag }: { flag: AdminAttendanceData["flags"][number] }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const alert = useMutation({
    mutationFn: async () => officeAbsenceAlertSchema.parse(unwrap(await api().post("/api/v1/office/attendance/alert", { studentMembershipId: flag.studentMembershipId }))),
    onSuccess: (r) => {
      toast.show(r.skipped ? t("attendanceIntel.alreadyNotified") : t("attendanceIntel.notified", { n: r.notified }), r.skipped ? "info" : "ok");
      void qc.invalidateQueries({ queryKey: ["admin", "safety"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const caption = [flag.className, flag.chronic ? t("attendanceIntel.chronicChip", { percent: flag.percent }) : null, flag.consecutive ? t("attendanceIntel.runChip", { n: flag.currentRun }) : null, t("attendanceIntel.marksCount", { n: flag.marks })].filter(Boolean).join(" · ");
  const label = flag.guardianCount === 0 ? t("attendanceIntel.noGuardians") : t("attendanceIntel.notify");
  return (
    <Row
      title={flag.name}
      caption={caption}
      right={<Button label={label} variant="secondary" disabled={flag.guardianCount === 0} busy={alert.isPending} accessibilityLabel={`${label}: ${flag.name}`} onPress={() => alert.mutate()} />}
    />
  );
}

/** The two inspection-shaped files: one class's month of attendance, and the enrolment summary. Each is audited on the server. */
function Exports({ classes }: { classes: { id: string; name: string }[] }) {
  const t = useT();
  const toast = useToast();
  const { locale } = useLocale();
  const months = [0, -1, -2].map((n) => shiftMonth(thisMonthKey(), n));
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [month, setMonth] = useState(months[0]!);
  const register = useMutation({
    mutationFn: async (input: { classId: string; month: string }) => officeCsvExportSchema.parse(unwrap(await api().get(`/api/v1/office/attendance/export/register?classId=${encodeURIComponent(input.classId)}&month=${input.month}`))),
    onSuccess: shareCsv,
    onError: (e) => toast.show(e.message, "danger"),
  });
  const enrolment = useMutation({
    mutationFn: async () => officeCsvExportSchema.parse(unwrap(await api().get("/api/v1/office/attendance/export/enrolment"))),
    onSuccess: shareCsv,
    onError: (e) => toast.show(e.message, "danger"),
  });
  return (
    <Card title={t("attendanceIntel.exportsTitle")}>
      <Text variant="xs" tone="subtle">
        {t("attendanceIntel.exportsHint")}
      </Text>
      {classes.length > 0 ? (
        <>
          <Chips label={t("attendanceHistory.fieldClass")} value={classId} options={classes.map((k) => ({ value: k.id, label: k.name }))} onChange={setClassId} />
          <Chips label={t("attendanceIntel.fieldMonth")} value={month} options={months.map((m) => ({ value: m, label: formatDateKey(`${m}-01`, locale, { month: "long", year: "numeric" }) }))} onChange={setMonth} />
          <Button label={t("attendanceIntel.exportRegister")} variant="secondary" busy={register.isPending} disabled={!classId} onPress={() => register.mutate({ classId, month })} />
        </>
      ) : null}
      <Button label={t("attendanceIntel.exportEnrolment")} variant="secondary" busy={enrolment.isPending} onPress={() => enrolment.mutate()} />
    </Card>
  );
}
