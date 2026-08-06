import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, GearIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { relativeTime } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { NotificationList } from "./list";
import { BulkActions } from "./bulk-actions";
import type { NotificationKind } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.notifications") };
}

const TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
] as const;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireUser();
  const { filter } = await searchParams;
  const showUnreadOnly = filter === "unread";

  const [rows, unreadCount, totalCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id, ...(showUnreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null } }),
    db.notification.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {unreadCount === 0
              ? totalCount === 0
                ? "Nothing yet"
                : "All caught up"
              : `${unreadCount} unread`}
          </p>
        </div>
        <Button asChild variant="secondary" size="sm" icon={<GearIcon weight="bold" />}>
          <Link href="/account">Settings</Link>
        </Button>
      </div>

      {totalCount > 0 && (
        <>
          <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label="Filter">
            {TABS.map((tab) => {
              const active = (tab.id === "unread") === showUnreadOnly;
              return (
                <Link
                  key={tab.id}
                  href={tab.id === "unread" ? "/notifications?filter=unread" : "/notifications"}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
                    active ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
                  }`}
                >
                  {tab.label}
                  {tab.id === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Link>
              );
            })}
          </nav>

          <BulkActions unreadCount={unreadCount} readCount={totalCount - unreadCount} />
        </>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<BellIcon weight="duotone" className="size-8" />}
          title={showUnreadOnly ? "Nothing unread" : "No notifications yet"}
          description={
            showUnreadOnly
              ? "You have read everything. Anything new will appear at the top."
              : "Attendance, new grades, teacher messages and school notices land here — and on your phone if you turn push on."
          }
          action={
            showUnreadOnly ? (
              <Button asChild variant="secondary">
                <Link href="/notifications">See all</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/account">Notification settings</Link>
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <NotificationList
            items={rows.map((row) => ({
              id: row.id,
              kind: row.kind as NotificationKind,
              title: row.title,
              body: row.body,
              url: row.url,
              read: row.readAt !== null,
              when: relativeTime(row.createdAt),
            }))}
          />
        </Card>
      )}
    </div>
  );
}
