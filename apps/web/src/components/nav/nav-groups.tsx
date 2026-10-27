"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { groupOpen, navOpenStorageKey, type NavGroup } from "@/lib/nav";
import type { Role } from "@/lib/constants";
import { cn } from "@/lib/cn";

/**
 * THE MENU'S GROUPS, OPENED AND CLOSED (the owner's decision of 27 October 2026, item 3). Each group of the rail and
 * of the More sheet is a button that shows or hides its entries; which ones the person opened or closed is kept in
 * this browser's localStorage under a key naming the role (navOpenStorageKey), so the office's choice and the same
 * person's teacher menu do not mix. A group holding the page the person is on is always open. Nothing is lost by
 * closing a group: the ⌘K palette searches every entry of the role, closed or not.
 *
 * Read through useSyncExternalStore, so the server's page and the first paint use the defaults (Setup closed, the
 * rest open) and the remembered state follows at once without a hydration mismatch.
 */

const CHANGED = "edulink:nav-groups";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function parse(raw: string | null): Partial<Record<string, boolean>> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => typeof v === "boolean")) as Record<string, boolean>;
  } catch {
    return {};
  }
}

/** The groups this person opened or closed for this role, and a setter that keeps the choice. */
export function useRememberedGroups(role: Role): [Partial<Record<string, boolean>>, (group: NavGroup, open: boolean) => void] {
  const key = navOpenStorageKey(role);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const remembered = useMemo(() => parse(raw), [raw]);
  const remember = useCallback(
    (group: NavGroup, open: boolean) => {
      const next = { ...parse(readRaw(key)), [group]: open };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* private mode: the choice lasts as long as the page */
      }
      window.dispatchEvent(new Event(CHANGED));
    },
    [key],
  );
  return [remembered, remember];
}

/**
 * One group: its name as a button with a chevron (aria-expanded, aria-controls), then its entries. While it holds the
 * current page the button says so (aria-disabled, no chevron) and the group stays open. `size` is the rail's on a desk
 * and the sheet's at a phone's width, where every control is at least 44 px.
 */
export function NavGroupSection({
  id,
  label,
  group,
  remembered,
  holdsPage,
  onToggle,
  size,
  children,
}: {
  id: string;
  label: string;
  group: NavGroup;
  remembered: Partial<Record<string, boolean>>;
  holdsPage: boolean;
  onToggle: (group: NavGroup, open: boolean) => void;
  size: "rail" | "sheet";
  children: React.ReactNode;
}) {
  const open = groupOpen(group, remembered, holdsPage);
  return (
    <div data-nav-group={group} className={size === "rail" ? "pt-2" : "mb-2"}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-disabled={holdsPage || undefined}
        onClick={() => {
          if (!holdsPage) onToggle(group, !open);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-[var(--radius-md)] text-left font-semibold uppercase tracking-wider text-fg-subtle",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          size === "rail" ? "min-h-9 px-3 text-[0.65rem]" : "min-h-11 px-2 text-xs",
          holdsPage ? "cursor-default" : "hover:bg-surface-muted hover:text-fg",
        )}
      >
        <span className="flex-1">{label}</span>
        {holdsPage ? null : <CaretDownIcon className={cn("size-3.5 shrink-0 transition-transform duration-[var(--dur-fast)]", !open && "-rotate-90")} weight="bold" aria-hidden="true" />}
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
