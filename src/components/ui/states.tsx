import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * The three states every view has. Building them before styling the
 * data-present case is what stops a screen reading as broken the first time a
 * list is empty or the network blips. (§9)
 */

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  tone?: "neutral" | "celebrate";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border bg-surface/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 grid size-16 place-items-center rounded-full bg-accent-soft text-accent-strong",
            tone === "celebrate" && "animate-pop",
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorState, SkeletonList and SkeletonCards used to live here too. Nothing
 * ever rendered them — a verification pass found zero call sites, which also
 * meant their English ("That did not load", the sr-only "Loading…") was dead
 * text no reader could reach. Deleted rather than translated: an untranslated
 * string in dead code is not a gap, it is a component waiting to be needed,
 * and whoever needs it next should build it against `useT` from the start.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
