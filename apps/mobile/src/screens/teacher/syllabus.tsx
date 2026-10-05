import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { lessonPlanSavedSchema, okSchema, planTemplateAppliedSchema, planTemplateSavedSchema, planTemplatesSchema, staffSyllabusSchema, substitutionAssignedSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, Tabs } from "../family/shared";
import { Chips, formatDateKey } from "../staff/shared";
import { dayLabel, todayKey } from "./support";

/**
 * A class's syllabus — the web's /teacher/classes/[classId]/syllabus: the
 * grade's chapter list for one subject with where the class has got to,
 * ticked along by its teacher (not started, in progress, done), and the
 * lessons planned and taught under it. Marking a lesson taught moves its
 * chapter to in progress on the server; the screen rereads after every
 * write so what it shows is what stands.
 */
export const SYLLABUS_PATH = "/api/v1/staff/syllabus";
export const LESSONS_PATH = "/api/v1/staff/lessons";
export const SYLLABUS_KEY = ["staff", "syllabus"] as const;
export const TEMPLATES_PATH = "/api/v1/teaching/plan-templates";
export const TEMPLATES_KEY = ["teaching", "plan-templates"] as const;

type StaffSyllabus = z.infer<typeof staffSyllabusSchema>;
type Unit = StaffSyllabus["units"][number];
type Lesson = StaffSyllabus["lessons"][number];
type UnitStatus = Unit["status"];
type LessonStatus = Lesson["status"];

const UNIT_STATUSES: UnitStatus[] = ["NOT_STARTED", "IN_PROGRESS", "DONE"];
const UNIT_STATUS_KEY: Record<UnitStatus, TranslationKey> = { NOT_STARTED: "syllabus.markNotStarted", IN_PROGRESS: "syllabus.markInProgress", DONE: "syllabus.markDone" };
const UNIT_STATUS_LABEL: Record<UnitStatus, TranslationKey> = { NOT_STARTED: "syllabus.notStarted", IN_PROGRESS: "syllabus.inProgress", DONE: "syllabus.done" };
const LESSON_STATUS_KEY: Record<LessonStatus, TranslationKey> = { PLANNED: "syllabus.planned", TAUGHT: "syllabus.taught", SKIPPED: "syllabus.skipped" };
const LESSON_STATUS_TONE: Record<LessonStatus, "muted" | "ok" | "warn"> = { PLANNED: "muted", TAUGHT: "ok", SKIPPED: "warn" };
const LESSON_MARK_KEY: Record<LessonStatus, TranslationKey> = { TAUGHT: "syllabus.markTaught", SKIPPED: "syllabus.markSkipped", PLANNED: "syllabus.markPlanned" };
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function TeacherSyllabus() {
  const params = useLocalSearchParams<{ classId?: string; subject?: string }>();
  const classId = params.classId;
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [subject, setSubject] = useState<string | null>(params.subject ?? null);
  const [planning, setPlanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const query = useQuery({
    queryKey: [...SYLLABUS_KEY, classId, subject ?? ""],
    placeholderData: keepPreviousData,
    queryFn: async () => staffSyllabusSchema.parse(unwrap(await api().get(`${SYLLABUS_PATH}?classId=${classId}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`))),
    enabled: Boolean(classId),
  });
  const d = query.data;
  if (!classId) {
    return (
      <Screen title={t("syllabus.title")}>
        <Failed message={t("teacher.classNotFound")} />
      </Screen>
    );
  }
  const current = d?.subject ?? subject;
  const done = d ? d.units.filter((u) => u.status === "DONE").length : 0;
  const openPlanner = () => setPlanning(true);
  return (
    <Screen
      title={d && current ? t("syllabus.classTitle", { className: d.className, subject: current }) : (d?.className ?? t("syllabus.title"))}
      description={d ? t("syllabus.lessonsHint") : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.subjects.length === 0 || !current ? (
          <Empty icon="books" title={t("syllabus.noSubjects")} action={<Button label={t("nav.timetable")} variant="secondary" onPress={() => router.push("/(app)/timetable" as never)} />} />
        ) : (
          <>
            {d.subjects.length > 1 ? <Tabs<string> label={t("syllabus.subject")} current={current} onChange={setSubject} tabs={d.subjects.map((s) => ({ key: s, label: s }))} /> : null}
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Stat label={t("syllabus.status")} value={d.percent === null ? "—" : `${d.percent}%`} tone={d.percent === null ? "fg" : "accent"} />
              <Stat label={t("syllabus.chapters")} value={`${done}/${d.units.length}`} />
              <Stat label={t("syllabus.lessons")} value={d.lessons.length} />
            </View>

            <Card title={t("syllabus.chapters")}>
              {d.units.length === 0 ? (
                <Empty icon="books" title={t("syllabus.noUnitsForClass")} body={t("syllabus.noUnitsForClassBody")} action={<Button label={t("syllabus.planLesson")} variant="secondary" onPress={openPlanner} />} />
              ) : (
                d.units.map((u) => <UnitRow key={u.id} classId={classId} unit={u} canEdit={d.canEdit} />)
              )}
            </Card>

            <Card title={t("syllabus.lessons")} action={d.canEdit && !planning ? <Button label={t("syllabus.planLesson")} variant="ghost" onPress={openPlanner} /> : undefined}>
              {planning ? <LessonForm classId={classId} subject={current} units={d.units} onClose={() => setPlanning(false)} /> : null}
              {/* The school's templates for this subject: copy one in as a new planned lesson (never a link). */}
              {d.canEdit && !applying ? <Button label={t("planTemplates.apply")} variant="ghost" onPress={() => setApplying(true)} /> : null}
              {applying ? <ApplyTemplate classId={classId} subject={current} units={d.units} onClose={() => setApplying(false)} /> : null}
              {d.lessons.length === 0 ? (
                <Empty icon="clipboard" title={t("syllabus.noLessons")} action={<Button label={t("syllabus.planLesson")} variant="secondary" onPress={openPlanner} />} />
              ) : (
                d.lessons.map((l) => <LessonRow key={l.id} lesson={l} canEdit={d.canEdit} />)
              )}
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}

/** One chapter: its place and title, when it was done and by whom, its lesson count, and the three-way status the teacher ticks. */
function UnitRow({ classId, unit, canEdit }: { classId: string; unit: Unit; canEdit: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const save = useMutation({
    mutationFn: async (status: UnitStatus) => okSchema.parse(unwrap(await api().post(`${SYLLABUS_PATH}/progress`, { classId, unitId: unit.id, status }))),
    onSuccess: () => {
      toast.show(t("syllabus.progressSaved"), "ok");
      void qc.invalidateQueries({ queryKey: SYLLABUS_KEY });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const caption = [
    unit.periodsPlanned !== null ? `${t("syllabus.periodsPlanned")} ${unit.periodsPlanned}` : null,
    unit.doneOn ? `${t("syllabus.doneOn", { date: formatDateKey(unit.doneOn, locale) })}${unit.byName ? ` ${t("syllabus.doneBy", { name: unit.byName })}` : ""}` : null,
    unit.lessons > 0 ? `${t("syllabus.lessons")} ${unit.lessons}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Text variant="base" bold>
        {`${unit.position}. ${unit.title}`}
      </Text>
      {caption ? (
        <Text variant="xs" tone="muted">
          {caption}
        </Text>
      ) : null}
      {canEdit ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={`${t("syllabus.status")}: ${unit.title}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          {UNIT_STATUSES.map((s) => (
            <StatusChip key={s} status={s} selected={unit.status === s} label={t(UNIT_STATUS_KEY[s])} name={unit.title} disabled={save.isPending} onPress={() => unit.status !== s && save.mutate(s)} />
          ))}
        </View>
      ) : (
        <Pill label={t(UNIT_STATUS_LABEL[unit.status])} tone={unit.status === "DONE" ? "ok" : unit.status === "IN_PROGRESS" ? "accent" : "muted"} />
      )}
    </View>
  );
}

function StatusChip({ status, selected, label, name, disabled, onPress }: { status: UnitStatus; selected: boolean; label: string; name: string; disabled: boolean; onPress: () => void }) {
  const th = useTheme();
  const colour = { NOT_STARTED: [th.fgMuted, th.surfaceMuted], IN_PROGRESS: [th.accentStrong, th.accentSoft], DONE: [th.ok, th.okSoft] }[status] as [string, string];
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={`${label}: ${name}`}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: th.tap, paddingHorizontal: th.space[3], alignItems: "center", justifyContent: "center", borderRadius: th.radius.md, borderWidth: 2, borderColor: selected ? colour[0] : th.border, backgroundColor: selected ? colour[1] : th.surface, opacity: pressed || disabled ? 0.8 : 1 })}
    >
      <Text variant="sm" bold style={{ color: selected ? colour[0] : th.fgMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** One lesson: its day and topic, the chapter it sits under, notes and homework, who planned it, its status and the moves out of it. */
function LessonRow({ lesson, canEdit }: { lesson: Lesson; canEdit: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const save = useMutation({
    mutationFn: async (status: LessonStatus) => okSchema.parse(unwrap(await api().post(`${LESSONS_PATH}/${lesson.id}/status`, { status }))),
    onSuccess: () => {
      toast.show(t("syllabus.lessonSaved"), "ok");
      void qc.invalidateQueries({ queryKey: SYLLABUS_KEY });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const keep = useMutation({
    mutationFn: async () => planTemplateSavedSchema.parse(unwrap(await api().post(TEMPLATES_PATH, { lessonId: lesson.id }))),
    onSuccess: () => {
      toast.show(t("planTemplates.kept"), "ok");
      void qc.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const moves: LessonStatus[] = (["TAUGHT", "SKIPPED", "PLANNED"] as LessonStatus[]).filter((s) => s !== lesson.status);
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <Text variant="base" bold style={{ flex: 1 }}>
          {`${dayLabel(lesson.dateKey, locale)} · ${lesson.topic}`}
        </Text>
        <Pill label={t(LESSON_STATUS_KEY[lesson.status])} tone={LESSON_STATUS_TONE[lesson.status]} />
      </View>
      <Text variant="xs" tone="muted">
        {[`${t("syllabus.lessonUnit")}: ${lesson.unitTitle ?? t("syllabus.lessonNoUnit")}`, t("syllabus.byTeacher", { name: lesson.teacherName })].join(" · ")}
      </Text>
      {lesson.notes ? (
        <Text variant="sm">
          {lesson.notes}
        </Text>
      ) : null}
      {lesson.homework ? (
        <Text variant="sm" tone="muted">
          {`${t("syllabus.lessonHomework")}: ${lesson.homework}`}
        </Text>
      ) : null}
      {canEdit ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          {moves.map((s) => (
            <Button key={s} label={t(LESSON_MARK_KEY[s])} accessibilityLabel={`${t(LESSON_MARK_KEY[s])}: ${lesson.topic}`} variant={s === "TAUGHT" ? "secondary" : "ghost"} busy={save.isPending && save.variables === s} disabled={save.isPending} onPress={() => save.mutate(s)} />
          ))}
          <Button label={t("planTemplates.keep")} accessibilityLabel={`${t("planTemplates.keep")}: ${lesson.topic}`} variant="ghost" busy={keep.isPending} disabled={save.isPending} onPress={() => keep.mutate()} />
        </View>
      ) : null}
    </View>
  );
}

/** Plan a lesson (or log one already taught): the day, the chapter it sits under, the topic, notes and homework. */
function LessonForm({ classId, subject, units, onClose }: { classId: string; subject: string; units: Unit[]; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [dateKey, setDateKey] = useState(todayKey());
  const [unitId, setUnitId] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState<LessonStatus>("PLANNED");
  const [tried, setTried] = useState(false);
  const dateError = DATE_KEY.test(dateKey.trim()) ? null : t("refusal.useRealDateForm");
  const topicMissing = topic.trim().length === 0;
  const save = useMutation({
    mutationFn: async () =>
      lessonPlanSavedSchema.parse(
        unwrap(await api().post(LESSONS_PATH, { classId, subject, unitId: unitId || null, dateKey: dateKey.trim(), topic: topic.trim(), notes: notes.trim(), homework: homework.trim(), status })),
      ),
    onSuccess: () => {
      toast.show(t("syllabus.lessonSaved"), "ok");
      void qc.invalidateQueries({ queryKey: SYLLABUS_KEY });
      onClose();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const submit = () => {
    setTried(true);
    if (dateError || topicMissing) return;
    save.mutate();
  };
  return (
    <View style={{ gap: th.space[3], paddingBottom: th.space[3], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Field label={t("syllabus.lessonDate")} value={dateKey} onChangeText={setDateKey} error={tried ? dateError : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" placeholder="YYYY-MM-DD" />
      <Chips<string> label={t("syllabus.lessonUnit")} value={unitId} options={[{ value: "", label: t("syllabus.lessonNoUnit") }, ...units.map((u) => ({ value: u.id, label: `${u.position}. ${u.title}` }))]} onChange={setUnitId} />
      <Field label={t("syllabus.lessonTopic")} value={topic} onChangeText={setTopic} maxLength={160} error={tried && topicMissing ? t("refusal.required") : null} />
      <Field label={t("syllabus.lessonNotes")} value={notes} onChangeText={setNotes} multiline maxLength={2000} />
      <Field label={t("syllabus.lessonHomework")} value={homework} onChangeText={setHomework} multiline maxLength={1000} />
      <Chips<LessonStatus>
        label={t("syllabus.lessonStatus")}
        value={status}
        options={[
          { value: "PLANNED", label: t("syllabus.planned") },
          { value: "TAUGHT", label: t("syllabus.taught") },
        ]}
        onChange={setStatus}
      />
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button label={status === "TAUGHT" ? t("syllabus.logLesson") : t("syllabus.planLesson")} busy={save.isPending} onPress={submit} />
        <Button label={t("common.cancel")} variant="secondary" disabled={save.isPending} onPress={onClose} />
      </View>
    </View>
  );
}

/**
 * Copy a template in: the school's templates for this subject (mine first),
 * the chapter the copy goes under, the day. The copy is a new planned
 * lesson; the template is untouched. The author may take their own out.
 */
function ApplyTemplate({ classId, subject, units, onClose }: { classId: string; subject: string; units: Unit[]; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [templateId, setTemplateId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [dateKey, setDateKey] = useState(todayKey());
  const [tried, setTried] = useState(false);
  const list = useQuery({
    queryKey: [...TEMPLATES_KEY, subject],
    queryFn: async () => planTemplatesSchema.parse(unwrap(await api().get(`${TEMPLATES_PATH}?subject=${encodeURIComponent(subject)}`))),
  });
  const items = list.data?.items ?? [];
  const chosenId = templateId || items[0]?.id || "";
  const chosen = items.find((x) => x.id === chosenId) ?? null;
  const dateError = DATE_KEY.test(dateKey.trim()) ? null : t("refusal.useRealDateForm");
  const apply = useMutation({
    mutationFn: async () => planTemplateAppliedSchema.parse(unwrap(await api().post(`${TEMPLATES_PATH}/${chosenId}/apply`, { classId, unitId: unitId || null, dateKey: dateKey.trim() }))),
    onSuccess: () => {
      toast.show(t("planTemplates.applied"), "ok");
      void qc.invalidateQueries({ queryKey: SYLLABUS_KEY });
      onClose();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const remove = useMutation({
    mutationFn: async () => substitutionAssignedSchema.parse(unwrap(await api().request("DELETE", `${TEMPLATES_PATH}/${chosenId}`))),
    onSuccess: () => {
      toast.show(t("planTemplates.removed"), "ok");
      setTemplateId("");
      void qc.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const submit = () => {
    setTried(true);
    if (dateError || !chosenId) return;
    apply.mutate();
  };
  return (
    <View style={{ gap: th.space[3], paddingBottom: th.space[3], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Text variant="sm" bold>
        {t("planTemplates.title")}
      </Text>
      <Text variant="xs" tone="muted">
        {t("planTemplates.hint")}
      </Text>
      {list.isPending ? <Loading /> : null}
      {list.isError ? <Failed error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.data && items.length === 0 ? (
        <Empty icon="clipboard" title={t("planTemplates.none")} action={<Button label={t("common.cancel")} variant="secondary" onPress={onClose} />} />
      ) : null}
      {items.length > 0 ? (
        <>
          <Chips<string> label={t("planTemplates.template")} value={chosenId} options={items.map((x) => ({ value: x.id, label: x.own ? t("planTemplates.ownLabel", { title: x.title }) : t("planTemplates.othersLabel", { title: x.title, name: x.authorName }) }))} onChange={setTemplateId} />
          {chosen ? (
            <View style={{ gap: 2, padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}>
              <Text variant="sm" bold>
                {chosen.topic}
              </Text>
              {chosen.notes ? <Text variant="sm">{chosen.notes}</Text> : null}
              {chosen.homework ? (
                <Text variant="sm" tone="muted">
                  {`${t("syllabus.lessonHomework")}: ${chosen.homework}`}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Chips<string> label={t("syllabus.lessonUnit")} value={unitId} options={[{ value: "", label: t("syllabus.lessonNoUnit") }, ...units.map((u) => ({ value: u.id, label: `${u.position}. ${u.title}` }))]} onChange={setUnitId} />
          <Field label={t("syllabus.lessonDate")} value={dateKey} onChangeText={setDateKey} error={tried ? dateError : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" placeholder="YYYY-MM-DD" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("planTemplates.apply")} busy={apply.isPending} disabled={remove.isPending} onPress={submit} />
            {chosen?.own ? <Button label={t("planTemplates.remove")} variant="ghost" busy={remove.isPending} disabled={apply.isPending} onPress={() => remove.mutate()} /> : null}
            <Button label={t("common.cancel")} variant="secondary" disabled={apply.isPending || remove.isPending} onPress={onClose} />
          </View>
        </>
      ) : null}
    </View>
  );
}
