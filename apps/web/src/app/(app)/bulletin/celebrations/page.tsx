import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CakeIcon, ConfettiIcon, PencilSimpleLineIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { celebrationsFor } from "@/lib/birthdays";
import { formatDateKey } from "@/lib/dates";
import { ROLE_META, type Role } from "@/lib/constants";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PersonLink } from "@/components/person-link";
import { EmptyState } from "@/components/ui/states";
import { getT, getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("celebrations.title") };
}

// Not exported: a page module may only export what the App Router names, and
// the production type check refuses anything else. Nobody imported it anyway.
const CELEBRATIONS_TAG = "celebrations";

/**
 * Upcoming birthdays and work anniversaries, on Social Media where the wishes
 * get posted. Every row has one door: "Post a wish", which opens the composer
 * with the title written, the #celebrations tag on, and People & Spotlights
 * chosen — so a wish is an ordinary post that the Birthdays & Anniversaries
 * chip on the feed collects. Who appears is decided in birthdays.ts.
 */
export default async function CelebrationsPage() {
  const session = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  // The month, and — when it is empty — the next half-year, labelled as
  // such, so the page never says "nothing" while a birthday sits 33 days out.
  let items = await celebrationsFor(session, 30);
  let later = false;
  if (items.length === 0) {
    items = await celebrationsFor(session, 183);
    later = items.length > 0;
  }
  const multiSchool = new Set(items.map((i) => i.schoolName)).size > 1;

  // Grouped by day, so three birthdays on Friday read as one Friday.
  const byDay = new Map<string, typeof items>();
  for (const item of items) {
    const list = byDay.get(item.dateKey) ?? [];
    list.push(item);
    byDay.set(item.dateKey, list);
  }

  const wishHref = (item: (typeof items)[number]) => {
    const title =
      item.kind === "BIRTHDAY"
        ? t("celebrations.wishBirthday", { name: item.name })
        : t("celebrations.wishAnniversary", { name: item.name, years: item.years ?? 1 });
    const params = new URLSearchParams({ title, tag: CELEBRATIONS_TAG, category: "PEOPLE" });
    return `/bulletin/new?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <Link href="/bulletin" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("bulletin.title")}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("celebrations.title")} description={t("celebrations.intro")} />
        <Link
          href={`/bulletin?tag=${CELEBRATIONS_TAG}`}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-muted px-3.5 text-sm font-medium text-fg hover:bg-border"
        >
          <ConfettiIcon weight="bold" className="size-4" />
          {t("celebrations.seeWishes")}
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<CakeIcon weight="duotone" className="size-8" />}
          title={t("celebrations.noneTitle")}
          description={t("celebrations.noneBody")}
        />
      ) : (
        <div className="space-y-3">
          {later && (
            <p className="rounded-[--radius-md] bg-accent-soft p-3.5 text-sm text-fg-muted">{t("celebrations.laterNote")}</p>
          )}
          {[...byDay.entries()].map(([dateKey, list]) => (
            <Card key={dateKey}>
              <CardBody className="p-0">
                <p className="border-b border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  {formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)}
                </p>
                <ul className="divide-y divide-border">
                  {list.map((item) => (
                    <li
                      key={`${item.kind}:${item.membershipId}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
                          {item.kind === "BIRTHDAY" ? (
                            <CakeIcon weight="duotone" className="size-5" />
                          ) : (
                            <ConfettiIcon weight="duotone" className="size-5" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <PersonLink membershipId={item.membershipId} name={item.name} className="block truncate font-medium text-fg" />
                          <span className="block truncate text-xs text-fg-muted">
                            {item.kind === "BIRTHDAY"
                              ? t("celebrations.birthday")
                              : item.years === 1
                                ? t("celebrations.anniversaryOne")
                                : t("celebrations.anniversaryMany", { years: item.years ?? 0 })}
                            {" · "}
                            {t(ROLE_META[item.role as Role].labelKey)}
                            {multiSchool ? ` · ${item.schoolName}` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        {item.membershipId === session.membershipId ? (
                          <Badge tone="accent" size="sm">{t("celebrations.you")}</Badge>
                        ) : (
                          <Link
                            href={wishHref(item)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-accent-fg hover:opacity-90"
                          >
                            <PencilSimpleLineIcon weight="bold" className="size-3.5" />
                            {t("celebrations.postWish")}
                          </Link>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
