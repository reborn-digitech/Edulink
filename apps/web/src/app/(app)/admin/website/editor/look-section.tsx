"use client";

import { useEffect, useState } from "react";
import { LOCALES } from "@edulink/i18n";
import { SITE_HEADER_STYLES, SITE_HERO_STYLES, SITE_PALETTE, SITE_TEMPLATES, type SiteConfig, type SiteHeaderStyle, type SiteHeroStyle, type SiteLanguage, type SiteTemplate } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, DateField, SelectField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";
import { colourProblem, type ColourProblem } from "@/lib/site-colour";
import { PicturePicker } from "./picture";
import type { SectionProps } from "./types";

/**
 * LOOK (website-two, 16 Oct 2026; the first of the six screens, grown): six templates, each drawn small with the
 * school's own words; a primary and an accent from the palette or the logo's own colour, refused when the words on
 * them could not be read; a light or dark page; a heading face and a body face (as pairs, or one by one); the header;
 * the top of the home page; a one-line announcement with its dates; the footer's social links; the languages.
 */

const TEMPLATE_KEYS: Record<SiteTemplate, { name: TranslationKey; what: TranslationKey }> = {
  CLASSIC: { name: "website.templateClassic", what: "website.templateClassicWhat" },
  MODERN: { name: "website.templateModern", what: "website.templateModernWhat" },
  WARM: { name: "website.templateWarm", what: "website.templateWarmWhat" },
  MINIMAL: { name: "website.templateMinimal", what: "website.templateMinimalWhat" },
  HERITAGE: { name: "siteEditor.templateHeritage", what: "siteEditor.templateHeritageWhat" },
  BOLD: { name: "siteEditor.templateBold", what: "siteEditor.templateBoldWhat" },
};
const HEADER_KEYS: Record<SiteHeaderStyle, TranslationKey> = { TEMPLATE: "siteEditor.headerTemplate", LOGO_LEFT: "siteEditor.headerLeft", LOGO_CENTRED: "siteEditor.headerCentred", WORDMARK: "siteEditor.headerWordmark" };
const HERO_KEYS: Record<SiteHeroStyle, TranslationKey> = { BAND: "siteEditor.heroBand", PICTURE: "siteEditor.heroPicture", MOTTO: "siteEditor.heroMotto" };
const PROBLEM_KEYS: Record<ColourProblem, TranslationKey> = { PRIMARY_TEXT: "siteEditor.refuseContrastPrimary", ACCENT_TEXT: "siteEditor.refuseContrastAccent", LINKS: "siteEditor.refuseContrastLinks" };

/** Heading and body faces that sit well together; "default" is the reader's own system face. */
const FONT_PAIRS: { key: TranslationKey; heading: string; body: string }[] = [
  { key: "siteEditor.pairSystem", heading: "default", body: "default" },
  { key: "siteEditor.pairClassic", heading: "merriweather", body: "notosans" },
  { key: "siteEditor.pairClean", heading: "inter", body: "inter" },
  { key: "siteEditor.pairBook", heading: "notoserif", body: "notoserif" },
  { key: "siteEditor.pairDevanagari", heading: "mukta", body: "mukta" },
  { key: "siteEditor.pairMarathi", heading: "tirodevanagarimarathi", body: "mukta" },
];

export function LookSection({ draft, setDraft, data, files, posts, onFileAdded, problem, fonts, logoColour, hasLogo }: SectionProps & { fonts: { key: string; family: string; devanagari: boolean }[]; logoColour: string | null; hasLogo: boolean }) {
  const t = useT();
  const contrast = colourProblem(draft.colour, draft.accent, draft.theme);
  const palette = [...SITE_PALETTE, ...(logoColour && !(SITE_PALETTE as readonly string[]).includes(logoColour) ? [logoColour] : [])];
  void data;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={t("website.lookTitle")} description={t("siteEditor.lookIntro")} />
        <CardBody className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("website.templateLabel")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {SITE_TEMPLATES.map((tp) => (
                <label key={tp} className={cn("block cursor-pointer rounded-[var(--radius-md)] border p-2", draft.template === tp ? "border-accent ring-2 ring-accent" : "border-border")}>
                  <input type="radio" name="template" value={tp} checked={draft.template === tp} onChange={() => setDraft("template", tp)} className="sr-only" />
                  <TemplateThumb config={draft} template={tp} />
                  <span className="mt-2 block text-sm font-semibold text-fg">{t(TEMPLATE_KEYS[tp].name)}</span>
                  <span className="block text-xs text-fg-muted">{t(TEMPLATE_KEYS[tp].what)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Swatches legend={t("siteEditor.primaryLabel")} name="colour" value={draft.colour} options={palette} logoColour={logoColour} onPick={(c) => setDraft("colour", c)} t={t} />
          <Swatches legend={t("siteEditor.accentLabel")} name="accent" value={draft.accent} options={palette} logoColour={logoColour} onPick={(c) => setDraft("accent", c)} t={t} />
          <p className="text-xs text-fg-muted">{hasLogo ? (logoColour ? t("siteEditor.logoColourHint") : t("siteEditor.logoNoColour")) : t("website.colourNoLogo")}</p>
          {contrast ? (
            <p role="alert" className="text-sm font-medium text-danger" data-testid="site-contrast">
              {t(PROBLEM_KEYS[contrast])}
            </p>
          ) : (
            <p className="text-sm text-ok" data-testid="site-contrast">
              {t("siteEditor.contrastOk")}
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("siteEditor.themeLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["LIGHT", "DARK"] as const).map((th) => (
                <label key={th} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm", draft.theme === th ? "border-accent bg-accent-soft" : "border-border")}>
                  <input type="radio" name="theme" checked={draft.theme === th} onChange={() => setDraft("theme", th)} />
                  {t(th === "LIGHT" ? "siteEditor.themeLight" : "siteEditor.themeDark")}
                </label>
              ))}
            </div>
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("siteEditor.typeTitle")} description={t("siteEditor.typeIntro")} />
        <CardBody className="space-y-4">
          <div role="group" aria-label={t("siteEditor.pairsLabel")} className="flex flex-wrap gap-2">
            {FONT_PAIRS.map((p) => {
              const on = draft.headingFont === p.heading && draft.font === p.body;
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setDraft("headingFont", p.heading);
                    setDraft("font", p.body);
                  }}
                  className={cn("min-h-11 rounded-[var(--radius-md)] border px-3 text-sm", on ? "border-accent bg-accent-soft font-semibold text-accent-strong" : "border-border text-fg hover:bg-surface-muted")}
                >
                  {t(p.key)}
                </button>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FontSelect label={t("siteEditor.headingFont")} value={draft.headingFont} fonts={fonts} onChange={(v) => setDraft("headingFont", v)} t={t} />
            <FontSelect label={t("siteEditor.bodyFont")} value={draft.font} fonts={fonts} onChange={(v) => setDraft("font", v)} t={t} />
          </div>
          <p className="text-xs text-fg-muted">{t("website.fontHint")}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("siteEditor.headerTitle")} />
        <CardBody className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("siteEditor.headerStyle")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SITE_HEADER_STYLES.map((h) => (
                <label key={h} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm", draft.headerStyle === h ? "border-accent bg-accent-soft" : "border-border")}>
                  <input type="radio" name="headerStyle" checked={draft.headerStyle === h} onChange={() => setDraft("headerStyle", h)} />
                  {t(HEADER_KEYS[h])}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("siteEditor.heroStyle")}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SITE_HERO_STYLES.map((h) => (
                <label key={h} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm", draft.heroStyle === h ? "border-accent bg-accent-soft" : "border-border")}>
                  <input type="radio" name="heroStyle" checked={draft.heroStyle === h} onChange={() => setDraft("heroStyle", h)} />
                  {t(HERO_KEYS[h])}
                </label>
              ))}
            </div>
          </fieldset>
          {draft.heroStyle === "PICTURE" ? (
            <PicturePicker label={t("siteEditor.heroPictureLabel")} value={draft.heroPicture} onChange={(p) => setDraft("heroPicture", p)} files={files} posts={posts} onFileAdded={onFileAdded} />
          ) : null}
          {problem?.field === "heroPicture" ? <p role="alert" className="text-sm text-danger">{problem.message}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("siteEditor.announcementTitle")} description={t("siteEditor.announcementIntro")} />
        <CardBody className="space-y-3">
          <TextField label={t("siteEditor.announcementText")} maxLength={160} value={draft.announcement.text} onChange={(e) => setDraft("announcement", { ...draft.announcement, text: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField label={t("siteEditor.announcementFrom")} value={draft.announcement.from} onChange={(e) => setDraft("announcement", { ...draft.announcement, from: e.target.value })} />
            <DateField label={t("siteEditor.announcementTo")} value={draft.announcement.to} error={problem?.field === "announcement" ? problem.message : undefined} onChange={(e) => setDraft("announcement", { ...draft.announcement, to: e.target.value })} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("siteEditor.footerTitle")} description={t("siteEditor.footerIntro")} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("siteWeb.socialFacebook")} type="url" maxLength={200} value={draft.social.facebook} onChange={(e) => setDraft("social", { ...draft.social, facebook: e.target.value })} />
          <TextField label={t("siteWeb.socialInstagram")} type="url" maxLength={200} value={draft.social.instagram} onChange={(e) => setDraft("social", { ...draft.social, instagram: e.target.value })} />
          <TextField label={t("siteWeb.socialYoutube")} type="url" maxLength={200} value={draft.social.youtube} onChange={(e) => setDraft("social", { ...draft.social, youtube: e.target.value })} />
          <TextField label={t("siteWeb.socialWhatsapp")} hint={t("siteEditor.whatsappHint")} type="tel" maxLength={20} value={draft.social.whatsapp} onChange={(e) => setDraft("social", { ...draft.social, whatsapp: e.target.value })} />
          {problem?.field === "social" ? <p role="alert" className="text-sm text-danger sm:col-span-2">{problem.message}</p> : null}
          <p className="text-xs text-fg-muted sm:col-span-2">{t("siteEditor.disclosureFooter")}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("website.languageLabel")} />
        <CardBody className="space-y-3">
          <SelectField label={t("website.languageLabel")} hint={t("website.languageHint")} value={draft.language} onChange={(e) => setDraft("language", e.target.value as SiteLanguage)}>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </SelectField>
          <CheckboxField label={t("website.offerOtherLanguages")} description={t("website.offerOtherLanguagesHint")} checked={draft.offerOtherLanguages} onChange={(e) => setDraft("offerOtherLanguages", e.target.checked)} />
        </CardBody>
      </Card>
    </div>
  );
}

function FontSelect({ label, value, fonts, onChange, t }: { label: string; value: string; fonts: { key: string; family: string; devanagari: boolean }[]; onChange: (v: string) => void; t: ReturnType<typeof useT> }) {
  return (
    <SelectField label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="default">{t("website.fontDefault")}</option>
      {fonts.map((f) => (
        <option key={f.key} value={f.key}>
          {f.family}
        </option>
      ))}
    </SelectField>
  );
}

function Swatches({ legend, name, value, options, logoColour, onPick, t }: { legend: string; name: string; value: string; options: string[]; logoColour: string | null; onPick: (c: string) => void; t: ReturnType<typeof useT> }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-fg">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((sw, i) => (
          <label key={sw} className={cn("grid size-12 cursor-pointer place-items-center rounded-full border-2", value.toLowerCase() === sw.toLowerCase() ? "border-fg" : "border-transparent")}>
            <input type="radio" name={name} value={sw} checked={value.toLowerCase() === sw.toLowerCase()} onChange={() => onPick(sw)} className="sr-only" aria-label={sw === logoColour ? t("siteEditor.fromLogo") : t("website.colourSwatch", { n: i + 1 })} />
            <span aria-hidden="true" className="size-9 rounded-full" style={{ background: sw }} />
          </label>
        ))}
      </div>
      {logoColour ? (
        <button type="button" onClick={() => onPick(logoColour)} className="min-h-11 rounded-[var(--radius-md)] px-2 text-sm text-accent-strong underline">
          {t("siteEditor.fromLogo")}
        </button>
      ) : null}
    </fieldset>
  );
}

/**
 * A template drawn small with the school's own draft (the preview route, in a frame scaled to a quarter): drawn once
 * the editor has stopped changing the colours and faces for a moment.
 */
function TemplateThumb({ config, template }: { config: SiteConfig; template: SiteTemplate }) {
  const t = useT();
  const [html, setHtml] = useState("");
  const key = `${template}|${config.colour}|${config.accent}|${config.theme}|${config.font}|${config.headingFont}|${config.headerStyle}|${config.heroStyle}|${config.language}`;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/admin/website/preview?lang=${config.language}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ config: { ...config, template }, page: "" }), signal: controller.signal });
        if (res.ok) setHtml(await res.text());
      } catch {
        /* the thumbnail stays as it was */
      }
    }, 900);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Drawn again when the look changes, not on every word typed elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <div aria-hidden="true" className="relative h-40 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
      {html ? <iframe title={t("website.previewFrameTitle")} srcDoc={html} sandbox="allow-same-origin" tabIndex={-1} className="pointer-events-none absolute left-0 top-0 h-[640px] w-[1280px] origin-top-left scale-[0.25] border-0" /> : null}
    </div>
  );
}
