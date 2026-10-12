import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * A row of links that reads as a segmented switch (college-content, 12 October 2026): the college
 * practice page's two sections. The same look as the board switch (practice-board-switch.tsx), 44 px
 * targets, the choice kept in the URL.
 */
export function SegmentLinks({ label, icon, options, current }: { label: string; icon?: ReactNode; options: { value: string; label: string; href: string }[]; current: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2" data-testid="college-practice-sections">
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        {icon}
        {label}
      </span>
      <div className="flex flex-1 flex-wrap gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1">
        {options.map((option) => {
          const active = option.value === current;
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={active ? "true" : undefined}
              data-section={option.value}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] px-3 py-1.5 text-center text-sm font-medium transition-colors",
                active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** A row of filter chips as links: "All …" first, then each value. */
export function ChipLinks({ label, options, current }: { label: string; options: { value: string; label: string; href: string }[]; current: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.value}
          href={option.href}
          aria-current={option.value === current ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium",
            option.value === current ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
