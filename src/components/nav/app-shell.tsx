"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandIcon, MagnifyingGlassIcon, SignOutIcon } from "@phosphor-icons/react";
import { NAV, PRIMARY_ACTION, isActive, type NavItem } from "@/lib/nav";
import { NavIcon } from "./icons";
import { CommandPalette } from "./command-palette";
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
}: {
  user: ShellUser;
  children: React.ReactNode;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const t = useT();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const items = NAV[user.role];
  const primaryItems = items.filter((i) => i.primary).slice(0, 5);
  const action = PRIMARY_ACTION[user.role];

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
    <div data-role={user.role.toLowerCase()} className="min-h-safe bg-bg">
      {/* ---------- desktop side rail ---------- */}
      {/* print:hidden on every piece of chrome: the sheet is the page's content,
          not the app around it. Found the hard way — the first printed progress
          report carried the side rail, the bottom tabs and the FAB. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex print:hidden">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Logo size={28} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-fg">{user.schoolName}</p>
            <p className="text-xs text-fg-muted">{t(ROLE_META[user.role].labelKey)}</p>
          </div>
        </div>

        <nav aria-label={t("shell.mainNav")} className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {items.map((item) => (
            <SideLink key={item.href} item={item} active={isActive(pathname, item)} t={t} />
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {user.isSuperuser && (
            <Link
              href="/root"
              className="mb-2 flex items-center gap-2 rounded-[--radius-md] border border-dashed border-border px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              <NavIcon name="buildings" className="size-5" />
              {t("shell.serverAdmin")}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mb-2 flex w-full items-center gap-2 rounded-[--radius-md] border border-border px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
            <span className="flex-1 text-left">{t("shell.search")}</span>
            <kbd className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[0.6875rem] font-medium">
              <CommandIcon className="size-3" aria-hidden="true" />K
            </kbd>
          </button>

          <Link
            href="/account"
            className="flex items-center gap-2.5 rounded-[--radius-md] p-2 transition-colors hover:bg-surface-muted"
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
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 pt-safe backdrop-blur-md lg:hidden print:hidden">
        <Link href={items[0]!.href} className="flex min-w-0 items-center gap-2">
          <Logo size={26} />
          <span className="truncate text-sm font-bold text-fg">{user.schoolName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label={t("shell.search")}
            className="tap grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted"
          >
            <MagnifyingGlassIcon className="size-5" aria-hidden="true" />
          </button>
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
              <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-bold text-white">
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
      <div className="lg:pl-64 print:pl-0">
        <main
          id="main"
          className="mx-auto max-w-5xl px-4 pb-32 pt-4 sm:px-6 lg:pb-12 lg:pt-8 print:p-0"
        >
          {children}
        </main>
      </div>

      {/* ---------- floating action button ---------- */}
      {action && (
        <Link
          href={action.href}
          className={cn(
            "fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] right-4 z-40",
            "flex h-14 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-accent-fg shadow-lg",
            "transition-transform duration-[--dur-fast] active:scale-95",
            "lg:bottom-8 lg:right-8 print:hidden",
          )}
        >
          <NavIcon name={action.icon} className="size-5" weight="bold" />
          <span className="hidden sm:inline">{t(action.labelKey)}</span>
          <span className="sr-only sm:hidden">{t(action.labelKey)}</span>
        </Link>
      )}

      {/* ---------- mobile bottom bar ---------- */}
      <nav
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
                    "transition-colors duration-[--dur-fast]",
                    active ? "text-accent-strong" : "text-fg-muted",
                  )}
                >
                  <NavIcon
                    name={item.icon}
                    className="size-6"
                    weight={active ? "fill" : "regular"}
                  />
                  <span className="text-[0.6875rem] font-medium leading-none">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        role={user.role}
        contextCount={user.contextCount}
        isSuperuser={user.isSuperuser}
      />
    </div>
  );
}

function SideLink({ item, active, t }: { item: NavItem; active: boolean; t: Translate }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[--radius-md] px-3 py-2.5 text-sm font-medium",
        "transition-colors duration-[--dur-fast]",
        active
          ? "bg-accent-soft text-accent-strong"
          : "text-fg-muted hover:bg-surface-muted hover:text-fg",
      )}
    >
      <NavIcon name={item.icon} className="size-5" weight={active ? "fill" : "regular"} />
      {t(item.labelKey)}
    </Link>
  );
}

export function SignOutButton() {
  const t = useT();
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-[--radius-md] px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <SignOutIcon className="size-5" aria-hidden="true" />
        {t("shell.signOut")}
      </button>
    </form>
  );
}
