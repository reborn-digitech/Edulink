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
import { effectiveThresholds } from "@/lib/notification-housekeeping";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.notifications") };
}

/* Keys, not words — resolved per render in the reader's language. */
const TABS = [
  { id: "all", labelKey: "notif.tabAll" },
  { id: "unread", labelKey: "notif.tabUnread" },
] as const;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const t = await getT();
  const session = await requireUser();
  const { filter } = await searchParams;
  const showUnreadOnly = filter === "unread";

  // The rule line quotes the reader's OWN school's numbers when it has set
  // its own; a parent or a school on the defaults reads the defaults.
  const thresholds = effectiveThresholds(
    session.schoolId
      ? await db.school.findUnique({ where: { id: session.schoolId }, select: { notifAutoReadDays: true, notifExpireDays: true } })
      : null,
  );

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
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("shell.notifications")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {unreadCount === 0
              ? totalCount === 0
                ? t("notif.nothingYet")
                : t("notif.allCaughtUp")
              : t("notif.unreadCount", { count: unreadCount })}
          </p>
        </div>
        <Button asChild variant="secondary" size="sm" icon={<GearIcon weight="bold" />}>
          <Link href="/account">{t("notif.settings")}</Link>
        </Button>
      </div>

      {totalCount > 0 && (
        <>
          <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label={t("bulletin.filter")}>
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
                  {t(tab.labelKey)}
                  {tab.id === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Link>
              );
            })}
          </nav>

          <BulkActions unreadCount={unreadCount} readCount={totalCount - unreadCount} />
          <p className="text-xs text-fg-subtle">
            {t("notif.housekeeping", { read: thresholds.autoReadDays, expire: thresholds.expireDays })}
          </p>
        </>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<BellIcon weight="duotone" className="size-8" />}
          title={showUnreadOnly ? t("notif.emptyUnreadTitle") : t("notif.emptyTitle")}
          description={showUnreadOnly ? t("notif.emptyUnreadBody") : t("notif.emptyBody")}
          action={
            showUnreadOnly ? (
              <Button asChild variant="secondary">
                <Link href="/notifications">{t("teacher.seeAll")}</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/account">{t("notif.notifSettings")}</Link>
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
