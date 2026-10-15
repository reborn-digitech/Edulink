import type { Metadata } from "next";
import Link from "next/link";
import type { SiteLanguage, SiteWarning } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { loadSite, previewHtml } from "@/lib/site-admin";
import { languagesOf } from "@/lib/site-publish";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PreviewFrame } from "./preview-frame";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: [t("website.stepPreview"), t("website.title")].join(" · ") };
}

const WARNING_KEYS: Record<SiteWarning, TranslationKey> = {
  NO_LOGO: "website.warnNoLogo",
  NO_ABOUT: "website.warnNoAbout",
  EMPTY_NUMBERS: "website.warnEmptyNumbers",
  EMPTY_FACULTY: "website.warnEmptyFaculty",
  EMPTY_DISCLOSURE: "website.warnEmptyDisclosure",
  EMPTY_NEWS: "website.warnEmptyNews",
  EMPTY_GALLERY: "website.warnEmptyGallery",
  EMPTY_CONTACT: "website.warnEmptyContact",
  GALLERY_NO_CONSENT: "website.warnGalleryNoConsent",
};

/**
 * Screen 4, Preview: the draft drawn exactly as Publish would draw it, in a frame that can be narrowed to a
 * phone's width, in each language the site offers; and what is missing, in plain words. The frame is given the
 * page itself (srcdoc) — the app's pages refuse to be framed by any address, its own included.
 */
export default async function WebsiteReviewPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const view = await loadSite(ctx);
  const offered = languagesOf(view.config);
  const { lang } = await searchParams;
  const shown: SiteLanguage = offered.includes(lang as SiteLanguage) ? (lang as SiteLanguage) : view.config.language;
  const html = await previewHtml(ctx, shown);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t("website.previewTitle")} description={t("website.previewIntro")} />
        <CardBody className="space-y-4">
          {view.warnings.length > 0 ? (
            <div role="status" className="rounded-[var(--radius-md)] border border-warn bg-warn-soft p-3">
              <p className="text-sm font-semibold text-fg">{t("website.warningsTitle")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg">
                {view.warnings.map((w) => (
                  <li key={w}>{t(WARNING_KEYS[w])}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p role="status" className="text-sm text-fg-muted">{t("website.warningsNone")}</p>
          )}
          <PreviewFrame html={html} languages={offered} current={shown} openHref={`/admin/website/preview?lang=${shown}`} />
        </CardBody>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button asChild variant="secondary">
          <Link href="/admin/website/sections">{t("website.back")}</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/website/publish">{t("website.continue")}</Link>
        </Button>
      </div>
    </div>
  );
}
