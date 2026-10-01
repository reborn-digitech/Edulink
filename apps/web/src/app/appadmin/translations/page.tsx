import Link from "next/link";
import { TranslateIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { listTranslationReview, REVIEW_PAGE, type ReviewLanguage, type ReviewStatus } from "@/lib/translation-review";
import { EmptyState } from "@/components/ui/states";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { ReviewCard } from "./review-card";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("translationReview.title") };
}

/**
 * Native review of the bank's Hindi and Marathi: every question whose
 * translation in the chosen language is a draft nobody has read, read, or
 * missing. A card shows the English beside the translation, lets the reader
 * correct it, and stamps it read. Reviewed is a content-quality flag; the
 * practice engine serves a draft regardless (decision 0002, gap 8).
 */
export default async function TranslationsPage({ searchParams }: { searchParams: Promise<{ language?: string; status?: string; page?: string }> }) {
  const sp = await searchParams;
  const t = await getT();
  const session = await requireAppAdmin();
  const language: ReviewLanguage = sp.language === "mr" ? "mr" : "hi";
  const status: ReviewStatus = sp.status === "reviewed" || sp.status === "missing" ? sp.status : "unreviewed";
  const list = await listTranslationReview(session, { language, status, page: Number(sp.page ?? 1) || 1 });
  const href = (over: Partial<{ language: string; status: string; page: number }>) => {
    const q = new URLSearchParams({ language, status, ...(over.language ? { language: over.language } : {}), ...(over.status ? { status: over.status } : {}) });
    if (over.page && over.page > 1) q.set("page", String(over.page));
    return `/appadmin/translations?${q.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("translationReview.title")} description={t("translationReview.intro")} />
      <DataToolbar
        facets={[
          {
            key: "language",
            label: t("translationReview.languageFacet"),
            value: language,
            options: [
              { value: "hi", label: t("gigs.hindi") },
              { value: "mr", label: t("gigs.marathi") },
            ],
          },
          {
            key: "status",
            label: t("translationReview.statusFacet"),
            value: status,
            options: [
              { value: "unreviewed", label: t("translationReview.statusUnreviewed"), count: list.counts.unreviewed },
              { value: "reviewed", label: t("translationReview.statusReviewed"), count: list.counts.reviewed },
              { value: "missing", label: t("translationReview.statusMissing"), count: list.counts.missing },
            ],
          },
        ]}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />
      {list.items.length === 0 ? (
        <EmptyState icon={<TranslateIcon weight="duotone" className="size-8" />} title={t("translationReview.empty")} description={status === "missing" ? t("translationReview.emptyMissingBody") : t("translationReview.emptyBody")} />
      ) : (
        <ul className="space-y-3">
          {list.items.map((item) => (
            <ReviewCard key={`${item.id}:${language}:${item.reviewedAt?.toISOString() ?? ""}`} item={{ ...item, reviewedAt: item.reviewedAt?.toISOString() ?? null }} language={language} />
          ))}
        </ul>
      )}
      {list.pages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm text-fg-muted" aria-label={t("translationReview.pagination")}>
          <Button asChild variant="secondary" size="sm" disabled={list.page <= 1}>
            <Link href={href({ page: list.page - 1 })} aria-disabled={list.page <= 1}>{t("translationReview.previous")}</Link>
          </Button>
          <span>{t("translationReview.pageOf", { page: list.page, pages: list.pages, size: REVIEW_PAGE })}</span>
          <Button asChild variant="secondary" size="sm" disabled={list.page >= list.pages}>
            <Link href={href({ page: list.page + 1 })} aria-disabled={list.page >= list.pages}>{t("translationReview.next")}</Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
