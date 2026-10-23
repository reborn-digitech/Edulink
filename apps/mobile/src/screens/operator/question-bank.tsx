import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankStatsSchema, contestBankSchema, contestBankTopicSchema, contestQuestionSavedSchema, type ContestBank, type ContestBankQuestion, type ContestQuestion } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, must, Refusal } from "../staff/shared";
import { formatInstant, levelName, param, Pill, subjectName } from "../family/shared";

type Topic = ContestBank["topics"][number];
const LEVELS = ["1", "2", "3", "4", "5", "6"] as const;
type Level = (typeof LEVELS)[number];
type Missing = "" | "hi" | "mr";

/**
 * The content team's question bank, the web's /appadmin/bank, as one route in
 * three depths: the chapters (no params), a chapter's questions ({ topicId }),
 * and one question ({ topicId, questionId }). A question is written in
 * English; the save translates it, and the toast says whether that ran.
 * Adding one, and editing one, happen on the chapter and the question.
 */
export function QuestionBank() {
  const params = useLocalSearchParams<{ topicId?: string; questionId?: string }>();
  const topicId = param(params.topicId);
  const questionId = param(params.questionId);
  return topicId ? <Chapter key={`${topicId}:${questionId ?? ""}`} topicId={topicId} questionId={questionId ?? null} /> : <Topics />;
}

/** Every chapter, grouped as the syllabus reads (subject, then class), narrowed on the phone as the web's toolbar narrows it. */
function Topics() {
  const t = useT();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["appadmin", "bank"],
    queryFn: async () => contestBankSchema.parse(unwrap(await api().get("/api/v1/appadmin/bank"))),
  });
  const all = query.data?.topics ?? [];
  const subjects = [...new Set(all.map((x) => x.subject))];
  const needle = q.trim().toLowerCase();
  const topics = all.filter((x) => (!subject || x.subject === subject) && (!needle || [x.name, x.chapter, String(x.classLevel)].join(" ").toLowerCase().includes(needle)));
  const narrowed = Boolean(subject || needle);
  const groups = new Map<string, Topic[]>();
  for (const topic of topics) groups.set(topic.subject, [...(groups.get(topic.subject) ?? []), topic]);
  const open = (topicId: string) => router.push({ pathname: "/(app)/question-bank", params: { topicId } } as never);

  return (
    <Screen title={t("appadmin.questionBank")} description={t("appadmin.bankIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {all.length > 3 || narrowed ? (
        <>
          <Field label={t("common.searchLabel")} placeholder={t("appadmin.bankSearchPlaceholder")} value={q} onChangeText={setQ} autoCapitalize="none" returnKeyType="search" />
          {subjects.length > 1 ? <Chips label={t("staff.subjectFilter")} value={subject} options={[{ value: "", label: t("staff.allSubjects") }, ...subjects.map((s) => ({ value: s, label: subjectName(t, s) }))]} onChange={setSubject} /> : null}
        </>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        topics.length === 0 ? (
          narrowed ? (
            <Empty
              title={t("common.noResultsTitle")}
              body={t("common.noResultsBody")}
              action={
                <Button
                  label={t("common.clearAll")}
                  variant="secondary"
                  onPress={() => {
                    setSubject("");
                    setQ("");
                  }}
                />
              }
            />
          ) : (
            <Empty icon="books" title={t("appadmin.bankEmpty")} body={t("appadmin.bankEmptyBody")} action={<Button label={t("ui.refresh")} variant="secondary" onPress={() => void query.refetch()} />} />
          )
        ) : (
          [...groups].map(([code, list]) => (
            <Card key={code} title={subjectName(t, code)}>
              {list.map((topic) => (
                <Row
                  key={topic.id}
                  icon="books"
                  title={topic.name}
                  caption={[t("appadmin.classN", { n: topic.classLevel }), topic.chapter, topic.questionCount === 1 ? t("appadmin.questionCountOne") : t("appadmin.questionCountMany", { count: topic.questionCount })].join(" · ")}
                  onPress={() => open(topic.id)}
                />
              ))}
            </Card>
          ))
        )
      ) : null}
    </Screen>
  );
}

/** One chapter: its questions, adding one, and — with a questionId — one question and editing it. */
function Chapter({ topicId, questionId }: { topicId: string; questionId: string | null }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [difficulty, setDifficulty] = useState("");
  const [missing, setMissing] = useState<Missing>("");
  const query = useQuery({
    queryKey: ["appadmin", "bank", topicId],
    queryFn: async () => contestBankTopicSchema.parse(unwrap(await api().get(`/api/v1/appadmin/bank/${topicId}`))),
  });
  const saved = (res: { translated: boolean }) => {
    // "Saved" and "saved in three languages" are different facts; the toast says which one happened.
    toast.show(res.translated ? t("appadmin.translatedToo") : t("appadmin.notTranslated"), res.translated ? "ok" : "info");
    void qc.invalidateQueries({ queryKey: ["appadmin", "bank"] });
  };
  const add = useMutation({
    mutationFn: async (body: ContestQuestion) => contestQuestionSavedSchema.parse(must(await api().post(`/api/v1/appadmin/bank/${topicId}/questions`, body), t("root.didNotWork"))),
    onSuccess: (res) => {
      setAdding(false);
      saved(res);
    },
  });
  const edit = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: ContestQuestion }) => contestQuestionSavedSchema.parse(must(await api().post(`/api/v1/appadmin/bank/${topicId}/questions/${id}`, body), t("root.didNotWork"))),
    onSuccess: (res) => {
      setEditing(false);
      saved(res);
    },
  });

  const d = query.data;
  const topic = d?.topic;
  const heading = topic ? t("appadmin.classN", { n: topic.classLevel }) : undefined;
  const question = questionId && d ? (d.questions.find((x) => x.id === questionId) ?? null) : null;
  const states = (
    <>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
    </>
  );

  if (adding && d) {
    return (
      <Screen title={t("appadmin.addQuestion")} description={t("appadmin.addQuestionIntro")}>
        <QuestionForm
          translationOn={d.translationOn}
          busy={add.isPending}
          error={add.error}
          onSave={(body) => add.mutate(body)}
          onCancel={() => {
            add.reset();
            setAdding(false);
          }}
        />
      </Screen>
    );
  }
  if (editing && question && d) {
    return (
      <Screen title={t("appadmin.editQuestion")} description={t("appadmin.editIntro")}>
        <QuestionForm
          initial={question}
          translationOn={d.translationOn}
          busy={edit.isPending}
          error={edit.error}
          onSave={(body) => edit.mutate({ id: question.id, body })}
          onCancel={() => {
            edit.reset();
            setEditing(false);
          }}
        />
      </Screen>
    );
  }
  if (questionId) {
    return (
      <Screen title={topic?.name ?? t("appadmin.questionBank")} description={heading} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        {states}
        {d && !question ? (
          <Empty icon="sealQuestion" title={t("appadmin.noSuchQuestion")} action={<Button label={d.topic.name} variant="secondary" onPress={() => router.push({ pathname: "/(app)/question-bank", params: { topicId } } as never)} />} />
        ) : null}
        {question ? <QuestionView question={question} onEdit={() => setEditing(true)} /> : null}
      </Screen>
    );
  }

  const all = d?.questions ?? [];
  const difficulties = [...new Set(all.map((x) => x.difficulty))].sort((a, b) => a - b);
  const shown = all.filter((x) => (!difficulty || x.difficulty === Number(difficulty)) && (!missing || !x.languages.includes(missing)));
  const narrowed = Boolean(difficulty || missing);
  const addButton = <Button label={t("appadmin.addQuestion")} icon={<Icon name="plus" size={20} color={th.accentFg} weight="bold" />} onPress={() => setAdding(true)} />;

  return (
    <Screen title={topic?.name ?? t("appadmin.questionBank")} description={heading} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {states}
      {d ? (
        <>
          {all.length > 0 ? addButton : null}
          {all.length > 3 || narrowed ? (
            <>
              {difficulties.length > 1 ? <Chips label={t("appadmin.difficultyFilter")} value={difficulty} options={[{ value: "", label: t("vacancies.filterAll") }, ...difficulties.map((n) => ({ value: String(n), label: t("appadmin.difficultyN", { n }) }))]} onChange={setDifficulty} /> : null}
              <Chips
                label={t("appadmin.missingFilter")}
                value={missing}
                options={[
                  { value: "", label: t("vacancies.filterAll") },
                  { value: "hi", label: t("appadmin.missingHindi") },
                  { value: "mr", label: t("appadmin.missingMarathi") },
                ]}
                onChange={setMissing}
              />
            </>
          ) : null}
          {shown.length === 0 ? (
            narrowed ? (
              <Empty
                title={t("common.noResultsTitle")}
                body={t("common.noResultsBody")}
                action={
                  <Button
                    label={t("common.clearAll")}
                    variant="secondary"
                    onPress={() => {
                      setDifficulty("");
                      setMissing("");
                    }}
                  />
                }
              />
            ) : (
              <Empty icon="sealQuestion" title={t("appadmin.noQuestionsYet")} body={t("appadmin.noQuestionsBody")} action={addButton} />
            )
          ) : (
            <Card title={all.length === 1 ? t("appadmin.questionCountOne") : t("appadmin.questionCountMany", { count: all.length })}>
              {shown.map((x) => (
                <Row key={x.id} title={x.stem} caption={[`${t("appadmin.levelN", { n: x.difficulty })} · ${languages(x)}`, reviewedLine(t, x), statsLine(t, x)].filter(Boolean).join(" · ")} onPress={() => router.push({ pathname: "/(app)/question-bank", params: { topicId, questionId: x.id } } as never)} />
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

/** Language codes, not names: "EN · HI · MR" reads the same in every dictionary and says exactly which rows exist. */
function languages(question: ContestBankQuestion): string {
  return ["en", ...question.languages].join(" · ").toUpperCase();
}

type T = ReturnType<typeof useT>;

/** Which translations a native speaker has read (the web's green badges); nothing when none. */
function reviewedLine(t: T, question: ContestBankQuestion): string {
  return [question.reviewed?.hi ? t("translationReview.reviewedHi") : null, question.reviewed?.mr ? t("translationReview.reviewedMr") : null].filter(Boolean).join(" · ");
}

/** The bank list's stats column: answered, right, seconds — from last night's count; nothing until a child has answered. */
function statsLine(t: T, question: ContestBankQuestion): string {
  const s = question.stats;
  if (!s || s.asked === 0) return "";
  return t("bankStats.column", { asked: s.asked, rate: s.correctRate ?? 0, seconds: s.avgSeconds ?? 0 });
}

/** One question's numbers, whole and by the answering pupils' grade — GET /api/v1/appadmin/bank/stats. */
function QuestionStats({ questionId }: { questionId: string }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["appadmin", "bank", "stats", questionId],
    queryFn: async () => bankStatsSchema.parse(unwrap(await api().get(`/api/v1/appadmin/bank/stats?questionId=${questionId}`))),
  });
  const d = query.data;
  return (
    <Card title={t("bankStats.title")}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && d.asked === 0 ? (
        <Text variant="sm" tone="muted">
          {t("bankStats.none")}
        </Text>
      ) : null}
      {d && d.asked > 0 ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("bankStats.asked", { count: d.asked })} value={d.asked} />
            <Stat label={t("bankStats.correctRate", { rate: d.correctRate ?? 0 })} value={`${d.correctRate ?? 0}%`} tone={(d.correctRate ?? 0) < 40 ? "warn" : "ok"} />
            <Stat label={t("bankStats.avgSeconds", { seconds: d.avgSeconds ?? 0 })} value={d.avgSeconds ?? "—"} />
          </View>
          {d.byGrade.length > 0 ? (
            <View style={{ gap: th.space[1] }}>
              <Text variant="xs" tone="muted">
                {t("bankStats.byGrade")}
              </Text>
              {d.byGrade.map((g) => (
                <Row key={g.grade} title={g.grade === 0 ? t("bankStats.gradeUnknown") : t("bankStats.gradeN", { n: g.grade })} caption={t("bankStats.column", { asked: g.asked, rate: g.correctRate ?? 0, seconds: g.avgSeconds ?? 0 })} />
              ))}
            </View>
          ) : null}
          <Text variant="xs" tone="muted">
            {d.updatedAt ? `${t("bankStats.updatedAt", { when: formatInstant(d.updatedAt, locale, { day: "numeric", month: "short" }) })} · ${t("bankStats.nightly")}` : t("bankStats.nightly")}
          </Text>
        </>
      ) : null}
    </Card>
  );
}

/** One question as a child meets it: the stem, the options with the right one marked, the level, and the worked solution. */
function QuestionView({ question, onEdit }: { question: ContestBankQuestion; onEdit: () => void }) {
  const t = useT();
  const th = useTheme();
  return (
    <>
      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[2] }}>
          <Pill tone="accent" label={`${t("appadmin.levelN", { n: question.difficulty })} · ${levelName(t, question.difficulty)}`} />
          <Text variant="xs" tone="muted">
            {languages(question)}
          </Text>
        </View>
        <Text variant="base" bold>
          {question.stem}
        </Text>
        {reviewedLine(t, question) ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            {question.reviewed?.hi ? <Pill tone="ok" label={t("translationReview.reviewedHi")} /> : null}
            {question.reviewed?.mr ? <Pill tone="ok" label={t("translationReview.reviewedMr")} /> : null}
          </View>
        ) : null}
      </Card>
      <QuestionStats questionId={question.id} />
      <Card title={t("appadmin.choicesLabel")}>
        {question.choices.map((choice, index) => {
          const right = index === question.answerIndex;
          return (
            <View key={index} accessible accessibilityLabel={right ? `${choice}. ${t("appadmin.correctOne", { n: index + 1 })}` : choice} style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], minHeight: th.tap }}>
              <Icon name={right ? "checkCircle" : "circle"} size={22} color={right ? th.ok : th.fgSubtle} weight={right ? "fill" : "regular"} />
              <Text variant="base" bold={right} style={{ flex: 1 }}>
                {choice}
              </Text>
            </View>
          );
        })}
        <Text variant="xs" tone="muted">
          {t("appadmin.radioMeans")}
        </Text>
      </Card>
      <Card title={t("appadmin.solutionLabel")}>
        <Text variant="base">{question.solution}</Text>
      </Card>
      <Button label={t("appadmin.edit")} icon={<Icon name="pencil" size={20} color={th.accentFg} weight="bold" />} onPress={onEdit} />
    </>
  );
}

/**
 * The editor, for adding and editing alike — the web's QuestionForm. Four
 * options by default, blank ones dropped on save and the answer re-pointed at
 * the option it marked, so the index can never name an option that is gone.
 */
function QuestionForm({ initial, translationOn, busy, error, onSave, onCancel }: { initial?: ContestBankQuestion; translationOn: boolean; busy: boolean; error: Error | null; onSave: (body: ContestQuestion) => void; onCancel: () => void }) {
  const t = useT();
  const th = useTheme();
  const [stem, setStem] = useState(initial?.stem ?? "");
  const [choices, setChoices] = useState<string[]>(() => {
    const start = initial?.choices ?? [];
    return [...start, ...Array<string>(Math.max(0, 4 - start.length)).fill("")];
  });
  const [answer, setAnswer] = useState(initial?.answerIndex ?? 0);
  const [level, setLevel] = useState<Level>(String(initial?.difficulty ?? 1) as Level);
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [local, setLocal] = useState<string | null>(null);
  const long = { minHeight: 96, textAlignVertical: "top" as const, paddingTop: th.space[3] };

  const submit = () => {
    const kept: string[] = [];
    let keptAnswer = -1;
    choices.forEach((choice, index) => {
      if (choice.trim().length === 0) return;
      if (index === answer) keptAnswer = kept.length;
      kept.push(choice.trim());
    });
    if (keptAnswer === -1) {
      setLocal(t("appadmin.pickTheAnswer"));
      return;
    }
    setLocal(null);
    onSave({ difficulty: Number(level), stem: stem.trim(), choices: kept, answerIndex: keptAnswer, solution: solution.trim() });
  };
  const retry = error instanceof Refusal && (error.status === 0 || error.status >= 500) ? submit : undefined;
  const message = local ?? error?.message ?? null;

  return (
    <>
      <Card>
        <Field label={t("appadmin.stemLabel")} value={stem} onChangeText={setStem} hint={t("appadmin.stemHint")} multiline maxLength={2000} style={long} />
      </Card>
      <Card title={t("appadmin.choicesLabel")}>
        <Text variant="xs" tone="muted">
          {t("appadmin.choicesHint")}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel={t("appadmin.choicesLabel")} style={{ gap: th.space[2] }}>
          {choices.map((choice, index) => {
            const on = answer === index;
            return (
              <View key={index} style={{ flexDirection: "row", alignItems: "flex-end", gap: th.space[2] }}>
                <Pressable
                  accessibilityRole="radio"
                  aria-checked={on}
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={t("appadmin.correctOne", { n: index + 1 })}
                  hitSlop={4}
                  onPress={() => {
                    haptics.tap();
                    setAnswer(index);
                    setLocal(null);
                  }}
                  style={({ pressed }) => ({ width: th.tap, height: th.tap, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
                >
                  <Icon name={on ? "checkCircle" : "circle"} size={28} color={on ? th.ok : th.fgSubtle} weight={on ? "fill" : "regular"} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Field label={t("appadmin.choiceN", { n: index + 1 })} value={choice} maxLength={500} onChangeText={(value) => setChoices((list) => list.map((c, j) => (j === index ? value : c)))} />
                </View>
              </View>
            );
          })}
        </View>
        <Text variant="xs" tone="muted">
          {t("appadmin.radioMeans")}
        </Text>
      </Card>
      <Card>
        <Chips label={t("appadmin.levelLabel")} value={level} options={LEVELS.map((n) => ({ value: n, label: `${t("appadmin.levelN", { n })} · ${levelName(t, Number(n))}` }))} onChange={setLevel} />
        <Text variant="xs" tone="muted">
          {t("appadmin.levelHint")}
        </Text>
        <Field label={t("appadmin.solutionLabel")} value={solution} onChangeText={setSolution} hint={t("appadmin.solutionHint")} multiline maxLength={4000} style={long} />
      </Card>
      {message ? <Failed message={message} onRetry={local ? undefined : retry} /> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <Icon name="translate" size={18} color={th.fgMuted} weight="bold" />
        <Text variant="sm" tone="muted" style={{ flex: 1 }}>
          {translationOn ? t("appadmin.willTranslate") : t("appadmin.translationOff")}
        </Text>
      </View>
      <Button label={t("appadmin.saveQuestion")} busy={busy} disabled={stem.trim().length === 0 || solution.trim().length === 0} onPress={submit} />
      <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
    </>
  );
}
