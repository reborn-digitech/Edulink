"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, WarningIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { relativeTime as relativeTimeIn } from "@/lib/dates";
import { actionKey, isSensitiveAction, type AuditEntry } from "@/lib/safety-labels";
import { useLocale, useT } from "@/lib/i18n";
import { fieldClass } from "@/components/ui/field-class";

/**
 * Audit log viewer.
 *
 * Filtering happens client-side over the fetched page rather than by refetching,
 * because an admin scanning for "who exported the directory" wants instant
 * narrowing, and the page is capped at 200 rows anyway. If that cap ever needs
 * raising, move the filter into the query.
 */
export function AuditTable({ rows }: { rows: AuditEntry[] }) {
  const t = useT();
  // "2 hours ago" in the reader's language (QA-20).
  const locale = useLocale();
  const relativeTime = (at: Date) => relativeTimeIn(at, new Date(), locale);
  const [query, setQuery] = useState("");
  const [sensitiveOnly, setSensitiveOnly] = useState(false);

  /* An action with no wording falls back to its raw key — `class.archive`
     rather than a blank cell. Not prose, and the same in every language. */
  const describe = (action: string) => {
    const key = actionKey(action);
    return key ? t(key) : action;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (sensitiveOnly && !isSensitiveAction(row.action)) return false;
      if (!q) return true;
      return (
        row.actorName.toLowerCase().includes(q) ||
        row.action.toLowerCase().includes(q) ||
        describe(row.action).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sensitiveOnly, t]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{t("safety.searchAudit")}</span>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("safety.searchAuditPlaceholder")}
            className={fieldClass("pl-11")}
          />
        </label>
        <button
          type="button"
          aria-pressed={sensitiveOnly}
          onClick={() => setSensitiveOnly((s) => !s)}
          className={cn(
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-medium",
            sensitiveOnly
              ? "bg-danger text-danger-fg"
              : "border border-border bg-surface text-fg-muted hover:text-fg",
          )}
        >
          <WarningIcon weight={sensitiveOnly ? "fill" : "regular"} className="size-4" />
          {t("safety.sensitiveOnly")}
        </button>
      </div>

      <p className="text-xs text-fg-muted" aria-live="polite">
        {t("safety.entryCount", { shown: filtered.length, total: rows.length })}
        {rows.length >= 200 && t("safety.mostRecent200")}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-md)] bg-surface-muted p-6 text-center text-sm text-fg-muted">
          {t("safety.nothingMatches")}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {filtered.map((row) => {
            const sensitive = isSensitiveAction(row.action);
            return (
              <li key={row.id} className={cn("p-3.5", sensitive && "bg-danger-soft/30")}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-fg">{row.actorName}</span>
                  <span className="text-sm text-fg-muted">{describe(row.action)}</span>
                  {sensitive && (
                    <Badge tone="danger" size="sm">
                      {t("safety.sensitive")}
                    </Badge>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-fg-subtle">
                    {relativeTime(row.at)}
                  </span>
                </div>

                <p className="mt-0.5 font-mono text-[0.6875rem] text-fg-subtle">
                  {row.action}
                  {row.targetType ? ` · ${row.targetType}` : ""}
                  {row.ip ? ` · ${row.ip}` : ""}
                </p>

                {Object.keys(row.meta).length > 0 && (
                  <p className="mt-1 break-words font-mono text-[0.6875rem] leading-relaxed text-fg-muted">
                    {Object.entries(row.meta)
                      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                      .join("  ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
