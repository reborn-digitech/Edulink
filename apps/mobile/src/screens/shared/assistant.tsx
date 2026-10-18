import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Linking, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ASSISTANT_QUESTION_MAX,
  answerPlainText,
  assistantAnswerSchema,
  assistantConversationSchema,
  assistantSuggestionsSchema,
  familyAssistantOptOutSavedSchema,
  familyAssistantSchema,
  inboxConversationOpenedSchema,
  parseAnswer,
  type AnswerBlock,
  type AssistantAbout,
  type AssistantChip,
  type AssistantCitation,
  type AssistantMessage,
  type AssistantStatus,
} from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Icon, Loading, Row, SwitchRow, Text } from "@/components";
import { AnswerMarkdown } from "@/components/answer-markdown";
import { api } from "@/lib/api";
import { unwrap, ApiRefused } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { screenFor, webLinkOrNull } from "@/lib/links";
import { openWeb } from "@/screens/family/shared";

/**
 * VIDURA ON THE PHONE (Phase C, 10 Oct 2026; Vidura pass 1, 17 Oct 2026; docs/plans/vidura.md): one conversation in
 * the bottom sheet the round button opens (vidura.tsx), reading the web's doors (GET /api/v1/assistant for what it is
 * for and whether the person may ask, the suggested questions, one conversation, ask, "was this helpful", delete).
 *
 * SHORT ANSWERS BY DEFAULT: an answer shows its first blocks up to about SHORT_ANSWER characters with "Show the whole
 * answer" beneath. NO OFFLINE TUTOR: a door not reached is the offline card, never a queued question (nothing goes in
 * the outbox). The answer arrives whole in the door's response (the web draws the event stream's pieces; the phone
 * waits for the checked answer), drawn from its restricted Markdown, and a screen reader is told it once. Since pass 1:
 * the mode chip on each answer and the pick for the next question, three suggested questions on an empty conversation,
 * "Go on" for an answer cut at its length, and "Ask a person" when Vidura cannot answer.
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

/**
 * The first blocks of an answer (Vidura pass 1): whole blocks up to about `max` characters of their words, at least
 * one; a lone long paragraph is cut at a sentence as before. `cut` when anything was left out.
 */
export function shortBlocks(text: string, max = SHORT_ANSWER): { blocks: AnswerBlock[]; cut: boolean } {
  const blocks = parseAnswer(text);
  if (answerPlainText(text).length <= max) return { blocks, cut: false };
  const out: AnswerBlock[] = [];
  let used = 0;
  for (const b of blocks) {
    const words = answerPlainText(blockText(b)).length;
    if (out.length && used + words > max) break;
    out.push(b);
    used += words;
  }
  if (out.length === 1 && out[0]!.kind === "paragraph" && used > max) {
    const short = shortAnswer(answerPlainText(blockText(out[0]!)), max);
    return { blocks: parseAnswer(short.text), cut: true };
  }
  return { blocks: out, cut: out.length < blocks.length };
}

/** A block back to its Markdown (for measuring and cutting). */
function blockText(b: AnswerBlock): string {
  const inl = (xs: { kind: string; text?: string; path?: string; n?: number }[]) => xs.map((x) => (x.kind === "cite" ? `[${x.n}]` : x.kind === "path" ? x.path : x.kind === "bold" ? `**${x.text}**` : x.text)).join("");
  if (b.kind === "heading") return `### ${inl(b.inlines)}`;
  if (b.kind === "paragraph") return inl(b.inlines);
  if (b.kind === "list") return b.items.map((it, n) => `${b.ordered ? `${b.start + n}.` : "-"} ${inl(it)}`).join("\n");
  return [b.header, ...b.rows].map((r) => `| ${r.map(inl).join(" | ")} |`).join("\n");
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
  // A help entry's page, and (the data questions, 11 Oct 2026) one of the person's own rows — a post, a circular, a thread: the platform's own page.
  if (c.kind === "HELP" || c.kind === "LINK") return pageTarget(c.pagePath);
  if (!role || !BOOK_LINK_ROLES.includes(role)) return null;
  const url = webLinkOrNull(c.sourceUrl);
  if (!url || !url.startsWith("https://")) return null;
  return { kind: "url", url: url.includes("#") ? url : `${url}#page=${c.page}` };
}

/** A path on the platform, as the app's own screen when it has one, else the web page; never anything off the platform. */
export function pageTarget(path: string | null): { kind: "screen"; target: NonNullable<ReturnType<typeof screenFor>> } | { kind: "web"; path: string } | null {
  if (!path || !/^\/(?!\/)/.test(path)) return null;
  const target = screenFor(path);
  return target ? { kind: "screen", target } : { kind: "web", path };
}

/** Not reached (offline, a dropped connection): the offline card, never a queued question. */
export const isOffline = (error: unknown) => error instanceof ApiRefused && error.status === 0;

export function Offline({ onRetry }: { onRetry: () => void }) {
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

function FirstScreen({ status, onLeave }: { status: AssistantStatus; onLeave?: () => void }) {
  const t = useT();
  const router = useRouter();
  const path = status.optOutPath;
  const openOptOut = () => {
    if (!path) return;
    onLeave?.();
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

/** A mode's name in the reader's language. */
const chipName = (chip: AssistantChip, t: (key: TranslationKey, vars?: Record<string, string | number>) => string) => t(`viduraUi.mode${chip}` as TranslationKey);

/**
 * One conversation: the first screen and the suggested questions while empty, the messages, the mode for the next
 * question and the box. A refusal is Vidura's own line, with no retry, and "Ask a person" when the door names one.
 * `page` is the web page the screen stands for (page awareness); `onLeave` closes the sheet before a link is followed.
 */
export function Conversation({
  status,
  conversationId,
  initial,
  onDeleted,
  page = null,
  onLeave,
  autoAsk = null,
}: {
  status: AssistantStatus;
  conversationId: string | null;
  initial: AssistantMessage[];
  onDeleted?: () => void;
  page?: string | null;
  onLeave?: () => void;
  /** "Explain this to me" (pass 2): asked once, as soon as the conversation is drawn, with the row it is about. */
  autoAsk?: { question: string; about: AssistantAbout; n: number } | null;
}) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const client = useQueryClient();
  const [id, setId] = useState(conversationId);
  const [messages, setMessages] = useState(initial);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [problem, setProblem] = useState<{ offline: boolean; text: string; question: string; goOn: boolean } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<AssistantChip | null>(null);
  const empty = messages.length === 0 && !asking;
  const suggestions = useQuery({
    queryKey: [...KEY, "suggestions", page ?? ""],
    enabled: empty && status.available,
    queryFn: async () => {
      const query = page ? `?page=${encodeURIComponent(page)}` : "";
      return assistantSuggestionsSchema.parse(unwrap(await api().get(`/api/v1/assistant/suggestions${query}`)));
    },
  });

  const ask = async (raw: string, goOn = false, about?: AssistantAbout) => {
    const q = raw.trim().slice(0, ASSISTANT_QUESTION_MAX);
    if (!q || asking) return;
    setProblem(null);
    setAsking(q);
    // The question moves into the thread as it is sent; a failure puts it back in the box (10 Oct 2026).
    setQuestion("");
    let cid = id;
    if (!cid) {
      // A guardian's "Explain this" opens the conversation at that child's school (pass 2).
      const opened = await api().post("/api/v1/assistant/conversations", { language: locale, ...(about?.childId ? { childId: about.childId } : {}) });
      if (!opened.ok) {
        setAsking(null);
        if (!goOn) setQuestion(q);
        setProblem({ offline: opened.status === 0, text: opened.error, question: q, goOn });
        return;
      }
      cid = assistantConversationSchema.parse(opened.data).id;
      setId(cid);
    }
    const body = { text: q, ...(mode && !goOn ? { mode } : {}), ...(page && !goOn ? { page } : {}), ...(goOn ? { goOn: true } : {}), ...(about ? { about } : {}) };
    const answered = await api().post(`/api/v1/assistant/conversations/${encodeURIComponent(cid)}/messages`, body);
    setAsking(null);
    if (!answered.ok) {
      if (!goOn) setQuestion(q);
      setProblem({ offline: answered.status === 0, text: answered.error, question: q, goOn });
      return;
    }
    const data = assistantAnswerSchema.parse(answered.data);
    // The pick re-routes this one question; Vidura picks again for the next.
    setMode(null);
    setMessages((list) => [...list, data.question, data.answer]);
    // Once per answer, the whole of it, in words (not the Markdown's marks): the phone's live region.
    AccessibilityInfo.announceForAccessibility(t("assistantUi.announce", { answer: answerPlainText(data.answer.text) }));
    void client.invalidateQueries({ queryKey: [...KEY, "list"] });
  };

  // "Explain this to me" (pass 2): the question is asked once, when this new conversation is drawn.
  const autoAsked = useRef<number | null>(null);
  useEffect(() => {
    if (!autoAsk || autoAsked.current === autoAsk.n || !status.available) return;
    autoAsked.current = autoAsk.n;
    void ask(autoAsk.question, false, autoAsk.about);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- asked once per press; `ask` is recreated each render
  }, [autoAsk, status.available]);

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    const done = await api().request("DELETE", `/api/v1/assistant/conversations/${encodeURIComponent(id)}`);
    setDeleting(false);
    if (!done.ok) return setProblem({ offline: done.status === 0, text: done.error, question: "", goOn: false });
    void client.invalidateQueries({ queryKey: [...KEY, "list"] });
    onDeleted?.();
  };
  const lastId = messages[messages.length - 1]?.id ?? null;

  return (
    <>
      {empty && suggestions.data?.suggestions.length ? (
        <View style={{ gap: th.space[2] }} testID="vidura-suggestions">
          <Text variant="xs" tone="muted" bold accessibilityRole="header" level={3}>
            {t("viduraUi.suggestionsTitle")}
          </Text>
          {suggestions.data.suggestions.map((s) => (
            <Button key={s.text} label={s.text} variant="secondary" onPress={() => void ask(s.text)} />
          ))}
        </View>
      ) : null}
      {/* The suggestions first, what Vidura is for after them (the live walk of 17 Oct 2026). */}
      {empty ? <FirstScreen status={status} onLeave={onLeave} /> : null}
      {messages.map((m) => (
        <Bubble key={m.id} message={m} conversationId={id} onLeave={onLeave} onGoOn={m.id === lastId && m.cut && !asking ? () => void ask(t("viduraUi.goOn"), true) : undefined} />
      ))}
      {asking ? (
        <>
          <Bubble message={{ id: "asking", role: "USER", text: asking, createdAt: new Date().toISOString(), citations: [], verdict: null, mode: null, hint: false, helpful: null, chip: null, cut: false, askPerson: null, standard: false }} conversationId={null} />
          <View style={{ padding: th.space[3] }} accessibilityRole="progressbar" accessibilityLabel={t("assistantUi.writing")}>
            <Text variant="sm" tone="muted">
              {t("assistantUi.writing")}
            </Text>
          </View>
        </>
      ) : null}
      {problem ? (
        problem.offline ? (
          <Offline onRetry={() => void ask(problem.question, problem.goOn)} />
        ) : (
          <Failed message={problem.text || t("assistantUi.failed")} />
        )
      ) : null}
      {status.available ? (
        <Card>
          {status.modes.length > 1 ? <ModePicker modes={status.modes} value={mode} onChange={setMode} /> : null}
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

/** "Mode for your next question": Vidura picks, or one of the person's modes; a radio group of 44 pt chips. */
function ModePicker({ modes, value, onChange }: { modes: AssistantChip[]; value: AssistantChip | null; onChange: (m: AssistantChip | null) => void }) {
  const t = useT();
  const th = useTheme();
  const options: (AssistantChip | null)[] = [null, ...modes];
  return (
    <View style={{ gap: th.space[1] }} testID="vidura-modes">
      <Text variant="xs" tone="muted" bold>
        {t("viduraUi.modeLabel")}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {options.map((m) => {
          const checked = value === m;
          const label = m ? chipName(m, t) : t("viduraUi.modeAuto");
          return (
            <Pressable
              key={m ?? "auto"}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              accessibilityLabel={label}
              onPress={() => onChange(m)}
              style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: th.space[3], borderRadius: th.radius.lg, borderWidth: 1, borderColor: checked ? th.accent : th.border, backgroundColor: checked ? th.accentSoft : th.surface }}
            >
              <Text variant="sm" bold tone={checked ? "accent" : "muted"}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function unavailableText(reason: string | null, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (!reason) return t("assistantUi.unavailableTitle");
  const key = `assistantService.unavailable.${reason}` as TranslationKey;
  const said = t(key);
  return said && said !== key ? said : t("assistantUi.unavailableTitle");
}

function Bubble({ message: m, conversationId, onGoOn, onLeave }: { message: AssistantMessage; conversationId: string | null; onGoOn?: () => void; onLeave?: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const role = useRole();
  const [whole, setWhole] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(m.helpful);
  const mine = m.role === "USER";
  const shown = mine || whole ? { blocks: parseAnswer(m.text), cut: false } : shortBlocks(m.text);
  const go = (target: ReturnType<typeof pageTarget>) => {
    if (!target) return;
    onLeave?.();
    if (target.kind === "screen") router.push(target.target as never);
    else openWeb(target.path);
  };
  const open = (c: AssistantCitation) => {
    const target = citationTarget(c, role);
    if (!target) return;
    if (target.kind === "url") void Linking.openURL(target.url);
    else go(target);
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
      {m.chip ? (
        <Text variant="xs" tone="muted" bold testID="vidura-chip" accessibilityLabel={t("viduraUi.chip", { mode: chipName(m.chip, t) })}>
          {chipName(m.chip, t)}
        </Text>
      ) : null}
      {/* Vidura pass 3 (18 Oct 2026): the platform's standard answer, checked by Shalaghar. */}
      {m.standard ? (
        <Text variant="xs" bold tone="ok" testID="vidura-standard">
          {t("viduraUi.standardAnswer")}
        </Text>
      ) : null}
      {m.hint ? (
        <Text variant="xs" bold tone="warn" testID="assistant-hint">
          {t("assistantUi.hint")}
        </Text>
      ) : null}
      {mine ? <Text variant="base">{m.text}</Text> : <AnswerMarkdown text={m.text} blocks={shown.blocks} onPath={(path) => go(pageTarget(path))} />}
      {shown.cut ? <Button label={t("assistantUi.showWhole")} variant="ghost" onPress={() => setWhole(true)} /> : null}
      {m.hint ? (
        <Text variant="sm" tone="muted">
          {t("assistantUi.hintNote")}
        </Text>
      ) : null}
      {m.cut ? (
        <View style={{ gap: th.space[1] }} testID="vidura-cut">
          <Text variant="sm" tone="muted">
            {t("viduraUi.cutNote")}
          </Text>
          {onGoOn ? <Button label={t("viduraUi.goOn")} variant="secondary" onPress={onGoOn} /> : null}
        </View>
      ) : null}
      {m.citations.length ? (
        <View testID="assistant-citations" style={{ gap: th.space[1] }}>
          <Text variant="xs" tone="muted" bold>
            {t("assistantUi.sources")}
          </Text>
          {m.citations.map((c) => (
            <Row key={`${c.kind}-${c.n}`} icon={c.kind === "CURRICULUM" ? "bookOpen" : "globe"} title={`[${c.n}] ${citationText(c, t)}`} onPress={citationTarget(c, role) ? () => open(c) : undefined} />
          ))}
        </View>
      ) : null}
      {m.askPerson ? <AskPerson person={m.askPerson} onLeave={onLeave} /> : null}
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

/**
 * "Ask a person" (Vidura pass 1): one press opens — or finds — the room with the person the door named, through the
 * messaging door every "Message" button uses, and goes there. Nothing of the question is carried.
 */
function AskPerson({ person, onLeave }: { person: NonNullable<AssistantMessage["askPerson"]>; onLeave?: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const go = async () => {
    setBusy(true);
    setFailed(false);
    const opened = await api().post("/api/v1/shared/conversations", { schoolId: person.schoolId, userId: person.userId });
    setBusy(false);
    if (!opened.ok) return setFailed(true);
    const room = inboxConversationOpenedSchema.parse(opened.data);
    onLeave?.();
    router.push({ pathname: "/(app)/messages/room", params: { conversationId: room.conversationId } } as never);
  };
  return (
    <View style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }} testID="vidura-ask-person">
      <Text variant="sm" tone="muted">
        {t("viduraUi.askPersonNote")}
      </Text>
      <Button label={t(`viduraUi.askPerson${person.who}` as TranslationKey)} variant="secondary" busy={busy} icon={<Icon name="user" size={18} color={th.fg} />} onPress={() => void go()} />
      {failed ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {t("viduraUi.askPersonFailed")}
        </Text>
      ) : null}
    </View>
  );
}

export function citationText(c: AssistantCitation, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (c.kind === "HELP" || c.kind === "LINK") return c.title;
  // The board by its short name: "Balbharati (Maharashtra State Bureau of …)" is "Balbharati" (the live walk of 10 Oct).
  const board = c.board.split(" (")[0]!.trim();
  const book = board && !c.book.toLowerCase().includes(board.toLowerCase()) ? `${board} · ${c.book}` : c.book;
  if (!c.chapter) return t("assistantUi.citationNoChapter", { book, page: c.page });
  return c.section ? t("assistantUi.citationSection", { book, chapter: c.chapter, section: c.section, page: c.page }) : t("assistantUi.citation", { book, chapter: c.chapter, page: c.page });
}

/**
 * A guardian's opt-out per child, on the phone's settings as on the web's (/parent/settings, the card #assistant):
 * one switch per child, on while the child may use Vidura; a child whose school has it off is a line, not a switch.
 * Vidura's first screen sends a guardian here.
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
