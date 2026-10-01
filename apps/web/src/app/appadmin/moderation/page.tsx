import Link from "next/link";
import { ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { listPlatformModeration, type ModerationStatus } from "@/lib/bulletin";
import { EmptyState } from "@/components/ui/states";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { ModerationCard } from "./moderation-card";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("moderation.title") };
}

/**
 * The global feed from above every school: what is live, what the platform
 * has taken down and what it restored, newest first with the school named.
 * The take-down is for everyone at once; a school's own hide of a global post
 * (bulletin, "hide here") stays the school's. Held comments are not here: a
 * held comment is the queue of the school that holds it.
 */
export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const t = await getT();
  const session = await requireAppAdmin();
  const status: ModerationStatus = sp.status === "takenDown" || sp.status === "restored" ? sp.status : "live";
  const list = await listPlatformModeration(session, { status, page: Number(sp.page ?? 1) || 1 });
  const href = (page: number) => `/appadmin/moderation?status=${status}${page > 1 ? `&page=${page}` : ""}`;

  return (
    <div className="space-y-5">
      <PageHeader title={t("moderation.title")} description={t("moderation.intro")} />
      <DataToolbar
        facets={[
          {
            key: "status",
            label: t("enquiries.statusFilter"),
            value: status,
            options: [
              { value: "live", label: t("moderation.statusLive"), count: list.counts.live },
              { value: "takenDown", label: t("moderation.statusTakenDown"), count: list.counts.takenDown },
              { value: "restored", label: t("moderation.statusRestored"), count: list.counts.restored },
            ],
          },
        ]}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />
      {list.items.length === 0 ? (
        <EmptyState icon={<ShieldCheckIcon weight="duotone" className="size-8" />} title={t("moderation.empty")} description={t("moderation.emptyBody")} />
      ) : (
        <ul className="space-y-3">
          {list.items.map((item) => (
            <ModerationCard
              key={`${item.postId}:${item.status}`}
              item={{ ...item, createdAt: item.createdAt.toISOString(), takedown: item.takedown ? { ...item.takedown, at: item.takedown.at.toISOString(), restoredAt: item.takedown.restoredAt?.toISOString() ?? null } : null }}
            />
          ))}
        </ul>
      )}
      {list.pages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm text-fg-muted" aria-label={t("translationReview.pagination")}>
          <Button asChild variant="secondary" size="sm" disabled={list.page <= 1}>
            <Link href={href(list.page - 1)} aria-disabled={list.page <= 1}>{t("translationReview.previous")}</Link>
          </Button>
          <span>{t("moderation.pageOf", { page: list.page, pages: list.pages })}</span>
          <Button asChild variant="secondary" size="sm" disabled={list.page >= list.pages}>
            <Link href={href(list.page + 1)} aria-disabled={list.page >= list.pages}>{t("translationReview.next")}</Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
