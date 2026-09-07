"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  BellIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  EnvelopeSimpleIcon,
  MegaphoneIcon,
  TrophyIcon,
  BriefcaseIcon,
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
};

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
  SYSTEM: BellIcon,
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const t = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function open(item: NotificationItem) {
    // Reading is a side effect of opening, not a separate chore. Fires
    // optimistically — a failed read receipt must never block navigation.
    if (!item.read) {
      startTransition(async () => {
        await markNotificationRead(item.id);
      });
    }
    if (item.url) router.push(item.url);
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
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
        <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
