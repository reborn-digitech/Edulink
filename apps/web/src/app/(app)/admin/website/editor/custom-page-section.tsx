"use client";

import { useEffect, useRef } from "react";
import { SITE_CUSTOM_SLUG } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { SITE_RESERVED_PATHS } from "@/lib/site-content";
import type { SectionProps } from "./types";

/**
 * A CUSTOM PAGE (website-two, 16 October 2026; at most four): a title, its own path, and limited rich text — headings,
 * paragraphs, bulleted and numbered lists, bold and links — typed in a small editing surface with a toolbar. What the
 * surface sends is HTML the server rebuilds from the allowed tags alone (src/lib/site-rich-text.ts) on every save and
 * every preview; nothing typed here reaches the site unsanitised.
 */

type ToolId = "h2" | "h3" | "p" | "bold" | "ul" | "ol" | "link" | "unlink";
const TOOLS: { id: ToolId; key: TranslationKey }[] = [
  { id: "h2", key: "siteEditor.richHeading" },
  { id: "h3", key: "siteEditor.richSubheading" },
  { id: "p", key: "siteEditor.richParagraph" },
  { id: "bold", key: "siteEditor.richBold" },
  { id: "ul", key: "siteEditor.richBullets" },
  { id: "ol", key: "siteEditor.richNumbers" },
  { id: "link", key: "siteEditor.richLink" },
  { id: "unlink", key: "siteEditor.richUnlink" },
];

export function CustomPageSection({ draft, setDraft, id, onRemoved, problem }: SectionProps & { id: string; onRemoved: () => void }) {
  const t = useT();
  const page = draft.customPages.find((p) => p.id === id);
  const surface = useRef<HTMLDivElement>(null);
  // The surface is filled once per page; afterwards it is the source and the draft follows it.
  useEffect(() => {
    if (surface.current && page) surface.current.innerHTML = page.html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (!page) return null;
  const set = (patch: Partial<typeof page>) => setDraft("customPages", draft.customPages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const slugBad = !SITE_CUSTOM_SLUG.test(page.slug) || SITE_RESERVED_PATHS.has(page.slug) || draft.customPages.some((p) => p.id !== id && p.slug === page.slug);
  const sync = () => set({ html: surface.current?.innerHTML ?? "" });
  const command = (name: string, value?: string) => {
    surface.current?.focus();
    document.execCommand(name, false, value);
    sync();
  };
  function runTool(id: ToolId) {
    if (id === "h2" || id === "h3" || id === "p") return command("formatBlock", id);
    if (id === "bold") return command("bold");
    if (id === "ul") return command("insertUnorderedList");
    if (id === "ol") return command("insertOrderedList");
    if (id === "unlink") return command("unlink");
    const url = window.prompt(t("siteEditor.richLinkAsk"), "https://");
    if (url && /^(https:\/\/|mailto:|tel:)/i.test(url.trim())) command("createLink", url.trim());
  }

  return (
    <Card data-custom-page={page.id}>
      <CardHeader title={page.title || t("siteEditor.customUntitled")} description={t("siteEditor.customIntro")} />
      <CardBody className="space-y-4">
        <CheckboxField label={t("siteEditor.pageOn")} description={t("siteEditor.pageOnHint")} checked={page.on} onChange={(e) => set({ on: e.target.checked })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={t("siteEditor.customTitle")} maxLength={60} value={page.title} onChange={(e) => set({ title: e.target.value })} />
          <TextField
            label={t("siteEditor.customSlug")}
            hint={t("siteEditor.customSlugHint", { path: `/${page.slug}` })}
            maxLength={40}
            value={page.slug}
            error={slugBad || problem?.field === "customPages" ? (slugBad ? t("siteEditor.refuseCustomSlug") : problem?.message) : undefined}
            onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 40) })}
          />
        </div>
        <div className="space-y-2">
          <p id={`rich-${page.id}-label`} className="text-sm font-medium text-fg">
            {t("siteEditor.customBody")}
          </p>
          <div role="toolbar" aria-label={t("siteEditor.richToolbar")} className="flex flex-wrap gap-1">
            {TOOLS.map((tool) => (
              <Button key={tool.id} type="button" size="sm" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => runTool(tool.id)}>
                {t(tool.key)}
              </Button>
            ))}
          </div>
          <div
            ref={surface}
            role="textbox"
            aria-multiline="true"
            aria-labelledby={`rich-${page.id}-label`}
            tabIndex={0}
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            className="rich-text min-h-48 rounded-[var(--radius-md)] border border-border bg-surface p-3 text-sm text-fg [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-accent-strong [&_a]:underline"
          />
          <p className="text-xs text-fg-muted">{t("siteEditor.customSanitised")}</p>
        </div>
        <TextField label={t("siteEditor.seoDescriptionLabel")} hint={t("siteEditor.seoDescriptionHint")} maxLength={160} value={page.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => {
            if (!window.confirm(t("siteEditor.customRemoveConfirm", { title: page.title }))) return;
            setDraft("customPages", draft.customPages.filter((p) => p.id !== id));
            onRemoved();
          }}
        >
          {t("siteEditor.customRemove")}
        </Button>
      </CardBody>
    </Card>
  );
}
