"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const SPANS: { days: number; labelKey: TranslationKey }[] = [
  { days: 7, labelKey: "principal.days7" },
  { days: 30, labelKey: "principal.days30" },
  { days: 90, labelKey: "principal.aTerm" },
  { days: 180, labelKey: "principal.halfYear" },
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
  const t = useT();
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
      aria-label={t("principal.howFarBack")}
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
          {t(span.labelKey)}
        </button>
      ))}
    </div>
  );
}
