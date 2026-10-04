import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * The one wrapper a table sits in when it may be wider than the screen.
 *
 * A wrapper with `overflow-x: auto` is a scrollable region, and a keyboard
 * user can only scroll it if it can take focus (axe `scrollable-region-
 * focusable`, serious). The intake table got `tabIndex={0}` by hand on
 * 30 September; ten college pages written after that did not (the walk of
 * 4 October), so the rule lives here once: focusable, a group (a region when
 * it has a name), and the page's own focus ring. tests/ui-source-rules.test.ts
 * fails on any new `overflow-x-auto` wrapper that is neither this nor
 * focusable.
 *
 * `relative`, because a scroll box clips only what it contains: the sr-only
 * header of a table's last column ("Save", "PDF") is absolutely placed, and
 * with no positioned ancestor its box is the page's, so it stood past the
 * right edge of a 390 px screen and the whole of /admin/academics scrolled
 * sideways by 67 px with the table itself neatly inside its scroller.
 */
export function TableScroll({ className, label, ...props }: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      role={label ? "region" : "group"}
      aria-label={label}
      tabIndex={0}
      className={cn("relative overflow-x-auto", className)}
      {...props}
    />
  );
}
