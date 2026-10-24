import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, GearIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { NotificationList, type NotificationItem } from "./list";
import { BulkActions } from "./bulk-actions";
import { NOTIFICATION_KINDS, NOTIFICATION_KIND_KEY, type NotificationKind } from "@/lib/constants";
import { getLocale, getT, getRelativeTime } from "@/lib/i18n/server";
import { localiseVars } from "@/lib/notice-dates";
import { effectiveThresholds } from "@/lib/notification-housekeeping";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { readJson } from "@/lib/json";

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
  searchParams: Promise<{ filter?: string; kind?: string }>;
}) {
  // The reader's language, not English under a Hindi or Marathi page (QA-20).
  const relativeTime = await getRelativeTime();
  const t = await getT();
  const locale = await getLocale();
  const session = await requireUser();
  const { filter, kind: rawKind } = await searchParams;
  const showUnreadOnly = filter === "unread";
  const kind = NOTIFICATION_KINDS.includes(rawKind as NotificationKind) ? (rawKind as NotificationKind) : null;

  // The rule line quotes the reader's OWN school's numbers when it has set
  // its own; a parent or a school on the defaults reads the defaults.
  const thresholds = effectiveThresholds(
    session.schoolId
      ? await db.school.findUnique({ where: { id: session.schoolId }, select: { notifAutoReadDays: true, notifExpireDays: true } })
      : null,
  );

  const [rows, unreadCount, totalCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id, ...(showUnreadOnly ? { readAt: null } : {}), ...(kind ? { kind } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null } }),
    db.notification.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("shell.notifications")} description={unreadCount === 0
              ? totalCount === 0
                ? t("notif.nothingYet")
                : t("notif.allCaughtUp")
              : t("notif.unreadCount", { count: unreadCount })} />
        <Button asChild variant="secondary" size="sm" icon={<GearIcon weight="bold" />}>
          <Link href="/account">{t("notif.settings")}</Link>
        </Button>
      </div>

      {totalCount > 0 && (
        <>
          <nav className="flex gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1" aria-label={t("bulletin.filter")}>
            {TABS.map((tab) => {
              const active = (tab.id === "unread") === showUnreadOnly;
              return (
                <Link
                  key={tab.id}
                  href={`${tab.id === "unread" ? "/notifications?filter=unread" : "/notifications"}${kind ? `${tab.id === "unread" ? "&" : "?"}kind=${kind}` : ""}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-center text-sm font-medium ${
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
          <DataToolbar
            className="w-full"
            facets={[
              {
                key: "kind",
                label: t("notif.kindFilter"),
                value: kind ?? "",
                as: "select",
                options: [
                  { value: "", label: t("notif.allKinds") },
                  ...NOTIFICATION_KINDS.map((k) => ({ value: k, label: t(NOTIFICATION_KIND_KEY[k]) })),
                ],
              },
            ]}
            extra={showUnreadOnly ? { filter: "unread" } : {}}
            labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
          />
          <p className="text-xs text-fg-subtle">
            {t("notif.housekeeping", { read: thresholds.autoReadDays, expire: thresholds.expireDays })}
          </p>
        </>
      )}

      {rows.length === 0 && kind ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : rows.length === 0 ? (
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
            items={fold(rows.map((row) => ({
              id: row.id,
              kind: row.kind as NotificationKind,
              // Said again in the reader's language of today when the key
              // was kept; the stored sentence otherwise.
              title: sayAgain(t, row.titleKey, row.titleVars, row.title, locale),
              body: sayAgain(t, row.bodyKey, row.bodyVars, row.body, locale),
              url: row.url,
              read: row.readAt !== null,
              when: relativeTime(row.createdAt),
            })))}
          />
        </Card>
      )}
    </div>
  );
}

/**
 * The same notice sent many times is one row with a count: a suggested
 * mentor was once 77 rows, a restored access 100. Rows fold when their
 * title, body and link are the same; the newest carries the rest, is unread
 * if any of them is, and opening it reads them all.
 */
function fold(items: NotificationItem[]): NotificationItem[] {
  const out: NotificationItem[] = [];
  const at = new Map<string, number>();
  for (const item of items) {
    const key = `${item.kind}\u0000${item.title}\u0000${item.body}\u0000${item.url ?? ""}`;
    const i = at.get(key);
    if (i === undefined) {
      at.set(key, out.length);
      out.push({ ...item, count: 1, ids: [item.id] });
    } else {
      const first = out[i]!;
      first.count = (first.count ?? 1) + 1;
      first.ids!.push(item.id);
      first.read = first.read && item.read;
    }
  }
  return out;
}

/**
 * A stored notification's sentence, re-rendered from its key when it has
 * one and the key is still in the dictionary; the sentence as written
 * otherwise. Never the bare key.
 */
function sayAgain(t: Translate, key: string | null, vars: string, fallback: string, locale?: string): string {
  if (!key) return fallback;
  // A date kept as a date (noticeDate, B-15) is said in the reader's language of today with the rest.
  const rendered = t(key as TranslationKey, localiseVars(readJson<Record<string, string | number>>(vars, {}), locale));
  return rendered && rendered !== key ? rendered : fallback;
}
