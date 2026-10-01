"use client";

import { useState, useTransition } from "react";
import type { Decisions } from "@edulink/contracts";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n";
import { loadMoreDecisions } from "./actions";
import { DECISION_KIND_KEY } from "@/lib/decision-kinds";

/**
 * The log's rows, thirty at a time: the first page came with the server
 * render, and each "Show more" asks the server action for the next page by
 * cursor and appends it. The filters live in the URL (the toolbar above),
 * so a change of kind or month is a fresh render with a fresh first page.
 */
export function DecisionList({ initial, query }: { initial: Decisions; query: { from?: string; to?: string; kind?: string } }) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [pending, start] = useTransition();
  const remaining = Math.min(30, Math.max(0, initial.total - items.length));
  const when = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-IN" : `${locale}-IN-u-nu-latn`, { day: "numeric", month: "short", year: "numeric" });

  const more = () => {
    if (!cursor) return;
    start(async () => {
      const page = await loadMoreDecisions({ ...query, cursor });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    });
  };

  return (
    <>
      <ol className="divide-y divide-border">
        {items.map((d) => (
          <li key={d.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{d.sentence}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">
                <time dateTime={d.at}>{when(d.at)}</time>
                {" · "}
                {t(DECISION_KIND_KEY[d.kind])}
              </p>
            </div>
            <span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", d.approved ? "bg-ok" : "bg-fg-subtle")} />
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
        <p className="text-xs text-fg-muted">{t("decisions.shownOf", { shown: items.length, total: initial.total })}</p>
        {cursor && remaining > 0 && (
          <Button type="button" variant="secondary" size="sm" loading={pending} onClick={more}>
            {t("common.showMore", { count: remaining })}
          </Button>
        )}
      </div>
    </>
  );
}
