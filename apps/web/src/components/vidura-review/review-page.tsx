import Link from "next/link";
import { TranslateIcon } from "@phosphor-icons/react/ssr";
import type { ViduraRenderingStatus } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { listRenderings } from "@/lib/assistant/renderings";
import { EmptyState } from "@/components/ui/states";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { ViduraOpsNav } from "@/components/vidura-ops/ops-nav";
import { RenderingCard } from "./review-card";

/**
 * VIDURA'S GUIDE IN HINDI AND MARATHI, FOR A SPEAKER (docs/plans/vidura.md, pass 2, 17 Oct 2026): the operator's
 * /root/vidura-review (approve, correct, reject) and the content team's /appadmin/vidura-review (read only), one page.
 * The practice bank's own Hindi and Marathi are read on their desk, /appadmin/translations, linked rather than repeated.
 */
export async function ViduraReviewPage({ session, base, searchParams }: { session: ActiveContext; base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const t = await getT();
  const language = one(sp.language) === "mr" ? "mr" : "hi";
  const statusRaw = one(sp.status);
  const status: ViduraRenderingStatus = statusRaw === "APPROVED" || statusRaw === "REJECTED" ? statusRaw : "UNREVIEWED";
  const kindRaw = one(sp.kind);
  const kind = kindRaw === "HEADING" || kindRaw === "PARAGRAPH" ? kindRaw : undefined;
  const list = await listRenderings(session, { language, status, kind, page: Number(one(sp.page) ?? 1) || 1 });
  const counts = list.counts[language];
  const total = list.counts.hi.unreviewed + list.counts.hi.approved + list.counts.hi.rejected + list.counts.mr.unreviewed + list.counts.mr.approved + list.counts.mr.rejected;
  const href = (page: number) => {
    const q = new URLSearchParams({ language, status, ...(kind ? { kind } : {}) });
    if (page > 1) q.set("page", String(page));
    return `${base}?${q.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("viduraReview.title")} description={list.mayReview ? t("viduraReview.intro") : t("viduraReview.introReadOnly")} />
      {/* F-12 (18 Oct 2026): the operator's copy carries the strip of Vidura's desks the other operator pages share; the app admin's does not (those desks are the operator's). */}
      {base === "/root/vidura-review" ? <ViduraOpsNav current="/root/vidura-review" t={t} /> : null}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted">
          <span>{t("viduraReview.quizDesk")}</span>
          <Button asChild size="sm" variant="secondary">
            <Link href="/appadmin/translations">{t("viduraReview.quizDeskLink")}</Link>
          </Button>
        </CardBody>
      </Card>
      <DataToolbar
        facets={[
          { key: "language", label: t("viduraReview.languageFacet"), value: language, defaultValue: "hi", options: [{ value: "hi", label: t("gigs.hindi"), count: list.counts.hi.unreviewed }, { value: "mr", label: t("gigs.marathi"), count: list.counts.mr.unreviewed }] },
          {
            key: "status",
            label: t("viduraReview.statusFacet"),
            value: status,
            defaultValue: "UNREVIEWED",
            options: [
              { value: "UNREVIEWED", label: t("viduraReview.statusUnreviewed"), count: counts.unreviewed },
              { value: "APPROVED", label: t("viduraReview.statusApproved"), count: counts.approved },
              { value: "REJECTED", label: t("viduraReview.statusRejected"), count: counts.rejected },
            ],
          },
          { key: "kind", label: t("viduraReview.kindFacet"), value: kind ?? "", options: [{ value: "HEADING", label: t("viduraReview.kindHeading") }, { value: "PARAGRAPH", label: t("viduraReview.kindParagraph") }] },
        ]}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />
      {list.items.length === 0 ? (
        <EmptyState icon={<TranslateIcon weight="duotone" className="size-8" />} title={t("viduraReview.empty")} description={total === 0 ? t("viduraReview.notRendered") : t("viduraReview.emptyBody")} />
      ) : (
        <ul className="space-y-3" data-testid="vidura-renderings">
          {list.items.map((item) => (
            <RenderingCard key={`${item.id}:${item.updatedAt}`} item={item} mayReview={list.mayReview} />
          ))}
        </ul>
      )}
      {list.pages > 1 ? (
        <nav className="flex items-center justify-between gap-3 text-sm text-fg-muted" aria-label={t("viduraReview.pagination")}>
          <Button asChild variant="secondary" size="sm" disabled={list.page <= 1}>
            <Link href={href(list.page - 1)} aria-disabled={list.page <= 1}>{t("viduraReview.previous")}</Link>
          </Button>
          <span>{t("viduraReview.pageOf", { page: list.page, pages: list.pages })}</span>
          <Button asChild variant="secondary" size="sm" disabled={list.page >= list.pages}>
            <Link href={href(list.page + 1)} aria-disabled={list.page >= list.pages}>{t("viduraReview.next")}</Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
