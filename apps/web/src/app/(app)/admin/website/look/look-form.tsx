"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES } from "@edulink/i18n";
import { SITE_SWATCHES, SITE_TEMPLATES, type SiteLanguage, type SiteSwatch, type SiteTemplate } from "@edulink/contracts";
import { SelectField, CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";
import { saveSiteDraftAction } from "../actions";
import { StepFooter } from "../steps";

type Look = { template: SiteTemplate; colour: SiteSwatch; font: string; language: SiteLanguage; offerOtherLanguages: boolean };

const TEMPLATE_KEYS: Record<SiteTemplate, { name: TranslationKey; what: TranslationKey }> = {
  CLASSIC: { name: "website.templateClassic", what: "website.templateClassicWhat" },
  MODERN: { name: "website.templateModern", what: "website.templateModernWhat" },
  WARM: { name: "website.templateWarm", what: "website.templateWarmWhat" },
  MINIMAL: { name: "website.templateMinimal", what: "website.templateMinimalWhat" },
};

/** A small drawing of each template's header and rhythm, in the chosen colour. */
function Thumb({ template, colour }: { template: SiteTemplate; colour: string }) {
  const bar = "h-1.5 rounded-full bg-surface-muted";
  if (template === "CLASSIC")
    return (
      <div aria-hidden="true" className="space-y-1.5">
        <div className="grid h-9 place-items-center rounded-[var(--radius-sm)]" style={{ background: colour }}>
          <div className="h-1.5 w-12 rounded-full bg-white/80" />
        </div>
        <div className={bar} />
        <div className="h-3 rounded-[var(--radius-sm)]" style={{ background: `${colour}22` }} />
        <div className={bar} />
      </div>
    );
  if (template === "MODERN")
    return (
      <div aria-hidden="true" className="space-y-1.5">
        <div className="flex h-9 items-center justify-between border-b-4 px-1" style={{ borderColor: colour }}>
          <div className="size-4 rounded-[var(--radius-sm)]" style={{ background: colour }} />
          <div className="h-1.5 w-10 rounded-full bg-surface-muted" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div className="h-5 rounded-[var(--radius-sm)] border border-border" />
          <div className="h-5 rounded-[var(--radius-sm)] border border-border" />
        </div>
      </div>
    );
  if (template === "WARM")
    return (
      <div aria-hidden="true" className="space-y-1.5 rounded-[var(--radius-sm)] bg-[#fdf8f3] p-1">
        <div className="h-9 rounded-[var(--radius-lg)]" style={{ background: `${colour}55` }} />
        <div className="h-1.5 w-10 rounded-full" style={{ background: colour }} />
        <div className={bar} />
      </div>
    );
  return (
    <div aria-hidden="true" className="space-y-2 border-t-4 pt-2" style={{ borderColor: colour }}>
      <div className="h-2 w-16 rounded-full bg-fg/60" />
      <div className={bar} />
      <div className={bar} />
    </div>
  );
}

export function LookForm({ initial, fonts, hasLogo }: { initial: Look; fonts: { key: string; family: string; devanagari: boolean }[]; hasLogo: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [look, setLook] = useState<Look>(initial);
  const set = <K extends keyof Look>(k: K, v: Look[K]) => setLook((l) => ({ ...l, [k]: v }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSiteDraftAction(look);
          if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
          router.push("/admin/website/about");
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("website.templateLabel")}</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SITE_TEMPLATES.map((tp) => (
            <label key={tp} className={cn("block cursor-pointer rounded-[var(--radius-md)] border p-3", look.template === tp ? "border-accent ring-2 ring-accent" : "border-border")}>
              <input type="radio" name="template" value={tp} checked={look.template === tp} onChange={() => set("template", tp)} className="sr-only" />
              <Thumb template={tp} colour={look.colour} />
              <span className="mt-2 block text-sm font-semibold text-fg">{t(TEMPLATE_KEYS[tp].name)}</span>
              <span className="block text-xs text-fg-muted">{t(TEMPLATE_KEYS[tp].what)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("website.colourLabel")}</legend>
        <p className="text-xs text-fg-muted">{hasLogo ? t("website.colourFromLogo") : t("website.colourNoLogo")}</p>
        <div className="flex flex-wrap gap-3">
          {SITE_SWATCHES.map((sw, i) => (
            <label key={sw} className={cn("grid size-12 cursor-pointer place-items-center rounded-full border-2", look.colour === sw ? "border-fg" : "border-transparent")}>
              <input type="radio" name="colour" value={sw} checked={look.colour === sw} onChange={() => set("colour", sw)} className="sr-only" aria-label={t("website.colourSwatch", { n: i + 1 })} />
              <span aria-hidden="true" className="size-9 rounded-full" style={{ background: sw }} />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t("website.fontLabel")} hint={t("website.fontHint")} value={look.font} onChange={(e) => set("font", e.target.value)}>
          <option value="default">{t("website.fontDefault")}</option>
          {fonts.map((f) => (
            <option key={f.key} value={f.key}>
              {f.family}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("website.languageLabel")} hint={t("website.languageHint")} value={look.language} onChange={(e) => set("language", e.target.value as SiteLanguage)}>
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </SelectField>
      </div>
      <CheckboxField label={t("website.offerOtherLanguages")} description={t("website.offerOtherLanguagesHint")} checked={look.offerOtherLanguages} onChange={(e) => set("offerOtherLanguages", e.target.checked)} />

      <StepFooter back={null} pending={pending} />
    </form>
  );
}
