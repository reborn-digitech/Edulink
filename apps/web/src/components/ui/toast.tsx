"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Context,
} from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * Toasts with a built-in undo affordance.
 *
 * The spec asks for undo on important actions (§0/§7). Rather than bolting an
 * "are you sure" dialog onto every destructive action — which trains people to
 * dismiss dialogs without reading — the pattern here is: perform it
 * optimistically, show a toast with Undo, and only commit once the toast
 * expires. `onUndo` runs when the user takes it back.
 *
 * Toasts are polite live regions so a screen reader announces them without
 * stealing focus mid-task.
 */

export type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
  /** ms; null pins the toast until dismissed (used for errors needing action) */
  duration?: number | null;
  action?: { label: string; onClick: () => void };
  onUndo?: () => void;
};

type ToastContextValue = {
  toast: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
};

// On globalThis for the reason lib/i18n/provider.tsx gives: a dev recompile must not leave the provider and a reader on two contexts.
const TOAST_KEY = Symbol.for("edulink.toast.context");
const ToastContext: Context<ToastContextValue | null> = ((globalThis as Record<symbol, unknown>)[TOAST_KEY] as Context<ToastContextValue | null> | undefined) ??
  ((globalThis as Record<symbol, unknown>)[TOAST_KEY] = createContext<ToastContextValue | null>(null)) as Context<ToastContextValue | null>;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const t2 = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = `toast-${++counter}`;
      const next: Toast = { duration: 5000, tone: "neutral", ...input, id };
      setToasts((current) => [...current.slice(-3), next]);
      if (next.duration !== null) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), next.duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  // Clearing on unmount stops a timer firing setState against a dead tree.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label={t2("shell.notifications")}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:items-end sm:pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const t = useT();
  const tones = {
    neutral: "border-border",
    ok: "border-ok/40",
    warn: "border-warn/40",
    danger: "border-danger/40",
    accent: "border-accent/40",
  } as const;
  const bars = {
    neutral: "bg-fg-subtle",
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
    accent: "bg-accent",
  } as const;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden",
        "rounded-[var(--radius-md)] border bg-surface p-3.5 pl-0 shadow-lg animate-in-up",
        tones[toast.tone ?? "neutral"],
      )}
    >
      <span className={cn("h-full w-1 shrink-0 self-stretch", bars[toast.tone ?? "neutral"])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-fg-muted">{toast.description}</p>}
      </div>

      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="shrink-0 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold text-accent-strong hover:bg-accent-soft"
        >
          {t("ui.undo")}
        </button>
      )}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="shrink-0 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold text-accent-strong hover:bg-accent-soft"
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("ui.dismissNotification")}
        className="-m-2 grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] text-fg-subtle hover:bg-surface-muted hover:text-fg"
      >
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
          <path
            d="m4 4 8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
