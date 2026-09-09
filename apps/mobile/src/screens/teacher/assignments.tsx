import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignmentCreatedSchema, newAssignmentSchema, staffAssignmentsSchema, type NewAssignmentBody } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, Notice, openWeb } from "../staff/shared";
import { Pill, formatMilli } from "../family/shared";
import { relativeTime } from "./support";

/**
 * Assignments, the web's /teacher/assignments: this year's work by default
 * (all years on request), the same three filters — to mark, past due, draft —
 * a class filter when there is more than one class, and the form that sets a
 * new piece of work. Handouts travel as files, so they stay on the web; the
 * gradebook for one assignment opens there too. An admin sees every class.
 */
type State = "" | "tomark" | "overdue" | "draft";

/** The web form's category list — stored values, so they stay in English. */
const CATEGORIES = ["Homework", "Classwork", "Quiz", "Test", "Project", "Reading"];

export function assignmentsPath(allYears: boolean, classId: string | null, state: State): string {
  const parts: string[] = [];
  if (allYears) parts.push("years=all");
  if (classId) parts.push(`classId=${classId}`);
  if (state) parts.push(`state=${state}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export function TeacherAssignments() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [allYears, setAllYears] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);
  const [state, setState] = useState<State>("");
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["staff", "assignments", allYears, classId, state],
    placeholderData: keepPreviousData,
    queryFn: async () => staffAssignmentsSchema.parse(unwrap(await api().get(`/api/v1/staff/assignments${assignmentsPath(allYears, classId, state)}`))),
  });
  const publish = useMutation({
    mutationFn: async (assignmentId: string) => unwrap(await api().post("/api/v1/staff/assignments/publish", { assignmentId })),
    onSuccess: () => {
      setNote(`${t("teacher.published")} ${t("teacher.classTold")}`);
      void qc.invalidateQueries({ queryKey: ["staff", "assignments"] });
      void qc.invalidateQueries({ queryKey: ["staff", "today"] });
    },
  });

  const d = query.data;
  const filtered = Boolean(classId || state);
  const toMark = d ? d.assignments.filter((a) => a.publishedAt && a.graded < a.class.students).length : 0;
  const drafts = d ? d.assignments.filter((a) => !a.publishedAt).length : 0;
  const clear = () => {
    setClassId(null);
    setState("");
  };

  return (
    <Screen
      title={t("teacher.assignments")}
      description={d ? (d.total === 0 ? t("teacher.nothingSetYetShort") : d.total === 1 ? t("teacher.piecesOfWorkOne") : t("teacher.piecesOfWorkMany", { count: d.total })) : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.classOptions.length === 0 ? (
        <Empty title={t("teacher.noClassesYet")} body={t("teacher.assignmentsBelong")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
      ) : null}
      {d && d.classOptions.length > 0 ? (
        <>
          {composing ? (
            <NewAssignment
              classes={d.classOptions}
              onDone={(sentence) => {
                setNote(sentence);
                setComposing(false);
              }}
              onClose={() => setComposing(false)}
            />
          ) : (
            <Button label={t("teacher.newAssignment")} onPress={() => setComposing(true)} />
          )}
          {note ? <Notice text={note} /> : null}
          {publish.isError ? <Failed message={publish.error.message} onRetry={() => publish.reset()} /> : null}

          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("teacher.assignments")} value={d.total} />
            <Stat label={t("teacher.toMark")} value={toMark} tone={toMark > 0 ? "warn" : "ok"} />
            {drafts > 0 ? <Stat label={t("teacher.draft")} value={drafts} tone="accent" /> : null}
          </View>

          {d.year && d.year.allCount > d.year.thisYearCount ? (
            <Chips
              label={t("teacher.assignments")}
              value={allYears ? "all" : "year"}
              options={[
                { value: "year", label: `${t("teacher.thisYear", { name: d.year.name })} · ${d.year.thisYearCount}` },
                { value: "all", label: `${t("teacher.allYears")} · ${d.year.allCount}` },
              ]}
              onChange={(v) => setAllYears(v === "all")}
            />
          ) : null}
          <Chips
            label={t("teacher.stateFilter")}
            value={state}
            options={[
              { value: "", label: t("vacancies.filterAll") },
              { value: "tomark", label: t("teacher.toMark") },
              { value: "overdue", label: t("teacher.overdueFilter") },
              { value: "draft", label: t("teacher.draft") },
            ]}
            onChange={setState}
          />
          {d.classOptions.length > 1 ? (
            <Chips label={t("teacher.classFilter")} value={classId ?? ""} options={[{ value: "", label: t("teacher.allClasses") }, ...d.classOptions.map((c) => ({ value: c.id, label: c.name }))]} onChange={(v) => setClassId(v || null)} />
          ) : null}

          {d.assignments.length === 0 ? (
            filtered ? (
              <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={clear} />} />
            ) : (
              <Empty title={t("teacher.noAssignmentsYet")} body={t("teacher.setWorkBlurb")} action={<Button label={t("teacher.setSomeWork")} variant="secondary" onPress={() => setComposing(true)} />} />
            )
          ) : (
            <Card title={t("nav.assignments")}>
              {d.assignments.map((a) => {
                const roster = a.class.students;
                const allGraded = roster > 0 && a.graded >= roster;
                const details = [a.class.name, a.category, a.pointsMilli ? `${t("teacher.pointsAvailable")}: ${formatMilli(a.pointsMilli)}` : null].filter(Boolean).join(" · ");
                const when = a.dueAt ? t("teacher.dueWhen", { when: relativeTime(a.dueAt, locale) }) : t("teacher.noDueDate");
                return (
                  <View key={a.id} style={{ gap: th.space[1] }}>
                    <Row
                      title={a.title}
                      caption={`${details} · ${when} · ${t("teacher.markedOf", { marked: a.graded, total: roster })}`}
                      right={!a.publishedAt ? <Pill label={t("teacher.draft")} tone="warn" /> : allGraded ? <Pill label={t("teacher.marked")} tone="ok" /> : <Pill label={`${roster - a.graded} · ${t("teacher.toMark")}`} tone="accent" />}
                      onPress={() => openWeb(`/teacher/assignments/${a.id}`)}
                    />
                    {!a.publishedAt ? <Button label={t("teacher.publishNow")} variant="ghost" busy={publish.isPending && publish.variables === a.id} onPress={() => publish.mutate(a.id)} /> : null}
                  </View>
                );
              })}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

/** The web's AssignmentForm without the file picker: the same fields, the same two ways out (draft, publish). */
function NewAssignment({ classes, onDone, onClose }: { classes: { id: string; name: string }[]; onDone: (sentence: string) => void; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Homework");
  const [points, setPoints] = useState("20");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("16:00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useMutation({
    mutationFn: async (body: NewAssignmentBody) => assignmentCreatedSchema.parse(unwrap(await api().post("/api/v1/staff/assignments", body))),
    onSuccess: (created, body) => {
      void qc.invalidateQueries({ queryKey: ["staff", "assignments"] });
      void qc.invalidateQueries({ queryKey: ["staff", "today"] });
      onDone(body.publish ? `${t("teacher.workSetToast")}. ${created.notified === 1 ? t("teacher.studentsToldOne") : t("teacher.studentsToldMany", { count: created.notified })}` : `${t("teacher.savedAsDraft")}. ${t("teacher.nobodyNotifiedYet")}`);
    },
  });

  const submit = (publish: boolean) => {
    const next: Record<string, string> = {};
    const pointsValue = points.trim() === "" ? undefined : Number(points);
    // A date with no time defaults to the end of the school day, as on the web, never to midnight.
    let dueAt: string | undefined;
    if (dueDate.trim()) {
      const combined = new Date(`${dueDate.trim()}T${dueTime.trim() || "16:00"}:00`);
      if (Number.isNaN(combined.getTime())) next.dueDate = t("teacher.checkHighlighted");
      else dueAt = combined.toISOString();
    }
    const parsed = newAssignmentSchema.safeParse({ classId, title: title.trim(), body: body.trim(), category: category || undefined, points: pointsValue, dueAt, publish });
    if (!parsed.success) for (const issue of parsed.error.issues) next[String(issue.path[0] ?? "")] = t("teacher.checkHighlighted");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    create.mutate(parsed.data!);
  };

  return (
    <Card title={t("teacher.newAssignment")} action={<Button label={t("common.cancel")} variant="ghost" onPress={onClose} />}>
      <Chips label={t("teacher.classField")} value={classId} options={classes.map((c) => ({ value: c.id, label: c.name }))} onChange={setClassId} />
      <Field label={t("teacher.title")} value={title} onChangeText={setTitle} placeholder={t("teacher.titlePlaceholder")} error={errors.title} />
      <Field label={t("teacher.instructions")} hint={t("teacher.instructionsHint")} value={body} onChangeText={setBody} placeholder={t("teacher.instructionsPlaceholder")} multiline style={{ minHeight: th.space[12] * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
      <Chips label={t("teacher.category")} value={category} options={CATEGORIES.map((c) => ({ value: c, label: c }))} onChange={setCategory} />
      <Field label={t("teacher.pointsAvailable")} hint={t("teacher.pointsHint")} value={points} onChangeText={setPoints} keyboardType="decimal-pad" error={errors.points} />
      <Field label={t("teacher.dueDate")} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.dueDate ?? errors.dueAt} />
      <Field label={t("teacher.dueTime")} hint={t("teacher.dueTimeHint")} value={dueTime} onChangeText={setDueTime} placeholder="16:00" autoCapitalize="none" />
      <Text variant="xs" tone="subtle">
        {t("teacher.handoutsHint")}
      </Text>
      <Button label={t("teacher.handouts")} variant="ghost" onPress={() => openWeb("/teacher/assignments/new")} />
      {create.isError ? <Failed message={create.error.message} onRetry={() => submit(true)} /> : null}
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("teacher.saveAsDraft")} variant="secondary" onPress={() => submit(false)} busy={create.isPending && create.variables?.publish === false} style={{ flexGrow: 1 }} />
        <Button label={t("teacher.publishNow")} onPress={() => submit(true)} busy={create.isPending && create.variables?.publish === true} style={{ flexGrow: 1 }} />
      </View>
    </Card>
  );
}
