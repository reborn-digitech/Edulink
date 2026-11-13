"use client";

import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { useState, useTransition } from "react";
import {
  BellIcon,
  ReceiptIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  EnvelopeSimpleIcon,
  MegaphoneIcon,
  TrophyIcon,
  BriefcaseIcon,
  FirstAidKitIcon,
  DoorOpenIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { markNotificationRead } from "./actions";
import { useT } from "@/lib/i18n";
import type { NotificationKind } from "@/lib/constants";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  when: string;
  /** The same notice, sent again and again: shown once with its count, the newest on top. */
  count?: number;
  /** Every row folded into this one, the newest first; opening it reads them all. */
  ids?: string[];
};

/** Rows shown before "Show more": a parent once had 16,000 px of notices on a phone. */
const PAGE = 30;

const ICONS: Record<NotificationKind, React.ComponentType<{ className?: string; weight?: "duotone" }>> = {
  EXPERT: BriefcaseIcon,
  ATTENDANCE: CalendarCheckIcon,
  GRADE: ChartLineUpIcon,
  ASSIGNMENT: ClipboardTextIcon,
  REMARK: ChatCircleDotsIcon,
  POST: MegaphoneIcon,
  INVITE: EnvelopeSimpleIcon,
  COMPETITION: TrophyIcon,
  ENQUIRY: ChatCircleDotsIcon,
  FEES: ReceiptIcon,
  INCIDENT: FirstAidKitIcon,
  ADMISSION: DoorOpenIcon,
  SYSTEM: BellIcon,
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const t = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useState(PAGE);

  function open(item: NotificationItem) {
    // Reading is a side effect of opening, not a separate chore. Fires
    // optimistically — a failed read receipt must never block navigation.
    if (!item.read) {
      startTransition(async () => {
        for (const id of item.ids ?? [item.id]) await markNotificationRead(id);
      });
    }
    if (item.url) router.push(item.url);
  }

  return (
    <>
    <ul className="divide-y divide-border">
      {items.slice(0, shown).map((item) => {
        const Icon = ICONS[item.kind] ?? BellIcon;
        const Row = item.url ? "button" : "div";

        return (
          <li key={item.id} className={cn(!item.read && "bg-accent-soft/40")}>
            <Row
              {...(item.url
                ? { type: "button" as const, onClick: () => open(item) }
                : {})}
              className={cn(
                "flex w-full items-start gap-3 p-4 text-left",
                item.url && "transition-colors hover:bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full",
                  item.read ? "bg-surface-muted text-fg-muted" : "bg-accent text-accent-fg",
                )}
              >
                <Icon className="size-5" weight="duotone" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "min-w-0 truncate",
                      item.read ? "font-medium text-fg" : "font-bold text-fg",
                    )}
                  >
                    {item.title}
                  </span>
                  {(item.count ?? 1) > 1 && (
                    <span className="shrink-0 rounded-full bg-surface-muted px-1.5 text-xs font-semibold text-fg-muted" title={t("notif.repeated", { count: item.count! })}>
                      ×{item.count}
                    </span>
                  )}
                  {!item.read && (
                    <span
                      className="size-2 shrink-0 rounded-full bg-accent"
                      aria-label={t("notif.tabUnread")}
                    />
                  )}
                </span>
                {item.body && (
                  <span className="mt-0.5 block text-sm leading-relaxed text-fg-muted">
                    {item.body}
                  </span>
                )}
                <span className="mt-0.5 block text-xs text-fg-subtle">{item.when}</span>
              </span>
            </Row>
          </li>
        );
      })}
    </ul>
    {items.length > shown && (
      <div className="border-t border-border p-3 text-center">
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="tap rounded-[var(--radius-md)] px-4 text-sm font-medium text-accent-strong hover:bg-surface-muted">
          {t("common.showMore", { count: items.length - shown })}
        </button>
      </div>
    )}
    </>
  );
}

/** Used by the shell's bell when there is nowhere to navigate. */
export function NotificationBellLink({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="tap relative grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted"
    >
      <BellIcon className="size-5" />
      {unread > 0 && (
        <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-bold text-danger-fg">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
