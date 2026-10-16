"use client";

import type { SitePage } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import { pageHasContent, SITE_PAGE_PATH, SITE_PAGE_TITLE } from "@/lib/site-content";
import type { SectionProps } from "./types";

/**
 * A PAGE'S OWN SETTINGS (website-two, 16 Oct 2026): on or off (Home is always on), its name in the menu and its
 * heading, a short lead under the heading, and what search engines are told — a title and a description. A page with
 * nothing to show is left out of the menu and answers "not found", and this says so.
 */
export function PageHead({ draft, setDraft, data, code }: SectionProps & { code: SitePage }) {
  const t = useT();
  const index = draft.pages.findIndex((p) => p.code === code);
  const page = draft.pages[index] ?? { code, on: true, title: "", lead: "", seoTitle: "", seoDescription: "" };
  const set = (patch: Partial<typeof page>) => setDraft("pages", draft.pages.map((p) => (p.code === code ? { ...p, ...patch } : p)));
  const shows = pageHasContent(code, draft, data);
  const name = page.title.trim() || t(SITE_PAGE_TITLE[code]);
  return (
    <Card data-page={code}>
      <CardHeader title={name} description={code === "HOME" ? t("siteEditor.homeIntro") : t("siteEditor.pagePath", { path: `/${SITE_PAGE_PATH[code]}` })} />
      <CardBody className="space-y-4">
        {code !== "HOME" ? <CheckboxField label={t("siteEditor.pageOn")} description={t("siteEditor.pageOnHint")} checked={page.on} onChange={(e) => set({ on: e.target.checked })} /> : null}
        {(page.on || code === "HOME") && !shows ? (
          <p className="rounded-[var(--radius-md)] border border-warn bg-warn-soft px-3 py-2 text-sm text-fg" data-testid="page-empty">
            {t("siteEditor.pageEmpty")}
          </p>
        ) : null}
        {code !== "HOME" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={t("siteEditor.pageTitleLabel")} hint={t("siteEditor.sectionTitleHint", { name: t(SITE_PAGE_TITLE[code]) })} maxLength={60} value={page.title} onChange={(e) => set({ title: e.target.value })} />
            <TextField label={t("siteEditor.leadLabel")} hint={t("siteEditor.leadHint")} maxLength={300} value={page.lead} onChange={(e) => set({ lead: e.target.value })} />
          </div>
        ) : null}
        <details className="rounded-[var(--radius-md)] border border-border p-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium text-fg">{t("siteEditor.seoTitle")}</summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-fg-muted">{t("siteEditor.seoIntro")}</p>
            <TextField label={t("siteEditor.seoTitleLabel")} hint={t("siteEditor.seoTitleHint")} maxLength={70} value={page.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
            <TextField label={t("siteEditor.seoDescriptionLabel")} hint={t("siteEditor.seoDescriptionHint")} maxLength={160} value={page.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
          </div>
        </details>
      </CardBody>
    </Card>
  );
}
