import { cn } from "@/lib/cn";

/**
 * The look of every text box, select and text area: the kit's own fields
 * (TextField, SelectField, TextAreaField, DateField) and any raw control a page
 * writes itself. One source, so a raw <select> in a table cell is the same
 * 48 px box with the same focus ring as a TextField, and nothing falls under
 * the 44 px touch floor because a page copied an older class list.
 *
 * A plain module, not "use client": server pages call it while rendering, and
 * a function exported from a client file reaches a server component as a
 * reference it cannot call.
 *
 * `extra` is layout only (width, margin, alignment, font-mono, the height of a
 * big text area); it goes through cn, so "w-24" replaces the default w-full.
 * A raw <select> keeps its native arrow (no appearance-none here).
 */
export function fieldClass(extra?: string, invalid = false): string {
  return cn(
    "w-full rounded-[var(--radius-md)] border bg-surface px-3.5 py-3 text-[0.9375rem] text-fg",
    "min-h-12 placeholder:text-fg-subtle",
    "transition-[border-color,box-shadow] duration-[var(--dur-fast)]",
    "focus:outline-none focus-visible:outline-none",
    invalid
      ? "border-danger ring-2 ring-danger/25"
      : "border-border hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent-ring/40",
    extra,
  );
}
