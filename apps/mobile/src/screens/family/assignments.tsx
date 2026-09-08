import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { familyParentAssignmentsSchema, familyStudentAssignmentsSchema, familyStudentSubmittedSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { ChildSwitcher, childQuery, formatMilli, Note, param, Pill, relativeTime, SectionTitle, Tabs } from "./shared";

type Tab = "todo" | "handed" | "marked";
type StudentWork = z.infer<typeof familyStudentAssignmentsSchema>["todo"][number];

/**
 * "What do I owe" — three tabs, to do, handed in, marked. A pupil hands work
 * in from here (the web's SubmitPanel); a guardian reads their child's three
 * tabs and touches nothing, because homework is between the child and the
 * teacher.
 */
export function FamilyAssignments() {
  const role = useRole();
  const t = useT();
  if (role === "STUDENT") return <PupilAssignments />;
  if (role === "PARENT") return <ChildAssignments />;
  return (
    <Screen title={t("nav.assignments")}>
      <Loading />
    </Screen>
  );
}

function ChildAssignments() {
  const t = useT();
  const { locale } = useLocale();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [tab, setTab] = useState<Tab>("todo");
  const router = useRouter();
  const query = useQuery({
    queryKey: ["family", "assignments", childId],
    queryFn: async () => familyParentAssignmentsSchema.parse(unwrap(await api().get(`/api/v1/family/assignments${childQuery(childId)}`))),
  });
  const d = query.data;
  const name = d?.childName ?? "";
  const list = d ? (tab === "todo" ? d.todo : tab === "handed" ? d.handedIn : d.marked) : [];
  // The door out of an empty tab: the neighbouring tab with something in it, else the child's overview.
  const elsewhere = d ? ([{ key: "todo", label: t("assignments.tabDue"), count: d.todo.length }, { key: "handed", label: t("assignments.tabHanded"), count: d.handedIn.length }, { key: "marked", label: t("assignments.tabMarked"), count: d.marked.length }] as const).find((x) => x.key !== tab && x.count > 0) ?? null : null;
  return (
    <Screen title={t("nav.assignments")} description={d ? `${t("assignments.forChild", { name })} · ${t("diary.intro")}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? <ChildSwitcher pupils={d.children} selectedId={childId ?? d.children[0]?.studentMembershipId ?? null} onSelect={setChildId} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Tabs
            label={t("nav.assignments")}
            current={tab}
            onChange={setTab}
            tabs={[
              { key: "todo", label: t("assignments.tabDue"), count: d.todo.length },
              { key: "handed", label: t("assignments.tabHanded"), count: d.handedIn.length },
              { key: "marked", label: t("assignments.tabMarked"), count: d.marked.length },
            ]}
          />
          {list.length === 0 ? (
            <Empty
              title={tab === "todo" ? t("diary.openEmpty") : tab === "handed" ? t("assignments.nothingHanded") : t("diary.markedEmpty")}
              body={t("diary.emptyBody", { name })}
              action={
                elsewhere ? (
                  <Button label={elsewhere.label} variant="secondary" onPress={() => setTab(elsewhere.key)} />
                ) : (
                  <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push({ pathname: "/(app)", params: { child: childId ?? d.children[0]?.studentMembershipId ?? "" } } as never)} />
                )
              }
            />
          ) : (
            <Card>
              {list.map((item) => (
                <View key={item.id}>
                  <Row
                    title={item.title}
                    caption={[item.className, item.category, tab !== "marked" && item.dueAt ? `${t("diary.due")} ${relativeTime(item.dueAt, locale)}` : null].filter(Boolean).join(" · ")}
                    right={
                      tab === "marked" ? (
                        <Text variant="sm" bold>
                          {`${formatMilli(item.scoreMilli)}${item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}`}
                        </Text>
                      ) : item.submittedAt ? (
                        <Pill tone="ok" label={t("diary.handedIn")} />
                      ) : item.overdue ? (
                        <Pill tone="danger" label={t("diary.overdue")} />
                      ) : (
                        <Pill label={t("diary.notYet")} />
                      )
                    }
                  />
                  {tab === "marked" && item.comment ? (
                    <Text variant="sm" tone="muted">
                      {`“${item.comment}”`}
                    </Text>
                  ) : null}
                </View>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function PupilAssignments() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("todo");
  const query = useQuery({
    queryKey: ["family", "student", "assignments"],
    queryFn: async () => familyStudentAssignmentsSchema.parse(unwrap(await api().get("/api/v1/family/student/assignments"))),
  });
  const d = query.data;
  const list = d ? (tab === "todo" ? d.todo : tab === "handed" ? d.handedIn : d.marked) : [];
  return (
    <Screen
      title={t("nav.assignments")}
      description={d ? (d.todo.length === 0 ? t("student.nothingToDo") : d.todo.length === 1 ? t("student.thingsToDoOne") : t("student.thingsToDoMany", { count: d.todo.length })) : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Tabs
            label={t("nav.assignments")}
            current={tab}
            onChange={setTab}
            tabs={[
              { key: "todo", label: t("assignments.tabTodo"), count: d.todo.length },
              { key: "handed", label: t("assignments.tabHanded"), count: d.handedIn.length },
              { key: "marked", label: t("assignments.tabMarked"), count: d.marked.length },
            ]}
          />
          {list.length === 0 ? (
            <Empty
              title={tab === "todo" ? t("student.nothingDue") : tab === "handed" ? t("assignments.nothingHanded") : t("assignments.nothingMarked")}
              body={tab === "todo" ? t("student.workEmpty") : tab === "handed" ? t("assignments.nothingHandedBody") : t("assignments.nothingMarkedBody")}
              action={
                tab === "todo" ? (
                  <Button label={t("nav.practice")} variant="secondary" onPress={() => router.push("/(app)/practice" as never)} />
                ) : (
                  <Button label={t("assignments.tabTodo")} variant="secondary" onPress={() => setTab("todo")} />
                )
              }
            />
          ) : tab === "marked" ? (
            <Card>
              {list.map((item) => {
                const percent = item.scoreMilli !== null && item.pointsMilli ? Math.round((item.scoreMilli * 100) / item.pointsMilli) : null;
                return (
                  <View key={item.id} style={{ gap: th.space[1] }}>
                    <Row
                      title={item.title}
                      caption={[item.className, item.category].filter(Boolean).join(" · ")}
                      right={
                        <View style={{ alignItems: "flex-end", gap: 2 }}>
                          <Text variant="base" bold>
                            {`${formatMilli(item.scoreMilli)}${item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}`}
                          </Text>
                          {percent !== null ? <Pill tone={percent >= 70 ? "ok" : "muted"} label={`${percent}%`} /> : null}
                        </View>
                      }
                    />
                    {item.comment ? (
                      <Text variant="sm" tone="muted" style={{ fontStyle: "italic" }}>
                        {`“${item.comment}”`}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </Card>
          ) : (
            list.map((item) => <WorkCard key={item.id} item={item} />)
          )}
        </>
      ) : null}
    </Screen>
  );
}

function WorkCard({ item }: { item: StudentWork }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const caption = [item.className, item.category, item.pointsMilli ? `${formatMilli(item.pointsMilli)} ${t("assignments.points")}` : null].filter(Boolean).join(" · ");
  return (
    <Card>
      <View style={{ flexDirection: "row", gap: th.space[3], alignItems: "flex-start" }}>
        {/* The class's own colour is data from the server, not a colour of ours. */}
        <View style={{ width: 6, alignSelf: "stretch", borderRadius: th.radius.sm, backgroundColor: item.classColor ?? th.accent }} />
        <View style={{ flex: 1, gap: th.space[2] }}>
          <Text variant="base" bold>
            {item.title}
          </Text>
          <Text variant="xs" tone="muted">
            {caption}
          </Text>
          {item.body ? (
            <Text variant="sm" tone="muted">
              {item.body}
            </Text>
          ) : null}
          {item.attachments.length > 0 ? (
            <View style={{ gap: 2 }}>
              <SectionTitle>{t("student.fromTeacher")}</SectionTitle>
              {item.attachments.map((file) => (
                <Text key={file.fileId} variant="sm">
                  {file.name}
                </Text>
              ))}
            </View>
          ) : null}
          {item.submissionAttachments.length > 0 ? (
            <View style={{ gap: 2 }}>
              <SectionTitle>{t("student.yourFiles")}</SectionTitle>
              {item.submissionAttachments.map((file) => (
                <Text key={file.fileId} variant="sm">
                  {file.name}
                </Text>
              ))}
            </View>
          ) : null}
          <SubmitPanel assignmentId={item.id} title={item.title} submittedAt={item.submittedAt} existingBody={item.submissionBody} />
        </View>
        {/* Gentle: "3 days ago", never a red OVERDUE stamp. */}
        <Pill tone={item.overdue ? "warn" : "muted"} label={item.dueAt ? relativeTime(item.dueAt, locale) : t("student.noDate")} />
      </View>
    </Card>
  );
}

/** Hand-in, collapsed until the pupil opens it: a text box and one button, as on the web. */
function SubmitPanel({ assignmentId, title, submittedAt, existingBody }: { assignmentId: string; title: string; submittedAt: string | null; existingBody: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(existingBody);
  const [error, setError] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const done = Boolean(submittedAt);
  const submit = useMutation({
    mutationFn: async (text: string) => {
      const result = await api().post("/api/v1/family/student/submissions", { assignmentId, body: text });
      if (!result.ok) throw new Error(errorText(result, t("student.notGoThrough")));
      return familyStudentSubmittedSchema.parse(result.data);
    },
    onSuccess: () => {
      setOpen(false);
      setCheer(true);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["family", "student"] });
    },
    onError: (e) => setError(e.message),
  });
  const send = () => {
    const text = body.trim();
    if (!text) {
      setError(t("student.writeBeforeHandIn"));
      return;
    }
    setError(null);
    submit.mutate(text);
  };
  if (!open) {
    if (cheer) {
      return (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok">
            {t("student.handedInCheer")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("student.teacherTold", { title })}
          </Text>
          <Button variant="ghost" label={t("student.changeIt")} onPress={() => setOpen(true)} />
        </Note>
      );
    }
    if (done) {
      return (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok">
            {t("student.handedIn")}
          </Text>
          <Button variant="ghost" label={t("student.changeIt")} onPress={() => setOpen(true)} />
        </Note>
      );
    }
    return <Button variant="secondary" label={t("student.handItIn")} onPress={() => setOpen(true)} />;
  }
  return (
    <Note tone="accent">
      <Field
        label={t("student.yourAnswer")}
        value={body}
        onChangeText={(next) => {
          setBody(next.slice(0, 20_000));
          if (error) setError(null);
        }}
        placeholder={t("student.answerPlaceholder")}
        multiline
        error={error}
        style={{ minHeight: 120, textAlignVertical: "top", paddingTop: th.space[3] }}
      />
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button
          variant="ghost"
          label={t("student.cancel")}
          style={{ flex: 1 }}
          onPress={() => {
            setOpen(false);
            setBody(existingBody);
            setError(null);
          }}
        />
        <Button label={done || cheer ? t("student.changeIt") : t("student.handItIn")} style={{ flex: 1 }} busy={submit.isPending} onPress={send} />
      </View>
    </Note>
  );
}
