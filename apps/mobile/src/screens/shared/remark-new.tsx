import { useMemo, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teachingRemarkPeopleSchema, teachingRemarkStartedSchema, type TeachingRemarkPeople, type TeachingStartRemarkBody } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { ApiRefused, unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { haptics } from "@/lib/haptics";
import { Chips } from "../staff/shared";
import { Pill } from "../family/shared";

/**
 * Writing about a pupil, the web's /remarks/new: one conversation between a
 * teacher, a pupil and that pupil's guardians. A teacher picks the pupil
 * (from a class page the pupil is already chosen) and is told before writing
 * when nobody at home will receive it; a pupil picks one of their teachers; a
 * guardian picks a child, then one of that child's teachers. Sending opens
 * the conversation it started.
 */
type Student = TeachingRemarkPeople["students"][number];
type Pupil = TeachingRemarkPeople["pupils"][number];
type Errors = Record<string, string>;

/* Keys, not words — looked up in the reader's language. */
const SUGGESTIONS: TranslationKey[] = ["remarks.suggestionUpdate", "remarks.suggestionLovely", "remarks.suggestionConcern", "remarks.suggestionHomework", "remarks.suggestionAbsence"];

export function RemarkNew() {
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const t = useT();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["teaching", "remarks"],
    queryFn: async () => teachingRemarkPeopleSchema.parse(unwrap(await api().get("/api/v1/teaching/remarks"))),
  });
  const d = query.data;
  const teacher = !d || d.role === "TEACHER";
  return (
    <Screen
      title={teacher ? t("remarks.newMessage") : t("remarks.messageATeacher")}
      description={d ? (teacher ? t("remarks.goesToGuardiansOnly") : t("remarks.oneConversation")) : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.role === "TEACHER" ? (
        d.students.length === 0 ? (
          <Empty title={t("remarks.noStudentsYet")} body={t("remarks.noStudentsBody")} icon="users" action={<Button label={t("remarks.backToToday")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
        ) : (
          <ComposeForm students={d.students} preselected={membershipId} />
        )
      ) : null}
      {d && d.role !== "TEACHER" ? (
        d.pupils.length === 0 ? (
          <Empty title={t("remarks.noTeachersChild")} icon="users" action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
        ) : (
          <AskForm pupils={d.pupils} selfOnly={d.selfOnly} preselected={membershipId} />
        )
      ) : null}
    </Screen>
  );
}

/** POST /api/v1/teaching/remarks, then the thread it made; the server's field sentences go back to their fields. */
function useStartThread(onIssues: (issues: Errors) => void) {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (body: TeachingStartRemarkBody) => {
      const result = await api().post("/api/v1/teaching/remarks", body);
      if (!result.ok) {
        if (result.issues) onIssues(result.issues);
        throw new ApiRefused(result.status, errorText(result, t("remarks.couldNotSend")));
      }
      return teachingRemarkStartedSchema.parse(result.data);
    },
    onSuccess: (started) => {
      toast.show(t("remarks.messageSent"));
      void qc.invalidateQueries({ queryKey: ["shared", "inbox"] });
      router.push({ pathname: "/(app)/messages/thread", params: { threadId: started.threadId } } as never);
    },
  });
}

/** A teacher writing to a pupil's family: find the pupil, then the subject and the message. */
function ComposeForm({ students, preselected }: { students: Student[]; preselected?: string }) {
  const t = useT();
  const th = useTheme();
  const [studentId, setStudentId] = useState(students.some((s) => s.membershipId === preselected) ? preselected! : "");
  const [choosing, setChoosing] = useState(!studentId);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const send = useStartThread(setErrors);
  const selected = students.find((s) => s.membershipId === studentId);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? students.filter((s) => s.fullName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)) : students;
  }, [students, search]);

  const submit = () => {
    const next: Errors = {};
    if (!studentId) next.studentMembershipId = t("remarks.chooseStudentDot");
    if (subject.trim().length < 2) next.subject = t("remarks.shortSubject");
    if (body.trim().length < 1) next.body = t("remarks.writeYourMessage");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    send.mutate({ studentMembershipId: studentId, subject: subject.trim(), body: body.trim() });
  };

  return (
    <>
      <Card title={t("remarks.whichStudent")}>
        {selected && !choosing ? (
          <>
            <Choice title={selected.fullName} caption={selected.className} checked right={selected.guardianCount === 0 ? <Pill label={t("remarks.noGuardian")} tone="warn" /> : undefined} onPress={() => setChoosing(true)} />
            <Button label={t("teaching.changePupil")} variant="ghost" onPress={() => setChoosing(true)} />
          </>
        ) : (
          <>
            <Field label={t("remarks.searchStudents")} placeholder={t("remarks.findStudent")} value={search} onChangeText={setSearch} autoCapitalize="none" returnKeyType="search" />
            {filtered.length === 0 ? (
              <Empty title={t("remarks.nobodyMatches", { query: search.trim() })} action={<Button label={t("teacher.clearSearch")} variant="secondary" onPress={() => setSearch("")} />} />
            ) : (
              <View accessibilityRole="radiogroup" accessibilityLabel={t("remarks.chooseStudent")} style={{ gap: th.space[2] }}>
                {filtered.map((s) => (
                  <Choice
                    key={s.membershipId}
                    title={s.fullName}
                    caption={s.className}
                    checked={s.membershipId === studentId}
                    right={s.guardianCount === 0 ? <Pill label={t("remarks.noGuardian")} tone="warn" /> : undefined}
                    onPress={() => {
                      setStudentId(s.membershipId);
                      setChoosing(false);
                      setErrors(({ studentMembershipId: _gone, ...rest }) => rest);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}
        {errors.studentMembershipId ? (
          <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
            {errors.studentMembershipId}
          </Text>
        ) : null}
      </Card>

      {/* Told BEFORE writing, not after sending into the void. */}
      {selected && selected.guardianCount === 0 ? <Warn text={t("remarks.noGuardianWarning", { name: selected.fullName })} /> : null}

      <Field label={t("remarks.subject")} placeholder={t("remarks.subjectPlaceholder")} value={subject} onChangeText={setSubject} maxLength={160} error={errors.subject} />
      <Chips label={t("teaching.subjectIdeas")} value={subject} options={SUGGESTIONS.map((key) => ({ value: t(key), label: t(key) }))} onChange={setSubject} />
      <Field
        label={t("remarks.message")}
        placeholder={t("remarks.messagePlaceholder")}
        value={body}
        onChangeText={setBody}
        maxLength={8000}
        multiline
        error={errors.body}
        style={{ minHeight: th.space[12] * 3, textAlignVertical: "top", paddingTop: th.space[3] }}
      />
      {send.isError ? <Failed message={send.error.message} onRetry={submit} /> : null}
      <Button label={send.isPending ? t("common.sending") : t("common.send")} icon={<Icon name="paperPlane" size={18} color={th.accentFg} weight="bold" />} busy={send.isPending} onPress={submit} />
    </>
  );
}

/** A pupil or a guardian writing to a teacher: which child (a guardian with more than one), which teacher, and who else reads it. */
function AskForm({ pupils, selfOnly, preselected }: { pupils: Pupil[]; selfOnly: boolean; preselected?: string }) {
  const t = useT();
  const th = useTheme();
  const [childId, setChildId] = useState(pupils.length === 1 ? pupils[0]!.membershipId : pupils.some((p) => p.membershipId === preselected) ? preselected! : "");
  const [teacherId, setTeacherId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const send = useStartThread(setErrors);
  const teachers = pupils.find((p) => p.membershipId === childId)?.teachers ?? [];

  const submit = () => {
    const next: Errors = {};
    if (!childId) next.child = t("remarks.chooseWhoAbout");
    if (!teacherId) next.teacher = t("remarks.chooseTeacher");
    if (subject.trim().length < 2) next.subject = t("remarks.shortSubject");
    if (body.trim().length < 1) next.body = t("remarks.writeYourMessage");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // A pupil's own membership comes from their session on the server, never from here.
    send.mutate({ studentMembershipId: selfOnly ? undefined : childId, teacherMembershipId: teacherId, subject: subject.trim(), body: body.trim() });
  };

  return (
    <>
      {pupils.length > 1 ? (
        <View style={{ gap: th.space[1] }}>
          <Chips
            label={t("remarks.whichChild")}
            value={childId}
            options={pupils.map((p) => ({ value: p.membershipId, label: p.name }))}
            onChange={(id) => {
              setChildId(id);
              setTeacherId("");
            }}
          />
          {errors.child ? (
            <Text variant="xs" tone="danger">
              {errors.child}
            </Text>
          ) : null}
        </View>
      ) : null}

      {childId ? (
        <Card title={t("remarks.writingToWhom")}>
          {teachers.length === 0 ? (
            <Text variant="sm" tone="muted">
              {selfOnly ? t("remarks.noTeachersSelf") : t("remarks.noTeachersChild")}
            </Text>
          ) : (
            <View accessibilityRole="radiogroup" accessibilityLabel={t("remarks.writingToWhom")} style={{ gap: th.space[2] }}>
              {teachers.map((teacher) => (
                <Choice
                  key={teacher.membershipId}
                  title={teacher.lead ? `${teacher.name} · ${t("remarks.classTeacher")}` : teacher.name}
                  caption={[teacher.title, teacher.classes.join(", ")].filter(Boolean).join(" · ")}
                  checked={teacher.membershipId === teacherId}
                  onPress={() => setTeacherId(teacher.membershipId)}
                />
              ))}
            </View>
          )}
          {errors.teacher ? (
            <Text variant="xs" tone="danger">
              {errors.teacher}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {/* Who else is in the room, said before anything is typed. */}
      <View style={{ flexDirection: "row", gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}>
        <Icon name="users" size={18} color={th.fgMuted} weight="duotone" />
        <Text variant="xs" tone="muted" style={{ flex: 1 }}>
          {`${selfOnly ? t("remarks.roomSelf") : t("remarks.roomChild")} ${t("remarks.schoolCanRead")}`}
        </Text>
      </View>

      <Field label={t("remarks.subject")} placeholder={t("remarks.askPlaceholder")} value={subject} onChangeText={setSubject} maxLength={160} error={errors.subject} />
      <Field
        label={t("remarks.yourMessage")}
        value={body}
        onChangeText={setBody}
        maxLength={8000}
        multiline
        error={errors.body}
        style={{ minHeight: th.space[12] * 3, textAlignVertical: "top", paddingTop: th.space[3] }}
      />
      {send.isError ? <Failed message={send.error.message} onRetry={submit} /> : null}
      <Button
        label={send.isPending ? t("common.sending") : t("common.send")}
        icon={<Icon name="paperPlane" size={18} color={th.accentFg} weight="bold" />}
        busy={send.isPending}
        disabled={Boolean(childId) && teachers.length === 0}
        onPress={submit}
      />
    </>
  );
}

/** One choice in a list, as a radio at the tap height: a pupil with their class, or a teacher with theirs. */
function Choice({ title, caption, checked, right, onPress }: { title: string; caption?: string; checked: boolean; right?: ReactNode; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={caption ? `${title}, ${caption}` : title}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: th.tap,
        flexDirection: "row",
        alignItems: "center",
        gap: th.space[3],
        padding: th.space[3],
        borderRadius: th.radius.md,
        borderWidth: 1,
        borderColor: checked ? th.accent : th.border,
        backgroundColor: checked ? th.accentSoft : th.surface,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="base" bold tone={checked ? "accent" : "fg"}>
          {title}
        </Text>
        {caption ? (
          <Text variant="xs" tone="muted">
            {caption}
          </Text>
        ) : null}
      </View>
      {right}
      {checked ? <Icon name="checkCircle" size={20} color={th.accentStrong} weight="fill" /> : null}
    </Pressable>
  );
}

function Warn({ text }: { text: string }) {
  const th = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.warnSoft }}>
      <Icon name="warning" size={18} color={th.warn} weight="fill" />
      <Text variant="sm" tone="warn" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
