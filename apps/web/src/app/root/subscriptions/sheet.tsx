"use client";

import { useId, useRef, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useModalFocus } from "@/components/ui/use-modal-focus";
import { useT } from "@/lib/i18n";

/**
 * A sheet of the subscription console (§2.1 to §2.4): a modal dialog with its title, its body (the server's sentence, the
 * fields) and its buttons. Focus moves into it and stays there, Escape and the backdrop close it, and focus goes back to
 * the control that opened it (useModalFocus, TA-232).
 */
export function Sheet({ open, title, onClose, children, footer, testId }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; testId?: string }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useModalFocus(open, ref, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-lg animate-pop"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={id} className="text-lg font-bold text-fg">
            {title}
          </h2>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} icon={<XIcon weight="bold" />}>
            {t("subs.close")}
          </Button>
        </div>
        <div className="mt-3 space-y-4">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** The server's sentence in a sheet, said to a screen reader when it arrives or changes. */
export function Said({ sentence }: { sentence: string | null }) {
  if (!sentence) return null;
  return (
    <p role="status" className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg">
      {sentence}
    </p>
  );
}
