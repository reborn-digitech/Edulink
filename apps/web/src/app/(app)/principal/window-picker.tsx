"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { Span } from "@/lib/insights";

const SPANS: { span: Span; labelKey: TranslationKey }[] = [
  { span: 7, labelKey: "principal.days7" },
  { span: 30, labelKey: "principal.days30" },
  { span: 90, labelKey: "principal.aTerm" },
  { span: "year", labelKey: "principal.yearSoFar" },
];

/**
 * How far back the figures look.
 *
 * IN THE URL, not in component state, so a principal can send a colleague the
 * view they are looking at and get the same numbers back. The same reason the
 * directory filters live there.
 *
 * The server parses this to the same four values regardless of what arrives —
 * it ends up in a date range and then in a query, and a control offering four
 * options is not a promise that only four will be sent. The fourth is not a
 * number of days: "the academic year so far" is resolved on the server from
 * the current year's start date (see `windowFor`).
 */
export function WindowPicker({ span }: { span: Span }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function choose(next: Span) {
    const query = new URLSearchParams(params.toString());
    query.set("days", String(next));
    startTransition(() => router.push(`${pathname}?${query}`));
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("principal.howFarBack")}
      className="flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1"
    >
      {SPANS.map((option) => (
        <button
          key={String(option.span)}
          type="button"
          role="radio"
          aria-checked={option.span === span}
          disabled={pending}
          onClick={() => choose(option.span)}
          className={cn(
            "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors disabled:opacity-60",
            option.span === span ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
          )}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
