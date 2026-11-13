"use client";

import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowSquareOutIcon, BookOpenTextIcon, ChatsCircleIcon, CompassIcon, LightbulbIcon, LinkSimpleIcon, PaperPlaneRightIcon, ThumbsDownIcon, ThumbsUpIcon, UserCircleIcon, WarningCircleIcon, WifiSlashIcon } from "@phosphor-icons/react";
import type { AssistantAbout, AssistantChip, AssistantMessage, AssistantStatus, AssistantSuggestions } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field-class";
import { cn } from "@/lib/cn";
import { useLocale, useT, type Translate, type TranslationKey } from "@/lib/i18n";
import { QUESTION_MAX, announcement, attributionLine, citationHref, citationLabel, firstScreenKeys, isFixedSentence, referenceHref, streamText, suggestionsPath } from "./model";
import { askQuestion, openConversation, openRoomWith, sendFeedback, type DoorFailure } from "./doors";
import { useAnswerStream } from "./stream";
import { useDoor } from "./use-door";
import { AnswerMarkdown } from "./answer";

const STAGE_KEY = { SEARCHING: "assistantUi.stageSearching", WRITING: "assistantUi.stageWriting", CHECKING: "assistantUi.stageChecking" } as const;

/** The sentence for why Vidura cannot be used now: Phase B's per-reason sentence where the dictionary has it. */
export function unavailableText(reason: string | null, t: Translate): string {
  if (!reason) return t("assistantUi.unavailableTitle");
  const key = `assistantService.unavailable.${reason}` as TranslationKey;
  const said = t(key);
  return said && said !== key ? said : t("assistantUi.unavailableTitle");
}

/** A mode's name in the reader's language (Vidura pass 1). */
export const chipName = (chip: AssistantChip, t: Translate) => t(`viduraUi.mode${chip}` as TranslationKey);

/**
 * One conversation with Vidura: the first screen and three suggested questions while it is empty, the questions and
 * answers, the mode for the next question and the box to ask. The drawer (drawer.tsx) draws it, from the status door's
 * answer (GET /api/v1/assistant).
 *
 * WHAT A READER HEARS. The answer streams into a bubble that is NOT a live region, and the sentence "Vidura answered:
 * …" goes into the one status region when the door has answered: once per answer, never per token (the plan's section
 * 9.11). A refusal is Vidura's own line, the fixed sentence the door gave, with no "try again" beside it (asking again
 * gets the same sentence) but with "Ask a person" when the door names one; only a failure to reach Vidura offers to ask again.
 *
 * VIDURA PASS 1 (17 Oct 2026): the answer is drawn from restricted Markdown (answer.tsx); each answer wears its mode's
 * chip; the person may pick the mode of the next question (it re-routes that one question, then Vidura picks again);
 * the page the drawer is beside goes with each question (`page`); a cut answer offers "Go on"; a refusal or an answer
 * that is not sure offers "Ask a person".
 */
export function AssistantChat({
  status,
  role,
  conversationId: initialId = null,
  messages: initialMessages = [],
  compact = false,
  page = null,
  onConversation,
  autoAsk = null,
}: {
  status: AssistantStatus;
  /** The reader's role on the session: whether a book's citation is a link (model.ts BOOK_LINK_ROLES). */
  role: string | null;
  conversationId?: string | null;
  messages?: AssistantMessage[];
  /** In the drawer: the list scrolls inside it and the box sits at its foot. */
  compact?: boolean;
  /** The page the drawer is beside (page awareness), sent with each question and used for the suggestions. */
  page?: string | null;
  /** Told the conversation's id once the door has opened one. */
  onConversation?: (id: string) => void;
  /** "Explain this to me" (pass 2): asked once, as soon as the conversation is drawn, with the row it is about. */
  autoAsk?: { question: string; about: AssistantAbout; n: number } | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ question: string; failure: DoorFailure; goOn: boolean } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [mode, setMode] = useState<AssistantChip | null>(null);
  const stream = useAnswerStream(conversationId);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const hintId = useId();
  const streamed = asking ? streamText(stream.state) : "";
  const empty = messages.length === 0 && !asking;
  const suggestions = useDoor<AssistantSuggestions>(empty && status.available ? suggestionsPath(page) : null);

  // Follow the conversation as it grows; a page opened on a conversation is not scrolled away from its header.
  const grown = useRef(false);
  useEffect(() => {
    if (!grown.current) {
      grown.current = true;
      if (!compact) return;
    }
    end.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, streamed, asking, compact]);

  const ask = useCallback(
    async (text: string, goOn = false, about?: AssistantAbout) => {
      const q = text.trim().slice(0, QUESTION_MAX);
      if (!q || asking) return;
      setFailure(null);
      setAnnounce("");
      stream.reset();
      setAsking(q);
      // The question moves into the thread the moment it is sent (10 Oct 2026: it sat in the box until the
      // answer came, so a person read it twice); a failure puts it back so it can be sent again.
      setQuestion("");
      let id = conversationId;
      if (!id) {
        // A guardian's "Explain this" opens the conversation at that child's school (pass 2).
        const opened = await openConversation(locale, about?.childId, q);
        if (!opened.ok) {
          setAsking(null);
          if (!goOn) setQuestion(q);
          setFailure({ question: q, failure: opened, goOn });
          return;
        }
        id = opened.data.id;
        setConversationId(id);
        onConversation?.(id);
      }
      const answered = await askQuestion(id, q, { mode: goOn ? undefined : (mode ?? undefined), page: page ?? undefined, goOn: goOn || undefined, about });
      setAsking(null);
      if (!answered.ok) {
        if (!goOn) setQuestion(q);
        setFailure({ question: q, failure: answered, goOn });
        return;
      }
      // The pick re-routes this one question; Vidura picks again for the next.
      setMode(null);
      setMessages((list) => [...list, answered.data.question, answered.data.answer]);
      setAnnounce(announcement(answered.data.answer, t));
      box.current?.focus();
    },
    [asking, conversationId, locale, mode, onConversation, page, stream, t],
  );

  // "Explain this to me" (pass 2): the question is asked once, when this new conversation is drawn.
  const autoAsked = useRef<number | null>(null);
  useEffect(() => {
    if (!autoAsk || autoAsked.current === autoAsk.n || !status.available) return;
    autoAsked.current = autoAsk.n;
    void ask(autoAsk.question, false, autoAsk.about);
  }, [autoAsk, ask, status.available]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };
  // Enter sends, Shift+Enter is a new line: the chat convention; the button is there for everyone else.
  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(question);
    }
  };
  const lastId = messages[messages.length - 1]?.id ?? null;

  return (
    <div className={cn("flex min-h-0 flex-col", compact && "h-full")} data-testid="assistant-chat">
      {/* In the drawer this list scrolls: it takes focus so a keyboard can scroll it (axe's scrollable-region-focusable,
          found by the e2e gate at 390 px where the first screen, the suggestions and four modes overflow the sheet). */}
      <div
        className={cn("min-h-0 flex-1 space-y-4", compact && "overflow-y-auto overscroll-contain px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent")}
        {...(compact ? { tabIndex: 0, role: "region", "aria-label": t("assistantUi.title") } : {})}
      >
        {empty && suggestions.data?.suggestions.length ? (
          <section aria-labelledby="vidura-suggestions-title" data-testid="vidura-suggestions">
            <h3 id="vidura-suggestions-title" className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
              {t("viduraUi.suggestionsTitle")}
            </h3>
            <ul className="flex flex-col gap-2">
              {suggestions.data.suggestions.map((s) => (
                <li key={s.text}>
                  <button
                    type="button"
                    onClick={() => void ask(s.text)}
                    className="flex min-h-11 w-full items-center rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-left text-sm font-medium text-fg hover:bg-surface-muted"
                  >
                    {s.text}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {/* The suggestions come first (the live walk of 17 Oct 2026: at phone width the first screen pushed them below the
            fold); what Vidura is for follows them. */}
        {empty ? <FirstScreen status={status} t={t} /> : null}
        {messages.length > 0 || asking ? (
          <ol className="space-y-4" aria-label={t("assistantUi.title")}>
            {messages.map((m) => (
              <li key={m.id}>
                <MessageBubble message={m} conversationId={conversationId} role={role} t={t} onGoOn={m.id === lastId && m.cut && !asking ? () => void ask(t("viduraUi.goOn"), true) : undefined} />
              </li>
            ))}
            {asking ? (
              <li>
                <Bubble mine label={t("assistantUi.you")}>
                  <p className="whitespace-pre-wrap break-words">{asking}</p>
                </Bubble>
              </li>
            ) : null}
            {asking ? (
              <li>
                {/* Not live: what streams in is drawn, and the status region below speaks once, when it is done. */}
                <Bubble label={t("assistantUi.assistant")} busy>
                  {streamed ? <AnswerMarkdown text={streamed} /> : <p className="text-fg-muted">{t(stream.state.stage ? STAGE_KEY[stream.state.stage] : "assistantUi.writing")}</p>}
                </Bubble>
              </li>
            ) : null}
          </ol>
        ) : null}
        {failure ? <FailureLine failure={failure.failure} t={t} asked onRetry={() => void ask(failure.question, failure.goOn)} /> : null}
        <div ref={end} />
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="assistant-announce">
        {announce}
      </p>

      {status.available ? (
        <form onSubmit={submit} className={cn("mt-4 space-y-2", compact && "mt-0 border-t border-border px-4 pb-4 pt-3")}>
          {status.modes.length > 1 ? <ModePicker modes={status.modes} value={mode} onChange={setMode} t={t} /> : null}
          <label htmlFor={inputId} className="block text-sm font-medium text-fg">
            {t("assistantUi.askLabel")}
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id={inputId}
              ref={box}
              name="question"
              rows={2}
              maxLength={QUESTION_MAX}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onKey}
              aria-describedby={hintId}
              readOnly={!!asking}
              className={fieldClass("min-h-12 flex-1 resize-none leading-relaxed")}
            />
            <Button type="submit" size="icon" loading={!!asking} disabled={!question.trim()} aria-label={t("assistantUi.send")}>
              <PaperPlaneRightIcon weight="bold" className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <p id={hintId} className="text-xs leading-relaxed text-fg-muted">
            {t("assistantUi.askHint")}
          </p>
        </form>
      ) : (
        <p role="note" className={cn("mt-4 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-sm text-fg-muted", compact && "m-4")} data-testid="assistant-unavailable">
          {unavailableText(status.reason, t)}
        </p>
      )}
    </div>
  );
}

/**
 * The mode of the next question (Vidura pass 1, the owner's decision 3): "Vidura picks", or one of the person's modes.
 * Radio buttons drawn as chips, each label a 44 px row; picking one re-routes the next question only.
 */
function ModePicker({ modes, value, onChange, t }: { modes: AssistantChip[]; value: AssistantChip | null; onChange: (m: AssistantChip | null) => void; t: Translate }) {
  const name = useId();
  const options: (AssistantChip | null)[] = [null, ...modes];
  return (
    <fieldset data-testid="vidura-modes">
      <legend className="mb-1 text-xs font-semibold text-fg-muted">{t("viduraUi.modeLabel")}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((m) => {
          const checked = value === m;
          return (
            <label
              key={m ?? "auto"}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3 text-xs font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                checked ? "border-accent bg-accent-soft text-accent-strong" : "border-border bg-surface text-fg-muted hover:text-fg",
              )}
            >
              <input type="radio" name={name} className="sr-only" checked={checked} onChange={() => onChange(m)} />
              {m ? chipName(m, t) : t("viduraUi.modeAuto")}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** What Vidura is for, in the reader's role; for a guardian, the way to the opt-out. */
export function FirstScreen({ status, t }: { status: Pick<AssistantStatus, "tutor" | "optOutPath">; t: Translate }) {
  return (
    <section aria-labelledby="assistant-first-title" className="rounded-[var(--radius-lg)] border border-border bg-surface-muted/60 p-4" data-testid="assistant-first-screen">
      <h2 id="assistant-first-title" className="flex items-center gap-2 text-base font-semibold text-fg">
        <ChatsCircleIcon weight="duotone" className="size-5 shrink-0 text-accent-strong" aria-hidden="true" />
        {t("assistantUi.firstTitle")}
      </h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-muted">
        {firstScreenKeys(status).map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      {status.optOutPath?.startsWith("/") ? (
        <Link href={status.optOutPath} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline underline-offset-4">
          {t("assistantUi.firstFamilyLink")}
        </Link>
      ) : null}
    </section>
  );
}

function Bubble({ mine = false, label, busy = false, children }: { mine?: boolean; label: string; busy?: boolean; children: ReactNode }) {
  return (
    <article
      aria-label={label}
      aria-busy={busy || undefined}
      className={cn(
        "max-w-[92%] rounded-[var(--radius-lg)] px-4 py-3 text-[0.9375rem] leading-relaxed",
        mine ? "ml-auto bg-accent-soft text-fg" : "mr-auto border border-border bg-surface text-fg shadow-sm",
      )}
    >
      <p className="mb-1 text-xs font-semibold text-fg-muted" aria-hidden="true">
        {label}
      </p>
      {children}
    </article>
  );
}

/** One message: the question as asked, or the answer with its chip, hint note, sources, "Go on", "Ask a person" and "was this helpful". */
export function MessageBubble({ message: m, conversationId, role, t, onGoOn }: { message: AssistantMessage; conversationId: string | null; role: string | null; t: Translate; onGoOn?: () => void }) {
  if (m.role === "USER") {
    return (
      <Bubble mine label={t("assistantUi.you")}>
        <p className="whitespace-pre-wrap break-words">{m.text}</p>
      </Bubble>
    );
  }
  const fixed = isFixedSentence(m);
  return (
    <Bubble label={t("assistantUi.assistant")}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {m.chip ? (
          <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-fg-muted" data-testid="vidura-chip" data-chip={m.chip}>
            <span className="sr-only">{t("viduraUi.chip", { mode: chipName(m.chip, t) })}</span>
            <span aria-hidden="true">{chipName(m.chip, t)}</span>
          </span>
        ) : null}
        {/* Vidura pass 3 (18 Oct 2026): the platform's standard answer to this question, checked by Shalaghar. */}
        {m.standard ? (
          <span className="inline-flex items-center rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok" data-testid="vidura-standard">
            {t("viduraUi.standardAnswer")}
          </span>
        ) : null}
        {m.hint ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn" data-testid="assistant-hint">
            <LightbulbIcon weight="fill" className="size-3.5" aria-hidden="true" />
            {t("assistantUi.hint")}
          </span>
        ) : null}
      </div>
      {/* A fixed sentence (a refusal, the counsellor route, the sentence saying what Vidura is for) is Vidura's own
          line like any answer: drawn the same, with nothing to press but "Ask a person" and "was this helpful". */}
      <div data-verdict={m.verdict ?? undefined} data-fixed={fixed || undefined}>
        {fixed ? <p className="whitespace-pre-wrap break-words">{m.text}</p> : <AnswerMarkdown text={m.text} />}
      </div>
      {m.hint ? <p className="mt-2 text-sm text-fg-muted">{t("assistantUi.hintNote")}</p> : null}
      {m.cut ? (
        <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="vidura-cut">
          <p className="text-sm text-fg-muted">{t("viduraUi.cutNote")}</p>
          {onGoOn ? (
            <Button type="button" size="sm" variant="secondary" onClick={onGoOn} data-testid="vidura-go-on">
              {t("viduraUi.goOn")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {m.citations.length > 0 ? (
        <div className="mt-3 border-t border-border pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("assistantUi.sources")}</p>
          <ul className="mt-1 space-y-0.5" data-testid="assistant-citations">
            {m.citations.map((c) => {
              const link = citationHref(c, role);
              const label = `[${c.n}] ${citationLabel(c, t)}`;
              // A LINK (the data questions, 11 Oct 2026) is one of the person's own rows — a post, a circular, a thread — on the platform, as a HELP page is.
              const Icon = c.kind === "HELP" ? CompassIcon : c.kind === "LINK" ? LinkSimpleIcon : BookOpenTextIcon;
              return (
                <li key={`${c.kind}-${c.n}`} className="text-sm">
                  {link?.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent-strong underline underline-offset-4">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                      <ArrowSquareOutIcon className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="sr-only">({t("assistantUi.citationOpens")})</span>
                    </a>
                  ) : link ? (
                    <Link href={link.href} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent-strong underline underline-offset-4">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center gap-1.5 text-fg-muted">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {label}
                    </span>
                  )}
                  {/* Pass 4: a share-alike passage's attribution, for every reader, its addresses as text. */}
                  {c.kind === "CURRICULUM" && c.attribution ? (
                    <p className="ms-6 text-xs text-fg-muted" data-testid="vidura-attribution">
                      {attributionLine(c.attribution, t)} <span className="break-all">{c.attribution.url}</span> · <span className="break-all">{c.attribution.licenceUrl}</span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {/* Pass 4: the operator's allow-listed sources beside a Learning answer; the server sends them only to staff and adult college students. */}
      {m.references.length > 0 ? (
        <div className="mt-3 border-t border-border pt-2" data-testid="vidura-references">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("viduraUi.referencesTitle")}</p>
          <ul className="mt-1 space-y-0.5">
            {m.references.map((r) => {
              const href = referenceHref(r.url);
              return href ? (
                <li key={r.url} className="text-sm">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent-strong underline underline-offset-4">
                    <LinkSimpleIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{t("viduraUi.referenceLink", { source: r.source, topic: r.topic })}</span>
                    <ArrowSquareOutIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">({t("assistantUi.citationOpens")})</span>
                  </a>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      ) : null}
      {m.askPerson ? <AskPerson person={m.askPerson} t={t} /> : null}
      {conversationId ? <Helpful conversationId={conversationId} message={m} t={t} /> : null}
    </Bubble>
  );
}

/**
 * "Ask a person" (Vidura pass 1): one press opens — or finds — the room with the person the door named, through the
 * messaging door every "Message" button uses (POST /api/v1/shared/conversations), and goes there. Nothing of the
 * question is carried; the person writes their own first message.
 */
function AskPerson({ person, t }: { person: NonNullable<AssistantMessage["askPerson"]>; t: Translate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const go = async () => {
    setBusy(true);
    setFailed(false);
    const opened = await openRoomWith(person.schoolId, person.userId);
    setBusy(false);
    if (!opened.ok) return setFailed(true);
    router.push(`/remarks/c/${encodeURIComponent(opened.data.conversationId)}`);
  };
  return (
    <div className="mt-3 rounded-[var(--radius-md)] border border-border bg-surface-muted/60 p-3" data-testid="vidura-ask-person" data-who={person.who}>
      <p className="text-sm text-fg-muted">{t("viduraUi.askPersonNote")}</p>
      <Button type="button" size="sm" variant="secondary" className="mt-2" loading={busy} onClick={() => void go()} icon={<UserCircleIcon className="size-4" aria-hidden="true" />}>
        {t(`viduraUi.askPerson${person.who}` as TranslationKey)}
      </Button>
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t("viduraUi.askPersonFailed")}
        </p>
      ) : null}
    </div>
  );
}

/** "Was this helpful?" once per answer: two buttons, then the thanks. A failure to send leaves the buttons as they were. */
function Helpful({ conversationId, message, t }: { conversationId: string; message: AssistantMessage; t: Translate }) {
  const [given, setGiven] = useState<boolean | null>(message.helpful);
  const [busy, setBusy] = useState(false);
  const give = async (helpful: boolean) => {
    setBusy(true);
    const sent = await sendFeedback(conversationId, message.id, helpful);
    setBusy(false);
    if (sent.ok) setGiven(helpful);
  };
  if (given !== null) {
    return (
      <p className="mt-2 text-xs text-fg-muted" data-testid="assistant-helpful-given">
        {t("assistantUi.helpfulThanks")}
      </p>
    );
  }
  return (
    <div role="group" aria-label={t("assistantUi.helpful")} className="mt-2 flex flex-wrap items-center gap-2" data-testid="assistant-helpful">
      <span className="text-xs text-fg-muted" aria-hidden="true">
        {t("assistantUi.helpful")}
      </span>
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void give(true)} icon={<ThumbsUpIcon className="size-4" aria-hidden="true" />}>
        {t("assistantUi.helpfulYes")}
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void give(false)} icon={<ThumbsDownIcon className="size-4" aria-hidden="true" />}>
        {t("assistantUi.helpfulNo")}
      </Button>
    </div>
  );
}

/**
 * A door that did not answer. Not reached (status 0, a 5xx): the question was not answered, and it may be asked again.
 * Refused (the module off, the kill switch, a guardian's opt-out, today's cap): the door's own sentence, and nothing to
 * press, since asking again gets the same answer.
 */
export function FailureLine({ failure, t, onRetry, asked = false }: { failure: DoorFailure; t: Translate; onRetry?: () => void; /** A question was sent (not a page's read): say it was not answered. */ asked?: boolean }) {
  const unreachable = failure.status === 0 || failure.status >= 500;
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft p-3 text-sm text-danger" data-testid="assistant-failure">
      {failure.status === 0 ? <WifiSlashIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <WarningCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
      <p className="min-w-0 flex-1">{unreachable ? t(asked ? "assistantUi.failed" : "assistantUi.notReached") : failure.error || t("assistantUi.unavailableTitle")}</p>
      {unreachable && onRetry ? (
        <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
          {t("assistantUi.retry")}
        </Button>
      ) : null}
    </div>
  );
}
