import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { staffClassDetailSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { openWeb, relativeTime } from "./support";

/**
 * One class, the web's /teacher/classes/[classId]: today's register, the
 * roster with 28 days of attendance per pupil, and the recent work.
 */
export function TeacherClassDetail() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["staff", "classes", classId],
    queryFn: async () => staffClassDetailSchema.parse(unwrap(await api().get(`/api/v1/staff/classes/${classId}`))),
    enabled: Boolean(classId),
  });
  const data = query.data;
  if (!classId) {
    return (
      <Screen title={t("nav.classes")}>
        <Failed message={t("teacher.classNotFound")} />
      </Screen>
    );
  }
  return (
    <Screen title={data?.class.name ?? t("nav.classes")} description={data ? [data.class.subject, data.class.gradeLevel, data.class.room].filter(Boolean).join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("teacher.registerToday")} value={data.today.registerTakenAt ? t("teacher.done") : t("teacher.toDo")} tone={data.today.registerTakenAt ? "ok" : "warn"} />
            <Stat label={t("teacher.toMark")} value={data.toGrade} />
            <Stat label={t("teacher.attendanceConcern")} value={data.ofConcern} tone={data.ofConcern > 0 ? "danger" : "fg"} />
            <Stat label={t("teacher.noGuardian")} value={data.withoutGuardian} tone={data.withoutGuardian > 0 ? "warn" : "fg"} />
          </View>
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            <Button label={data.today.registerTakenAt ? t("teacher.editTodaysRegister") : t("teacher.takeRegister")} onPress={() => router.push({ pathname: "/(app)/attendance", params: { classId } } as never)} />
            <Button label={t("exams.enterMarks")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/marks", params: { classId } } as never)} />
          </View>

          <Card title={t("teacher.whoIsInClass")}>
            <Text variant="xs" tone="subtle">
              {t("teacher.attendanceOver", { days: 28 })}
            </Text>
            {data.roster.length === 0 ? (
              <Empty title={t("teacher.nobodyJoined")} body={t("teacher.nobodyJoinedBody")} action={<Button label={t("mobile.openOnWeb")} variant="secondary" onPress={() => openWeb(`/teacher/classes/${classId}`)} />} />
            ) : (
              data.roster.map((p) => {
                const concern = p.percent !== null && p.percent < 90;
                return (
                  <Row
                    key={p.membershipId}
                    title={p.name}
                    caption={p.percent === null ? t("teacher.nobodyMarkedYet") : `${Math.round(p.percent)}%${concern ? ` · ${t("teacher.belowNinety", { days: 28 })}` : ""}`}
                    right={
                      <View style={{ alignItems: "flex-end", gap: 2 }}>
                        {p.absences > 0 ? (
                          <Text variant="xs" tone={concern ? "danger" : "muted"}>
                            {t("attendance.absent")}: {p.absences}
                          </Text>
                        ) : null}
                        {!p.hasGuardian ? (
                          <Text variant="xs" tone="warn" bold>
                            {t("teacher.noGuardian")}
                          </Text>
                        ) : null}
                      </View>
                    }
                  />
                );
              })
            )}
          </Card>

          <Card title={t("teacher.recentWork")}>
            {data.recentAssignments.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("teacher.nothingSetYet")}
              </Text>
            ) : (
              data.recentAssignments.map((a) => (
                <Row
                  key={a.id}
                  title={a.title}
                  caption={!a.publishedAt ? t("teacher.draft") : a.dueAt ? t("teacher.dueWhen", { when: relativeTime(a.dueAt, locale) }) : t("teacher.noDueDate")}
                  right={
                    <Text variant="xs" tone="muted">
                      {t("teacher.markedOf", { marked: a.graded, total: data.roster.length })}
                    </Text>
                  }
                />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
