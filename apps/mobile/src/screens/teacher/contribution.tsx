import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigContributionSchema, gigDraftSchema, gigMyContributionsSchema, gigTopicsSchema, type GigContribution, type GigQuestionText } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, SwitchRow, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note, param, Pill, subjectName } from "@/screens/family/shared";
// The level and the correct option are a choice of one, so a radio group that
// wraps under its own label: the family's filter chips scroll sideways with no
// sign there is more, and "Level 6" sat past the card's edge (A3-states-17).
import { Chips } from "@/screens/staff/shared";
import { CONTRIBUTION_STATUS, CONTRIBUTIONS_KEY } from "./contributions";

/**
 * One question for the bank — the web's /teacher/contributions/new and
 * /teacher/contributions/{id}: the chapter, the level, and the question in
 * English, Hindi and Marathi, each with the same options in the same order
 * and its worked solution. The correct option is one fact for all three. The
 * Hindi and the Marathi can be drafted from the English where the server has
 * a translator, and are then the teacher's to correct: what is sent is what
 * is in the boxes. A question that is settled is read and not changed.
 */
type Language = "en" | "hi" | "mr";
type Topic = { id: string; name: string; subject: string; classLevel: number; chapter: string };
type Draft = { topicId: string | null; difficulty: number; answerIndex: number; en: GigQuestionText; hi: GigQuestionText; mr: GigQuestionText };
const LANGUAGES: Language[] = ["en", "hi", "mr"];
const ROWS = 4;
const blank = (text?: GigQuestionText): GigQuestionText => ({ stem: text?.stem ?? "", solution: text?.solution ?? "", choices: [...(text?.choices ?? []), ...Array<string>(Math.max(0, ROWS - (text?.choices.length ?? 0))).fill("")] });

/** The draft as it is sent: an option left blank in all three languages is dropped and the answer re-pointed. Null when the marked option is one of the dropped. */
export function compact(draft: Draft): Omit<Draft, "topicId"> | null {
  const rows = draft.en.choices.map((_, i) => i).filter((i) => LANGUAGES.some((l) => (draft[l].choices[i] ?? "").trim().length > 0));
  const answerIndex = rows.indexOf(draft.answerIndex);
  if (answerIndex === -1) return null;
  const text = (l: Language): GigQuestionText => ({ stem: draft[l].stem.trim(), solution: draft[l].solution.trim(), choices: rows.map((i) => (draft[l].choices[i] ?? "").trim()) });
  return { difficulty: draft.difficulty, answerIndex, en: text("en"), hi: text("hi"), mr: text("mr") };
}

export function TeacherContribution() {
  const t = useT();
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  const topics = useQuery({ queryKey: ["gigs", "topics"], queryFn: async () => gigTopicsSchema.parse(unwrap(await api().get("/api/v1/gigs/questions/topics"))).topics });
  const mine = useQuery({ queryKey: CONTRIBUTIONS_KEY, queryFn: async () => gigMyContributionsSchema.parse(unwrap(await api().get("/api/v1/gigs/questions"))) });
  const existing = useQuery({ queryKey: ["gigs", "question", id ?? "new"], enabled: Boolean(id), queryFn: async () => gigContributionSchema.parse(unwrap(await api().get(`/api/v1/gigs/questions/${id}`))) });
  const failed = topics.error ?? mine.error ?? existing.error;
  const ready = topics.data && mine.data && (!id || existing.data);

  return (
    <Screen title={id ? t("gigs.title") : t("gigs.newQuestion")} description={id ? undefined : t("gigs.intro")}>
      {failed ? (
        <Failed
          message={failed.message}
          onRetry={() => {
            void topics.refetch();
            void mine.refetch();
            if (id) void existing.refetch();
          }}
        />
      ) : !ready ? (
        <Loading />
      ) : existing.data && !existing.data.open ? (
        <Settled question={existing.data} />
      ) : (
        <Editor key={existing.data?.id ?? "new"} topics={topics.data!} draftOn={mine.data!.draftOn} existing={existing.data ?? null} />
      )}
    </Screen>
  );
}

function Said({ question }: { question: GigContribution }) {
  const t = useT();
  if (!question.reviewNote) return null;
  return (
    <Note tone="warn">
      <Text variant="xs" bold>
        {t("gigs.reviewerSaid")}
      </Text>
      <Text variant="sm">{question.reviewNote}</Text>
    </Note>
  );
}

function Settled({ question }: { question: GigContribution }) {
  const t = useT();
  const th = useTheme();
  const names: Record<Language, string> = { en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi") };
  return (
    <>
      <Pill label={t(CONTRIBUTION_STATUS[question.status].label)} tone={CONTRIBUTION_STATUS[question.status].tone} />
      <Said question={question} />
      <Text variant="sm" tone="muted">
        {t("gigs.settledNote")}
      </Text>
      {LANGUAGES.map((l) => (
        <Card key={l} title={names[l]}>
          <Text variant="base">{question[l].stem}</Text>
          <View style={{ gap: th.space[1] }}>
            {question[l].choices.map((choice, index) => (
              <Text key={index} variant="sm" bold={index === question.answerIndex}>
                {[`${index + 1}.`, choice, index === question.answerIndex ? `(${t("gigs.correctOption")})` : null].filter(Boolean).join(" ")}
              </Text>
            ))}
          </View>
          <Text variant="xs" tone="muted">
            {question[l].solution}
          </Text>
        </Card>
      ))}
    </>
  );
}

function Editor({ topics, draftOn, existing }: { topics: Topic[]; draftOn: boolean; existing: GigContribution | null }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => ({ topicId: existing?.topic.id ?? null, difficulty: existing?.difficulty ?? 1, answerIndex: existing?.answerIndex ?? 0, en: blank(existing?.en), hi: blank(existing?.hi), mr: blank(existing?.mr) }));
  const [search, setSearch] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafted, setDrafted] = useState(false);
  const names: Record<Language, string> = { en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi") };
  const label = (topic: Topic) => [subjectName(t, topic.subject), t("appadmin.classN", { n: topic.classLevel }), topic.name].join(" · ");
  const chosen = topics.find((topic) => topic.id === draft.topicId) ?? null;
  const needle = search.trim().toLowerCase();
  const matches = needle.length < 2 ? [] : topics.filter((topic) => label(topic).toLowerCase().includes(needle)).slice(0, 8);
  const patch = (l: Language, part: Partial<GigQuestionText>) => setDraft((d) => ({ ...d, [l]: { ...d[l], ...part } }));
  const back = () => {
    void qc.invalidateQueries({ queryKey: CONTRIBUTIONS_KEY });
    router.replace("/(app)/contributions" as never);
  };

  const send = useMutation({
    mutationFn: async () => {
      const body = compact(draft);
      if (!draft.topicId) throw new Error(t("gigs.chooseTopic"));
      if (!body) throw new Error(t("appadmin.pickTheAnswer"));
      const result = await api().post(existing ? `/api/v1/gigs/questions/${existing.id}` : "/api/v1/gigs/questions", { topicId: draft.topicId, ...body, terms });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return result.data;
    },
    onSuccess: back,
    onError: (e) => setError(e.message),
  });
  const withdraw = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/gigs/questions/${existing!.id}/withdraw`);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return result.data;
    },
    onSuccess: back,
    onError: (e) => setError(e.message),
  });
  const translate = useMutation({
    mutationFn: async () => {
      const body = compact(draft);
      if (!body) throw new Error(t("appadmin.pickTheAnswer"));
      return gigDraftSchema.parse(unwrap(await api().post("/api/v1/gigs/questions/draft", body.en)));
    },
    onSuccess: (made) => {
      // Put into the rows the English occupies, so option for option they still line up.
      const rows = draft.en.choices.map((c, i) => (c.trim() ? i : -1)).filter((i) => i >= 0);
      const spread = (choices: string[]) => draft.en.choices.map((_, i) => (rows.includes(i) ? (choices[rows.indexOf(i)] ?? "") : ""));
      setDraft((d) => ({ ...d, hi: { stem: made.hi.stem, solution: made.hi.solution, choices: spread(made.hi.choices) }, mr: { stem: made.mr.stem, solution: made.mr.solution, choices: spread(made.mr.choices) } }));
      setError(null);
      setDrafted(true);
    },
    onError: (e) => setError(e.message),
  });
  const busy = send.isPending || withdraw.isPending || translate.isPending;

  return (
    <>
      {existing ? <Said question={existing} /> : null}
      {error ? <Failed message={error} /> : null}
      <Card title={t("gigs.topic")}>
        {chosen ? (
          <>
            <Text variant="sm" bold>
              {t("gigs.topicChosen", { name: label(chosen) })}
            </Text>
            <Button label={t("gigs.changeTopic")} variant="ghost" onPress={() => setDraft((d) => ({ ...d, topicId: null }))} />
          </>
        ) : (
          <>
            <Field label={t("gigs.topicSearch")} value={search} onChangeText={setSearch} autoCapitalize="none" />
            {matches.map((topic) => (
              <Row key={topic.id} title={label(topic)} caption={topic.chapter} onPress={() => setDraft((d) => ({ ...d, topicId: topic.id }))} />
            ))}
          </>
        )}
        <Chips label={t("appadmin.levelLabel")} value={String(draft.difficulty)} onChange={(v) => setDraft((d) => ({ ...d, difficulty: Number(v) }))} options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: t("appadmin.levelN", { n }) }))} />
      </Card>

      {LANGUAGES.map((l) => (
        <Card key={l} title={names[l]}>
          <Field label={[names[l], t("appadmin.stemLabel")].join(" · ")} typing={l} value={draft[l].stem} onChangeText={(stem) => patch(l, { stem })} multiline maxLength={2000} />
          {draft[l].choices.map((choice, index) => (
            <Field key={index} label={[names[l], t("appadmin.choiceN", { n: index + 1 })].join(" · ")} typing={l} value={choice} onChangeText={(text) => patch(l, { choices: draft[l].choices.map((c, i) => (i === index ? text : c)) })} maxLength={500} />
          ))}
          {l === "en" ? (
            <View style={{ gap: th.space[1] }}>
              <Text variant="sm" bold>
                {t("gigs.answerLabel")}
              </Text>
              <Chips label={t("gigs.answerLabel")} value={String(draft.answerIndex)} onChange={(v) => setDraft((d) => ({ ...d, answerIndex: Number(v) }))} options={draft.en.choices.map((_, i) => ({ value: String(i), label: t("appadmin.choiceN", { n: i + 1 }) }))} />
              <Text variant="xs" tone="muted">
                {t("gigs.answerSame")}
              </Text>
            </View>
          ) : null}
          <Field label={[names[l], t("appadmin.solutionLabel")].join(" · ")} typing={l} value={draft[l].solution} onChangeText={(solution) => patch(l, { solution })} multiline maxLength={4000} />
        </Card>
      ))}

      {draftOn ? <Button label={t("gigs.draftButton")} variant="secondary" busy={translate.isPending} disabled={busy} onPress={() => translate.mutate()} /> : null}
      {drafted ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {t("gigs.draftDone")}
          </Text>
        </Note>
      ) : null}
      <SwitchRow label={t("gigs.terms")} value={terms} onChange={setTerms} />
      <Button label={existing ? t("gigs.sendAgain") : t("gigs.send")} busy={send.isPending} disabled={busy} onPress={() => send.mutate()} />
      {existing ? <Button label={t("gigs.withdraw")} variant="ghost" busy={withdraw.isPending} disabled={busy} onPress={() => withdraw.mutate()} /> : null}
    </>
  );
}
