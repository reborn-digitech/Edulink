"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { ROLE_META, SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";
import { cn } from "@/lib/cn";

/**
 * Directory search, filter and sort.
 *
 * State lives in the URL rather than component state, so a filtered view is
 * shareable, survives a refresh, and the back button behaves the way people
 * expect. Typing is debounced so a 20-character name is one navigation, not 20.
 */
export function DirectoryControls({
  query,
  role,
  classId,
  sort,
  status,
  leftCount,
  suspendedCount,
  classes,
}: {
  query: string;
  role: SchoolRole | null;
  classId: string;
  sort: string;
  status: "ACTIVE" | "SUSPENDED" | "LEFT";
  leftCount: number;
  suspendedCount: number;
  classes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep in step when the URL changes from elsewhere (back button, Clear).
  // Adjusted DURING render rather than in an effect: React re-runs this
  // component before touching the DOM, so the box never paints the stale text
  // for a frame the way an effect would have it.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setText(query);
  }

  function navigate(
    next: Partial<{ q: string; role: string; classId: string; sort: string; status: string }>,
  ) {
    const params = new URLSearchParams();
    const merged = {
      q: text,
      role: role ?? "",
      classId,
      sort,
      // "" rather than "ACTIVE": the default view needs no parameter, so the
      // plain /admin/people URL keeps meaning what it has always meant.
      status: status === "ACTIVE" ? "" : status,
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "sort" && value === "name")) params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  function onType(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ q: value }), 300);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={t("people.searchPlaceholder")}
          aria-label={t("people.searchLabel")}
          className="min-h-12 w-full rounded-[--radius-md] border border-border bg-surface pl-11 pr-11 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
        {pending && (
          <span className="absolute right-11 top-1/2 -translate-y-1/2 text-fg-subtle">
            <Spinner />
          </span>
        )}
        {text && (
          <button
            type="button"
            onClick={() => {
              setText("");
              navigate({ q: "" });
            }}
            aria-label={t("people.clearSearch")}
            className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-fg-subtle hover:bg-surface-muted hover:text-fg"
          >
            <XIcon weight="bold" className="size-4" />
          </button>
        )}
      </div>

      {/* Paused people are a SEPARATE VIEW, not a row style mixed into the
          list. An admin asking "who is here" and an admin asking "who did we
          pause" are two different questions, and answering both at once is how
          a suspended pupil gets counted into a class total. The tab only
          appears once there is something behind it. */}
      {(suspendedCount > 0 || leftCount > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={status === "ACTIVE"} onClick={() => navigate({ status: "" })}>
            {t("people.inTheSchool")}
          </FilterChip>
          {suspendedCount > 0 && (
            <FilterChip
              active={status === "SUSPENDED"}
              onClick={() => navigate({ status: "SUSPENDED" })}
            >
              {t("people.pausedCount", { count: suspendedCount })}
            </FilterChip>
          )}
          {/* A THIRD TAB, NOT A SECOND MEANING FOR "PAUSED". A school in
              September needs to know which of these children are coming back,
              and one list holding both cannot answer it. */}
          {leftCount > 0 && (
            <FilterChip active={status === "LEFT"} onClick={() => navigate({ status: "LEFT" })}>
              {t("people.leftCount", { count: leftCount })}
            </FilterChip>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={!role} onClick={() => navigate({ role: "" })}>
          {t("people.everyone")}
        </FilterChip>
        {SCHOOL_ROLES.map((r) => (
          <FilterChip key={r} active={role === r} onClick={() => navigate({ role: r })}>
            {t(ROLE_META[r].pluralKey)}
          </FilterChip>
        ))}

        {classes.length > 0 && (
          <select
            value={classId}
            onChange={(e) => navigate({ classId: e.target.value })}
            aria-label={t("people.filterByClass")}
            className="ml-auto min-h-10 rounded-full border border-border bg-surface px-3.5 text-sm text-fg outline-none focus:border-accent"
          >
            <option value="">{t("people.allClasses")}</option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value })}
          aria-label={t("people.sortBy")}
          className="min-h-10 rounded-full border border-border bg-surface px-3.5 text-sm text-fg outline-none focus:border-accent"
        >
          <option value="name">{t("people.sortName")}</option>
          <option value="recent">{t("people.sortRecent")}</option>
        </select>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-full px-3.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-fg"
          : "border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
