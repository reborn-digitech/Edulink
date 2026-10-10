import { useState } from "react";
import { AccessibilityInfo, Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ASSISTANT_QUESTION_MAX,
  assistantAnswerSchema,
  assistantConversationDetailSchema,
  assistantConversationListSchema,
  assistantConversationSchema,
  assistantStatusSchema,
  familyAssistantOptOutSavedSchema,
  familyAssistantSchema,
  type AssistantCitation,
  type AssistantMessage,
  type AssistantStatus,
} from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Icon, Loading, Row, Screen, SwitchRow, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap, ApiRefused } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatDateTime } from "@/lib/dates";
import { screenFor, webLinkOrNull } from "@/lib/links";
import { openWeb } from "@/screens/family/shared";

/**
 * The assistant on the phone (Phase C, 10 Oct 2026; docs/plans/assistant.md): a screen under More for every role whose
 * school has the ASSISTANT module on, reading the web's doors (GET /api/v1/assistant for what it is for and whether the
 * person may ask, the conversations of the last thirty days, one conversation, ask, "was this helpful", delete).
 *
 * SHORT ANSWERS BY DEFAULT: an answer is cut at a sentence near SHORT_ANSWER characters with "Show the whole answer"
 * beneath. NO OFFLINE TUTOR: a door not reached is the offline card, never a queued question (nothing goes in the
 * outbox). The answer arrives whole in the door's response (the web draws the event stream's pieces; the phone waits
 * for the checked answer), and a screen reader is told it once. Screen capture stays allowed: nothing on it is
 * sensitive once stripped (the plan's Phase C).
 */
export const SHORT_ANSWER = 280;
const KEY = ["assistant"] as const;

/** The first part of an answer: whole when it is short, else cut at the last sentence end before the limit (or a word). */
export function shortAnswer(text: string, max = SHORT_ANSWER): { text: string; cut: boolean } {
  if (text.length <= max) return { text, cut: false };
  const head = text.slice(0, max);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("। "), head.lastIndexOf("? "), head.lastIndexOf("\n"));
  const at = sentence > max * 0.4 ? sentence + 1 : head.lastIndexOf(" ") > 0 ? head.lastIndexOf(" ") : max;
  return { text: `${text.slice(0, at).trimEnd()}…`, cut: true };
}

/** The first screen's lines, as the web's: what it is for in this role, the conversation as the unit, thirty days, a guardian's opt-out. */
export function firstScreenKeys(status: Pick<AssistantStatus, "tutor" | "optOutPath">): TranslationKey[] {
  return [
    "assistantUi.firstHelp",
    status.tutor ? "assistantUi.firstTutor" : "assistantUi.firstHelpOnly",
    "assistantUi.firstNotGeneral",
    "assistantUi.firstConversation",
    "assistantUi.firstKept",
    ...(status.optOutPath ? (["assistantUi.firstFamily"] as TranslationKey[]) : []),
  ];
}

/**
 * Who may follow a book's citation off the platform (the coordinator's rule of 10 Oct 2026, under the owner's gate on
 * links off the platform for minors): staff who teach or run the school. A pupil, a guardian and every other role read
 * the book, chapter, section and page as text. A help entry opens its page for everyone.
 */
export const BOOK_LINK_ROLES: readonly string[] = ["TEACHER", "FACULTY", "HOD", "ADMIN", "PRINCIPAL"];

/** What a citation opens: a book's publisher copy at the page (https, BOOK_LINK_ROLES only), or a help entry's page in the app or on the web. */
export function citationTarget(c: AssistantCitation, role: string | null): { kind: "url"; url: string } | { kind: "screen"; target: NonNullable<ReturnType<typeof screenFor>> } | { kind: "web"; path: string } | null {
  if (c.kind === "HELP") {
    if (!c.pagePath || !/^\/(?!\/)/.test(c.pagePath)) return null;
    const target = screenFor(c.pagePath);
    return target ? { kind: "screen", target } : { kind: "web", path: c.pagePath };
  }
  if (!role || !BOOK_LINK_ROLES.includes(role)) return null;
  const url = webLinkOrNull(c.sourceUrl);
  if (!url || !url.startsWith("https://")) return null;
  return { kind: "url", url: url.includes("#") ? url : `${url}#page=${c.page}` };
}

const offline = (error: unknown) => error instanceof ApiRefused && error.status === 0;

export function Assistant() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" && params.id ? params.id : null;
  const status = useQuery({ queryKey: [...KEY, "status"], queryFn: async () => assistantStatusSchema.parse(unwrap(await api().get("/api/v1/assistant"))) });
  const list = useQuery({ queryKey: [...KEY, "list"], enabled: !id, queryFn: async () => assistantConversationListSchema.parse(unwrap(await api().get("/api/v1/assistant/conversations"))) });
  const detail = useQuery({ queryKey: [...KEY, "one", id], enabled: !!id, queryFn: async () => assistantConversationDetailSchema.parse(unwrap(await api().get(`/api/v1/assistant/conversations/${encodeURIComponent(id!)}`))) });
  const failedQuery = [status, id ? detail : list].find((q) => q.isError);
  const refetch = () => void Promise.all([status.refetch(), id ? detail.refetch() : list.refetch()]);

  return (
    <Screen title={t("assistantUi.title")} description={t("assistantUi.intro")} refreshing={status.isRefetching} onRefresh={refetch}>
      {status.isPending ? <Loading /> : null}
      {failedQuery ? offline(failedQuery.error) ? <Offline onRetry={refetch} /> : <Failed error={failedQuery.error} onRetry={refetch} /> : null}
      {status.data && !failedQuery ? (
        id ? (
          detail.data ? (
            <Conversation key={id} status={status.data} conversationId={id} initial={detail.data.messages} onDeleted={() => router.replace("/(app)/assistant" as never)} />
          ) : detail.isPending ? (
            <Loading />
          ) : null
        ) : (
          <>
            <Conversation status={status.data} conversationId={null} initial={[]} />
            <Card title={t("assistantUi.conversations")}>
              <Text variant="sm" tone="muted">
                {t("assistantUi.conversationsBody")}
              </Text>
              {list.isPending ? <Loading /> : null}
              {/* Two lines, not the empty-state card: the way on is the box just above, not a button that would lead to it. */}
              {list.data && list.data.conversations.length === 0 ? (
                <View testID="assistant-no-conversations">
                  <Text variant="base" bold>
                    {t("assistantUi.noConversations")}
                  </Text>
                  <Text variant="sm" tone="muted">
                    {t("assistantUi.noConversationsBody")}
                  </Text>
                </View>
              ) : null}
              {list.data?.conversations.map((c) => (
                <Row key={c.id} title={c.title ?? t("assistantUi.newConversation")} caption={t("assistantUi.lastWhen", { when: formatDateTime(c.lastAt) })} onPress={() => router.push({ pathname: "/(app)/assistant", params: { id: c.id } } as never)} />
              ))}
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}

function Offline({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  const th = useTheme();
  return (
    <View accessibilityRole="alert" style={{ padding: th.space[5], gap: th.space[2], backgroundColor: th.surfaceMuted, borderRadius: th.radius.lg }} testID="assistant-offline">
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <Icon name="wifiSlash" size={20} color={th.fgMuted} />
        <Text variant="base" bold>
          {t("assistantUi.offlineTitle")}
        </Text>
      </View>
      <Text variant="sm" tone="muted">
        {t("assistantUi.offlineBody")}
      </Text>
      <Button label={t("assistantUi.retry")} variant="secondary" onPress={onRetry} />
    </View>
  );
}

function FirstScreen({ status }: { status: AssistantStatus }) {
  const t = useT();
  const router = useRouter();
  const path = status.optOutPath;
  const openOptOut = () => {
    if (!path) return;
    const target = screenFor(path);
    if (target) router.push(target as never);
    else openWeb(path);
  };
  return (
    <Card title={t("assistantUi.firstTitle")} testID="assistant-first-screen">
      {firstScreenKeys(status).map((key) => (
        <Text key={key} variant="sm" tone="muted">
          {`• ${t(key)}`}
        </Text>
      ))}
      {path ? <Button label={t("assistantUi.firstFamilyLink")} variant="secondary" onPress={openOptOut} /> : null}
    </Card>
  );
}

/** One conversation: the first screen while empty, the messages, the box. A refusal is the assistant's own line, with no retry. */
function Conversation({ status, conversationId, initial, onDeleted }: { status: AssistantStatus; conversationId: string | null; initial: AssistantMessage[]; onDeleted?: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const client = useQueryClient();
  const [id, setId] = useState(conversationId);
  const [messages, setMessages] = useState(initial);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [problem, setProblem] = useState<{ offline: boolean; text: string; question: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const ask = async (raw: string) => {
    const q = raw.trim().slice(0, ASSISTANT_QUESTION_MAX);
    if (!q || asking) return;
    setProblem(null);
    setAsking(q);
    // The question moves into the thread as it is sent; a failure puts it back in the box (10 Oct 2026).
    setQuestion("");
    let cid = id;
    if (!cid) {
      const opened = await api().post("/api/v1/assistant/conversations", { language: locale });
      if (!opened.ok) {
        setAsking(null);
        setQuestion(q);
        setProblem({ offline: opened.status === 0, text: opened.error, question: q });
        return;
      }
      cid = assistantConversationSchema.parse(opened.data).id;
      setId(cid);
    }
    const answered = await api().post(`/api/v1/assistant/conversations/${encodeURIComponent(cid)}/messages`, { text: q });
    setAsking(null);
    if (!answered.ok) {
      setQuestion(q);
      setProblem({ offline: answered.status === 0, text: answered.error, question: q });
      return;
    }
    const data = assistantAnswerSchema.parse(answered.data);
    setMessages((list) => [...list, data.question, data.answer]);
    // Once per answer, the whole of it: the phone's live region.
    AccessibilityInfo.announceForAccessibility(t("assistantUi.announce", { answer: data.answer.text }));
    void client.invalidateQueries({ queryKey: [...KEY, "list"] });
  };

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    const done = await api().request("DELETE", `/api/v1/assistant/conversations/${encodeURIComponent(id)}`);
    setDeleting(false);
    if (!done.ok) return setProblem({ offline: done.status === 0, text: done.error, question: "" });
    void client.invalidateQueries({ queryKey: [...KEY, "list"] });
    onDeleted?.();
  };

  return (
    <>
      {messages.length === 0 && !asking ? <FirstScreen status={status} /> : null}
      {messages.map((m) => (
        <Bubble key={m.id} message={m} conversationId={id} />
      ))}
      {asking ? (
        <>
          <Bubble message={{ id: "asking", role: "USER", text: asking, createdAt: new Date().toISOString(), citations: [], verdict: null, mode: null, hint: false, helpful: null }} conversationId={null} />
          <View style={{ padding: th.space[3] }} accessibilityRole="progressbar" accessibilityLabel={t("assistantUi.writing")}>
            <Text variant="sm" tone="muted">
              {t("assistantUi.writing")}
            </Text>
          </View>
        </>
      ) : null}
      {problem ? (
        problem.offline ? (
          <Offline onRetry={() => void ask(problem.question)} />
        ) : (
          <Failed message={problem.text || t("assistantUi.failed")} />
        )
      ) : null}
      {status.available ? (
        <Card>
          <Field label={t("assistantUi.askLabel")} hint={t("assistantUi.askHint")} value={question} onChangeText={setQuestion} multiline maxLength={ASSISTANT_QUESTION_MAX} editable={!asking} />
          <Button label={t("assistantUi.send")} busy={!!asking} disabled={!question.trim()} onPress={() => void ask(question)} />
        </Card>
      ) : (
        <View accessibilityRole="text" style={{ padding: th.space[4], backgroundColor: th.surfaceMuted, borderRadius: th.radius.md }} testID="assistant-unavailable">
          <Text variant="sm" tone="muted">
            {unavailableText(status.reason, t)}
          </Text>
        </View>
      )}
      {id && onDeleted ? (
        confirming ? (
          <Card>
            <Text variant="sm">{t("assistantUi.deleteConfirm")}</Text>
            <Button label={t("assistantUi.deleteYes")} variant="danger" busy={deleting} onPress={() => void remove()} />
            <Button label={t("common.cancel")} variant="secondary" onPress={() => setConfirming(false)} />
          </Card>
        ) : (
          <Button label={t("assistantUi.deleteConversation")} variant="secondary" onPress={() => setConfirming(true)} />
        )
      ) : null}
    </>
  );
}

export function unavailableText(reason: string | null, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (!reason) return t("assistantUi.unavailableTitle");
  const key = `assistantService.unavailable.${reason}` as TranslationKey;
  const said = t(key);
  return said && said !== key ? said : t("assistantUi.unavailableTitle");
}

function Bubble({ message: m, conversationId }: { message: AssistantMessage; conversationId: string | null }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const role = useRole();
  const [whole, setWhole] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(m.helpful);
  const mine = m.role === "USER";
  const shown = mine || whole ? { text: m.text, cut: false } : shortAnswer(m.text);
  const open = (c: AssistantCitation) => {
    const target = citationTarget(c, role);
    if (!target) return;
    if (target.kind === "url") void Linking.openURL(target.url);
    else if (target.kind === "screen") router.push(target.target as never);
    else openWeb(target.path);
  };
  const give = async (value: boolean) => {
    if (!conversationId) return;
    const sent = await api().post(`/api/v1/assistant/conversations/${encodeURIComponent(conversationId)}/feedback`, { messageId: m.id, helpful: value });
    if (sent.ok) setHelpful(value);
  };
  return (
    <View
      testID={mine ? "assistant-question" : "assistant-answer"}
      style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "92%", padding: th.space[3], gap: th.space[2], borderRadius: th.radius.lg, backgroundColor: mine ? th.accentSoft : th.surface, borderWidth: mine ? 0 : 1, borderColor: th.border }}
    >
      <Text variant="xs" tone="muted" bold>
        {mine ? t("assistantUi.you") : t("assistantUi.assistant")}
      </Text>
      {m.hint ? (
        <Text variant="xs" bold tone="warn" testID="assistant-hint">
          {t("assistantUi.hint")}
        </Text>
      ) : null}
      <Text variant="base">{shown.text}</Text>
      {shown.cut ? <Button label={t("assistantUi.showWhole")} variant="ghost" onPress={() => setWhole(true)} /> : null}
      {m.hint ? (
        <Text variant="sm" tone="muted">
          {t("assistantUi.hintNote")}
        </Text>
      ) : null}
      {m.citations.length ? (
        <View testID="assistant-citations" style={{ gap: th.space[1] }}>
          <Text variant="xs" tone="muted" bold>
            {t("assistantUi.sources")}
          </Text>
          {m.citations.map((c) => (
            <Row key={`${c.kind}-${c.n}`} icon={c.kind === "HELP" ? "globe" : "bookOpen"} title={`[${c.n}] ${citationText(c, t)}`} onPress={citationTarget(c, role) ? () => open(c) : undefined} />
          ))}
        </View>
      ) : null}
      {!mine && conversationId ? (
        helpful !== null ? (
          <Text variant="xs" tone="muted">
            {t("assistantUi.helpfulThanks")}
          </Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[2] }} accessibilityLabel={t("assistantUi.helpful")}>
            <Text variant="xs" tone="muted">
              {t("assistantUi.helpful")}
            </Text>
            <Button label={t("assistantUi.helpfulYes")} variant="ghost" accessibilityLabel={`${t("assistantUi.helpful")} ${t("assistantUi.helpfulYes")}`} onPress={() => void give(true)} />
            <Button label={t("assistantUi.helpfulNo")} variant="ghost" accessibilityLabel={`${t("assistantUi.helpful")} ${t("assistantUi.helpfulNo")}`} onPress={() => void give(false)} />
          </View>
        )
      ) : null}
    </View>
  );
}

export function citationText(c: AssistantCitation, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (c.kind === "HELP") return c.title;
  // The board by its short name: "Balbharati (Maharashtra State Bureau of …)" is "Balbharati" (the live walk of 10 Oct).
  const board = c.board.split(" (")[0]!.trim();
  const book = board && !c.book.toLowerCase().includes(board.toLowerCase()) ? `${board} · ${c.book}` : c.book;
  if (!c.chapter) return t("assistantUi.citationNoChapter", { book, page: c.page });
  return c.section ? t("assistantUi.citationSection", { book, chapter: c.chapter, section: c.section, page: c.page }) : t("assistantUi.citation", { book, chapter: c.chapter, page: c.page });
}

/**
 * A guardian's opt-out per child, on the phone's settings as on the web's (/parent/settings, the card #assistant):
 * one switch per child, on while the child may use the assistant; a child whose school has it off is a line, not a
 * switch. The assistant's first screen sends a guardian here.
 */
export function FamilyAssistantCard() {
  const t = useT();
  const client = useQueryClient();
  const query = useQuery({ queryKey: [...KEY, "family"], queryFn: async () => familyAssistantSchema.parse(unwrap(await api().get("/api/v1/family/assistant"))) });
  const [busy, setBusy] = useState<string | null>(null);
  const [said, setSaid] = useState<{ ok: boolean; text: string } | null>(null);
  const flip = async (childId: string, name: string, allowed: boolean) => {
    setBusy(childId);
    const sent = await api().post("/api/v1/family/assistant/opt-out", { childId, optedOut: !allowed });
    setBusy(null);
    if (!sent.ok) return setSaid({ ok: false, text: sent.error || t("common.somethingWrong") });
    const saved = familyAssistantOptOutSavedSchema.parse(sent.data);
    setSaid({ ok: true, text: t(saved.optedOut ? "assistantUi.familyOff" : "assistantUi.familyOn", { name }) });
    void client.invalidateQueries({ queryKey: [...KEY, "family"] });
  };
  return (
    <Card title={t("assistantUi.familyTitle")} testID="family-assistant-card">
      <Text variant="xs" tone="muted">
        {t("assistantUi.familyBody")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {said ? (
        <Text variant="sm" bold tone={said.ok ? "ok" : "danger"} accessibilityLiveRegion="polite">
          {said.text}
        </Text>
      ) : null}
      {query.data?.children.map((child) =>
        child.schoolOn ? (
          <SwitchRow key={child.childId} label={t("assistantUi.familyAllow", { name: child.name })} value={!child.optedOut} disabled={busy === child.childId} onChange={(next) => void flip(child.childId, child.name, next)} />
        ) : (
          <Text key={child.childId} variant="sm" tone="muted">
            {t("assistantUi.familySchoolOff", { name: child.name })}
          </Text>
        ),
      )}
    </Card>
  );
}
