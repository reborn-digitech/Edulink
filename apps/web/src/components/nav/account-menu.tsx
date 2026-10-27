"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import { ACCOUNT_HREF, isActive, type NavItem } from "@/lib/nav";
import { NavIcon } from "./icons";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { Translate } from "@/lib/i18n";

/**
 * THE ACCOUNT MENU (the owner's decision of 27 October 2026, item 3): the avatar opens the person's own pages — their
 * account first, then my letters, my payslips, my items, my profile, whichever the role has and the school has on —
 * which used to sit in the rail among the school's work. A person with no page of their own beyond the account keeps
 * the plain link to it, as before.
 *
 * A disclosure, not an ARIA menu: a button with aria-expanded and aria-controls and a list of links, so a screen
 * reader and the Tab key walk it like the rest of the page. Escape closes it and returns to the button; so does a
 * press outside it or following one of its links.
 *
 * `place` is the rail's foot on a desk (the name beside the avatar, the list opening above it) or the top bar at a
 * phone's width (the avatar alone, the list dropping below it).
 */
export function AccountMenu({
  place,
  name,
  avatarKey,
  switchHint,
  items,
  t,
}: {
  place: "rail" | "bar";
  name: string;
  avatarKey: string | null;
  /** "Switch role" under the name in the rail, for a person with more than one place. */
  switchHint: boolean;
  /** The person's own pages, the account page excepted (personalItems). */
  items: NavItem[];
  t: Translate;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // A link followed from inside the list lands on a page with the list shut.
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) {
    return place === "rail" ? (
      <Link href={ACCOUNT_HREF} className="flex items-center gap-2.5 rounded-[var(--radius-md)] p-2 transition-colors hover:bg-surface-muted">
        <Avatar avatarKey={avatarKey} name={name} size="sm" />
        <RailName name={name} switchHint={switchHint} t={t} />
      </Link>
    ) : (
      <Link href={ACCOUNT_HREF} aria-label={t("shell.yourAccount")} className="tap grid place-items-center">
        <Avatar avatarKey={avatarKey} name={name} size="sm" />
      </Link>
    );
  }

  const list = (
    <ul id={panelId} hidden={!open} aria-label={t("shell.yourAccount")} data-testid={`account-menu-${place}`} className={cn(
      "space-y-0.5 rounded-[var(--radius-md)] border border-border bg-surface p-1 shadow-lg",
      place === "rail" ? "absolute inset-x-0 bottom-full mb-1" : "absolute right-0 top-full z-50 mt-1 w-64",
    )}>
      <li>
        <MenuLink href={ACCOUNT_HREF} icon="gear" label={t("shell.yourAccount")} active={pathname === ACCOUNT_HREF} onFollow={() => setOpen(false)} />
      </li>
      {items.map((item) => (
        <li key={item.href}>
          <MenuLink href={item.href} icon={item.icon} label={t(item.labelKey)} active={isActive(pathname, item)} onFollow={() => setOpen(false)} />
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} className="relative">
      {list}
      {place === "rail" ? (
        <button
          ref={button}
          type="button"
          data-testid="account-menu-button-rail"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((o) => !o);
          }}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] p-2 text-left transition-colors hover:bg-surface-muted"
        >
          <Avatar avatarKey={avatarKey} name={name} size="sm" />
          <RailName name={name} switchHint={switchHint} t={t} />
          <CaretUpDownIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        </button>
      ) : (
        <button
          ref={button}
          type="button"
          data-testid="account-menu-button-bar"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t("shell.yourAccount")}
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((o) => !o);
          }}
          className="tap grid place-items-center rounded-full"
        >
          <Avatar avatarKey={avatarKey} name={name} size="sm" />
        </button>
      )}
    </div>
  );
}

function RailName({ name, switchHint, t }: { name: string; switchHint: boolean; t: Translate }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-fg">{name}</span>
      {switchHint && <span className="block text-xs text-accent-strong">{t("shell.switchRole")}</span>}
    </span>
  );
}

function MenuLink({ href, icon, label, active, onFollow }: { href: string; icon: string; label: string; active: boolean; onFollow: () => void }) {
  return (
    <Link
      href={href}
      onClick={onFollow}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-md)] px-3 text-sm font-medium",
        active ? "bg-accent-soft text-accent-strong" : "text-fg hover:bg-surface-muted",
      )}
    >
      <NavIcon name={icon} className="size-5" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}
