"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

const SPANS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "A term" },
  { days: 180, label: "Half a year" },
];

/**
 * How far back the figures look.
 *
 * IN THE URL, not in component state, so a principal can send a colleague the
 * view they are looking at and get the same numbers back. The same reason the
 * directory filters live there.
 *
 * The server clamps this to the same four values regardless of what arrives —
 * it ends up in a date range and then in a query, and a control offering four
 * options is not a promise that only four will be sent.
 */
export function WindowPicker({ days }: { days: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function choose(next: number) {
    const query = new URLSearchParams(params.toString());
    query.set("days", String(next));
    startTransition(() => router.push(`${pathname}?${query}`));
  }

  return (
    <div
      role="radiogroup"
      aria-label="How far back"
      className="flex flex-wrap gap-1 rounded-[--radius-md] bg-surface-muted p-1"
    >
      {SPANS.map((span) => (
        <button
          key={span.days}
          type="button"
          role="radio"
          aria-checked={span.days === days}
          disabled={pending}
          onClick={() => choose(span.days)}
          className={cn(
            "min-h-10 rounded-[--radius-sm] px-3 text-sm font-medium transition-colors disabled:opacity-60",
            span.days === days ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
          )}
        >
          {span.label}
        </button>
      ))}
    </div>
  );
}
