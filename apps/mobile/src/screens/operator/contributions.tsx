import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigDecidedSchema, gigQueueSchema, gigReviewSchema, type GigContributionStatus, type GigQuestionText, type GigReview } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note, param, Pill, subjectName } from "@/screens/family/shared";
import { Chips } from "@/screens/staff/shared";
import { CONTRIBUTION_STATUS } from "@/screens/teacher/contributions";
import { compact } from "@/screens/teacher/contribution";

/**
 * The content team's review queue — the web's /appadmin/contributions:
 * teachers' questions for the bank, those waiting to be read (the oldest
 * first) and those decided, by status; and one question opened to read in
 * its three languages, with what adding it today would earn its author
 * said before the button is pressed. Adding it to the bank, as written or
 * with the reviewer's corrections, is the only act that earns; returning
 * it with a note and rejecting it with a reason are the other two.
 */
export const QUEUE_KEY = ["appadmin", "contributions"] as const;
const STATUSES: GigContributionStatus[] = ["SUBMITTED", "RETURNED", "ACCEPTED", "REJECTED", "WITHDRAWN"];
type Language = "en" | "hi" | "mr";
const LANGUAGES: Language[] = ["en", "hi", "mr"];
const ROWS = 4;
const blank = (text: GigQuestionText): GigQuestionText => ({ stem: text.stem, solution: text.solution, choices: [...text.choices, ...Array<string>(Math.max(0, ROWS - text.choices.length)).fill("")] });

export function ContributionsQueue() {
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  if (id) return <Review id={id} />;
  return <Queue />;
}

function Queue() {
  const t = useT();
  const router = useRouter();
  const [status, setStatus] = useState<GigContributionStatus>("SUBMITTED");
  const query = useQuery({
    queryKey: [...QUEUE_KEY, status],
    queryFn: async () => gigQueueSchema.parse(unwrap(await api().get(`/api/v1/appadmin/contributions?status=${status}`))),
  });
  const d = query.data;
  return (
    <Screen title={t("gigs.queueTitle")} description={t("gigs.queueIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Chips label={t("enquiries.statusFilter")} value={status} options={STATUSES.map((s) => ({ value: s, label: d?.counts[s] !== undefined ? `${t(CONTRIBUTION_STATUS[s].label)} ${d.counts[s]}` : t(CONTRIBUTION_STATUS[s].label) }))} onChange={setStatus} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.rows.length === 0 ? (
          <Empty title={t("gigs.queueEmpty")} action={<Button label={t("appadmin.questionBank")} variant="secondary" onPress={() => router.push("/(app)/question-bank" as never)} />} />
        ) : (
          <Card>
            {d.rows.map((row) => (
              <Row key={row.id} title={row.stem} caption={[subjectName(t, row.subject), t("appadmin.classN", { n: row.classLevel }), row.topicName, t("gigs.from", { name: row.authorName, school: row.authorSchoolName })].join(" · ")} onPress={() => router.push({ pathname: "/(app)/contribution-queue", params: { id: row.id } } as never)} />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}

function Review({ id }: { id: string }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: [...QUEUE_KEY, "one", id], queryFn: async () => gigReviewSchema.parse(unwrap(await api().get(`/api/v1/appadmin/contributions/${id}`))) });
  const c = query.data;
  const money = (paise: number) => formatPaise(paise, locale);
  const names: Record<Language, string> = { en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi") };
  return (
    <Screen title={t("gigs.reviewTitle")} description={c ? [subjectName(t, c.topic.subject), t("appadmin.classN", { n: c.topic.classLevel }), c.topic.name, t("appadmin.levelN", { n: c.difficulty })].join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {c ? (
        <>
          <Pill label={t(CONTRIBUTION_STATUS[c.status].label)} tone={CONTRIBUTION_STATUS[c.status].tone} />
          <Note tone="accent">
            <Text variant="sm" bold>
              {t("gigs.from", { name: c.authorName, school: c.authorSchoolName })}
            </Text>
            <Text variant="xs" tone="muted">
              {t("gigs.authorStanding", { accepted: c.authorAccepted, paid: c.authorPaidThisMonth })}
            </Text>
            {c.status === "SUBMITTED" ? (
              <Text variant="sm" testID="gig-outcome">
                {"refuse" in c.outcome ? t(c.outcome.refuse) : c.outcome.basis === "FREE_BLOCK" ? t("gigs.outcomeFree", { count: c.freeCount }) : t("gigs.outcomePaid", { amount: money(c.outcome.amountPaise) })} {t("gigs.budgetLine", { spent: money(c.spentThisMonthPaise), budget: money(c.budgetPaise) })}
              </Text>
            ) : null}
          </Note>
          {LANGUAGES.map((l) => (
            <Card key={l} title={names[l]}>
              <Text variant="base">{c[l].stem}</Text>
              <View style={{ gap: th.space[1] }}>
                {c[l].choices.map((choice, index) => (
                  <Text key={index} variant="sm" bold={index === c.answerIndex}>
                    {[`${index + 1}.`, choice, index === c.answerIndex ? `(${t("gigs.correctOption")})` : null].filter(Boolean).join(" ")}
                  </Text>
                ))}
              </View>
              <Text variant="xs" tone="muted">
                {c[l].solution}
              </Text>
            </Card>
          ))}
          {c.reviewNote ? (
            <Note tone="warn">
              <Text variant="xs" bold>
                {t("gigs.noteLabel")}
              </Text>
              <Text variant="sm">{c.reviewNote}</Text>
            </Note>
          ) : null}
          {c.status === "SUBMITTED" ? <Decide c={c} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

/** What the content team does with a question: add it (as written or corrected), return it with a note, or reject it. */
function Decide({ c }: { c: GigReview }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [draft, setDraft] = useState(() => ({ topicId: c.topic.id, difficulty: c.difficulty, answerIndex: c.answerIndex, en: blank(c.en), hi: blank(c.hi), mr: blank(c.mr) }));
  const [error, setError] = useState<string | null>(null);
  const th = useTheme();
  const names: Record<Language, string> = { en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi") };
  const canAdd = !("refuse" in c.outcome);
  const patch = (l: Language, part: Partial<GigQuestionText>) => setDraft((d) => ({ ...d, [l]: { ...d[l], ...part } }));
  const decide = useMutation({
    mutationFn: async (decision: "ACCEPT" | "RETURN" | "REJECT") => {
      const edit = decision === "ACCEPT" && correcting ? compact(draft) : undefined;
      if (edit === null) throw new Error(t("appadmin.pickTheAnswer"));
      return gigDecidedSchema.parse(unwrap(await api().post(`/api/v1/appadmin/contributions/${c.id}/decide`, { decision, note, ...(edit ? { edit: { topicId: c.topic.id, ...edit } } : {}) })));
    },
    onSuccess: () => {
      toast.show(t("gigs.decided"), "ok");
      void qc.invalidateQueries({ queryKey: QUEUE_KEY });
      router.replace("/(app)/contribution-queue" as never);
    },
    onError: (e) => setError(e.message),
  });
  return (
    <Card>
      {error ? <Failed message={error} /> : null}
      <SwitchRow label={t("gigs.correct")} value={correcting} onChange={setCorrecting} />
      {correcting ? (
        <>
          <Chips label={t("appadmin.levelLabel")} value={String(draft.difficulty)} onChange={(v) => setDraft((d) => ({ ...d, difficulty: Number(v) }))} options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: t("appadmin.levelN", { n }) }))} />
          {LANGUAGES.map((l) => (
            <View key={l} style={{ gap: th.space[2] }}>
              <Field label={[names[l], t("appadmin.stemLabel")].join(" · ")} typing={l} value={draft[l].stem} onChangeText={(stem) => patch(l, { stem })} multiline maxLength={2000} />
              {draft[l].choices.map((choice, index) => (
                <Field key={index} label={[names[l], t("appadmin.choiceN", { n: index + 1 })].join(" · ")} typing={l} value={choice} onChangeText={(text) => patch(l, { choices: draft[l].choices.map((x, i) => (i === index ? text : x)) })} maxLength={500} />
              ))}
              {l === "en" ? <Chips label={t("gigs.answerLabel")} value={String(draft.answerIndex)} onChange={(v) => setDraft((d) => ({ ...d, answerIndex: Number(v) }))} options={draft.en.choices.map((_, i) => ({ value: String(i), label: t("appadmin.choiceN", { n: i + 1 }) }))} /> : null}
              <Field label={[names[l], t("appadmin.solutionLabel")].join(" · ")} typing={l} value={draft[l].solution} onChangeText={(solution) => patch(l, { solution })} multiline maxLength={4000} />
            </View>
          ))}
        </>
      ) : null}
      <Field label={t("gigs.noteLabel")} hint={t("gigs.noteHint")} value={note} onChangeText={setNote} multiline maxLength={1000} />
      <Button label={correcting ? t("gigs.addCorrected") : t("gigs.addToBank")} busy={decide.isPending && decide.variables === "ACCEPT"} disabled={decide.isPending || !canAdd} onPress={() => decide.mutate("ACCEPT")} />
      <Button label={t("gigs.returnIt")} variant="secondary" busy={decide.isPending && decide.variables === "RETURN"} disabled={decide.isPending} onPress={() => decide.mutate("RETURN")} />
      <Button label={t("gigs.rejectIt")} variant="ghost" busy={decide.isPending && decide.variables === "REJECT"} disabled={decide.isPending} onPress={() => decide.mutate("REJECT")} />
    </Card>
  );
}
