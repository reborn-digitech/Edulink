import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { practiceWorksheetSchema, practiceWorksheetTopicsSchema, type PracticeWorksheetQuery } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb } from "../staff/shared";
import { subjectName } from "../family/shared";

/**
 * Worksheets, the web's /teacher/worksheets: a paper straight from the
 * practice bank — a chapter, a rung and a count — previewed here question by
 * question with its answer key. The same chapter, rung, count and seed always
 * build the same paper, so the preview and the printed sheet match; a new
 * seed ("Reshuffle") is a fresh one. Printing is the one thing a phone hands
 * to the web: the browser is the PDF engine, with the web's own words.
 */
const LETTER = (i: number) => String.fromCharCode(65 + i);

/** Minted per build, never during a render — the web's fresh-seed rule. */
function mintSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function TeacherWorksheets() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [grade, setGrade] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [level, setLevel] = useState("3");
  const [count, setCount] = useState("10");
  const [countError, setCountError] = useState<string | null>(null);
  const [paper, setPaper] = useState<PracticeWorksheetQuery | null>(null);
  const [showKey, setShowKey] = useState(false);

  const topics = useQuery({
    queryKey: ["practice", "worksheets"],
    queryFn: async () => practiceWorksheetTopicsSchema.parse(unwrap(await api().get("/api/v1/practice/worksheets"))),
  });
  const sheet = useQuery({
    queryKey: ["practice", "worksheet", paper],
    enabled: paper !== null,
    staleTime: Infinity,
    queryFn: async () => {
      const p = paper!;
      return practiceWorksheetSchema.parse(unwrap(await api().get(`/api/v1/practice/worksheets/sheet?slug=${encodeURIComponent(p.slug)}&level=${p.level}&count=${p.count}&seed=${encodeURIComponent(p.seed)}`)));
    },
  });

  const d = topics.data;
  const all = d?.topics ?? [];
  const grades = [...new Set(all.map((x) => x.classLevel))].sort((a, b) => a - b).map(String);
  const gradeValue = grade && grades.includes(grade) ? grade : (grades[0] ?? "");
  const inGrade = all.filter((x) => String(x.classLevel) === gradeValue);
  const subjects = [...new Set(inGrade.map((x) => x.subject))];
  const subjectValue = subject && subjects.includes(subject) ? subject : (subjects[0] ?? "");
  const chapters = inGrade.filter((x) => x.subject === subjectValue);
  const chosen = chapters.some((x) => x.slug === slug) ? slug! : (chapters[0]?.slug ?? "");
  const max = d?.maxQuestions ?? 30;

  const build = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > max) {
      setCountError(t("worksheets.countRange", { max }));
      return;
    }
    setCountError(null);
    setShowKey(false);
    setPaper({ slug: chosen, level: Number(level), count: n, seed: mintSeed() });
  };
  const print = (p: PracticeWorksheetQuery) => openWeb(`/teacher/worksheets/print?slug=${encodeURIComponent(p.slug)}&level=${p.level}&count=${p.count}&seed=${encodeURIComponent(p.seed)}`);

  const s = sheet.data;
  const heading = s ? `${s.topicName} · L${s.level} ${s.tierName}` : "";

  return (
    <Screen
      title={t("worksheets.title")}
      description={t("worksheets.intro")}
      refreshing={topics.isRefetching || (paper !== null && sheet.isRefetching)}
      onRefresh={() => {
        void topics.refetch();
        if (paper) void sheet.refetch();
      }}
    >
      {topics.isPending ? <Loading /> : null}
      {topics.isError ? <Failed message={topics.error.message} onRetry={() => void topics.refetch()} /> : null}
      {d && all.length === 0 ? (
        <Empty icon="printer" title={t("worksheets.title")} body={t("worksheets.noChapters")} action={<Button label={t("practice.teacherTitle")} variant="secondary" onPress={() => router.push("/(app)/practice" as never)} />} />
      ) : null}
      {d && all.length > 0 ? (
        <Card title={t("worksheets.formTitle")}>
          <Text variant="xs" tone="muted">
            {t("worksheets.formHint")}
          </Text>
          {grades.length > 1 ? <Chips label={t("nav.classes")} value={gradeValue} options={grades.map((g) => ({ value: g, label: t("practice.classN", { n: g }) }))} onChange={setGrade} /> : null}
          {subjects.length > 1 ? <Chips label={t("student.subjects")} value={subjectValue} options={subjects.map((x) => ({ value: x, label: subjectName(t, x) }))} onChange={setSubject} /> : null}
          <Chips label={t("practice.fieldChapter")} value={chosen} options={chapters.map((x) => ({ value: x.slug, label: grades.length > 1 ? x.name : `${t("practice.classN", { n: x.classLevel })} · ${x.name}` }))} onChange={setSlug} />
          <Chips label={t("practice.fieldTarget")} value={level} options={d.levels.map((l) => ({ value: String(l.level), label: `L${l.level} · ${l.tierName}` }))} onChange={setLevel} />
          <Field label={t("worksheets.fieldCount")} value={count} onChangeText={setCount} keyboardType="number-pad" maxLength={2} error={countError} />
          <Button label={t("worksheets.build")} variant={s ? "secondary" : "primary"} busy={paper !== null && sheet.isFetching} disabled={!chosen} onPress={build} icon={<Icon name="printer" size={18} weight="bold" color={s ? th.fg : th.accentFg} />} />
        </Card>
      ) : null}

      {paper && sheet.isPending && sheet.isFetching ? <Loading /> : null}
      {paper && sheet.isError ? <Failed message={sheet.error.message} onRetry={() => void sheet.refetch()} /> : null}
      {s && paper ? (
        <>
          <Card title={heading}>
            <Text variant="xs" tone="muted">
              {`${t("practice.classN", { n: s.classLevel })} · ${subjectName(t, s.subject)} · ${t("worksheets.paperMeta", { count: s.questions.length, seed: s.seed })}`}
            </Text>
            <Button label={t("reportView.printOrSave")} onPress={() => print(paper)} icon={<Icon name="printer" size={18} weight="bold" color={th.accentFg} />} />
            <Button label={t("worksheets.reshuffle")} variant="secondary" busy={sheet.isFetching} onPress={() => setPaper({ ...paper, seed: mintSeed() })} icon={<Icon name="arrowsClockwise" size={18} weight="bold" color={th.fg} />} />
          </Card>
          <Card>
            {s.questions.map((q) => (
              <View key={q.number} style={{ gap: th.space[1], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
                <Text variant="base" bold>
                  {`${q.number}. ${q.stem}`}
                </Text>
                {q.choices.map((choice, i) => (
                  <Text key={i} variant="sm">
                    {`(${LETTER(i)}) ${choice}`}
                  </Text>
                ))}
              </View>
            ))}
          </Card>
          <Button label={showKey ? t("worksheets.hideKey") : t("worksheets.showKey")} variant="ghost" onPress={() => setShowKey((v) => !v)} />
          {showKey ? (
            <Card title={`${t("worksheets.keyTitle")} — ${heading}`}>
              {s.questions.map((q) => (
                <View key={q.number} style={{ gap: 2, paddingVertical: th.space[1] }}>
                  <Text variant="sm" bold>
                    {`${q.number}. (${LETTER(q.answerIndex)}) ${q.choices[q.answerIndex] ?? ""}`}
                  </Text>
                  {q.solution ? (
                    <Text variant="xs" tone="muted">
                      {q.solution}
                    </Text>
                  ) : null}
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
