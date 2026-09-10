import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { practiceCreatedSchema, setPracticeSchema, staffPracticeSchema, type SetPracticeBody, type StaffPractice } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { formatDateKey, levelName, subjectName } from "../family/shared";

/**
 * Practice insights, the web's /teacher/practice: where one class stands on
 * the drill ladders, chapter by rung — counts, never rankings — the chapters
 * set for it with attainment the ladder proved itself, and the form that sets
 * another. Worksheets open the phone's own screen (route "worksheets").
 */
const LEVELS = [1, 2, 3, 4, 5, 6];

export function TeacherPractice() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["staff", "practice", picked],
    placeholderData: keepPreviousData,
    queryFn: async () => staffPracticeSchema.parse(unwrap(await api().get(`/api/v1/staff/practice${picked ? `?classId=${picked}` : ""}`))),
  });
  const archive = useMutation({
    mutationFn: async (id: string) => unwrap(await api().post("/api/v1/staff/practice/archive", { id })),
    onSuccess: () => {
      setConfirming(null);
      void qc.invalidateQueries({ queryKey: ["staff", "practice"] });
    },
  });
  const d = query.data;
  const classId = d?.selectedClassId ?? d?.classes[0]?.id ?? null;
  const klass = d?.classes.find((c) => c.id === classId) ?? null;

  return (
    <Screen title={t("practice.teacherTitle")} description={t("practice.teacherIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.classes.length === 0 ? (
        <Empty title={t("practice.teacherTitle")} body={t("teacher.noClassesYet")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
      ) : null}
      {d && klass && classId ? (
        <>
          {d.classes.length > 1 ? <Chips label={t("nav.classes")} value={klass.id} options={d.classes.map((c) => ({ value: c.id, label: c.name }))} onChange={setPicked} /> : null}
          {d.weekly && d.weekly.pupilCount > 0 ? (
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Stat label={t("practice.weeklyPracticed")} value={`${d.weekly.practiced}/${d.weekly.pupilCount}`} tone="accent" />
              <Stat label={t("practice.weeklyAnswers")} value={d.weekly.answers} />
              <Stat label={t("practice.weeklyClimbs")} value={d.weekly.climbs} tone="ok" />
              <Stat label={t("practice.weeklyMisses")} value={d.weekly.misses} tone={d.weekly.misses > 0 ? "warn" : "fg"} />
            </View>
          ) : null}

          {d.gaps.length > 0 ? (
            <Card title={t("practice.gapsTitle")}>
              <Text variant="xs" tone="muted">
                {t("practice.gapsHint")}
              </Text>
              {d.gaps.map((g) => (
                <Row key={g.slug} title={g.name} caption={subjectName(t, g.subject)} right={<Text variant="sm" tone="warn" bold>{t("practice.gapsStuck", { count: g.stuckCount, level: g.level })}</Text>} />
              ))}
            </Card>
          ) : null}

          <Card title={t("practice.heatmapTitle")}>
            <Text variant="xs" tone="muted">
              {t("practice.heatmapHint")}
            </Text>
            {!d.heatmap || d.heatmap.rows.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("practice.heatmapEmpty")}
              </Text>
            ) : (
              d.heatmap.rows.map((row) => (
                <Row
                  key={row.slug}
                  title={row.name}
                  caption={`${subjectName(t, row.subject)} · ${t("practice.colPupils")} ${row.tried}/${d.heatmap?.pupilCount ?? 0}`}
                  right={
                    <Text variant="xs" tone="accent" bold>
                      {row.atLevel.map((n, i) => (n > 0 ? `L${i + 1} ${n}` : null)).filter(Boolean).join(" · ") || "—"}
                    </Text>
                  }
                />
              ))
            )}
          </Card>

          <SetChapter classId={classId} topics={d.topicOptions} note={note} onDone={setNote} />

          {archive.isError ? <Failed message={archive.error.message} onRetry={() => (confirming ? archive.mutate(confirming) : archive.reset())} /> : null}
          {d.assignments.length === 0 ? (
            <Empty title={t("practice.assignmentsTitle")} body={t("practice.assignmentsEmpty")} action={<Button label={t("worksheets.title")} variant="secondary" onPress={() => router.push("/(app)/worksheets" as never)} />} />
          ) : (
            <Card title={t("practice.assignmentsTitle")}>
              {d.assignments.map((a) => (
                <View key={a.id} style={{ gap: th.space[1] }}>
                  <Row
                    title={a.topicName}
                    caption={[t("practice.assignedTarget", { tier: a.targetTierName, level: a.targetLevel }), a.dueAt ? formatDateKey(a.dueAt.slice(0, 10), locale) : null, a.note].filter(Boolean).join(" · ")}
                    right={
                      <Text variant="sm" bold tone={a.reached >= a.pupilCount && a.pupilCount > 0 ? "ok" : "fg"}>
                        {t("practice.reachedCount", { reached: a.reached, total: a.pupilCount })}
                      </Text>
                    }
                  />
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    {a.pupils.map((p) => (
                      <Text key={p.name} variant="xs" tone={p.reached ? "ok" : "muted"}>
                        {`${p.name} · ${p.level > 0 ? `L${p.level}` : "—"}`}
                      </Text>
                    ))}
                  </View>
                  {confirming === a.id ? (
                    <View style={{ flexDirection: "row", gap: th.space[2] }}>
                      <Button label={t("common.confirm")} variant="danger" busy={archive.isPending} onPress={() => archive.mutate(a.id)} style={{ flexGrow: 1 }} />
                      <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(null)} style={{ flexGrow: 1 }} />
                    </View>
                  ) : (
                    <Button label={t("practice.remove")} variant="ghost" onPress={() => setConfirming(a.id)} />
                  )}
                </View>
              ))}
            </Card>
          )}
          <Button label={t("worksheets.title")} variant="secondary" onPress={() => router.push("/(app)/worksheets" as never)} />
        </>
      ) : null}
    </Screen>
  );
}

/** The web's "Set a chapter" form: a subject, a chapter in it, a target rung, a note and a due day. */
function SetChapter({ classId, topics, note, onDone }: { classId: string; topics: StaffPractice["topicOptions"]; note: string | null; onDone: (sentence: string | null) => void }) {
  const t = useT();
  const qc = useQueryClient();
  const subjects = [...new Set(topics.map((x) => x.subject))];
  const [subject, setSubject] = useState<string>(subjects[0] ?? "");
  const [slug, setSlug] = useState<string>("");
  const [level, setLevel] = useState("3");
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inSubject = topics.filter((x) => x.subject === (subjects.includes(subject) ? subject : subjects[0]));
  const chosen = inSubject.some((x) => x.slug === slug) ? slug : inSubject[0]?.slug ?? "";
  const set = useMutation({
    mutationFn: async (body: SetPracticeBody) => practiceCreatedSchema.parse(unwrap(await api().post("/api/v1/staff/practice", body))),
    onSuccess: () => {
      setText("");
      setDue("");
      onDone(t("practice.setDone"));
      void qc.invalidateQueries({ queryKey: ["staff", "practice"] });
    },
  });
  const submit = () => {
    onDone(null);
    const parsed = setPracticeSchema.safeParse({ classId, topicSlug: chosen, targetLevel: Number(level), note: text.trim() || undefined, dueDate: due.trim() || undefined });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? "")] = t("common.checkTheForm");
      setErrors(next);
      return;
    }
    setErrors({});
    set.mutate(parsed.data);
  };
  return (
    <Card title={t("practice.setTitle")}>
      <Text variant="xs" tone="muted">
        {t("practice.setHint")}
      </Text>
      {topics.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("practice.setNoChapters")}
        </Text>
      ) : (
        <>
          {subjects.length > 1 ? <Chips label={t("nav.practice")} value={subjects.includes(subject) ? subject : subjects[0]!} options={subjects.map((s) => ({ value: s, label: subjectName(t, s) }))} onChange={setSubject} /> : null}
          <Chips label={t("practice.fieldChapter")} value={chosen} options={inSubject.map((x) => ({ value: x.slug, label: subjects.length > 1 ? x.name : `${t("practice.classN", { n: x.classLevel })} · ${x.name}` }))} onChange={setSlug} />
          <Chips label={t("practice.fieldTarget")} value={level} options={LEVELS.map((n) => ({ value: String(n), label: `L${n} · ${levelName(t, n)}` }))} onChange={setLevel} />
          <Field label={t("practice.fieldNote")} value={text} onChangeText={setText} error={errors.note} />
          <Field label={t("practice.fieldDue")} value={due} onChangeText={setDue} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.dueDate} />
          {errors.topicSlug ? <Failed message={t("common.checkTheForm")} /> : null}
          {set.isError ? <Failed message={set.error.message} onRetry={submit} /> : null}
          {note ? <Notice text={note} /> : null}
          <Button label={t("practice.setSubmit")} onPress={submit} busy={set.isPending} />
        </>
      )}
    </Card>
  );
}
