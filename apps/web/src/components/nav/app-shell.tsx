"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatsCircleIcon, CommandIcon, DotsThreeOutlineIcon, MagnifyingGlassIcon, SignOutIcon } from "@phosphor-icons/react";
import { OutboxBadge } from "./outbox-badge";
import { ASSISTANT_HREF, NAV, NAV_GROUP_KEY, PHONE_BAR, PRIMARY_ACTION, isActive, personalItems, railFor, sheetFor, type NavItem } from "@/lib/nav";
import { NavIcon } from "./icons";
import { NavGroupSection, useRememberedGroups } from "./nav-groups";
import { AccountMenu } from "./account-menu";
import { CommandPalette } from "./command-palette";
import { ViduraDrawer, useDesk } from "@/components/assistant/drawer";
import { ViduraExplainContext, type ExplainRequest } from "@/components/assistant/explain-this";
import { DRAWER_PARAM } from "@/components/assistant/model";
import { TypingSwitch } from "@/components/typing-switch";
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
  hiddenBar = [],
  badges = {},
  vidura = null,
}: {
  user: ShellUser;
  children: React.ReactNode;
  unreadCount?: number;
  /**
   * VIDURA'S ROUND BUTTON (docs/plans/vidura.md; pass 1, 17 Oct 2026): "open" where this person may use it
   * (platform-features.ts `mayUse`: the operator's switch, the school's module, the plan where the role needs one),
   * "plan" where the switch and the module are on but the person lacks the plan (the button then opens the plan card),
   * null where it is not theirs at all (no button). Decided by signed-in-shell.tsx.
   */
  vidura?: "open" | "plan" | null;
  /** Counts worn by nav entries, keyed by href — unread messages on /remarks. */
  badges?: Record<string, number>;
  /** Nav entries that exist for the role but not for this person right now —
   * e.g. Feedback, which appears only while a review round is open. */
  hiddenHrefs?: string[];
  /** The phone-width bar's tabs (PHONE_BAR) not for this person right now, by href (signed-in-shell.tsx). */
  hiddenBar?: string[];
}) {
  const pathname = usePathname();
  const t = useT();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  /**
   * VIDURA (pass 1, 17 Oct 2026): ONE ENTRY POINT, the round button at the bottom right of every page (the rail's
   * button, the phone-width top bar's launcher, the menu entry and the /assistant page are gone). It opens the drawer:
   * docked beside the page on a desk, which stays open as the person moves through the pages, and a bottom sheet on a
   * phone, which a link followed from inside it closes. The drawer is told the page it is beside (page awareness).
   * `?vidura=open` (or `?vidura=<conversationId>`) in the address opens it: where the old /assistant pages now send.
   */
  const desk = useDesk();
  const viduraButton = useRef<HTMLButtonElement>(null);
  const [viduraOpen, setViduraOpen] = useState(false);
  const [viduraConversation, setViduraConversation] = useState<string | null>(null);
  // "Explain this to me" (pass 2): a link on the page asks Vidura about one of its rows, in a new conversation.
  const [explainRequest, setExplainRequest] = useState<(ExplainRequest & { n: number }) | null>(null);
  const closeVidura = useCallback(() => {
    setViduraOpen(false);
    setViduraConversation(null);
    setExplainRequest(null);
  }, []);
  const explain = useCallback((request: ExplainRequest) => {
    setViduraConversation(null);
    setExplainRequest((prior) => ({ ...request, n: (prior?.n ?? 0) + 1 }));
    setViduraOpen(true);
  }, []);
  const [viduraPath, setViduraPath] = useState(pathname);
  if (viduraPath !== pathname) {
    setViduraPath(pathname);
    // A phone's sheet covers the page: a link followed from inside it lands on a page with the sheet shut.
    if (viduraOpen && !desk) closeVidura();
  }
  useEffect(() => {
    if (vidura !== "open") return;
    const params = new URLSearchParams(window.location.search);
    const asked = params.get(DRAWER_PARAM);
    if (!asked) return;
    params.delete(DRAWER_PARAM);
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
    // Opened from the address once the page is drawn (a timer, not the effect's body: the address is outside React).
    const timer = window.setTimeout(() => {
      setViduraConversation(asked === "open" ? null : asked);
      setViduraOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, vidura]);
  const items = NAV[user.role].filter((item) => !hiddenHrefs.includes(item.href));
  /* FIVE PRIMARIES carry the day; the rail and the phone's More sheet read the
   * remainder under group headings so a parent looking for Meetings is not
   * scanning Competitions to find it — the office's and the head's in seven
   * groups that open and close (27 Oct 2026, item 3; lib/nav.ts navGroupsFor).
   * The person's own pages are the account menu's, not the rail's. */
  const { primary: primaryItems, groups: secondary } = railFor(user.role, items);
  const mine = personalItems(items);
  const [remembered, remember] = useRememberedGroups(user.role);
  /*
   * AT A PHONE'S WIDTH, THE PHONE APP'S BAR (QA-65): its tabs in its order, then More, whose sheet holds every entry
   * not on the bar (a primary that is not a tab under "Day to day"). The desk's rail above keeps the primaries.
   */
  const barItems = PHONE_BAR[user.role].filter((item) => !hiddenBar.includes(item.href));
  const onBar = (item: NavItem) => barItems.some((b) => b.href === item.href);
  const sheet = sheetFor(user.role, items, onBar);
  const moreActive = !barItems.some((item) => isActive(pathname, item));
  // Only on the pages it belongs to (QuickAction.on), and never on the page it opens.
  const primary = PRIMARY_ACTION[user.role];
  // …and not while its page is hidden (an expert's "Offer time" while expert sessions are off, 15 Oct 2026).
  const action = primary && !hiddenHrefs.includes(primary.href) && primary.on?.includes(pathname) && primary.href !== pathname ? primary : null;
  // Not on the old /assistant page itself, where a person without the plan reads the plan card.
  const viduraShown = (vidura === "open" || vidura === "plan") && !pathname.startsWith(ASSISTANT_HREF);

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
      <aside data-chrome aria-label={t("shell.mainNav")} className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex print:hidden">
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
            <NavGroupSection
              key={group}
              id={`rail-group-${group}`}
              label={t(NAV_GROUP_KEY[group])}
              group={group}
              remembered={remembered}
              holdsPage={list.some((item) => isActive(pathname, item))}
              onToggle={remember}
              size="rail"
            >
              <div className="space-y-0.5">
                {list.map((item) => (
                  <SideLink key={item.href} item={item} active={isActive(pathname, item)} t={t} badge={badges[item.href] ?? 0} />
                ))}
              </div>
            </NavGroupSection>
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

          {/* The person's own pages (my letters, payslips, items, profile) open from the avatar, not the rail (item 3). */}
          <AccountMenu place="rail" name={user.name} avatarKey={user.avatarKey} switchHint={user.contextCount > 1} items={mine} t={t} />
        </div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header data-chrome className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 pt-safe backdrop-blur-md lg:hidden print:hidden">
        <Link href={items[0]!.href} className="flex min-h-11 min-w-11 items-center gap-2">
          <Logo size={26} />
          <span className="flex min-w-0 flex-col">
            {/* Below 400 px the three round buttons leave the name one letter (10 Oct 2026); the rail and the home card carry it, so here it is for the screen reader only. */}
            <span className="truncate text-sm font-bold text-fg max-[399px]:sr-only">{user.schoolName}</span>
            {user.streams?.length ? <StreamChip streams={user.streams} t={t} /> : null}
          </span>
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
          <AccountMenu place="bar" name={user.name} avatarKey={user.avatarKey} switchHint={false} items={mine} t={t} />
        </div>
      </header>

      {/* ---------- content ---------- */}
      {/* The docked drawer takes the right of a desk's window: the page makes room for it and stays usable beside it. */}
      <div data-wash className={cn("lg:pl-64 print:pl-0", viduraOpen && "lg:pr-[26rem]")}>
        <main
          id="main"
          // Room under the last row for the bottom bar, and for the floating buttons where they are drawn: the action's
          // top edge is 8.75 rem up, Vidura's 8.75 rem alone or 12.75 rem above the action; on a desk Vidura's is 5 rem.
          className={cn(
            "mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:pt-8 print:p-0",
            viduraShown ? (action ? "pb-56" : "pb-40") : action ? "pb-44" : "pb-24",
            viduraShown ? "lg:pb-24" : "lg:pb-12",
          )}
        >
          {/* The page's "Explain this to me" links reach the drawer through this, only where Vidura is the person's. */}
          <ViduraExplainContext.Provider value={viduraShown && vidura === "open" ? explain : null}>{children}</ViduraExplainContext.Provider>
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
          {barItems.map((item) => {
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
          {sheet.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-expanded={moreOpen}
                className={cn(
                  "flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5",
                  "transition-colors duration-[var(--dur-fast)]",
                  moreActive ? "text-accent-strong" : "text-fg-muted",
                )}
              >
                <DotsThreeOutlineIcon className="size-6" weight={moreActive ? "fill" : "regular"} aria-hidden="true" />
                <span className="text-[0.6875rem] font-medium leading-none">{t("nav.more")}</span>
              </button>
            </li>
          )}
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
            {sheet.map(({ group, items: list }) => (
              <NavGroupSection
                key={group}
                id={`sheet-group-${group}`}
                label={t(NAV_GROUP_KEY[group])}
                group={group}
                remembered={remembered}
                holdsPage={list.some((item) => isActive(pathname, item))}
                onToggle={remember}
                size="sheet"
              >
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
              </NavGroupSection>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Vidura: the round button and its drawer ---------- */}
      {viduraShown && vidura === "plan" ? (
        // The plan is missing: the button opens the plan card (the old page's layout draws it), from this page.
        <Link
          href={`${ASSISTANT_HREF}?from=${encodeURIComponent(pathname)}`}
          aria-label={t("viduraUi.planButton")}
          data-testid="vidura-button"
          data-access="plan"
          className={viduraButtonClass(!!action)}
        >
          <ChatsCircleIcon weight="fill" className="size-7" aria-hidden="true" />
        </Link>
      ) : null}
      {viduraShown && vidura === "open" ? (
        <>
          <button
            ref={viduraButton}
            type="button"
            onClick={() => (viduraOpen ? closeVidura() : setViduraOpen(true))}
            aria-label={t("assistantUi.open")}
            aria-haspopup="dialog"
            aria-expanded={viduraOpen}
            data-testid="vidura-button"
            data-access="open"
            className={viduraButtonClass(!!action)}
          >
            <ChatsCircleIcon weight="fill" className="size-7" aria-hidden="true" />
          </button>
          <ViduraDrawer open={viduraOpen} onClose={closeVidura} role={user.role} page={pathname} initialConversationId={viduraConversation} explain={explainRequest} />
        </>
      ) : null}

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

/** The round button: bottom right, above the bottom bar and the action's button on a phone, in the corner on a desk. */
function viduraButtonClass(withAction: boolean): string {
  return cn(
    "fixed right-4 z-40 grid size-14 place-items-center rounded-full border border-border bg-surface text-accent-strong shadow-lg",
    "transition-transform duration-[var(--dur-fast)] hover:brightness-105 active:scale-95 print:hidden",
    withAction ? "bottom-[calc(env(safe-area-inset-bottom,0px)+9.25rem)]" : "bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)]",
    "lg:bottom-6 lg:right-6",
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
