import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  practiceAnsweredSchema,
  practiceBeganSchema,
  practiceNextSchema,
  practiceRevealedSchema,
  practiceRevisionAnsweredSchema,
  practiceRevisionQuestionSchema,
  practiceRevisionSchema,
  type PracticeAnswerBody,
  type PracticeAnswerResult,
  type PracticeBegan,
  type PracticeQuestion,
  type PracticeRevision,
  type PracticeRevisionAnswerBody,
} from "@edulink/contracts";
import type { Translate } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Icon, Loading, Screen, Stat, Text } from "@/components";
import { LanguageRow } from "@/components/language-row";
import { useSaveLocaleToAccount } from "@/lib/account-locale";
import { api, errorText } from "@/lib/api";
import { ApiRefused, unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { haptics } from "@/lib/haptics";
import { newClientId, onQueueEvent } from "@/lib/outbox";
import { formatInstant, levelName, Note, param, Pill, subjectName } from "../family/shared";
import { OutboxBadge, useOutboxRunner, writeOrQueue } from "../teacher/support";
import { QuestionFigure } from "./figure";

/**
 * The practice player, the web's /student/practice/{slug} and
 * /student/practice/revision, native. Route "quiz", params { mode, slug?,
 * assignmentId? }: "topic" opens a chapter by slug, "assigned" a chapter the
 * teacher set (with the pupil's standing against its target rung), and
 * "revision" walks the pupil's own missed questions once.
 *
 * The web player's rules, kept: a served question never carries its answer;
 * the reveal button says what it costs before and again in the confirmation;
 * after answering the working is free; right and wrong are colour, an icon
 * AND words. Every question in the bank is multiple choice (the contract
 * takes a chosen index), so the options are the input — large, one tap each.
 *
 * Answers carry a client id and go through the outbox when the network is
 * not there: the server's guard is the (attempt, question) pair, so a replay
 * returns the stored verdict and climbs nothing. The verdict is re-asked from
 * the same idempotent endpoint whenever the outbox flushes. The NEXT question
 * genuinely needs the server, and the screen says so rather than spinning.
 */
export type QuizMode = "topic" | "revision" | "assigned";

const LETTER = (i: number) => String.fromCharCode(65 + i);

/** A read that failed: the server's sentence, or — with no network at all — what practice needs. */
function failText(error: Error, t: Translate): string {
  if (error instanceof ApiRefused && error.status === 0) return t("practice.offlineStart");
  return error.message || t("common.tryAgainMoment");
}

export function PracticeQuiz() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const mode = param(params.mode) as QuizMode | undefined;
  const slug = param(params.slug);
  const assignmentId = param(params.assignmentId);

  if (role === null) {
    return (
      <Screen title={t("feature.practice")}>
        <Loading />
      </Screen>
    );
  }
  if (role !== "STUDENT") {
    // A guardian (or anybody else) has no player: the questions are the child's to answer.
    return (
      <Screen title={t("feature.practice")}>
        <Empty icon="brain" title={t("feature.practice")} body={t("practice.childPlaysOwn")} action={<Button label={t("practice.backToPractice")} variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }
  if (mode === "revision") return <RevisionQuiz />;
  if (mode === "assigned" && assignmentId) return <TopicQuiz assignmentId={assignmentId} />;
  if (slug) return <TopicQuiz slug={slug} />;
  return (
    <Screen title={t("feature.practice")}>
      <Empty icon="brain" title={t("feature.practice")} body={t("practice.pickChapter")} action={<Button label={t("practice.allPractice")} variant="secondary" onPress={() => router.back()} />} />
    </Screen>
  );
}

/* ------------------------------------------------------------------------- */
/* A chapter: open or resume the sitting, then play it                        */
/* ------------------------------------------------------------------------- */

function TopicQuiz({ slug, assignmentId }: { slug?: string; assignmentId?: string }) {
  const t = useT();
  const { locale } = useLocale();
  const qc = useQueryClient();
  // A fresh run after finishing: the finished sitting stays finished, so opening again starts a new one.
  const [run, setRun] = useState(0);
  useOutboxRunner();
  const began = useQuery({
    // Keyed on the reading language, as the web keys its player: a switch re-serves the same question in the new language.
    queryKey: ["practice", "attempt", slug ?? null, assignmentId ?? null, locale, run],
    queryFn: async () => practiceBeganSchema.parse(unwrap(await api().post("/api/v1/practice/attempts", assignmentId ? { assignmentId, language: locale } : { slug, language: locale }))),
    // The sitting lives on the server; the screen holds the question being answered. Never re-open it behind the pupil's back.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  // Leaving the player: the practice list's counts, rungs and badges have moved.
  useEffect(() => () => void qc.invalidateQueries({ queryKey: ["family", "student", "practice"] }), [qc]);

  if (!began.data) {
    return (
      <Screen title={t("feature.practice")} refreshing={began.isRefetching} onRefresh={() => void began.refetch()}>
        {began.isPending ? <Loading /> : null}
        {began.isError ? <Failed message={failText(began.error, t)} onRetry={() => void began.refetch()} /> : null}
      </Screen>
    );
  }
  return <Player key={`${began.data.attemptId}:${began.dataUpdatedAt}`} began={began.data} refreshing={began.isRefetching} onRefresh={() => void began.refetch()} onFreshRun={() => setRun((n) => n + 1)} />;
}

type Outcome = { correct: boolean; answerIndex: number; solution: string };
type Refusal = { message: string; retry: () => void };

function Player({ began, refreshing, onRefresh, onFreshRun }: { began: PracticeBegan; refreshing: boolean; onRefresh: () => void; onFreshRun: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const saveLocale = useSaveLocaleToAccount({ refresh: false });
  const { attemptId, topic, assignment } = began;
  const tag = `practice:${attemptId}`;

  const [question, setQuestion] = useState<PracticeQuestion | null>(began.question);
  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [peeked, setPeeked] = useState<{ solution: string; answerIndex: number } | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [forfeited, setForfeited] = useState(false);
  const [done, setDone] = useState<{ badgeAwarded: boolean } | null>(began.question ? null : { badgeAwarded: false });
  const [queued, setQueued] = useState<PracticeAnswerBody | null>(null);
  const [hiccup, setHiccup] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [busy, setBusy] = useState<"answer" | "next" | "reveal" | null>(null);
  const [level, setLevel] = useState(topic.level);
  const [tally, setTally] = useState({ answered: 0, right: 0, streak: 0 });

  const apply = useCallback(
    (r: PracticeAnswerResult) => {
      setOutcome({ correct: r.correct, answerIndex: r.answerIndex, solution: r.solution });
      if (r.correct) haptics.success();
      else haptics.error();
      // 0 is a replay's rung: it moved nothing, so the rung on screen stays.
      if (r.newLevel > 0) setLevel(r.newLevel);
      setTally((x) => ({ answered: x.answered + 1, right: x.right + (r.correct ? 1 : 0), streak: r.correct ? x.streak + 1 : 0 }));
      if (r.finished) {
        setDone({ badgeAwarded: r.badgeAwarded });
        void qc.invalidateQueries({ queryKey: ["family", "student", "practice"] });
      }
    },
    [qc],
  );

  const choose = async (index: number) => {
    if (!question || outcome || queued || busy) return;
    setChosen(index);
    setHiccup(false);
    setRefusal(null);
    setBusy("answer");
    const body: PracticeAnswerBody = { attemptId, questionId: question.questionId, chosenIndex: index, clientId: newClientId(), language: locale };
    const result = await api().post("/api/v1/practice/answer", body);
    const sent = await writeOrQueue(result, { url: "/api/v1/practice/answer", body, tag });
    setBusy(null);
    if (sent.kind === "sent" && result.ok) {
      apply(practiceAnsweredSchema.parse(result.data).result);
      return;
    }
    if (sent.kind === "queued") {
      haptics.warning();
      setQueued(body);
      return;
    }
    setChosen(null);
    setRefusal({ message: sent.kind === "refused" ? errorText({ ok: false, error: sent.message }, t("common.tryAgainMoment")) : t("common.tryAgainMoment"), retry: () => void choose(index) });
  };

  // A stranded answer: ask the idempotent endpoint for its verdict whenever the outbox flushes, and on a slow timer as the backstop.
  useEffect(() => {
    if (!queued) return;
    let alive = true;
    const recover = async () => {
      const r = await api().post("/api/v1/practice/answer", queued);
      if (!alive || !r.ok) return;
      const parsed = practiceAnsweredSchema.safeParse(r.data);
      if (!parsed.success) return;
      setQueued(null);
      apply(parsed.data.result);
    };
    const stop = onQueueEvent((event) => {
      if (event.type === "flushed") void recover();
    });
    const timer = setInterval(() => void recover(), 10_000);
    return () => {
      alive = false;
      stop();
      clearInterval(timer);
    };
  }, [queued, apply]);

  const next = async () => {
    setHiccup(false);
    setRefusal(null);
    setBusy("next");
    const r = await api().get(`/api/v1/practice/next?attemptId=${attemptId}&language=${locale}`);
    setBusy(null);
    if (!r.ok) {
      // Serving the next question needs the server; all that can honestly be done is say so and let the same button retry.
      if (r.status === 0) setHiccup(true);
      else setRefusal({ message: errorText(r, t("common.tryAgainMoment")), retry: () => void next() });
      return;
    }
    const served = practiceNextSchema.parse(r.data);
    setChosen(null);
    setOutcome(null);
    setPeeked(null);
    setConfirmReveal(false);
    if (served.question) {
      setQuestion(served.question);
    } else {
      setQuestion(null);
      setDone((d) => d ?? { badgeAwarded: false });
      void qc.invalidateQueries({ queryKey: ["family", "student", "practice"] });
    }
  };

  const reveal = async () => {
    if (!question) return;
    setHiccup(false);
    setRefusal(null);
    setBusy("reveal");
    const r = await api().post("/api/v1/practice/reveal", { attemptId, questionId: question.questionId, language: locale });
    setBusy(null);
    if (!r.ok) {
      if (r.status === 0) setHiccup(true);
      else setRefusal({ message: errorText(r, t("common.tryAgainMoment")), retry: () => void reveal() });
      return;
    }
    const shown = practiceRevealedSchema.parse(r.data);
    setPeeked({ solution: shown.solution, answerIndex: shown.answerIndex });
    setConfirmReveal(false);
    if (shown.badgeForfeited) setForfeited(true);
  };

  /* ---------------- finished ---------------- */
  if (done && !question) {
    const badge = done.badgeAwarded || topic.badgeEarned;
    const reached = assignment ? level >= assignment.targetLevel : true;
    const back = () => router.back();
    return (
      <Screen title={topic.name} description={topic.chapter}>
        <Card>
          <View style={{ alignItems: "center", gap: th.space[2] }}>
            <Icon name={badge ? "medal" : "checkCircle"} size={48} weight="fill" color={badge ? th.accentStrong : th.ok} />
            <Text variant="xl" bold accessibilityRole="header" style={{ textAlign: "center" }}>
              {badge ? t("practice.doneNoPeek", { topic: topic.name }) : t("practice.finishedTitle", { topic: topic.name })}
            </Text>
            <Text variant="sm" tone="muted" style={{ textAlign: "center" }}>
              {badge ? t("practice.badgeYours") : t("practice.wentThroughAll")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("practice.summaryAnswered")} value={tally.answered} />
            <Stat label={t("practice.summaryRight")} value={tally.right} tone="ok" />
            <Stat label={t("practice.colLevel")} value={`L${level}`} tone="accent" />
          </View>
        </Card>
        {assignment ? <AssignmentProgress assignment={assignment} level={level} /> : null}
        {/* The next step: a chapter the teacher set and not yet reached is climbed again; otherwise back to the list. */}
        {reached ? (
          <>
            <Button label={t("practice.backToPractice")} onPress={back} />
            <Button label={t("practice.playAgain")} variant="secondary" onPress={onFreshRun} />
          </>
        ) : (
          <>
            <Button label={t("practice.playAgain")} onPress={onFreshRun} />
            <Button label={t("practice.backToPractice")} variant="secondary" onPress={back} />
          </>
        )}
      </Screen>
    );
  }

  if (!question) return null;

  const shown = outcome ?? peeked;
  const answerIndex = outcome?.answerIndex ?? peeked?.answerIndex ?? null;
  const total = question.totalCount || topic.questionCount;

  return (
    <Screen title={topic.name} description={topic.chapter} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ gap: th.space[1] }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[1] }}>
          <Icon name="translate" size={16} color={th.fgMuted} weight="bold" />
          <Text variant="xs" tone="muted" bold>
            {t("language.readIn")}
          </Text>
        </View>
        {/* The choice goes to the account too (A3-states-16), so the next phone and the web's Practice read in it. */}
        <LanguageRow onChosen={saveLocale} />
      </View>
      {began.resumed && tally.answered === 0 ? (
        <Note tone="accent">
          <Text variant="sm">{t("practice.resumedNote")}</Text>
        </Note>
      ) : null}
      {assignment ? <AssignmentProgress assignment={assignment} level={level} /> : null}
      <OutboxBadge tag={tag} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: th.space[2] }}>
        <Pill label={`L${question.difficulty} · ${levelName(t, question.difficulty)}`} tone="accent" />
        <Text variant="xs" tone="muted">
          {[tally.streak >= 2 ? t("practice.streak", { n: tally.streak }) : null, t("practice.nOfTotal", { n: question.askedCount + 1, total })].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <Bar now={question.askedCount} max={Math.max(1, total)} label={t("practice.questionsAnswered")} />

      <Card>
        {/* figures (10 Oct 2026): the question's figure above the stem, in the stem's language. */}
        {question.image ? <QuestionFigure fileId={question.image.fileId} alt={question.image.alt} /> : null}
        <Text variant="lg" bold>
          {question.stem}
        </Text>
        <Choices choices={question.choices} chosen={chosen} answerIndex={shown ? answerIndex : null} disabled={busy !== null || outcome !== null || queued !== null} busy={busy === "answer"} onChoose={(i) => void choose(i)} />

        {outcome ? <Verdict correct={outcome.correct} /> : null}
        {shown ? (
          <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[1] }}>
            <Text variant="xs" tone="muted" bold>
              {t("practice.howItWorks")}
            </Text>
            <Text variant="sm">{shown.solution}</Text>
          </View>
        ) : null}
        {forfeited ? (
          <Text variant="xs" tone="muted">
            {t("practice.forfeitedNote", { topic: topic.name })}
          </Text>
        ) : null}
        {queued ? (
          <Note tone="warn">
            <View style={{ flexDirection: "row", gap: th.space[2] }}>
              <Icon name="wifiSlash" size={20} weight="fill" color={th.warn} />
              <View style={{ flex: 1, gap: th.space[1] }}>
                <Text variant="sm" bold accessibilityLiveRegion="polite">
                  {t("practice.offlineSavedTitle")}
                </Text>
                <Text variant="xs" tone="muted">
                  {t("practice.offlineSavedBody")}
                </Text>
              </View>
            </View>
          </Note>
        ) : null}
        {hiccup ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[1] }}>
            <Icon name="wifiSlash" size={16} weight="fill" color={th.warn} />
            <Text variant="xs" tone="warn" bold accessibilityLiveRegion="polite">
              {t("practice.connectionHiccup")}
            </Text>
          </View>
        ) : null}
        {refusal ? <Failed message={refusal.message} onRetry={refusal.retry} /> : null}

        {outcome ? (
          <Button label={t("practice.nextQuestion")} busy={busy === "next"} onPress={() => void next()} />
        ) : peeked ? (
          <Button label={t("practice.skipNext")} variant="secondary" busy={busy === "next"} onPress={() => void next()} />
        ) : confirmReveal ? (
          <Note tone="warn">
            <Text variant="sm" bold>
              {forfeited ? t("practice.showWorkingThis") : t("practice.noBadgeThisRun", { topic: topic.name })}
            </Text>
            <Button label={t("practice.yesShowMe")} variant="secondary" busy={busy === "reveal"} onPress={() => void reveal()} />
            <Button label={t("practice.keepTrying")} variant="ghost" onPress={() => setConfirmReveal(false)} />
          </Note>
        ) : queued ? null : (
          <Button label={t("practice.showMeHow")} variant="ghost" icon={<Icon name="eye" size={18} weight="bold" color={th.accentStrong} />} disabled={busy !== null} onPress={() => setConfirmReveal(true)} />
        )}
      </Card>
    </Screen>
  );
}

/** A chapter the teacher set: the target rung, where the pupil stands, the note and the day. */
function AssignmentProgress({ assignment, level }: { assignment: NonNullable<PracticeBegan["assignment"]>; level: number }) {
  const t = useT();
  const { locale } = useLocale();
  const reached = level >= assignment.targetLevel;
  return (
    <Card title={t("practice.assignedTitle")}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Text variant="sm" bold>
          {t("practice.assignedTarget", { tier: assignment.targetTierName, level: assignment.targetLevel })}
        </Text>
        <Pill label={reached ? t("practice.assignedReached") : t("practice.assignedKeepGoing")} tone={reached ? "ok" : "accent"} />
      </View>
      <Bar now={Math.min(level, assignment.targetLevel)} max={assignment.targetLevel} label={t("practice.youAreOn", { level, name: levelName(t, level) })} />
      <Text variant="xs" tone="muted">
        {[t("practice.youAreOn", { level, name: levelName(t, level) }), assignment.dueAt ? t("practice.dueOn", { date: formatInstant(assignment.dueAt, locale, { day: "numeric", month: "short" }) }) : null, assignment.note].filter(Boolean).join(" · ")}
      </Text>
    </Card>
  );
}

function Bar({ now, max, label }: { now: number; max: number; label: string }) {
  const th = useTheme();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now }} style={{ height: 6, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted, overflow: "hidden" }}>
      <View style={{ height: 6, width: `${Math.min(100, Math.round((now * 100) / Math.max(1, max)))}%`, backgroundColor: th.accent }} />
    </View>
  );
}

/** Right or wrong in words, with an icon and a colour — never colour alone. */
function Verdict({ correct }: { correct: boolean }) {
  const t = useT();
  const th = useTheme();
  return (
    <Note tone={correct ? "ok" : "danger"}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <Icon name={correct ? "checkCircle" : "xCircle"} size={20} weight="fill" color={correct ? th.ok : th.danger} />
        <Text variant="base" bold tone={correct ? "ok" : "danger"} accessibilityLiveRegion="polite" style={{ flex: 1 }}>
          {correct ? t("practice.gotIt") : t("practice.notThisTime")}
        </Text>
      </View>
    </Note>
  );
}

/** The options: each a large tappable row at least the tap height, lettered, marked right or wrong once the answer is known. */
function Choices({ choices, chosen, answerIndex, disabled, busy, onChoose }: { choices: string[]; chosen: number | null; answerIndex: number | null; disabled: boolean; busy: boolean; onChoose: (index: number) => void }) {
  const t = useT();
  const th = useTheme();
  const known = answerIndex !== null;
  return (
    <View style={{ gap: th.space[2] }}>
      {choices.map((choice, i) => {
        const isAnswer = known && answerIndex === i;
        const isWrong = known && chosen === i && answerIndex !== i;
        const isChosen = chosen === i;
        const border = isAnswer ? th.ok : isWrong ? th.danger : isChosen ? th.accent : th.border;
        const ground = isAnswer ? th.okSoft : isWrong ? th.dangerSoft : th.surface;
        const said = isAnswer ? `, ${t("practice.rightAnswer")}` : isWrong ? `, ${t("practice.yourAnswer")}` : "";
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`${LETTER(i)}. ${choice}${said}`}
            accessibilityState={{ disabled, selected: isChosen }}
            disabled={disabled}
            onPress={() => {
              haptics.tap();
              onChoose(i);
            }}
            style={({ pressed }) => ({
              minHeight: th.tap,
              flexDirection: "row",
              alignItems: "center",
              gap: th.space[3],
              padding: th.space[3],
              borderRadius: th.radius.md,
              borderWidth: 2,
              borderColor: border,
              backgroundColor: ground,
              opacity: known && !isAnswer && !isWrong ? 0.6 : pressed ? 0.8 : 1,
            })}
          >
            <View style={{ width: 32, height: 32, borderRadius: th.radius.xl, borderWidth: 1, borderColor: th.borderStrong, alignItems: "center", justifyContent: "center" }}>
              <Text variant="xs" bold>
                {LETTER(i)}
              </Text>
            </View>
            <Text variant="base" style={{ flex: 1 }}>
              {choice}
            </Text>
            {isAnswer ? <Icon name="checkCircle" size={22} weight="fill" color={th.ok} /> : null}
            {isWrong ? <Icon name="xCircle" size={22} weight="fill" color={th.danger} /> : null}
            {busy && isChosen ? <ActivityIndicator color={th.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------------- */
/* Smart revision: the pupil's own missed questions, walked once              */
/* ------------------------------------------------------------------------- */

function RevisionQuiz() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  useOutboxRunner();
  const queue = useQuery({
    queryKey: ["practice", "revision", locale],
    queryFn: async () => practiceRevisionSchema.parse(unwrap(await api().get(`/api/v1/practice/revision?language=${locale}`))),
    // Fixed when read: a queue that grows while you clear it never feels clearable.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => () => void qc.invalidateQueries({ queryKey: ["family", "student", "practice"] }), [qc]);
  const items = queue.data?.items ?? [];
  const current = items[index];
  return (
    <Screen
      title={t("practice.revisionTitle")}
      description={items.length > 0 ? t("practice.revisionHint", { n: items.length }) : undefined}
      refreshing={queue.isRefetching}
      onRefresh={() => {
        setIndex(0);
        void queue.refetch();
      }}
    >
      {queue.isPending ? <Loading /> : null}
      {queue.isError ? <Failed message={failText(queue.error, t)} onRetry={() => void queue.refetch()} /> : null}
      <OutboxBadge tag="practice:revision" />
      {queue.data && items.length === 0 ? (
        <Empty icon="clockCounterClockwise" title={t("practice.revisionTitle")} body={t("practice.revisionEmpty")} action={<Button label={t("practice.allPractice")} variant="secondary" onPress={() => router.back()} />} />
      ) : null}
      {queue.data && items.length > 0 && !current ? (
        <Card>
          <View style={{ alignItems: "center", gap: 2 }}>
            <RevisionDoneIcon />
            <Text variant="lg" bold accessibilityRole="header" style={{ textAlign: "center" }}>
              {t("practice.revisionAllDone")}
            </Text>
          </View>
          <Button label={t("practice.backToPractice")} onPress={() => router.back()} />
        </Card>
      ) : null}
      {current ? <RevisionQuestion key={current.questionId} item={current} position={index + 1} total={items.length} onNext={() => setIndex((i) => i + 1)} /> : null}
    </Screen>
  );
}

function RevisionDoneIcon() {
  const th = useTheme();
  return <Icon name="checkCircle" size={40} weight="fill" color={th.ok} />;
}

function RevisionQuestion({ item, position, total, onNext }: { item: PracticeRevision["items"][number]; position: number; total: number; onNext: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [queued, setQueued] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [busy, setBusy] = useState(false);
  const served = useQuery({
    queryKey: ["practice", "revision", "question", item.questionId, locale],
    queryFn: async () => practiceRevisionQuestionSchema.parse(unwrap(await api().get(`/api/v1/practice/revision/question?questionId=${encodeURIComponent(item.questionId)}&language=${locale}`))),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const answer = async (index: number) => {
    if (outcome || queued || busy) return;
    setChosen(index);
    setRefusal(null);
    setBusy(true);
    const body: PracticeRevisionAnswerBody = { questionId: item.questionId, chosenIndex: index, clientId: newClientId(), language: locale };
    const result = await api().post("/api/v1/practice/revision/answer", body);
    const sent = await writeOrQueue(result, { url: "/api/v1/practice/revision/answer", body, tag: "practice:revision" });
    setBusy(false);
    if (sent.kind === "sent" && result.ok) {
      const r = practiceRevisionAnsweredSchema.parse(result.data).result;
      setOutcome({ correct: r.correct, answerIndex: r.answerIndex, solution: r.solution });
      if (r.correct) haptics.success();
      else haptics.error();
      return;
    }
    if (sent.kind === "queued") {
      haptics.warning();
      setQueued(true);
      return;
    }
    setChosen(null);
    setRefusal({ message: sent.kind === "refused" ? errorText({ ok: false, error: sent.message }, t("common.tryAgainMoment")) : t("common.tryAgainMoment"), retry: () => void answer(index) });
  };

  const th = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: th.space[2] }}>
        <Text variant="xs" tone="muted">
          {`${item.topicName} · ${subjectName(t, item.subject)}`}
        </Text>
        <Text variant="xs" tone="muted">
          {t("practice.revisionProgress", { done: position, total })}
        </Text>
      </View>
      <Bar now={position - 1} max={total} label={t("practice.questionsAnswered")} />
      {served.isPending ? <Loading /> : null}
      {served.isError ? <Failed message={failText(served.error, t)} onRetry={() => void served.refetch()} /> : null}
      {served.data ? (
        <>
          {/* figures (10 Oct 2026): a re-served question keeps its figure. */}
          {served.data.image ? <QuestionFigure fileId={served.data.image.fileId} alt={served.data.image.alt} /> : null}
          <Text variant="lg" bold>
            {served.data.stem}
          </Text>
          <Choices choices={served.data.choices} chosen={chosen} answerIndex={outcome ? outcome.answerIndex : null} disabled={busy || outcome !== null || queued} busy={busy} onChoose={(i) => void answer(i)} />
        </>
      ) : null}
      {outcome ? (
        <>
          <Verdict correct={outcome.correct} />
          <Text variant="sm" tone="muted">
            {outcome.solution}
          </Text>
        </>
      ) : null}
      {queued ? (
        <Note tone="warn">
          <Text variant="sm" bold accessibilityLiveRegion="polite">
            {t("practice.offlineSavedTitle")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("practice.offlineSavedBody")}
          </Text>
        </Note>
      ) : null}
      {refusal ? <Failed message={refusal.message} onRetry={refusal.retry} /> : null}
      {outcome || queued ? <Button label={t("practice.nextQuestion")} onPress={onNext} /> : null}
    </Card>
  );
}
