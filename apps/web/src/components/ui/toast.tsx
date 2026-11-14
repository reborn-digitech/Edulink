"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
 * Toasts are said by two live regions mounted once with the provider (TA-235):
 * a polite one, and an assertive one for a danger toast. A region only
 * announces what is inserted after it exists, and a card that arrives already
 * filled is often not read at all, so the card itself is not a live region and
 * each toast's words are written into the standing region instead.
 *
 * A toast with an Undo or an action stays ten seconds rather than five, and
 * its clock stops while the pointer is on it or the keyboard focus is in it,
 * so the control can be reached before it goes (TA-235). A pinned toast
 * (`duration: null`) is never pushed off by the ones after it (TA-605): the
 * oldest timed toast goes instead.
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
  /**
   * Runs once when the toast goes WITHOUT its Undo pressed: it expired, was
   * dismissed, its action was taken, or it was pushed off by later toasts.
   * The optimistic pattern above commits here (TA-216), so a write is not
   * sent while its Undo is still on the screen.
   */
  onCommit?: () => void;
};

/** How long a toast stays: five seconds, ten when it carries a control to reach (TA-235), or pinned. */
export function toastDuration(input: Pick<Toast, "duration" | "action" | "onUndo">): number | null {
  if (input.duration !== undefined) return input.duration;
  return input.action || input.onUndo ? 10_000 : 5000;
}

/** The toasts kept on screen when one more arrives: at most four, and a pinned one is never the one dropped (TA-605). */
export function keepToasts(current: Toast[], next: Toast, limit = 4): { kept: Toast[]; dropped: Toast[] } {
  const all = [...current, next];
  const dropped: Toast[] = [];
  while (all.length > limit) {
    const oldestTimed = all.findIndex((t) => t !== next && t.duration !== null);
    if (oldestTimed === -1) break;
    dropped.push(...all.splice(oldestTimed, 1));
  }
  return { kept: all, dropped };
}

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

/** True in the browser, false in the server's markup: the live regions are drawn by the browser only. */
const neverChanges = () => () => undefined;
const inBrowser = () => true;
const onServer = () => false;

export function ToastProvider({ children }: { children: ReactNode }) {
  const t2 = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);
  // The toasts on screen, read outside a render (eviction, closing) without waiting for the state.
  const live = useRef<Toast[]>([]);
  const timers = useRef(new Map<string, { handle: ReturnType<typeof setTimeout> | null; deadline: number; remaining: number }>());
  const [said, setSaid] = useState<{ polite: { id: string; text: string } | null; assertive: { id: string; text: string } | null }>({ polite: null, assertive: null });

  const stopTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    timers.current.delete(id);
  }, []);

  /** Takes a toast off the screen; `undone` when its Undo was pressed, otherwise its commit runs. */
  const close = useCallback(
    (id: string, undone: boolean) => {
      const found = live.current.find((t) => t.id === id);
      if (!found) return;
      live.current = live.current.filter((t) => t.id !== id);
      setToasts(live.current);
      stopTimer(id);
      if (!undone) found.onCommit?.();
    },
    [stopTimer],
  );

  const dismiss = useCallback((id: string) => close(id, false), [close]);

  const startTimer = useCallback(
    (id: string, ms: number) => {
      const handle = setTimeout(() => close(id, false), ms);
      timers.current.set(id, { handle, deadline: Date.now() + ms, remaining: ms });
    },
    [close],
  );

  /** The pointer is on the toast or the focus is in it: its clock stops. */
  const hold = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (!timer?.handle) return;
    clearTimeout(timer.handle);
    timers.current.set(id, { handle: null, deadline: 0, remaining: Math.max(0, timer.deadline - Date.now()) });
  }, []);

  /** …and starts again, with what was left of it, once both have gone. */
  const release = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (!timer || timer.handle) return;
      startTimer(id, Math.max(timer.remaining, 1500));
    },
    [startTimer],
  );

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = `toast-${++counter}`;
      const next: Toast = { tone: "neutral", ...input, duration: toastDuration(input), id };
      const { kept, dropped } = keepToasts(live.current, next);
      live.current = kept;
      setToasts(kept);
      for (const gone of dropped) {
        stopTimer(gone.id);
        gone.onCommit?.();
      }
      if (next.duration !== null && next.duration !== undefined) startTimer(id, next.duration);
      // Written into the standing region after it exists, so a screen reader says it (TA-235).
      const text = next.description ? `${next.title}. ${next.description}` : next.title;
      setSaid((current) => (next.tone === "danger" ? { ...current, assertive: { id, text } } : { ...current, polite: { id, text } }));
      return id;
    },
    [startTimer, stopTimer],
  );

  // Clearing on unmount stops a timer firing setState against a dead tree.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) if (timer.handle) clearTimeout(timer.handle);
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  // The regions stand from the first client render, before any toast; they are not in the server's markup, which
  // has nothing to announce and must not add a live region to every page a test or a crawler reads.
  const regions = useSyncExternalStore(neverChanges, inBrowser, onServer);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {regions && (
        <>
          <div role="status" aria-live="polite" aria-atomic="false" className="sr-only" data-testid="toast-said-polite">
            {said.polite ? <p key={said.polite.id}>{said.polite.text}</p> : null}
          </div>
          <div role="alert" aria-live="assertive" aria-atomic="false" className="sr-only" data-testid="toast-said-assertive">
            {said.assertive ? <p key={said.assertive.id}>{said.assertive.text}</p> : null}
          </div>
        </>
      )}
      <div
        role="region"
        aria-label={t2("shell.notifications")}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:items-end sm:pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={(undone) => close(t.id, undone)} onHold={() => hold(t.id)} onRelease={() => release(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
  onHold,
  onRelease,
}: {
  toast: Toast;
  onDismiss: (undone: boolean) => void;
  onHold: () => void;
  onRelease: () => void;
}) {
  const t = useT();
  const hovered = useRef(false);
  const focused = useRef(false);
  const settle = () => {
    if (!hovered.current && !focused.current) onRelease();
  };
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
      data-testid="toast"
      onMouseEnter={() => {
        hovered.current = true;
        onHold();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        settle();
      }}
      onFocus={() => {
        focused.current = true;
        onHold();
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        focused.current = false;
        settle();
      }}
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
            onDismiss(true);
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
            onDismiss(false);
          }}
          className="shrink-0 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold text-accent-strong hover:bg-accent-soft"
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={() => onDismiss(false)}
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
