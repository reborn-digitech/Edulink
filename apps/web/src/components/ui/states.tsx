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
  heading: Heading = "h2",
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  tone?: "neutral" | "celebrate";
  /**
   * h1 only where the empty state IS the page and no PageHeader stands above it (a signed-out invite that no longer
   * works, the role chooser with nothing to choose). Everywhere else a page keeps its PageHeader and this stays an h2
   * (A3-states-9: 47 routes had no h1 because a first-run page returned the empty state in place of its header).
   */
  heading?: "h1" | "h2";
}) {
  return (
    <div
      // Found by the walks' inspector (an empty state with no way on is a finding, 5 Oct 2026).
      data-empty-state="true"
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface/60 px-6 py-12 text-center",
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
      <Heading className={cn("font-semibold text-fg", Heading === "h1" ? "text-xl" : "text-base")}>{title}</Heading>
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

/**
 * What a page looks like while its queries run: the title's bar, a line of
 * description, then three card-shaped blocks. Route-level `loading.tsx`
 * files render this inside the shell, so a navigation shows the frame at
 * once instead of a blank until the slowest query answers — and the shape
 * matches every list page closely enough that nothing jumps when it lands.
 * No words, so nothing to translate; `aria-busy` says what it is.
 */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-[var(--radius-md)]" />
        <Skeleton className="h-4 w-80 max-w-full rounded-[var(--radius-sm)]" />
      </div>
      <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  );
}
