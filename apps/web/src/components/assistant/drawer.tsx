"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeftIcon, ListBulletsIcon, NotePencilIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import type { AssistantConversation, AssistantMessage, AssistantStatus } from "@edulink/contracts";
import { Button, Spinner } from "@/components/ui/button";
import { relativeTime } from "@/lib/dates";
import { useLocale, useT, type Translate } from "@/lib/i18n";
import { AssistantChat, FailureLine } from "./chat";
import { deleteConversation, readConversation, type DoorFailure } from "./doors";
import { useDoor } from "./use-door";
import { ASSISTANT_DOORS } from "./model";
import type { ExplainRequest } from "./explain-this";

/** A desk's width, where the drawer docks beside the page (Tailwind's lg). */
export const DESK_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(DESK_QUERY);
  mq.addEventListener?.("change", onChange);
  return () => mq.removeEventListener?.("change", onChange);
}
/** Whether the window is a desk's width (the drawer docks) or a phone's (the drawer is a bottom sheet). */
export function useDesk(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(DESK_QUERY).matches : true),
    () => true,
  );
}

type View = { kind: "chat"; round: number } | { kind: "history" } | { kind: "saved"; id: string; messages: AssistantMessage[] | null; failure: DoorFailure | null };

/**
 * VIDURA'S DRAWER (docs/plans/vidura.md, the owner's decision 2; pass 1, 17 Oct 2026): the one place Vidura lives,
 * opened by the round button at the bottom right of every page (app-shell.tsx).
 *
 *   - On a desk it DOCKS at the right: the page stays usable beside it (the shell makes room), so it is a dialog that
 *     is not modal; on a phone it is a BOTTOM SHEET over the page, modal, with the page dimmed behind it.
 *   - Its header holds a new conversation, the person's conversations of the last thirty days (the history lives in
 *     the drawer; the /assistant page is gone) and Close. Escape inside it closes it, and the focus goes back to the
 *     round button that opened it.
 *   - `page` is the page it is beside: sent with each question (page awareness) and used for the suggested questions.
 *
 * It reads the status door when it opens, so the first screen says what Vidura is for in this person's role and the
 * box is there only when they may ask.
 */
export function ViduraDrawer({
  open,
  onClose,
  role,
  page,
  initialConversationId = null,
  explain = null,
}: {
  open: boolean;
  onClose: () => void;
  role: string;
  page: string | null;
  initialConversationId?: string | null;
  /** "Explain this to me" (pass 2): a new conversation that asks about one row of the page at once; `n` tells a second press from the first. */
  explain?: (ExplainRequest & { n: number }) | null;
}) {
  const t = useT();
  const desk = useDesk();
  const { data: status, failure, retry } = useDoor<AssistantStatus>(open ? ASSISTANT_DOORS.status : null);
  const [view, setView] = useState<View>({ kind: "chat", round: 0 });
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // The latest close handler, so a parent passing a fresh function each render does not reopen the drawer's effect.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // A conversation asked for by the address (?vidura=<id>, from the old /assistant/<id>): read it into the drawer.
  const [wanted, setWanted] = useState<string | null>(null);
  if (open && initialConversationId && wanted !== initialConversationId) {
    setWanted(initialConversationId);
    setView({ kind: "saved", id: initialConversationId, messages: null, failure: null });
  }
  // A press of "Explain this to me": a fresh conversation in the drawer, asking at once.
  const [explained, setExplained] = useState<number | null>(null);
  if (open && explain && explained !== explain.n) {
    setExplained(explain.n);
    setView((v) => ({ kind: "chat", round: (v.kind === "chat" ? v.round : 0) + 1 }));
  }
  const savedId = view.kind === "saved" && view.messages === null && view.failure === null ? view.id : null;
  useEffect(() => {
    if (!savedId) return;
    let live = true;
    void readConversation(savedId).then((got) => {
      if (!live) return;
      setView((v) => (v.kind === "saved" && v.id === savedId ? { ...v, messages: got.ok ? got.data.messages : null, failure: got.ok ? null : got } : v));
    });
    return () => {
      live = false;
    };
  }, [savedId]);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
    };
  }, [open]);

  if (!open) return null;
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeRef.current();
    }
  };

  return (
    <div className="print:hidden" data-testid="assistant-panel">
      {desk ? null : <button type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} className="fixed inset-0 z-50 bg-black/40" />}
      <div
        ref={dialog}
        role="dialog"
        aria-modal={desk ? "false" : "true"}
        aria-labelledby="vidura-drawer-title"
        onKeyDown={onKeyDown}
        data-docked={desk || undefined}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col rounded-t-[var(--radius-xl)] border-t border-border bg-bg shadow-xl animate-in-up lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:h-auto lg:w-[26rem] lg:rounded-none lg:border-l lg:border-t-0 lg:animate-none"
      >
        <header data-chrome className="flex items-center gap-1 rounded-t-[var(--radius-xl)] border-b border-border bg-surface px-3 py-2 lg:rounded-none">
          {view.kind === "chat" ? null : (
            <Button type="button" size="icon-sm" variant="ghost" aria-label={t("viduraUi.historyBack")} onClick={() => setView({ kind: "chat", round: 0 })}>
              <ArrowLeftIcon className="size-5" aria-hidden="true" />
            </Button>
          )}
          <h2 id="vidura-drawer-title" className="min-w-0 flex-1 truncate pl-1 text-base font-semibold text-fg">
            {view.kind === "history" ? t("viduraUi.history") : t("assistantUi.title")}
          </h2>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={t("assistantUi.newConversation")} onClick={() => setView((v) => ({ kind: "chat", round: (v.kind === "chat" ? v.round : 0) + 1 }))}>
            <NotePencilIcon className="size-5" aria-hidden="true" />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={t("viduraUi.history")} aria-pressed={view.kind === "history"} onClick={() => setView({ kind: "history" })} data-testid="vidura-history">
            <ListBulletsIcon className="size-5" aria-hidden="true" />
          </Button>
          <Button data-autofocus type="button" size="icon-sm" variant="ghost" aria-label={t("assistantUi.close")} onClick={onClose}>
            <XIcon className="size-5" aria-hidden="true" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 pb-safe">
          {!status ? (
            failure ? (
              <div className="p-4">
                <FailureLine failure={failure} t={t} onRetry={retry} />
              </div>
            ) : (
              <div className="grid h-full place-items-center" role="status" aria-label={t("ui.loading")}>
                <Spinner className="size-6 text-accent-strong" />
              </div>
            )
          ) : view.kind === "history" ? (
            <History t={t} onOpen={(id) => setView({ kind: "saved", id, messages: null, failure: null })} />
          ) : view.kind === "saved" ? (
            view.failure ? (
              <div className="p-4">
                <FailureLine failure={view.failure} t={t} />
              </div>
            ) : view.messages ? (
              <Saved key={view.id} id={view.id} messages={view.messages} status={status} role={role} page={page} t={t} onDeleted={() => setView({ kind: "history" })} />
            ) : (
              <div className="grid h-full place-items-center" role="status" aria-label={t("ui.loading")}>
                <Spinner className="size-6 text-accent-strong" />
              </div>
            )
          ) : (
            <AssistantChat key={view.round} status={status} role={role} page={page} compact autoAsk={explain && explained === explain.n ? explain : null} />
          )}
        </div>
      </div>
    </div>
  );
}

/** The person's conversations of the last thirty days, newest first, inside the drawer; one opens in place. */
function History({ t, onOpen }: { t: Translate; onOpen: (id: string) => void }) {
  const locale = useLocale();
  const list = useDoor<{ conversations: AssistantConversation[] }>(ASSISTANT_DOORS.conversations);
  if (list.failure) return <div className="p-4"><FailureLine failure={list.failure} t={t} onRetry={list.retry} /></div>;
  if (!list.data)
    return (
      <div className="grid h-full place-items-center" role="status" aria-label={t("ui.loading")}>
        <Spinner className="size-6 text-accent-strong" />
      </div>
    );
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 py-4">
      <p className="text-sm text-fg-muted">{t("assistantUi.conversationsBody")}</p>
      {list.data.conversations.length === 0 ? (
        <div className="mt-3" data-testid="assistant-no-conversations">
          <p className="text-sm font-medium text-fg">{t("assistantUi.noConversations")}</p>
          <p className="text-sm text-fg-muted">{t("assistantUi.noConversationsBody")}</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border" data-testid="assistant-conversations">
          {list.data.conversations.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onOpen(c.id)} className="flex min-h-11 w-full flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] px-2 py-2.5 text-left hover:bg-surface-muted">
                <span className="line-clamp-2 break-words text-sm font-medium text-fg">{c.title ?? t("assistantUi.newConversation")}</span>
                <span className="text-xs text-fg-muted">{t("assistantUi.lastWhen", { when: relativeTime(new Date(c.lastAt), new Date(), locale) })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One of the person's conversations, to re-read and go on with inside the drawer, and the way to delete it now. */
function Saved({ id, messages, status, role, page, t, onDeleted }: { id: string; messages: AssistantMessage[]; status: AssistantStatus; role: string; page: string | null; t: Translate; onDeleted: () => void }) {
  const [failure, setFailure] = useState<DoorFailure | null>(null);
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (!window.confirm(t("assistantUi.deleteConfirm"))) return;
    setDeleting(true);
    const done = await deleteConversation(id);
    setDeleting(false);
    if (!done.ok) return setFailure(done);
    onDeleted();
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-4 py-2">
        <Button type="button" size="sm" variant="ghost" loading={deleting} onClick={() => void remove()} icon={<TrashIcon className="size-4" aria-hidden="true" />}>
          {t("assistantUi.deleteConversation")}
        </Button>
      </div>
      {failure ? (
        <div className="px-4 pt-3">
          <FailureLine failure={failure} t={t} />
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <AssistantChat status={status} role={role} page={page} conversationId={id} messages={messages} compact />
      </div>
    </div>
  );
}
