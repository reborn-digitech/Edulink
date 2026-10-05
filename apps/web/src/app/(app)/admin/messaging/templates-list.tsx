"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { LOCALES } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { MESSAGE_LOCALES, renderTemplate, type MessageEvent, type MessageTemplateKey } from "@/lib/message-templates";
import { EVENT_KEY, word } from "./labels";

export type TemplateView = { key: MessageTemplateKey; label: string; event: MessageEvent | null; smsIds: Record<string, string>; whatsappIds: Record<string, string> };

/**
 * Every fixed template, with its registered ids and a preview of the three
 * texts filled with sample values — the same rendering the router uses, so
 * what the office reads here is what a family's phone shows.
 */
export function TemplatesList({ templates, school }: { templates: TemplateView[]; school: string }) {
  const t = useT();
  const [open, setOpen] = useState<MessageTemplateKey | null>(null);
  const sample = {
    school,
    child: t("messaging.sampleChild"),
    amount: "₹1,250",
    date: "15/07/2026",
    serial: "RCPT/2026–27/000012",
    notice: t("messaging.sampleNotice"),
  };
  const ids = (map: Record<string, string>) => {
    const entries = Object.entries(map);
    if (entries.length === 0) return <span className="text-fg-muted">{t("messaging.templateNone")}</span>;
    return <span className="font-mono text-xs">{entries.map(([lang, id]) => `${lang}: ${id}`).join(" · ")}</span>;
  };

  return (
    <ul className="divide-y divide-border">
      {templates.map((tpl) => {
        const expanded = open === tpl.key;
        const panelId = `template-${tpl.key}`;
        return (
          <li key={tpl.key} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-medium text-fg">{tpl.label}</p>
                <p className="text-xs text-fg-muted">
                  {t("messaging.templateEvent")}: {tpl.event ? word(t, EVENT_KEY, tpl.event) : "—"}
                </p>
                <p className="text-xs text-fg-muted">
                  {t("messaging.templateSmsIds")}: {ids(tpl.smsIds)}
                </p>
                <p className="text-xs text-fg-muted">
                  {t("messaging.templateWhatsappIds")}: {ids(tpl.whatsappIds)}
                </p>
              </div>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : tpl.key)}
                className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-sm font-medium text-accent-strong hover:bg-accent-soft"
              >
                {t("messaging.templatePreview")}
                {expanded ? <CaretUpIcon weight="bold" className="size-4" aria-hidden="true" /> : <CaretDownIcon weight="bold" className="size-4" aria-hidden="true" />}
              </button>
            </div>
            {expanded && (
              <ul id={panelId} className="mt-3 space-y-2">
                {MESSAGE_LOCALES.map((lang) => (
                  <li key={lang} className="rounded-[var(--radius-md)] bg-surface-muted px-3 py-2">
                    <Badge tone="outline" size="sm">
                      {LOCALES.find((l) => l.code === lang)?.native ?? lang}
                    </Badge>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg">{renderTemplate(tpl.key, lang, sample)}</p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
