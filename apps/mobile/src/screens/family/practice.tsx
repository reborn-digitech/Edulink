import { useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { familyParentPracticeSchema, familyStudentPracticeSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text } from "@/components";
import { api, API_BASE } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { ChildSwitcher, childQuery, Chips, levelName, Note, param, subjectName } from "./shared";

/**
 * Practice. A pupil sees the topic list and the cards above it (the web's
 * /student/practice); answering questions stays on the web for now, so every
 * topic opens there. A guardian sees every chapter their child has touched
 * and the rung they stand on — this child against this ladder, nobody else's.
 */
export function FamilyPractice() {
  const role = useRole();
  const t = useT();
  if (role === "STUDENT") return <PupilPractice />;
  if (role === "PARENT") return <ChildPractice />;
  return (
    <Screen title={t("nav.practice")}>
      <Loading />
    </Screen>
  );
}

const openWeb = (path: string) => void Linking.openURL(`${API_BASE}${path}`);

function ChildPractice() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const query = useQuery({
    queryKey: ["family", "practice", childId],
    queryFn: async () => familyParentPracticeSchema.parse(unwrap(await api().get(`/api/v1/family/practice${childQuery(childId)}`))),
  });
  const d = query.data;
  const name = d?.childName ?? "";
  const subjects = d ? [...new Set(d.topics.map((row) => row.subject))] : [];
  return (
    <Screen title={d ? t("practice.parentPracticeTitle", { name }) : t("nav.practice")} description={d ? t("practice.parentPracticeIntro", { name }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? <ChildSwitcher pupils={d.children} selectedId={childId ?? d.children[0]?.studentMembershipId ?? null} onSelect={setChildId} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.topics.length === 0 ? (
          <Empty title={t("feature.practice")} body={t("practice.parentPracticeEmpty", { name })} action={<Button label={t("nav.assignments")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/assignments", params: { child: childId ?? d.children[0]?.studentMembershipId ?? "" } } as never)} />} />
        ) : (
          <>
            <Note tone="accent">
              <Text variant="sm">{t("practice.parentWeekly", { n: d.weeklyCount })}</Text>
            </Note>
            {subjects.map((subject) => (
              <Card key={subject} title={subjectName(t, subject)}>
                {d.topics
                  .filter((row) => row.subject === subject)
                  .map((row) => (
                    <Row
                      key={row.slug}
                      title={`${row.name} · ${t("practice.classN", { n: row.classLevel })}`}
                      caption={[levelName(t, row.level), `${t("practice.colTried")} ${row.seenCount}`, `${t("practice.colBadges")} ${row.tierCount}/6`, row.cleanCompletion ? t("student.badgeEarned") : null].filter(Boolean).join(" · ")}
                    />
                  ))}
              </Card>
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}

function PupilPractice() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [grade, setGrade] = useState<number | "all" | null>(null);
  const [subject, setSubject] = useState<string>("all");
  const query = useQuery({
    queryKey: ["family", "student", "practice"],
    queryFn: async () => familyStudentPracticeSchema.parse(unwrap(await api().get("/api/v1/family/student/practice"))),
  });
  const d = query.data;
  const topics = d?.topics ?? [];
  const grades = [...new Set(topics.map((topic) => topic.classLevel))].sort((a, b) => a - b);
  // No choice yet opens on the pupil's own grade, as the web does; "all" is the way out.
  const gradeNum = grade === "all" ? null : (grade ?? (d?.defaultGrade && grades.includes(d.defaultGrade) ? d.defaultGrade : null));
  const subjectsShown = [...new Set(topics.filter((topic) => gradeNum === null || topic.classLevel === gradeNum).map((topic) => topic.subject))];
  const shown = topics.filter((topic) => (subject === "all" || topic.subject === subject) && (gradeNum === null || topic.classLevel === gradeNum));
  const resume = d?.resume ?? null;
  return (
    <Screen title={t("feature.practice")} description={t("practice.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Button label={t("mobile.openOnWeb")} onPress={() => openWeb("/student/practice")} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        topics.length === 0 ? (
          <Empty title={t("student.noTopics")} body={t("student.noTopicsBody")} action={<Button label={t("nav.assignments")} variant="secondary" onPress={() => router.push("/(app)/assignments" as never)} />} />
        ) : (
          <>
            {resume ? (
              <Card title={t("practice.continueTitle")}>
                <Row title={resume.name} caption={`${levelName(t, resume.level)}${resume.tierCount > 0 ? ` · ${resume.tierCount}/6` : ""}`} onPress={() => openWeb(`/student/practice/${resume.slug}`)} />
                <Text variant="xs" tone="muted">
                  {resume.remainingForBadge !== null && resume.nextTierName ? t("practice.continueBadgeHint", { n: resume.remainingForBadge, tier: resume.nextTierName }) : t("practice.continueAllProven")}
                </Text>
              </Card>
            ) : null}
            <Card title={t("practice.goalTitle")}>
              <Text variant="2xl" bold>
                {`${Math.min(d.weekly, d.weeklyGoal)}`}
                <Text variant="sm" tone="muted">{` / ${d.weeklyGoal}`}</Text>
              </Text>
              <View accessible accessibilityRole="progressbar" accessibilityLabel={t("practice.goalHint", { n: d.weekly, goal: d.weeklyGoal })} style={{ height: 6, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted, overflow: "hidden" }}>
                <View style={{ height: 6, width: `${Math.min(100, Math.round((d.weekly * 100) / Math.max(1, d.weeklyGoal)))}%`, backgroundColor: th.accent }} />
              </View>
              <Text variant="xs" tone="muted">
                {t("practice.goalHint", { n: d.weekly, goal: d.weeklyGoal })}
              </Text>
            </Card>
            {d.revision.length > 0 ? (
              <Card title={t("practice.revisionTitle")}>
                <Text variant="2xl" bold>
                  {String(d.revision.length)}
                </Text>
                <Text variant="xs" tone="muted">
                  {t("practice.revisionHint", { n: d.revision.length })}
                </Text>
                <Button variant="ghost" label={t("practice.revisionStart")} onPress={() => openWeb("/student/practice/revision")} />
              </Card>
            ) : null}
            {d.assigned.length > 0 ? (
              <Card title={t("practice.assignedTitle")}>
                {d.assigned.map((a) => (
                  <Row
                    key={a.id}
                    title={a.topicName}
                    caption={`${t("practice.assignedTarget", { tier: a.targetTierName, level: a.targetLevel })} · ${a.reached ? t("practice.assignedReached") : t("practice.assignedKeepGoing")}`}
                    onPress={() => openWeb(`/student/practice/${a.topicSlug}`)}
                  />
                ))}
              </Card>
            ) : null}

            {grades.length > 1 ? (
              <Chips
                label={t("practice.allClasses")}
                value={gradeNum === null ? "all" : String(gradeNum)}
                onChange={(value) => setGrade(value === "all" ? "all" : Number(value))}
                options={[{ value: "all", label: t("practice.allClasses") }, ...grades.map((g) => ({ value: String(g), label: t("practice.classN", { n: g }) }))]}
              />
            ) : null}
            {subjectsShown.length > 1 ? (
              <Chips label={t("student.subjects")} value={subject} onChange={setSubject} options={[{ value: "all", label: t("practice.allSubjects") }, ...subjectsShown.map((s) => ({ value: s, label: subjectName(t, s) }))]} />
            ) : null}

            {shown.map((topic) => (
              <Card key={topic.id}>
                <Row
                  title={topic.name}
                  caption={`${subjectName(t, topic.subject)} · ${t("practice.classN", { n: topic.classLevel })}`}
                  right={
                    topic.badgeEarned ? (
                      <View accessible accessibilityLabel={t("student.badgeEarned")}>
                        <Icon name="medal" size={22} weight="fill" color={th.accentStrong} />
                      </View>
                    ) : null
                  }
                  onPress={() => openWeb(`/student/practice/${topic.slug}`)}
                />
                {topic.summary ? (
                  <Text variant="sm" tone="muted">
                    {topic.summary}
                  </Text>
                ) : null}
                <Text variant="xs" tone="muted">
                  {[levelName(t, topic.level), t("practice.triedOfTotal", { seen: topic.seenCount, total: topic.questionCount }), topic.tierCount > 0 ? t("practice.tierBadges", { n: topic.tierCount }) : null, topic.completed && !topic.badgeEarned ? t("practice.finished") : null]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </Card>
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}
