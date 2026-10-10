"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ListBulletsIcon, NotePencilIcon, XIcon } from "@phosphor-icons/react";
import type { AssistantStatus } from "@edulink/contracts";
import { Button, Spinner } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { AssistantChat, FailureLine } from "./chat";
import { useDoor } from "./use-door";
import { ASSISTANT_DOORS, ASSISTANT_PAGE } from "./model";

/**
 * The assistant as a panel over whatever page the person is on (opened from the shell's "Ask the assistant" on every
 * page of every role, the role homes included, which is where the e2e axe gate opens it). A sheet from the right on a
 * desk, the whole screen on a phone; a dialog with its own name, closed by its button or Escape, focus handed back to
 * the button that opened it. It reads the status door when it opens, so the first screen says what the assistant is
 * for in this person's role and the box is there only when they may ask.
 */
export function AssistantPanel({ open, onClose, role }: { open: boolean; onClose: () => void; role: string }) {
  const t = useT();
  const { data: status, failure, retry } = useDoor<AssistantStatus>(open ? ASSISTANT_DOORS.status : null);
  const [round, setRound] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // The latest close handler, so a parent passing a fresh function each render does not reopen the panel's effect.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 print:hidden" data-testid="assistant-panel">
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} className="absolute inset-0 hidden bg-black/40 sm:block" />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-panel-title"
        className="absolute inset-0 flex flex-col bg-bg pt-safe shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[28rem] sm:border-l sm:border-border animate-in-up"
      >
        <header data-chrome className="flex items-center gap-1 border-b border-border bg-surface px-3 py-2">
          <h2 id="assistant-panel-title" className="min-w-0 flex-1 truncate pl-1 text-base font-semibold text-fg">
            {t("assistantUi.title")}
          </h2>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={t("assistantUi.newConversation")} onClick={() => setRound((n) => n + 1)}>
            <NotePencilIcon className="size-5" aria-hidden="true" />
          </Button>
          <Button asChild size="icon-sm" variant="ghost" aria-label={t("assistantUi.allConversations")}>
            <Link href={ASSISTANT_PAGE} onClick={onClose}>
              <ListBulletsIcon className="size-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button data-autofocus type="button" size="icon-sm" variant="ghost" aria-label={t("assistantUi.close")} onClick={onClose}>
            <XIcon className="size-5" aria-hidden="true" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 pb-safe">
          {status ? (
            <AssistantChat key={round} status={status} role={role} compact />
          ) : failure ? (
            <div className="p-4">
              <FailureLine failure={failure} t={t} onRetry={retry} />
            </div>
          ) : (
            <div className="grid h-full place-items-center" role="status" aria-label={t("ui.loading")}>
              <Spinner className="size-6 text-accent-strong" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
