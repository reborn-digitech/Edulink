import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { getT, getLocale } from "@/lib/i18n/server";
import { loadSite, siteEnquiries } from "@/lib/site-admin";
import { formatInZone } from "@/lib/dates";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnquiryRead, PublishControls } from "./publish-controls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: [t("website.stepPublish"), t("website.title")].join(" · ") };
}

/**
 * Screen 5, Publish: the site's address — the school's own domain once it is live, and until then what that means
 * with the way to the sixth screen (16 Oct 2026: no platform subdomain) — Publish (every language at once; allowed
 * before any domain, the version is stored), Unpublish (the versions are kept), the office's own view of the
 * published version (/sites/<slug>, signed in); under them the enquiries the site's form has brought in.
 */
export default async function WebsitePublishPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const [view, enquiries, school] = await Promise.all([loadSite(ctx), siteEnquiries(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const when = (d: Date) => formatInZone(d, school.timezone, { dateStyle: "medium", timeStyle: "short" }, locale);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t("website.publishTitle")}
          description={view.published && view.publishedAt ? t("website.publishedSince", { when: when(view.publishedAt) }) : t("website.notPublished")}
          action={view.published ? <Badge tone="ok">{t("website.liveBadge")}</Badge> : <Badge>{t("website.draftBadge")}</Badge>}
        />
        <CardBody className="space-y-4">
          {view.address ? (
            <div data-testid="site-address">
              <p className="text-sm font-medium text-fg">{t("website.siteAddressLabel")}</p>
              <a className="inline-flex min-h-11 items-center break-all text-base font-semibold text-accent-strong underline" href={view.address} target="_blank" rel="noopener noreferrer">
                {view.address}
              </a>
              <p className="text-xs text-fg-muted">{t("website.siteAddressHint")}</p>
            </div>
          ) : (
            // A site lives only on the school's own domain (16 Oct 2026): until it is live, say where the site stands and
            // how to connect the domain. Publishing first is allowed; the version is stored and opens once the domain does.
            <div className="space-y-2" data-testid="site-awaiting-domain">
              <p className="text-sm text-fg">{t(view.published ? "website.publishedAwaitingDomain" : "website.publishBeforeDomain")}</p>
              <Button asChild variant="secondary">
                <Link href="/admin/website/domain">{t("website.connectDomain")}</Link>
              </Button>
            </div>
          )}
          {view.published ? (
            <a className="inline-flex min-h-11 items-center text-sm text-accent-strong underline" href={view.localPath} target="_blank" rel="noopener">
              {t("website.openHere")}
            </a>
          ) : null}
          <PublishControls published={view.published} warnings={view.warnings.length} />
          {view.address ? (
            <div className="border-t border-border pt-4">
              <p className="text-sm text-fg-muted">{t("website.domainNext")}</p>
              <Button asChild variant="secondary" className="mt-2">
                <Link href="/admin/website/domain">{t("website.domainLink")}</Link>
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader id="enquiries" title={t("website.enquiriesTitle")} description={t("website.enquiriesIntro")} />
        <CardBody>
          {enquiries.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("website.enquiriesNone")}</p>
          ) : (
            <ul className="space-y-3">
              {enquiries.map((q) => (
                <li key={q.id} className="space-y-1 rounded-[var(--radius-md)] border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-fg">
                      {q.name} · <span className="font-normal">{q.contact}</span>
                    </p>
                    {q.read ? <Badge>{t("website.enquiryRead")}</Badge> : <Badge tone="accent">{t("website.enquiryNew")}</Badge>}
                  </div>
                  <p className="text-xs text-fg-muted">
                    {when(q.createdAt)}
                    {q.grade ? ` · ${t("website.enquiryGrade", { grade: q.grade })}` : ""}
                  </p>
                  <p className="whitespace-pre-line text-sm text-fg">{q.message}</p>
                  <EnquiryRead id={q.id} read={q.read} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
