import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminClassesSchema, adminStaffSchema, attendanceHistorySchema, okSchema, principalClassesSchema, type AdminClasses } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { adminClassesPath, principalClassesPath } from "./classes";
import { Chips, DEFAULT_SPAN, pct } from "./shared";

/**
 * One class, for the head or the office. There is no single-class endpoint
 * for either, so the header comes from the role's own list — the head's
 * insight over the default window, the office's staffing row — and the
 * roll from the attendance history, which both roles may read: every pupil,
 * alphabetically, with their attendance this month. Concerns are flagged,
 * never ordered. The office runs the class's settings here: who is in
 * charge of it, and archiving it, after a confirm.
 */
export function StaffClassDetail({ classId: classIdProp }: { classId?: string } = {}) {
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = classIdProp ?? (typeof params.classId === "string" ? params.classId : "");
  const role = useRole();
  const router = useRouter();
  const t = useT();
  const th = useTheme();
  const roll = useQuery({
    queryKey: ["admin", "attendance", "history", classId],
    enabled: Boolean(classId),
    queryFn: async () => attendanceHistorySchema.parse(unwrap(await api().get(`/api/v1/admin/attendance/history?classId=${encodeURIComponent(classId)}`))),
  });
  const insight = useQuery({
    queryKey: ["principal", "classes", DEFAULT_SPAN, "name", ""],
    enabled: role === "PRINCIPAL",
    queryFn: async () => principalClassesSchema.parse(unwrap(await api().get(principalClassesPath(DEFAULT_SPAN, "name", "")))),
  });
  const staffing = useQuery({
    queryKey: ["admin", "classes", ""],
    enabled: role === "ADMIN",
    queryFn: async () => adminClassesSchema.parse(unwrap(await api().get(adminClassesPath("")))),
  });
  const history = roll.data?.history ?? null;
  const mine = insight.data?.classes.find((c) => c.classId === classId) ?? null;
  const office = staffing.data?.classes.find((c) => c.id === classId) ?? null;
  const name = history?.class.name ?? mine?.name ?? office?.name ?? t("nav.classes");
  const description = [mine?.gradeLevel ?? office?.gradeLevel ? t("classes.grade", { grade: mine?.gradeLevel ?? office?.gradeLevel ?? "" }) : null, mine?.section ?? office?.section ? t("classes.section", { section: mine?.section ?? office?.section ?? "" }) : null, office?.room ? t("classes.room", { room: office.room }) : null]
    .filter(Boolean)
    .join(" · ");
  const refetch = () => {
    void roll.refetch();
    if (role === "PRINCIPAL") void insight.refetch();
    if (role === "ADMIN") void staffing.refetch();
  };
  const concern = insight.data?.concernPercent ?? 75;
  const pastAttendance = () => router.push({ pathname: "/(app)/attendance", params: { view: "history", classId } } as never);
  return (
    <Screen title={name} description={description || undefined} refreshing={roll.isRefetching} onRefresh={refetch}>
      {roll.isPending || !role ? <Loading /> : null}
      {roll.isError ? <Failed message={roll.error.message} onRetry={refetch} /> : null}
      {mine ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("principal.pupils")} value={mine.pupils} />
            <Stat label={t("principal.attendance")} value={pct(mine.attendance.percent)} tone={mine.attendance.percent !== null && mine.attendance.percent < concern ? "danger" : "fg"} />
            <Stat label={t("principal.progress")} value={pct(mine.progress.percent)} />
          </View>
          {mine.reportCards.length > 0 ? (
            <Card title={t("classes.reportCards")}>
              {mine.reportCards.map((r) => (
                <Text key={r.title} variant="sm" tone="muted">
                  {r.drafts > 0 ? t("principal.reportSummaryDrafts", { title: r.title, published: r.published, drafts: r.drafts }) : t("principal.reportSummary", { title: r.title, published: r.published })}
                </Text>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
      {office ? <Staffing classId={classId} office={office} /> : null}
      {roll.data ? (
        !history || history.pupils.length === 0 ? (
          <Empty
            title={t("principal.nobodyOnRoll")}
            body={t("principal.nobodyOnRollBody")}
            action={
              role === "ADMIN" ? (
                <Button label={t("intake.fromPeople")} variant="secondary" onPress={() => router.push("/(app)/intake" as never)} />
              ) : (
                <Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />
              )
            }
          />
        ) : (
          <Card title={role === "ADMIN" ? t("classes.whoIsIn") : t("principal.everybody")} action={<Button label={t("attendanceHistory.link")} variant="ghost" onPress={pastAttendance} />}>
            <Text variant="xs" tone="subtle">
              {t("classes.onTheRoll", { count: history.pupils.length })} · {t("principal.alphabetical")} · {history.month}
            </Text>
            {[...history.pupils]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => {
                const marks = p.present + p.late + p.absent + p.excused;
                const below = p.percent !== null && p.percent < concern;
                return (
                  <Row
                    key={p.membershipId}
                    title={p.name}
                    caption={marks === 0 ? t("principal.noMarksInWindow") : marks === 1 ? t("principal.markCountOne") : t("principal.markCountMany", { count: marks })}
                    right={
                      <Text variant="base" bold tone={below ? "danger" : "fg"}>
                        {pct(p.percent)}
                      </Text>
                    }
                  />
                );
              })}
            <Text variant="xs" tone="subtle">
              {t("principal.usuallyMarking")}
            </Text>
          </Card>
        )
      ) : null}
    </Screen>
  );
}

type OfficeClass = AdminClasses["classes"][number];

/**
 * The class's settings, for the office: who is down for it (taking somebody
 * off asks first; adding somebody picks from the teaching staff) and
 * archiving it — which asks first, says who stops seeing it, and keeps
 * every register and mark.
 */
function Staffing({ classId, office }: { classId: string; office: OfficeClass }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const staff = useQuery({
    queryKey: ["admin", "staff", "", "", ""],
    enabled: adding,
    queryFn: async () => adminStaffSchema.parse(unwrap(await api().get("/api/v1/admin/staff"))),
  });
  const refresh = () => {
    for (const queryKey of [["admin", "classes"], ["admin", "overview"], ["principal", "classes"], ["admin", "timetable"], ["admin", "staff"]]) void qc.invalidateQueries({ queryKey });
  };
  const seat = useMutation({
    mutationFn: async (input: { teacherMembershipId: string; assigned: boolean; name: string }) =>
      okSchema.parse(unwrap(await api().post(`/api/v1/admin/classes/${classId}/teacher`, { teacherMembershipId: input.teacherMembershipId, assigned: input.assigned }))),
    onSuccess: (_r, input) => {
      toast.show(input.assigned ? t("classes.teacherAssigned") : t("classes.teacherRemoved", { name: input.name }));
      setAdding(false);
      setPick("");
      setRemoving(null);
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const archive = useMutation({
    mutationFn: async () => okSchema.parse(unwrap(await api().post(`/api/v1/admin/classes/${classId}/archive`, { archived: true }))),
    onSuccess: () => {
      toast.show(t("classes.archivedToast", { name: office.name }));
      refresh();
      void qc.invalidateQueries({ queryKey: ["admin", "attendance"] });
      router.push("/(app)/classes" as never);
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const candidates = (staff.data?.staff ?? []).filter((s) => s.role !== "ADMIN" && !office.teachers.some((x) => x.membershipId === s.membershipId));
  const seatName = (role: string) => (role === "LEAD" ? t("classes.classTeacher") : role === "SUBJECT" ? t("classes.subjectTeacher") : t("classes.alsoTeaches"));
  return (
    <>
      <Card title={t("classes.whoMarks")}>
        <Text variant="sm" tone="muted">
          {t("classes.whoMarksBody")}
        </Text>
        {office.teachers.length === 0 ? (
          <Text variant="sm" tone="warn" bold>
            {t("classes.nobodyAssigned")}
          </Text>
        ) : (
          office.teachers.map((x) => (
            <View key={x.membershipId} style={{ gap: th.space[2] }}>
              <Row title={x.name} caption={seatName(x.role)} right={removing === x.membershipId ? null : <Button label={t("common.remove")} variant="ghost" onPress={() => setRemoving(x.membershipId)} accessibilityLabel={t("classes.takeOff", { name: x.name })} />} />
              {removing === x.membershipId ? (
                <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                  <Button label={t("classes.takeOff", { name: x.name })} variant="danger" busy={seat.isPending} onPress={() => seat.mutate({ teacherMembershipId: x.membershipId, assigned: false, name: x.name })} style={{ flexGrow: 1 }} />
                  <Button label={t("common.cancel")} variant="ghost" onPress={() => setRemoving(null)} />
                </View>
              ) : null}
            </View>
          ))
        )}
        {!adding ? (
          <Button label={t("classes.addTeacher")} variant="secondary" icon={<Icon name="plus" size={20} color={th.fg} />} onPress={() => setAdding(true)} />
        ) : staff.isPending ? (
          <Loading />
        ) : staff.isError ? (
          <Failed error={staff.error} onRetry={() => void staff.refetch()} />
        ) : candidates.length === 0 ? (
          <Empty icon="chalkboard" title={t("admin.noTeachersYet")} body={t("admin.noTeachersBody")} action={<Button label={t("admin.inviteFirstTeacher")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/invites", params: { role: "TEACHER" } } as never)} />} />
        ) : (
          <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[3] }}>
            <Chips label={t("classes.addTeacher")} value={pick} options={candidates.map((s) => ({ value: s.membershipId, label: s.name }))} onChange={setPick} />
            <Text variant="xs" tone="subtle">
              {t("classes.classTeacherHint")}
            </Text>
            <View style={{ flexDirection: "row", gap: th.space[2] }}>
              <Button label={t("classes.assign")} busy={seat.isPending} disabled={!pick} onPress={() => seat.mutate({ teacherMembershipId: pick, assigned: true, name: candidates.find((s) => s.membershipId === pick)?.name ?? "" })} style={{ flexGrow: 1 }} />
              <Button
                label={t("common.cancel")}
                variant="ghost"
                onPress={() => {
                  setAdding(false);
                  setPick("");
                }}
              />
            </View>
          </View>
        )}
      </Card>
      <Card>
        {archiving ? (
          <>
            <Text variant="base" bold>
              {t("classes.archiveTitle", { name: office.name })}
            </Text>
            <Text variant="sm" tone="muted">
              {office.pupils === 0 ? t("classes.archiveWarnEmpty") : `${office.pupils === 1 ? t("classes.archiveWarnOne") : t("classes.archiveWarnMany", { count: office.pupils })} ${t("classes.archiveWarnRest")}`}
            </Text>
            <Text variant="sm" tone="muted">
              {`${t("classes.archiveKept")} ${t("classes.archiveKeptWord")}${t("classes.archiveKeptRest")}`}
            </Text>
            <View style={{ flexDirection: "row", gap: th.space[2] }}>
              <Button label={t("classes.archiveConfirm")} variant="danger" busy={archive.isPending} onPress={() => archive.mutate()} accessibilityLabel={`${t("classes.archiveConfirm")}: ${office.name}`} style={{ flexGrow: 1 }} />
              <Button label={t("common.cancel")} variant="ghost" onPress={() => setArchiving(false)} />
            </View>
          </>
        ) : (
          <Button label={t("classes.archiveClass")} variant="secondary" icon={<Icon name="archive" size={20} color={th.fg} />} onPress={() => setArchiving(true)} />
        )}
      </Card>
    </>
  );
}
