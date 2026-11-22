"use client";

import { cn } from "@/lib/cn";

/**
 * A premium switch drawn as a switch (the coordinating session's C5 point 7; its walk, U3): a track and a thumb with
 * role="switch", named for the school and the role, in a 44 px target. A button that read "Off" read as an act.
 */
export function PremiumSwitch({ on, label, disabled, onToggle, testId }: { on: boolean; label: string; disabled?: boolean; onToggle: () => void; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      data-testid={testId}
      className="tap inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-55"
    >
      <span aria-hidden="true" className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", on ? "bg-accent" : "bg-border-strong")}>
        <span className={cn("inline-block size-5 rounded-full bg-surface shadow transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
      </span>
    </button>
  );
}
