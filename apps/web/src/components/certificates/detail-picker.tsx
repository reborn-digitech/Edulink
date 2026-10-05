"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, PencilSimpleLineIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import type { PaletteEntry, PaletteGroup } from "@/lib/certificates";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { fieldClass } from "@/components/ui/field-class";

/**
 * The list a detail is chosen from: what the certificate can print about a
 * pupil, under the six headings an office would look for it, with a box to
 * search and beside each name what it prints for the sample pupil. It opens
 * under the button that asked for it and writes to the field that button
 * belongs to, so there is no "click into a text first" to forget.
 *
 * Named in the READER's language. The label a new row is given is in the
 * DOCUMENT's, and is the caller's to choose from the entry handed back.
 */
const GROUPS: { group: PaletteGroup; key: TranslationKey }[] = [
  { group: "PUPIL", key: "certificates.groupPupil" },
  { group: "FAMILY", key: "certificates.groupFamily" },
  { group: "ADMISSION", key: "certificates.groupAdmission" },
  { group: "SCHOOL", key: "certificates.groupSchool" },
  { group: "LEAVING", key: "certificates.groupLeaving" },
  { group: "ISSUE", key: "certificates.groupIssue" },
];

const fold = (s: string) => s.toLocaleLowerCase().normalize("NFKD");

export function DetailPicker({ palette, onPick, onBlank, label, intro, variant = "insert", disabled, testId }: { palette: PaletteEntry[]; onPick: (entry: PaletteEntry) => void; onBlank?: () => void; label: string; intro?: string; variant?: "insert" | "add" | "icon"; disabled?: boolean; testId?: string }) {
  const t = useT();
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** The first button inside is the one that opened the list; the focus goes back to it when the list shuts. */
  const wrap = useRef<HTMLDivElement>(null);
  const reader = locale === "hi" || locale === "mr" ? locale : "en";

  const shown = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return palette;
    // Found by its name in any of the three languages, or by what it prints.
    return palette.filter((p) => [p.labels.en, p.labels.hi, p.labels.mr, p.samples[reader]].some((s) => fold(s).includes(q)));
  }, [palette, query, reader]);

  const close = () => {
    setOpen(false);
    setQuery("");
    wrap.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };
  const choose = (entry: PaletteEntry) => {
    close();
    onPick(entry);
  };

  return (
    <div ref={wrap} className="min-w-0" onKeyDown={(event) => event.key === "Escape" && open && (event.stopPropagation(), close())}>
      {variant === "icon" ? (
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={open ? `${id}-panel` : undefined}
          aria-label={label}
          title={label}
          onClick={() => (open ? close() : setOpen(true))}
          data-testid={testId}
          className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
        >
          <PencilSimpleLineIcon weight="bold" className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <Button type="button" variant="secondary" size="sm" disabled={disabled} aria-expanded={open} aria-controls={open ? `${id}-panel` : undefined} onClick={() => (open ? close() : setOpen(true))} icon={<PlusIcon weight="bold" />} data-testid={testId}>
          {label}
        </Button>
      )}

      {open && (
        <div id={`${id}-panel`} role="group" aria-label={label} className="mt-2 space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3" data-testid="detail-picker">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs leading-relaxed text-fg-muted">{intro ?? t("certificates.detailsHint")}</p>
            <button type="button" onClick={close} aria-label={t("common.cancel")} title={t("common.cancel")} className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-fg-muted hover:bg-surface hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <XIcon weight="bold" className="size-4" aria-hidden="true" />
            </button>
          </div>
          <label className="relative block">
            <span className="sr-only">{t("certificates.pickSearch")}</span>
            <MagnifyingGlassIcon weight="bold" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <input type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("certificates.pickSearch")} autoComplete="off" className={fieldClass("pl-9")} data-testid="detail-search" />
          </label>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1" tabIndex={0} role="region" aria-label={label}>
            {onBlank && !query.trim() && (
              <button type="button" onClick={() => (close(), onBlank())} className="flex min-h-11 w-full flex-col items-start rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface px-3 py-2 text-left hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" data-testid="detail-blank">
                <span className="text-sm font-medium text-fg">{t("certificates.blankRow")}</span>
                <span className="text-xs text-fg-muted">{t("certificates.blankRowHint")}</span>
              </button>
            )}
            {GROUPS.map(({ group, key }) => {
              const entries = shown.filter((p) => p.group === group);
              if (entries.length === 0) return null;
              return (
                <section key={group} aria-label={t(key)}>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t(key)}</h4>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {entries.map((entry) => (
                      <li key={entry.key}>
                        <button type="button" onClick={() => choose(entry)} className="flex min-h-11 w-full flex-col items-start rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-left hover:border-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" data-testid={`detail-${entry.key}`}>
                          <span className="text-sm font-medium text-fg">{entry.labels[reader]}</span>
                          <span className="text-xs text-fg-muted">{t("certificates.sampleFor", { sample: entry.samples[reader] })}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            {shown.length === 0 && <p className="py-3 text-center text-sm text-fg-muted">{t("certificates.pickNone")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
