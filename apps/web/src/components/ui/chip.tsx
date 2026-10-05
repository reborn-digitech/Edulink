import Link from "next/link";
import { cn } from "@/lib/cn";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps } from "react";

/**
 * A filter or quick-pick chip: a pill that is 44 px tall like every other
 * target (the kit's small button). Before this the chips were raw buttons and
 * links hand-styled page by page at 16 to 40 px (A3-states-11, the walk of
 * 5 October 2026: remarks' subject suggestions 30 px, the people filters and
 * the principal's window picker 40, the inventory filters 20).
 *
 * `pressed` makes it a toggle (aria-pressed); leave it out for a chip that
 * does one thing when pressed (fill a subject, add a tag). `ChipLink` is the
 * same pill as a link, `current` marking the filter in force.
 */
export function chipClass(on = false, className?: string) {
  return cn(
    "inline-flex min-h-11 select-none items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
    "transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
    "disabled:pointer-events-none disabled:opacity-55",
    on ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg",
    className,
  );
}

export function Chip({ pressed, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return <button type={type} aria-pressed={pressed} className={chipClass(pressed, className)} {...props} />;
}

export function ChipLink({
  current,
  className,
  ...props
}: ComponentProps<typeof Link> & AnchorHTMLAttributes<HTMLAnchorElement> & { current?: boolean }) {
  return <Link aria-current={current ? "page" : undefined} className={chipClass(current, className)} {...props} />;
}
