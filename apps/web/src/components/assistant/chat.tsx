"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowSquareOutIcon, BookOpenTextIcon, ChatsCircleIcon, CompassIcon, LightbulbIcon, PaperPlaneRightIcon, ThumbsDownIcon, ThumbsUpIcon, WarningCircleIcon, WifiSlashIcon } from "@phosphor-icons/react";
import type { AssistantMessage, AssistantStatus } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field-class";
import { cn } from "@/lib/cn";
import { useLocale, useT, type Translate, type TranslationKey } from "@/lib/i18n";
import { QUESTION_MAX, announcement, citationHref, citationLabel, firstScreenKeys, isFixedSentence, streamText } from "./model";
import { askQuestion, openConversation, sendFeedback, type DoorFailure } from "./doors";
import { useAnswerStream } from "./stream";

const STAGE_KEY = { SEARCHING: "assistantUi.stageSearching", WRITING: "assistantUi.stageWriting", CHECKING: "assistantUi.stageChecking" } as const;

/** The sentence for why the assistant cannot be used now: Phase B's per-reason sentence where the dictionary has it. */
export function unavailableText(reason: string | null, t: Translate): string {
  if (!reason) return t("assistantUi.unavailableTitle");
  const key = `assistantService.unavailable.${reason}` as TranslationKey;
  const said = t(key);
  return said && said !== key ? said : t("assistantUi.unavailableTitle");
}

/**
 * One conversation with the assistant: the first screen while it is empty, the questions and answers, the box to ask.
 * The panel (launcher.tsx) and the page (/assistant) both draw it, from the status door's answer (GET /api/v1/assistant).
 *
 * WHAT A READER HEARS. The answer streams into a bubble that is NOT a live region, and the sentence "The assistant
 * answered: …" goes into the one status region when the door has answered: once per answer, never per token (the plan's
 * section 9.11). A refusal is the assistant's own line, the fixed sentence the door gave, with no "try again" beside it
 * (asking again gets the same sentence); only a failure to reach the assistant offers to ask again.
 */
export function AssistantChat({
  status,
  role,
  conversationId: initialId = null,
  messages: initialMessages = [],
  compact = false,
  onConversation,
}: {
  status: AssistantStatus;
  /** The reader's role on the session: whether a book's citation is a link (model.ts BOOK_LINK_ROLES). */
  role: string | null;
  conversationId?: string | null;
  messages?: AssistantMessage[];
  /** In the panel: the list scrolls inside the sheet and the box sits at its foot. */
  compact?: boolean;
  /** Told the conversation's id once the door has opened one (the page puts it in the address). */
  onConversation?: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ question: string; failure: DoorFailure } | null>(null);
  const [announce, setAnnounce] = useState("");
  const stream = useAnswerStream(conversationId);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const hintId = useId();
  const streamed = asking ? streamText(stream.state) : "";

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
    async (text: string) => {
      const q = text.trim().slice(0, QUESTION_MAX);
      if (!q || asking) return;
      setFailure(null);
      setAnnounce("");
      stream.reset();
      setAsking(q);
      let id = conversationId;
      if (!id) {
        const opened = await openConversation(locale);
        if (!opened.ok) {
          setAsking(null);
          setFailure({ question: q, failure: opened });
          return;
        }
        id = opened.data.id;
        setConversationId(id);
        onConversation?.(id);
      }
      const answered = await askQuestion(id, q);
      setAsking(null);
      if (!answered.ok) {
        setFailure({ question: q, failure: answered });
        return;
      }
      setQuestion("");
      setMessages((list) => [...list, answered.data.question, answered.data.answer]);
      setAnnounce(announcement(answered.data.answer, t));
      box.current?.focus();
    },
    [asking, conversationId, locale, onConversation, stream, t],
  );

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

  return (
    <div className={cn("flex min-h-0 flex-col", compact && "h-full")} data-testid="assistant-chat">
      <div className={cn("min-h-0 flex-1 space-y-4", compact && "overflow-y-auto overscroll-contain px-4 py-4")}>
        {messages.length === 0 && !asking ? <FirstScreen status={status} t={t} /> : null}
        {messages.length > 0 || asking ? (
          <ol className="space-y-4" aria-label={t("assistantUi.title")}>
            {messages.map((m) => (
              <li key={m.id}>
                <MessageBubble message={m} conversationId={conversationId} role={role} t={t} />
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
                  {streamed ? (
                    <p className="whitespace-pre-wrap break-words">{streamed}</p>
                  ) : (
                    <p className="text-fg-muted">{t(stream.state.stage ? STAGE_KEY[stream.state.stage] : "assistantUi.writing")}</p>
                  )}
                </Bubble>
              </li>
            ) : null}
          </ol>
        ) : null}
        {failure ? <FailureLine failure={failure.failure} t={t} asked onRetry={() => void ask(failure.question)} /> : null}
        <div ref={end} />
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="assistant-announce">
        {announce}
      </p>

      {status.available ? (
        <form onSubmit={submit} className={cn("mt-4 space-y-2", compact && "mt-0 border-t border-border px-4 pb-4 pt-3")}>
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

/** What the assistant is for, in the reader's role; for a guardian, the way to the opt-out. */
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

/** One message: the question as asked, or the answer with its hint note, its sources and "was this helpful". */
export function MessageBubble({ message: m, conversationId, role, t }: { message: AssistantMessage; conversationId: string | null; role: string | null; t: Translate }) {
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
      {m.hint ? (
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn" data-testid="assistant-hint">
          <LightbulbIcon weight="fill" className="size-3.5" aria-hidden="true" />
          {t("assistantUi.hint")}
        </p>
      ) : null}
      {/* A fixed sentence (a refusal, the counsellor route, the sentence saying what the assistant is for) is the
          assistant's own line like any answer: drawn the same, with nothing to press but "was this helpful". */}
      <p className={cn("whitespace-pre-wrap break-words", fixed && "text-fg")} data-verdict={m.verdict ?? undefined} data-fixed={fixed || undefined}>
        {m.text}
      </p>
      {m.hint ? <p className="mt-2 text-sm text-fg-muted">{t("assistantUi.hintNote")}</p> : null}
      {m.citations.length > 0 ? (
        <div className="mt-3 border-t border-border pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("assistantUi.sources")}</p>
          <ul className="mt-1 space-y-0.5" data-testid="assistant-citations">
            {m.citations.map((c) => {
              const link = citationHref(c, role);
              const label = `[${c.n}] ${citationLabel(c, t)}`;
              const Icon = c.kind === "HELP" ? CompassIcon : BookOpenTextIcon;
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
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {conversationId ? <Helpful conversationId={conversationId} message={m} t={t} /> : null}
    </Bubble>
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
