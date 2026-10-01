import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { familyParentAttendanceSchema, familyStudentOverviewSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole, useSession } from "@/lib/session";
import { ATTENDANCE, ChildLeftBanner, ChildSwitcher, childQuery, formatDateKey, Note, param, StatusBadge } from "./shared";
import { AbsenceNotes } from "./absence-notes";

/**
 * Attendance for the family. A guardian reads one month of one child's
 * register — the web's /parent/attendance, any month up to this one. A pupil
 * has no childId and no month endpoint of their own; they read the last four
 * weeks from their own overview, which is what their Today page shows too.
 */
export function FamilyAttendance() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const role = useRole();
  const t = useT();
  if (role === "STUDENT") return <PupilAttendance />;
  if (role === "PARENT") return <ChildAttendance />;
  return (
    <Screen title={t("nav.attendance")}>
      <Loading />
    </Screen>
  );
}

function ChildAttendance() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [month, setMonth] = useState<string | null>(param(params.month) ?? null);
  const query = useQuery({
    queryKey: ["family", "attendance", childId, month],
    queryFn: async () => familyParentAttendanceSchema.parse(unwrap(await api().get(`/api/v1/family/attendance${childQuery(childId, { month })}`))),
  });
  const d = query.data;
  const name = d?.child.name ?? "";
  const monthLabel = d ? formatDateKey(`${d.month}-01`, locale, { month: "long", year: "numeric" }) : "";
  const days = d ? [...d.days].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)) : [];
  const summary = d?.summary;
  return (
    <Screen
      title={d ? t("parent.childsAttendance", { name }) : t("nav.attendance")}
      description={d ? `${d.child.schoolName} · ${monthLabel}` : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {d ? <ChildSwitcher pupils={d.children} selectedId={d.child.studentMembershipId} onSelect={setChildId} /> : null}
      {d?.child.leftAt ? <ChildLeftBanner name={name} leftAt={d.child.leftAt} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && summary ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            <Button variant="secondary" label={t("parent.previousMonth")} onPress={() => setMonth(d.previousMonth)} />
            <Button variant="secondary" label={t("parent.nextMonth")} disabled={!d.nextMonth} onPress={() => setMonth(d.nextMonth)} />
            {d.month !== d.thisMonth ? <Button variant="ghost" label={t("parent.thisMonth")} onPress={() => setMonth(null)} /> : null}
          </View>

          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("parent.overall")} value={summary.percent === null ? "—" : `${summary.percent}%`} tone={summary.percent === null ? "fg" : summary.percent >= 95 ? "ok" : summary.percent >= 90 ? "warn" : "danger"} />
            {(["LATE", "ABSENT", "EXCUSED"] as const).map((status) => (
              <Stat key={status} label={t(ATTENDANCE[status].label)} value={summary.counts[status]} tone={summary.counts[status] === 0 ? "fg" : status === "ABSENT" ? "danger" : status === "LATE" ? "warn" : "fg"} />
            ))}
          </View>
          <Text variant="xs" tone="muted">
            {summary.total === 0 ? t("parent.noRecords") : t("parent.thereOfDays", { there: summary.counts.PRESENT + summary.counts.LATE, total: summary.total })}
          </Text>

          <Card title={t("parent.dayByDay")}>
            <Text variant="sm" tone="muted">
              {summary.total === 0 ? t("parent.nothingRecordedYet") : summary.total === 1 ? t("parent.daysRecordedOne") : t("parent.daysRecordedMany", { count: summary.total })}
            </Text>
            {days.length === 0 ? (
              <Empty title={t("parent.noAttendanceYet")} body={t("parent.nothingInMonth", { name, month: monthLabel })} action={<Button label={t("parent.previousMonth")} variant="secondary" onPress={() => setMonth(d.previousMonth)} />} />
            ) : (
              days.map((day) => (
                <Row
                  key={day.dateKey}
                  title={formatDateKey(day.dateKey, locale, { weekday: "long", day: "numeric", month: "long" })}
                  caption={day.note ? `“${day.note}”` : !day.teachingDay ? t("parent.sundaySession") : undefined}
                  right={<StatusBadge status={day.status} />}
                />
              ))
            )}
          </Card>

          {/* The days away the family has told the school about, for a child still at the school. */}
          {d.child.leftAt ? null : <AbsenceNotes studentMembershipId={d.child.studentMembershipId} />}

          {summary.percent !== null && summary.percent < 90 ? (
            <Note tone="warn">
              <Text variant="sm" tone="warn">
                {t("parent.below90Body", { name })}
              </Text>
              <Button variant="ghost" label={t("parent.messagesPageLink")} onPress={() => router.push("/(app)/messages" as never)} />
            </Note>
          ) : null}
          <Text variant="xs" tone="subtle">
            {t("parent.changesAppearImmediately")}
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

function PupilAttendance() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const session = useSession();
  const membershipId = session.status === "signed-in" ? session.me.active.membershipId : null;
  const query = useQuery({
    queryKey: ["family", "student", "overview"],
    queryFn: async () => familyStudentOverviewSchema.parse(unwrap(await api().get("/api/v1/family/student/overview"))),
  });
  const d = query.data;
  const days = d ? [...d.attendance.recent].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)) : [];
  return (
    <Screen title={t("nav.attendance")} description={d ? t("student.lastFourWeeks") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat
              label={t("student.today")}
              value={d.todayStatus ? t(ATTENDANCE[d.todayStatus].label) : t("student.notYet")}
              tone={!d.todayStatus ? "fg" : d.todayStatus === "PRESENT" ? "ok" : d.todayStatus === "LATE" ? "warn" : "danger"}
            />
            <Stat label={t("student.streak")} value={d.streak} tone={d.streak >= 5 ? "ok" : "fg"} />
            <Stat label={t("student.attendance")} value={d.attendance.percent === null ? "—" : `${d.attendance.percent}%`} tone={d.attendance.percent !== null && d.attendance.percent >= 95 ? "ok" : "fg"} />
          </View>
          <Card title={t("parent.dayByDay")}>
            {days.length === 0 ? (
              <Empty title={t("parent.noAttendanceYet")} body={t("student.registerNotTakenYet")} action={<Button label={t("teacher.openTimetable")} variant="secondary" onPress={() => router.push("/(app)/timetable" as never)} />} />
            ) : (
              days.map((day) => (
                <Row key={day.dateKey} title={formatDateKey(day.dateKey, locale, { weekday: "long", day: "numeric", month: "long" })} caption={day.note ? `“${day.note}”` : undefined} right={<StatusBadge status={day.status} />} />
              ))
            )}
          </Card>
          {/* The pupil tells the school themselves. */}
          {membershipId ? <AbsenceNotes studentMembershipId={membershipId} self /> : null}
        </>
      ) : null}
    </Screen>
  );
}
