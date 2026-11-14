import { useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { familyParentAssignmentsSchema, familyStudentAssignmentsSchema, familyStudentSubmittedSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Text } from "@/components";
import { api, API_BASE, errorText } from "@/lib/api";
import { CAMERA_AVAILABLE, openAppSettings, takePhotoAndUpload } from "@/lib/camera";
import { pickAndUpload } from "@/lib/pick-file";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole, useSessionIfAny } from "@/lib/session";
import { ChildSwitcher, childQuery, firstChild, formatMilli, Note, param, Pill, relativeTime, SectionTitle, Tabs, useAuthHeaders, useSwitcherChildren } from "./shared";
import { featuresOf } from "@/lib/nav";

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
  // TA-167: the switcher stays beside a refused child.
  const pupils = useSwitcherChildren(d?.children, query.isError);
  const name = d?.childName ?? "";
  const list = d ? (tab === "todo" ? d.todo : tab === "handed" ? d.handedIn : d.marked) : [];
  // The door out of an empty tab: the neighbouring tab with something in it, else the child's overview.
  const elsewhere = d ? ([{ key: "todo", label: t("assignments.tabDue"), count: d.todo.length }, { key: "handed", label: t("assignments.tabHanded"), count: d.handedIn.length }, { key: "marked", label: t("assignments.tabMarked"), count: d.marked.length }] as const).find((x) => x.key !== tab && x.count > 0) ?? null : null;
  return (
    <Screen title={t("nav.assignments")} description={d ? `${t("assignments.forChild", { name })} · ${t("diary.intro")}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ChildSwitcher pupils={pupils} selectedId={childId ?? firstChild(pupils)?.studentMembershipId ?? null} onSelect={setChildId} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
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
                  <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push({ pathname: "/(app)", params: { child: childId ?? firstChild(d.children)?.studentMembershipId ?? "" } } as never)} />
                )
              }
            />
          ) : (
            <Card>
              {list.map((item) => (
                <View key={item.id}>
                  <Row
                    title={item.title}
                    caption={[item.className, item.subject, item.category, tab !== "marked" && item.dueAt ? `${t("diary.due")} ${relativeTime(item.dueAt, locale)}` : null].filter(Boolean).join(" · ")}
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
  // The practice bank is the platform's QUESTION_BANK feature (15 Oct 2026; /me's `features`): no way into it while it is off.
  const practiceSession = useSessionIfAny();
  const practiceOn = featuresOf(practiceSession?.status === "signed-in" ? practiceSession.me : null).includes("QUESTION_BANK");
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
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
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
                  practiceOn ? <Button label={t("nav.practice")} variant="secondary" onPress={() => router.push("/(app)/practice" as never)} /> : undefined
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
                      caption={[item.className, item.subject, item.category].filter(Boolean).join(" · ")}
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
  const caption = [item.className, item.subject, item.category, item.pointsMilli ? `${formatMilli(item.pointsMilli)} ${t("assignments.points")}` : null].filter(Boolean).join(" · ");
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
          <SubmitPanel assignmentId={item.id} title={item.title} submittedAt={item.submittedAt} existingBody={item.submissionBody} existingFiles={item.submissionAttachments} />
        </View>
        {/* Gentle: "3 days ago", never a red OVERDUE stamp. */}
        <Pill tone={item.overdue ? "warn" : "muted"} label={item.dueAt ? relativeTime(item.dueAt, locale) : t("student.noDate")} />
      </View>
    </Card>
  );
}

/**
 * Hand-in, collapsed until the pupil opens it: the words, and the photographs
 * of the notebook — taken there and then with the camera (lib/camera.ts), or
 * one picture chosen through the system's own picker. Each photo is uploaded
 * as it is taken and shown back from the server, so what the pupil sees is
 * what the teacher will; the hand-in itself is one POST naming the text and
 * every file to keep, and until it is sent nothing has changed. Either words
 * or a photo is enough.
 */
/** `localUri`: the phone's copy of a picture picked and not yet handed in, which the file route will not serve (TA-565). */
type HandInFile = { fileId: string; name: string; mime: string; size: number; localUri?: string };
const MAX_PHOTOS = 5;

function SubmitPanel({ assignmentId, title, submittedAt, existingBody, existingFiles }: { assignmentId: string; title: string; submittedAt: string | null; existingBody: string; existingFiles: HandInFile[] }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const headers = useAuthHeaders();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(existingBody);
  const [files, setFiles] = useState<HandInFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const done = Boolean(submittedAt);
  const submit = useMutation({
    mutationFn: async (input: { body: string; files: HandInFile[] }) => {
      const result = await api().post("/api/v1/family/student/submissions", { assignmentId, body: input.body, attachments: input.files.map((f) => ({ fileId: f.fileId, name: f.name })) });
      if (!result.ok) throw new Error(errorText(result, t("student.notGoThrough")));
      return familyStudentSubmittedSchema.parse(result.data);
    },
    onSuccess: (data) => {
      setOpen(false);
      setCheer(true);
      setError(null);
      setFiles(data.attachments);
      void qc.invalidateQueries({ queryKey: ["family", "student"] });
    },
    onError: (e) => setError(e.message),
  });
  const send = () => {
    const text = body.trim();
    if (!text && files.length === 0) {
      setError(t("student.photoOrWords"));
      return;
    }
    setError(null);
    submit.mutate({ body: text, files });
  };
  const addFile = async (take: boolean) => {
    if (files.length >= MAX_PHOTOS) {
      setError(t("ui.upToFilesMany", { max: MAX_PHOTOS }));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      if (take) {
        const outcome = await takePhotoAndUpload(t("student.notGoThrough"));
        if (outcome && "denied" in outcome) {
          setCameraDenied(true);
          return;
        }
        if (outcome) setFiles((current) => [...current, outcome.picked]);
      } else {
        const picked = await pickAndUpload("image", t("student.notGoThrough"));
        if (picked) setFiles((current) => [...current, picked]);
      }
    } catch (e) {
      // The server's own sentence (too big, not a picture), under the box where the pupil is looking.
      setError(e instanceof Error ? e.message : t("student.notGoThrough"));
    } finally {
      setUploading(false);
    }
  };
  const remove = (fileId: string) => setFiles((current) => current.filter((f) => f.fileId !== fileId));

  if (!open) {
    const thumbs = files.length > 0 ? <Thumbnails files={files} headers={headers} /> : null;
    if (cheer) {
      return (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok">
            {t("student.handedInCheer")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("student.teacherTold", { title })}
          </Text>
          {thumbs}
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
          {thumbs}
          <Button variant="ghost" label={t("student.changeIt")} onPress={() => setOpen(true)} />
        </Note>
      );
    }
    return (
      <View style={{ gap: th.space[2] }}>
        {thumbs}
        <Button variant="secondary" label={t("student.handItIn")} onPress={() => setOpen(true)} />
      </View>
    );
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
      <Text variant="xs" tone="muted">
        {t("student.photosHint", { max: MAX_PHOTOS })}
      </Text>
      <Thumbnails files={files} headers={headers} onRemove={remove} />
      {cameraDenied ? (
        <Note tone="warn">
          <Text variant="sm">{t("student.cameraDenied")}</Text>
          <Button variant="ghost" label={t("student.openSettings")} onPress={openAppSettings} />
        </Note>
      ) : null}
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        {CAMERA_AVAILABLE ? (
          <Button variant="secondary" label={uploading ? t("student.uploadingPhoto") : t("student.takePhoto")} icon={<Icon name="camera" size={18} color={th.fg} weight="bold" />} busy={uploading} disabled={files.length >= MAX_PHOTOS} onPress={() => void addFile(true)} style={{ flex: 1 }} />
        ) : null}
        <Button variant="secondary" label={t("student.choosePicture")} icon={<Icon name="image" size={18} color={th.fg} weight="bold" />} busy={uploading} disabled={files.length >= MAX_PHOTOS} onPress={() => void addFile(false)} style={{ flex: 1 }} />
      </View>
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button
          variant="ghost"
          label={t("student.cancel")}
          style={{ flex: 1 }}
          onPress={() => {
            setOpen(false);
            setBody(existingBody);
            setFiles(existingFiles);
            setError(null);
          }}
        />
        <Button label={done || cheer ? t("student.changeIt") : t("student.handItIn")} style={{ flex: 1 }} busy={submit.isPending || uploading} onPress={send} />
      </View>
    </Note>
  );
}

/** The hand-in's photographs, drawn from the server with the bearer token; a file that is not a picture is named. */
function Thumbnails({ files, headers, onRemove }: { files: HandInFile[]; headers: Record<string, string> | null; onRemove?: (fileId: string) => void }) {
  const t = useT();
  const th = useTheme();
  if (files.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }} accessibilityLabel={t("student.yourFiles")}>
      {files.map((file) => (
        <View key={file.fileId} style={{ width: th.tap * 2, gap: 2 }}>
          {file.mime.startsWith("image/") && file.localUri ? (
            <Image source={{ uri: file.localUri }} accessible accessibilityLabel={file.name} contentFit="cover" style={{ width: th.tap * 2, height: th.tap * 2, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted }} />
          ) : file.mime.startsWith("image/") && headers ? (
            <Image source={{ uri: `${API_BASE}/api/files/${encodeURIComponent(file.fileId)}?w=320`, headers }} accessible accessibilityLabel={file.name} contentFit="cover" style={{ width: th.tap * 2, height: th.tap * 2, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted }} />
          ) : (
            <View style={{ width: th.tap * 2, height: th.tap * 2, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
              <Icon name="paperclip" size={22} color={th.fgMuted} weight="duotone" />
            </View>
          )}
          <Text variant="xs" tone="muted" numberOfLines={1}>
            {file.name}
          </Text>
          {onRemove ? (
            <Pressable onPress={() => onRemove(file.fileId)} accessibilityRole="button" accessibilityLabel={t("student.removePhoto", { name: file.name })} hitSlop={8} style={{ position: "absolute", top: -6, right: -6, backgroundColor: th.surface, borderRadius: th.radius.lg }}>
              <Icon name="xCircle" size={22} color={th.danger} weight="fill" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
