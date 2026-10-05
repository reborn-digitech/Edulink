"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandIcon, DotsThreeOutlineIcon, MagnifyingGlassIcon, SignOutIcon } from "@phosphor-icons/react";
import { OutboxBadge } from "./outbox-badge";
import { NAV, NAV_GROUP_KEY, PRIMARY_ACTION, isActive, type NavGroup, type NavItem } from "@/lib/nav";
import { NavIcon } from "./icons";
import { CommandPalette } from "./command-palette";
import { TypingSwitch } from "@/components/typing-switch";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import type { Translate } from "@/lib/i18n";
import { ROLE_META, type Role } from "@/lib/constants";

export type ShellUser = {
  name: string;
  avatarKey: string | null;
  role: Role;
  schoolName: string;
  /** A college's streams, in the reader's words (5 Oct 2026): a chip beside the name; empty at a school. */
  streams?: string[];
  /** At a college (5 Oct 2026) the office is "College office" in the rail, not "School admin". */
  college?: boolean;
  contextCount: number;
  /**
   * Whoever runs the server, signed in as somebody INSIDE a school.
   *
   * The redirect to /root in the app layout only fires for a superuser with no
   * school context at all. An owner who also teaches — the ordinary case for a
   * small deployment — landed in their classroom with no way back out but the
   * address bar. This is that way back: one link, deliberately set apart from
   * the school's own navigation, because it leaves the school.
   */
  isSuperuser?: boolean;
};

/**
 * The four-way navigation the spec asks for:
 *   * side rail   — desktop, always visible, full labels
 *   * bottom bar  — phones, thumb-reachable, max 5 items
 *   * FAB         — the single most common action for the role
 *   * ⌘K palette  — everything, searchable, keyboard-first
 */
export function AppShell({
  user,
  children,
  unreadCount = 0,
  hiddenHrefs = [],
  badges = {},
}: {
  user: ShellUser;
  children: React.ReactNode;
  unreadCount?: number;
  /** Counts worn by nav entries, keyed by href — unread messages on /remarks. */
  badges?: Record<string, number>;
  /** Nav entries that exist for the role but not for this person right now —
   * e.g. Feedback, which appears only while a review round is open. */
  hiddenHrefs?: string[];
}) {
  const pathname = usePathname();
  const t = useT();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const items = NAV[user.role].filter((item) => !hiddenHrefs.includes(item.href));
  const primaryItems = items.filter((i) => i.primary).slice(0, 5);
  /* The rest, as three short lists. FIVE PRIMARIES carry the day; the rail
   * and the phone's More sheet read the remainder under group headings so a
   * parent looking for Meetings is not scanning Competitions to find it. */
  const GROUPS: NavGroup[] = ["daily", "school", "running"];
  const secondary = GROUPS.map((group) => ({
    group,
    items: items.filter((i) => !i.primary && (i.group ?? "school") === group),
  })).filter((g) => g.items.length > 0);
  // Only on the pages it belongs to (QuickAction.on), and never on the page it opens.
  const primary = PRIMARY_ACTION[user.role];
  const action = primary && primary.on?.includes(pathname) && primary.href !== pathname ? primary : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // data-role drives every accent token in the subtree, so the whole shell
    // recolours per role from one attribute.
    // data-shell tints the page behind the cards in the light theme; data-chrome
    // marks the frame (menu, bars, sheet) that takes dark's navy there; data-wash
    // fades the role's colour behind the page title. globals.css, "The frame of
    // a light page".
    <div data-role={user.role.toLowerCase()} data-shell className="min-h-safe bg-bg">
      {/* ---------- desktop side rail ---------- */}
      {/* print:hidden on every piece of chrome: the sheet is the page's content,
          not the app around it. Found the hard way — the first printed progress
          report carried the side rail, the bottom tabs and the FAB. */}
      <aside data-chrome className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex print:hidden">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Logo size={28} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-fg">{user.schoolName}</p>
            <p className="text-xs text-fg-muted">
              <span className="shrink-0">{t(user.college && user.role === "ADMIN" ? "role.collegeAdmin" : ROLE_META[user.role].labelKey)}</span>
            </p>
            {user.streams?.length ? (
              <p className="flex min-w-0">
                <StreamChip streams={user.streams} t={t} />
              </p>
            ) : null}
          </div>
        </div>

        <nav aria-label={t("shell.mainNav")} className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {primaryItems.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(pathname, item)} t={t} badge={badges[item.href] ?? 0} />
          ))}
          {secondary.map(({ group, items: list }) => (
            <div key={group} className="pt-3">
              <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-fg-subtle">
                {t(NAV_GROUP_KEY[group])}
              </p>
              {list.map((item) => (
                <SideLink key={item.href} item={item} active={isActive(pathname, item)} t={t} badge={badges[item.href] ?? 0} />
              ))}
            </div>
          ))}
        </nav>
        {/* The language is changed on the account page, one tap away; a link to it here was one more thing in the menu (the owner, 2026-10-01). */}
        <div className="flex items-center justify-between gap-2 px-3 pb-2">
          <OutboxBadge />
        </div>

        <div className="border-t border-border p-3">
          {user.isSuperuser && (
            <Link
              href="/root"
              className="mb-2 flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              <NavIcon name="buildings" className="size-5" />
              {t("shell.serverAdmin")}
            </Link>
          )}
          {/* The role's one action, on a desk: in the rail rather than floating over the page, where at 1280 px it
              sat on the second class's "Take it" (the walk of 4 October, B-19). The phone keeps the floating button. */}
          {action && (
            <Link
              href={action.href}
              className="mb-2 flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-3 py-2.5 text-sm font-semibold text-accent-fg shadow-sm hover:brightness-110 active:brightness-95"
            >
              <NavIcon name={action.icon} className="size-5" weight="bold" />
              <span className="flex-1">{t(action.labelKey)}</span>
            </Link>
          )}
          {/* The bell lived only in the phone's top bar; on a desk, the
              unread count had nowhere to show. */}
          <Link
            href="/notifications"
            className={cn(
              "mb-2 flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors hover:bg-surface-muted hover:text-fg",
              pathname.startsWith("/notifications") ? "bg-accent-soft text-accent-strong" : "text-fg-muted",
            )}
          >
            <NavIcon name="bell" className="size-5" />
            <span className="flex-1">{t("shell.notifications")}</span>
            {unreadCount > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[0.6875rem] font-bold text-danger-fg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mb-2 flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
            <span className="flex-1 text-left">{t("shell.search")}</span>
            <kbd className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[0.6875rem] font-medium">
              <CommandIcon className="size-3" aria-hidden="true" />K
            </kbd>
          </button>

          <Link
            href="/account"
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] p-2 transition-colors hover:bg-surface-muted"
          >
            <Avatar avatarKey={user.avatarKey} name={user.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{user.name}</span>
              {user.contextCount > 1 && (
                <span className="block text-xs text-accent-strong">{t("shell.switchRole")}</span>
              )}
            </span>
          </Link>
        </div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header data-chrome className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 pt-safe backdrop-blur-md lg:hidden print:hidden">
        <Link href={items[0]!.href} className="flex min-w-0 items-center gap-2">
          <Logo size={26} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-fg">{user.schoolName}</span>
            {user.streams?.length ? <StreamChip streams={user.streams} t={t} /> : null}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {secondary.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label={t("nav.more")}
              aria-expanded={moreOpen}
              className="tap grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted"
            >
              <DotsThreeOutlineIcon className="size-5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label={t("shell.search")}
            className="tap grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted"
          >
            <MagnifyingGlassIcon className="size-5" aria-hidden="true" />
          </button>
          <OutboxBadge className="mr-1" />
          <Link
            href="/notifications"
            aria-label={
              unreadCount > 0
                ? t("shell.notificationsUnread", { count: unreadCount })
                : t("shell.notifications")
            }
            className="tap relative grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted"
          >
            <NavIcon name="bell" className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-bold text-danger-fg">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/account" aria-label={t("shell.yourAccount")} className="tap grid place-items-center">
            <Avatar avatarKey={user.avatarKey} name={user.name} size="sm" />
          </Link>
        </div>
      </header>

      {/* ---------- content ---------- */}
      <div data-wash className="lg:pl-64 print:pl-0">
        <main
          id="main"
          // Room under the last row for the bottom bar, and for the floating button where one is drawn (its bottom edge is 8.75 rem up).
          className={cn("mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:pb-12 lg:pt-8 print:p-0", action ? "pb-44" : "pb-24")}
        >
          {children}
        </main>
      </div>

      {/* The typing switch: one engine for the page, drawn beside whichever text box has focus. */}
      <TypingSwitch />

      {/* ---------- floating action button ---------- */}
      {action && (
        // A landmark of its own: the button floats outside <main>, and a
        // screen reader's region list should still find it by name.
        <nav aria-label={t("shell.quickAction")} className="contents lg:hidden">
        <Link
          href={action.href}
          className={cn(
            "fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] right-4 z-40",
            "flex h-14 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-accent-fg shadow-lg",
            "transition-transform duration-[var(--dur-fast)] active:scale-95",
            "lg:hidden print:hidden",
          )}
        >
          <NavIcon name={action.icon} className="size-5" weight="bold" />
          <span className="hidden sm:inline">{t(action.labelKey)}</span>
          <span className="sr-only sm:hidden">{t(action.labelKey)}</span>
        </Link>
        </nav>
      )}

      {/* ---------- mobile bottom bar ---------- */}
      <nav
        data-chrome
        aria-label={t("shell.mainNav")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-md lg:hidden print:hidden"
      >
        <ul className="flex">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 py-1.5",
                    "transition-colors duration-[var(--dur-fast)]",
                    active ? "text-accent-strong" : "text-fg-muted",
                  )}
                >
                  <span className="relative">
                    <NavIcon
                      name={item.icon}
                      className="size-6"
                      weight={active ? "fill" : "regular"}
                    />
                    {(badges[item.href] ?? 0) > 0 && (
                      <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-bold leading-4 text-accent-fg">
                        {(badges[item.href] ?? 0) > 9 ? "9+" : badges[item.href]}
                      </span>
                    )}
                  </span>
                  <span className="text-[0.6875rem] font-medium leading-none">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---------- mobile "More" sheet ---------- */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("nav.more")}>
          <button
            type="button"
            aria-label={t("common.cancel")}
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div data-chrome className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-surface p-4 pb-safe shadow-xl animate-in-up">
            {secondary.map(({ group, items: list }) => (
              <div key={group} className="mb-4">
                <p className="px-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-fg-subtle">
                  {t(NAV_GROUP_KEY[group])}
                </p>
                <ul className="grid grid-cols-2 gap-1">
                  {list.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-md)] px-3 text-sm font-medium",
                          isActive(pathname, item) ? "bg-accent-soft text-accent-strong" : "text-fg hover:bg-surface-muted",
                        )}
                      >
                        <NavIcon name={item.icon} className="size-5" />
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        role={user.role}
        contextCount={user.contextCount}
        isSuperuser={user.isSuperuser}
        hiddenHrefs={hiddenHrefs}
      />
    </div>
  );
}

function SideLink({ item, active, t, badge = 0 }: { item: NavItem; active: boolean; t: Translate; badge?: number }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium",
        "transition-colors duration-[var(--dur-fast)]",
        active
          ? "bg-accent-soft text-accent-strong"
          : "text-fg-muted hover:bg-surface-muted hover:text-fg",
      )}
    >
      <NavIcon name={item.icon} className="size-5" weight={active ? "fill" : "regular"} />
      <span className="flex-1">{t(item.labelKey)}</span>
      {badge > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.6875rem] font-bold leading-5 text-accent-fg">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export function SignOutButton() {
  const t = useT();
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <SignOutIcon className="size-5" aria-hidden="true" />
        {t("shell.signOut")}
      </button>
    </form>
  );
}

/**
 * The college's streams beside its name (5 Oct 2026): one quiet chip, the
 * streams joined, cut with an ellipsis where the bar is narrow (the full list
 * is its title; a screen reader hears "Streams:" first). Nothing at a school;
 * the rail gives it a line of its own under the role.
 */
function StreamChip({ streams, t }: { streams?: string[]; t: Translate }) {
  if (!streams?.length) return null;
  const all = streams.join(" · ");
  return (
    <span
      data-testid="stream-chip"
      title={t("streams.chipLabel", { streams: all })}
      className="min-w-0 truncate rounded-full border border-border bg-surface-muted px-1.5 text-[0.6875rem] font-medium leading-4 text-fg-muted"
    >
      <span className="sr-only">{t("streams.label")}: </span>
      {all}
    </span>
  );
}
