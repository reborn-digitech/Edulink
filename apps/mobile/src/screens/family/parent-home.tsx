import { useState } from "react";
import { QUICK } from "@/lib/nav";
import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { familyChildrenSchema, familyParentOverviewSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, QuickActions, Row, Screen, Stat, Text } from "@/components";
import { api, API_BASE } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { FamilyApplicationsCard } from "./applications";
import { CompleteRecordCard } from "./record";
import { FamilyPenChangesCard } from "../shared/pupil-record";
import { ATTENDANCE, ChildSwitcher, childQuery, ExamMarksCards, formatDateKey, LessonList, Note, param, relativeTime, SectionTitle, StatusBadge } from "./shared";

type Overview = z.infer<typeof familyParentOverviewSchema>;

/**
 * The guardian's overview — the web's /parent — for one child at a time.
 * The chosen child lives in state at the top and goes down as `childId`;
 * a deep link (?child=) picks it, and the server picks the first child when
 * nothing does. A child who has left gets the web's panel, not a stale day.
 */
export function ParentHome() {
  const t = useT();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const children = useQuery({
    queryKey: ["family", "children"],
    queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))),
  });
  const noChildren = children.data?.children.length === 0;
  const overview = useQuery({
    queryKey: ["family", "overview", childId],
    queryFn: async () => familyParentOverviewSchema.parse(unwrap(await api().get(`/api/v1/family/overview${childQuery(childId)}`))),
    enabled: !noChildren,
  });
  const pupils = children.data?.children ?? overview.data?.children ?? [];
  const router = useRouter();
  const th = useTheme();
  const refresh = () => {
    void children.refetch();
    void overview.refetch();
  };
  return (
    <Screen title={t("nav.overview")} description={overview.data?.child.schoolName} refreshing={overview.isRefetching} onRefresh={refresh}>
      <ChildSwitcher pupils={pupils} selectedId={childId ?? overview.data?.child.studentMembershipId ?? null} onSelect={setChildId} />
      {noChildren ? (
        <Empty
          title={t("shell.yourChildren")}
          action={
            <View style={{ gap: th.space[2] }}>
              <Button label={t("parent.linkAnother")} variant="secondary" onPress={() => void Linking.openURL(`${API_BASE}/parent/link`)} />
              {/* A guardian with no child yet may be applying for one: the applications are theirs whether or not a child is linked. */}
              <Button label={t("admissions.myApplications")} variant="ghost" onPress={() => router.push("/(app)/my-applications" as never)} />
            </View>
          }
        />
      ) : null}
      {/* The guardian's applications, at every school, while they have any; the card asks for them itself. */}
      <FamilyApplicationsCard />
      {children.isError && !overview.data ? <Failed message={children.error.message} onRetry={refresh} /> : null}
      {overview.isPending && !noChildren && !children.isError ? <Loading /> : null}
      {overview.isError ? <Failed message={overview.error.message} onRetry={() => void overview.refetch()} /> : null}
      {overview.data ? overview.data.left ? <ChildLeft data={overview.data} /> : <ChildDay data={overview.data} /> : null}
    </Screen>
  );
}

function ChildLeft({ data }: { data: Overview }) {
  const t = useT();
  const { locale } = useLocale();
  const { child } = data;
  return (
    <Card>
      <Text variant="lg" bold style={{ textAlign: "center" }}>
        {t("parent.childLeftTitle", { name: child.name, school: child.schoolName, date: child.leftAt ? formatDateKey(child.leftAt.slice(0, 10), locale) : "" })}
      </Text>
      <Text variant="sm" tone="muted" style={{ textAlign: "center" }}>
        {t("parent.childLeftBody", { name: child.name })}
      </Text>
      <Button label={t("parent.childLeftRecord", { name: child.name })} onPress={() => void Linking.openURL(`${API_BASE}/record/${child.studentUserId}`)} />
    </Card>
  );
}

function ChildDay({ data }: { data: Overview }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const { child } = data;
  const name = child.name;
  const childParams = { child: child.studentMembershipId };
  const attendance = data.attendance;
  const percent = attendance?.percent ?? null;
  const streak = data.streak;
  return (
    <>
      <View>
        <Text variant="2xl" bold accessibilityRole="header">
          {name}
        </Text>
        <Text variant="sm" tone="muted">
          {child.schoolName}
          {child.gradeLevel ? ` · ${t("parent.gradeLevel", { level: child.gradeLevel })}` : ""}
        </Text>
      </View>

      {data.awaitingConsent.length > 0 ? (
        <Card title={t("parent.consentTitle")}>
          <Text variant="sm" tone="muted">
            {t("parent.consentBody")}
          </Text>
          {data.awaitingConsent.map((item) => (
            <Row
              key={item.entryId}
              title={t("competitions.wouldLikeToEnter", { child: item.childName, title: item.title, organiser: item.organizerName })}
              onPress={() => void Linking.openURL(`${API_BASE}/competitions/${item.competitionId}`)}
            />
          ))}
        </Card>
      ) : null}

      {/* While a certificate field is still blank on the child's record, the nudge to fill it; gone once it is complete. */}
      <CompleteRecordCard childId={child.studentMembershipId} />
      {/* A correction to a child's PEN awaiting this guardian's word — every child's, because the office is waiting on it. */}
      <FamilyPenChangesCard />

      <Card>
        <Text variant="xs" tone="muted" style={{ textTransform: "uppercase" }}>
          {`${t("parent.today")} · ${formatDateKey(data.today, locale, { weekday: "long", day: "numeric", month: "long" })}`}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: th.space[3] }}>
          <Text variant="base" bold tone={data.todayRecord ? "fg" : "muted"} style={{ flex: 1 }}>
            {data.todayRecord ? t(ATTENDANCE[data.todayRecord.status].marked, { name }) : t("parent.notTakenYet")}
          </Text>
          {data.todayRecord ? <StatusBadge status={data.todayRecord.status} /> : null}
        </View>
        {data.todayRecord?.note ? (
          <Text variant="sm" tone="muted">
            {`“${data.todayRecord.note}”`}
          </Text>
        ) : null}
      </Card>

      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("parent.attendance")} value={percent === null ? "—" : `${percent}%`} tone={percent === null ? "fg" : percent >= 95 ? "ok" : percent >= 90 ? "warn" : "danger"} />
        <Stat label={t("parent.averageGrade")} value={data.averagePercent === null ? "—" : `${data.averagePercent}%`} tone={data.averagePercent === null ? "fg" : data.averagePercent >= 70 ? "ok" : "warn"} />
        <Stat label={t("parent.streak")} value={streak} tone={streak >= 5 ? "ok" : "fg"} />
      </View>
      <QuickActions actions={QUICK.PARENT ?? []} onOpen={(href) => router.push(href as never)} />
      <Text variant="xs" tone="muted">
        {[
          !attendance || attendance.total === 0 ? t("parent.noRecordsYet") : t("parent.lastFourWeeks"),
          data.scoredCount === 0 ? t("parent.nothingGradedYet") : data.scoredCount === 1 ? t("parent.acrossPiecesOne") : t("parent.acrossPieces", { count: data.scoredCount }),
          streak === 0 ? t("parent.streakStart") : streak === 1 ? t("parent.streakDaysOne") : t("parent.streakDays", { count: streak }),
        ].join(" · ")}
      </Text>

      <Card title={t("parent.todayLessons", { name })} action={<Button variant="ghost" label={t("teacher.openTimetable")} onPress={() => router.push({ pathname: "/(app)/timetable", params: childParams } as never)} />}>
        <Text variant="sm" tone="muted">
          {data.closedToday ? t("teacher.closedToday", { name: data.closedName ?? "" }) : t("parent.todayLessonsBody")}
        </Text>
        <LessonList lessons={data.lessonsToday} closedToday={data.closedToday} closedName={data.closedName} />
      </Card>

      <Card title={t("parent.comingUp")} action={<Button variant="ghost" label={t("agenda.link")} onPress={() => router.push({ pathname: "/(app)/agenda", params: childParams } as never)} />}>
        <Text variant="sm" tone="muted">
          {t("parent.workDueSoon")}
        </Text>
        {data.upcoming.length === 0 ? (
          <Text variant="sm" tone="muted" style={{ textAlign: "center", paddingVertical: th.space[3] }}>
            {t("parent.nothingDue")}
          </Text>
        ) : (
          data.upcoming.map((item) => (
            <Row
              key={item.id}
              title={item.title}
              caption={item.className}
              right={
                <Text variant="xs" bold tone={item.dueSoon ? "warn" : "muted"}>
                  {item.dueAt ? relativeTime(item.dueAt, locale) : t("parent.noDueDate")}
                </Text>
              }
              onPress={() => router.push({ pathname: "/(app)/assignments", params: childParams } as never)}
            />
          ))
        )}
      </Card>

      <Card title={t("parent.teacherMessages")} action={<Button variant="ghost" label={t("parent.open")} onPress={() => router.push("/(app)/messages" as never)} />}>
        <Text variant="sm" tone="muted">
          {t("parent.teacherMessagesBody")}
        </Text>
        {data.threads.length === 0 ? (
          <Empty title={t("parent.noMessages")} body={t("parent.noMessagesBody")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
        ) : (
          data.threads.map((thread) => (
            <Row
              key={thread.id}
              title={thread.subject}
              caption={`${thread.teacherName} · ${relativeTime(thread.lastMessageAt, locale)}`}
              onPress={() => router.push({ pathname: "/(app)/messages/thread", params: { threadId: thread.id } } as never)}
            />
          ))
        )}
      </Card>

      {data.examMarks.some((m) => m.series.length > 0) ? (
        <>
          <SectionTitle>{t("exams.myMarksTitle")}</SectionTitle>
          {data.examMarks.map((m) => (
            <ExamMarksCards key={m.studentMembershipId} marks={m} compact showStudent={data.examMarks.length > 1} onSeeAll={() => router.push("/(app)/exams" as never)} />
          ))}
        </>
      ) : null}

      <Note tone="accent">
        <Button label={t("parent.linkAnother")} variant="secondary" onPress={() => void Linking.openURL(`${API_BASE}/parent/link`)} />
      </Note>
    </>
  );
}
