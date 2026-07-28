"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { NAV, QUICK_ACTIONS } from "@/lib/nav";
import { NavIcon } from "./icons";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/constants";

type Entry = { href: string; label: string; icon: string; description?: string; group: string };

/**
 * ⌘K palette.
 *
 * Implemented as a modal dialog with roving focus rather than a listbox because
 * the results are links: keyboard users get arrow keys and Enter, and everyone
 * else can just tap a row.
 */
export function CommandPalette({
  open,
  onClose,
  role,
  contextCount,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
  contextCount: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [
      ...QUICK_ACTIONS[role].map((a) => ({ ...a, group: "Actions" })),
      ...NAV[role].map((n) => ({ href: n.href, label: n.label, icon: n.icon, group: "Go to" })),
      { href: "/notifications", label: "Notifications", icon: "bell", group: "Go to" },
      { href: "/account", label: "Your account and appearance", icon: "gear", group: "Go to" },
    ];
    if (contextCount > 1) {
      list.push({
        href: "/switch",
        label: "Switch role or school",
        icon: "users",
        description: "You belong to more than one",
        group: "Actions",
      });
    }
    return list;
  }, [role, contextCount]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.href.toLowerCase().includes(q),
    );
  }, [entries, query]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    // rAF: the input is not in the DOM until after this effect's first paint.
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      // Returning focus is what stops a keyboard user being dumped at the top
      // of the document every time they dismiss the palette.
      previouslyFocused.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(c + 1, results.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (event.key === "Enter") {
        const target = results[cursor];
        if (target) {
          event.preventDefault();
          onClose();
          setQuery("");
          router.push(target.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, onClose, router]);

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 p-4 pt-[10vh] animate-fade"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-[--radius-lg] border border-border bg-surface shadow-lg animate-in-up"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <MagnifyingGlassIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
            className="min-h-14 w-full bg-transparent text-[0.9375rem] text-fg outline-none placeholder:text-fg-subtle"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.6875rem] text-fg-muted sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto p-2 scrollbar-thin">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-fg-muted">
              Nothing matches &ldquo;{query}&rdquo;. Try a page name like &ldquo;register&rdquo;.
            </p>
          ) : (
            results.map((entry, index) => {
              const showGroup = entry.group !== lastGroup;
              lastGroup = entry.group;
              return (
                <div key={`${entry.href}-${entry.label}`}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-subtle">
                      {entry.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => {
                      onClose();
                      setQuery("");
                      router.push(entry.href);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[--radius-md] px-3 py-2.5 text-left",
                      index === cursor ? "bg-accent-soft text-accent-strong" : "text-fg",
                    )}
                  >
                    <NavIcon name={entry.icon} className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{entry.label}</span>
                      {entry.description && (
                        <span className="block truncate text-xs text-fg-muted">
                          {entry.description}
                        </span>
                      )}
                    </span>
                    {index === cursor && (
                      <ArrowRightIcon className="size-4 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
