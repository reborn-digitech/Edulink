import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminClassesSchema, attendanceHistorySchema, principalClassesSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { adminClassesPath, principalClassesPath } from "./classes";
import { DEFAULT_SPAN, openWeb, pct } from "./shared";

/**
 * One class, for the head or the office. There is no single-class endpoint
 * for either, so the header comes from the role's own list — the head's
 * insight over the default window, the office's staffing row — and the
 * roll from the attendance history, which both roles may read: every pupil,
 * alphabetically, with their attendance this month. Concerns are flagged,
 * never ordered.
 */
export function StaffClassDetail({ classId: classIdProp }: { classId?: string } = {}) {
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = classIdProp ?? (typeof params.classId === "string" ? params.classId : "");
  const role = useRole();
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
      {office ? (
        <Card title={t("classes.whoMarks")} action={<Button label={t("meta.classStaffing")} variant="ghost" onPress={() => openWeb(`/admin/classes/${classId}`)} />}>
          <Text variant="sm" tone="muted">
            {t("classes.whoMarksBody")}
          </Text>
          {office.teachers.length === 0 ? (
            <Text variant="sm" tone="warn" bold>
              {t("classes.noTeacherAssigned")}
            </Text>
          ) : (
            office.teachers.map((x) => <Row key={x.membershipId} title={x.name} caption={x.role} />)
          )}
        </Card>
      ) : null}
      {roll.data ? (
        !history || history.pupils.length === 0 ? (
          <Empty title={t("principal.nobodyOnRoll")} body={t("principal.nobodyOnRollBody")} />
        ) : (
          <Card title={role === "ADMIN" ? t("classes.whoIsIn") : t("principal.everybody")} action={<Button label={t("attendanceHistory.link")} variant="ghost" onPress={() => openWeb(`/admin/attendance/history?classId=${encodeURIComponent(classId)}`)} />}>
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
