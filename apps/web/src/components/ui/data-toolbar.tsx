"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Search, sort and filters for a page that shows a collection.
 *
 * ONE TOOLBAR FOR EVERY LIST, so the search box is always in the same place,
 * a sort is always a select on the right, and a filter is always a chip
 * that turns solid when it is on. State lives in the URL: a filtered view is
 * shareable, survives a refresh, and the back button undoes a filter the
 * way it undoes everything else. Typing is debounced so a 20-character name
 * is one navigation, not twenty; a chip or a select navigates at once.
 *
 * DEFAULTS LEAVE NO TRACE. A facet's `defaultValue` (and a sort's) is what
 * the plain URL means, so choosing it removes the parameter rather than
 * writing it — `/admin/exams` keeps meaning what it always meant, and the
 * active-filter chips only show what the person actually narrowed.
 *
 * Everything here is words the PAGE translated: the toolbar carries no
 * English of its own.
 */

export type ToolbarOption = { value: string; label: string; count?: number };

export type ToolbarFacet = {
  /** The URL parameter. */
  key: string;
  label: string;
  options: ToolbarOption[];
  value: string;
  /** The option that means "no filter" — omitted from the URL. Default "". */
  defaultValue?: string;
  /** Chips (few options, one line) or a select (many options). Default: chips up to 5. */
  as?: "chips" | "select";
  /** Parameters that stop meaning anything when this one changes (a state under a country). */
  clears?: string[];
};

export type ToolbarSort = {
  key?: string;
  label: string;
  options: ToolbarOption[];
  value: string;
  defaultValue: string;
};

export function DataToolbar({
  search,
  sort,
  facets = [],
  extra = {},
  labels,
  className,
}: {
  search?: { key?: string; value: string; placeholder: string; label: string };
  sort?: ToolbarSort;
  facets?: ToolbarFacet[];
  /** Parameters this toolbar does not own but must carry (a tab, a school). */
  extra?: Record<string, string>;
  labels: { clearAll: string; clearSearch: string; activeFilters: string };
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const searchKey = search?.key ?? "q";
  const sortKey = sort?.key ?? "sort";
  const [text, setText] = useState(search?.value ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The last value THIS box sent to the URL, until the URL catches up with it.
  // While it is set, a URL change is our own navigation landing (possibly
  // trimmed by the page, possibly an older keystroke on a slow server) and
  // must not overwrite what the person has typed since.
  const [own, setOwn] = useState<string | null>(null);

  // Keep the box in step when the URL changes from elsewhere (back button,
  // a chip's clear). Adjusted during render, not in an effect, so the stale
  // text never paints for a frame.
  const [lastValue, setLastValue] = useState(search?.value ?? "");
  if ((search?.value ?? "") !== lastValue) {
    const incoming = search?.value ?? "";
    setLastValue(incoming);
    if (own === null) setText(incoming);
    else if (incoming.trim() === own.trim()) setOwn(null);
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function current(): Record<string, string> {
    const state: Record<string, string> = { ...extra };
    if (search && text) state[searchKey] = text;
    if (sort && sort.value !== sort.defaultValue) state[sortKey] = sort.value;
    for (const facet of facets) {
      if (facet.value !== (facet.defaultValue ?? "")) state[facet.key] = facet.value;
    }
    return state;
  }

  function navigate(next: Record<string, string | null>) {
    const merged = { ...current(), ...next };
    for (const facet of facets) {
      if (facet.key in next && facet.clears) for (const key of facet.clears) merged[key] = null;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function onType(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOwn(value);
      navigate({ [searchKey]: value || null });
    }, 300);
  }

  const active = facets.filter((f) => f.value !== (f.defaultValue ?? ""));
  const anyActive = active.length > 0 || Boolean(search?.value);
  const chipFacets = facets.filter((f) => (f.as ?? (f.options.length <= 5 ? "chips" : "select")) === "chips");
  const selectFacets = facets.filter((f) => (f.as ?? (f.options.length <= 5 ? "chips" : "select")) === "select");

  return (
    <div className={cn("space-y-2.5", className)} role="search">
      {(search || sort || selectFacets.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <div className="relative min-w-[12rem] flex-1">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
                aria-hidden="true"
              />
              <input
                type="search"
                value={text}
                onChange={(e) => onType(e.target.value)}
                placeholder={search.placeholder}
                aria-label={search.label}
                className="min-h-11 w-full rounded-[--radius-md] border border-border bg-surface pl-11 pr-11 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
              />
              {pending ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle">
                  <Spinner />
                </span>
              ) : text ? (
                <button
                  type="button"
                  onClick={() => { setText(""); setOwn(null); navigate({ [searchKey]: null }); }}
                  aria-label={labels.clearSearch}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-fg-subtle hover:bg-surface-muted hover:text-fg"
                >
                  <XIcon weight="bold" className="size-4" />
                </button>
              ) : null}
            </div>
          )}
          {selectFacets.map((facet) => (
            <select
              key={facet.key}
              value={facet.value}
              onChange={(e) => navigate({ [facet.key]: e.target.value === (facet.defaultValue ?? "") ? null : e.target.value })}
              aria-label={facet.label}
              className="min-h-11 rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
            >
              {facet.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}{o.count !== undefined ? ` (${o.count})` : ""}
                </option>
              ))}
            </select>
          ))}
          {sort && (
            <select
              value={sort.value}
              onChange={(e) => navigate({ [sortKey]: e.target.value === sort.defaultValue ? null : e.target.value })}
              aria-label={sort.label}
              className="min-h-11 rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent sm:ml-auto"
            >
              {sort.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {chipFacets.map((facet) => (
        // The chips wrap: a row that scrolled sideways was cut at "Mentoring one chil…" with no sign of more (the walk of 2026-10-01).
        <div key={facet.key} role="group" aria-label={facet.label} className="-mx-1 flex flex-wrap gap-1.5 px-1 pb-0.5">
          {facet.options.map((o) => {
            const on = facet.value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => navigate({ [facet.key]: o.value === (facet.defaultValue ?? "") ? null : o.value })}
                className={cn(
                  "min-h-11 shrink-0 snap-start rounded-full px-3 text-xs font-medium transition-colors",
                  on ? "bg-accent text-accent-fg" : "border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg",
                )}
              >
                {o.label}
                {o.count !== undefined && <span className={cn("ml-1 tabular-nums", on ? "" : "text-fg-subtle")}>{o.count}</span>}
              </button>
            );
          })}
        </div>
      ))}

      {anyActive && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs" aria-label={labels.activeFilters}>
          {search?.value && (
            <button type="button" onClick={() => { setText(""); setOwn(null); navigate({ [searchKey]: null }); }} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent-strong hover:opacity-80">
              “{search.value}”
              <XIcon weight="bold" className="size-3" aria-hidden="true" />
            </button>
          )}
          {active.map((facet) => {
            const chosen = facet.options.find((o) => o.value === facet.value);
            return (
              <button
                key={facet.key}
                type="button"
                onClick={() => navigate({ [facet.key]: null })}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent-strong hover:opacity-80"
                aria-label={`${facet.label}: ${chosen?.label ?? facet.value}`}
              >
                {chosen?.label ?? facet.value}
                <XIcon weight="bold" className="size-3" aria-hidden="true" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setText("");
              setOwn(null);
              const cleared: Record<string, null> = { [searchKey]: null };
              for (const f of facets) cleared[f.key] = null;
              navigate(cleared);
            }}
            className="ml-1 font-medium text-fg-muted underline-offset-2 hover:text-fg hover:underline"
          >
            {labels.clearAll}
          </button>
        </div>
      )}
    </div>
  );
}
