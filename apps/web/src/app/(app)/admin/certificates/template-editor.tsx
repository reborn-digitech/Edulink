"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, FloppyDiskIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { CertificateKind, CertificateLayout, CertificateTemplateSave, CertificateTemplatesView } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { CERTIFICATE_KIND_KEY, localeName } from "@/components/certificates/labels";
import { saveTemplateAction } from "./actions";

type Preset = CertificateTemplatesView["presets"][number];
type Template = CertificateTemplatesView["templates"][number];
type RowDraft = { key: string; label: string; value: string };

const KINDS: CertificateKind[] = ["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM"];
const LOCALES: ("en" | "hi" | "mr")[] = ["en", "hi", "mr"];
const LAYOUT_TOGGLES: (keyof Pick<CertificateLayout, "showLogo" | "showAddress" | "useBrandColour">)[] = ["showLogo", "showAddress", "useBrandColour"];

let seq = 0;
const nextKey = () => `row-${++seq}`;
const toRows = (rows: { label: string; value: string }[]): RowDraft[] => rows.map((r) => ({ key: nextKey(), label: r.label, value: r.value }));

type Draft = Omit<CertificateTemplateSave, "rows"> & { rows: RowDraft[] };

function draftFrom(source: Preset | Template, active: boolean): Draft {
  return {
    kind: source.kind,
    name: source.name,
    locale: source.locale,
    title: source.title,
    intro: source.intro,
    rows: toRows(source.rows),
    outro: source.outro,
    layout: { ...source.layout },
    serialPrefix: source.serialPrefix,
    active,
  };
}

/**
 * The office's editor for one certificate template: its wording in the
 * language the document is written in, its numbered rows, its layout and
 * its serial prefix. A preset fills the whole form so a school starts from
 * a board-shaped document and changes the words, never from a blank page.
 *
 * PLACEHOLDERS ARE INSERTED WHERE THE CURSOR WAS. Each text that may carry
 * one reports itself on focus; the palette splices [[key]] into that text
 * at its caret and puts the caret after it, so writing "[[pupil.name]]" by
 * hand is never required and never mistyped.
 */
export function TemplateEditor({ view, template }: { view: CertificateTemplatesView; template?: Template }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [preset, setPreset] = useState<string>(template ? "" : (view.presets[0]?.key ?? ""));
  const [draft, setDraft] = useState<Draft>(() => (template ? draftFrom(template, template.active) : view.presets[0] ? draftFrom(view.presets[0], true) : { kind: "CUSTOM", name: "", locale: "en", title: "", intro: "", rows: [], outro: "", layout: { showLogo: true, showAddress: true, useBrandColour: true, signatureLeft: "", signatureRight: "", footerNote: null, paper: "A4" }, serialPrefix: "CERT", active: true }));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** The text last focused, so the palette knows where to write. */
  const focused = useRef<{ id: string; el: HTMLInputElement | HTMLTextAreaElement } | null>(null);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const patchLayout = (p: Partial<CertificateLayout>) => setDraft((d) => ({ ...d, layout: { ...d.layout, ...p } }));
  const patchRow = (key: string, p: Partial<RowDraft>) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.key === key ? { ...r, ...p } : r)) }));
  const removeRow = (key: string) => setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.key !== key) }));
  const addRow = () => setDraft((d) => ({ ...d, rows: [...d.rows, { key: nextKey(), label: "", value: "" }] }));
  const moveRow = (key: string, delta: -1 | 1) =>
    setDraft((d) => {
      const index = d.rows.findIndex((r) => r.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= d.rows.length) return d;
      const rows = [...d.rows];
      const [row] = rows.splice(index, 1);
      rows.splice(target, 0, row!);
      return { ...d, rows };
    });

  function choosePreset(key: string) {
    setPreset(key);
    const found = view.presets.find((p) => p.key === key);
    if (!found) return;
    // The name and the active flag are the office's own; the preset brings the words.
    setDraft((d) => ({ ...draftFrom(found, d.active), name: template ? d.name : found.name }));
  }

  /** Writes a field by its id — the three paragraphs, or one row's value. */
  function writeField(id: string, next: string) {
    if (id === "title" || id === "intro" || id === "outro") patch({ [id]: next } as Partial<Draft>);
    else if (id.startsWith("value:")) patchRow(id.slice("value:".length), { value: next });
  }

  function insertPlaceholder(key: string) {
    const target = focused.current;
    if (!target) return;
    const token = `[[${key}]]`;
    const { el, id } = target;
    const current = el.value;
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? start;
    writeField(id, current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* a field type that has no caret */
      }
    });
  }

  /** Each text that may carry a placeholder names itself; the handler runs on focus, never during render. */
  const rememberFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const id = event.currentTarget.dataset.field;
    if (id) focused.current = { id, el: event.currentTarget };
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    const needed = t("common.checkTheForm");
    if (!draft.name.trim()) errors.name = needed;
    if (!draft.title.trim()) errors.title = needed;
    if (!/^[A-Za-z0-9-]{1,12}$/.test(draft.serialPrefix.trim())) errors.serialPrefix = t("certificates.serialHint");
    const rows = draft.rows.filter((r) => r.label.trim() || r.value.trim());
    for (const r of rows) if (!r.label.trim()) errors[`row-${r.key}`] = needed;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(needed);
      return;
    }
    const input: CertificateTemplateSave = {
      kind: draft.kind,
      name: draft.name.trim().slice(0, 80),
      locale: draft.locale,
      title: draft.title.trim().slice(0, 120),
      intro: draft.intro.trim().slice(0, 2000),
      rows: rows.slice(0, 40).map((r) => ({ label: r.label.trim().slice(0, 80), value: r.value.trim().slice(0, 200) })),
      outro: draft.outro.trim().slice(0, 2000),
      layout: {
        ...draft.layout,
        signatureLeft: draft.layout.signatureLeft.trim().slice(0, 40),
        signatureRight: draft.layout.signatureRight.trim().slice(0, 40),
        footerNote: draft.layout.footerNote?.trim().slice(0, 240) || null,
      },
      serialPrefix: draft.serialPrefix.trim().toUpperCase(),
      active: draft.active,
    };
    startTransition(async () => {
      const result = await saveTemplateAction(input, template?.id);
      if (!result.ok) {
        if (result.errorKey === "certificates.nameTaken") {
          setFieldErrors({ name: t("certificates.nameTaken") });
          setError(t("certificates.nameTaken"));
          return;
        }
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("certificates.saved") });
      if (template) router.refresh();
      else router.push("/admin/certificates");
    });
  }

  const iconButton = "grid size-10 shrink-0 place-items-center rounded-[--radius-md] text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40";
  const compact = "[&_input]:min-h-10 [&_input]:py-2";
  const layoutLabel: Record<(typeof LAYOUT_TOGGLES)[number], string> = {
    showLogo: t("certificates.showLogo"),
    showAddress: t("certificates.showAddress"),
    useBrandColour: t("certificates.useBrandColour"),
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6" data-testid="certificate-template-editor">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* ---- what this template is ---- */}
      <Card>
        <CardHeader title={t("certificates.templatesTitle")} description={t("certificates.templatesIntro")} />
        <CardBody className="space-y-4">
          <SelectField label={t("certificates.fromPreset")} value={preset} onChange={(e) => choosePreset(e.target.value)} className="max-w-sm" data-testid="template-preset">
            {template && <option value="">—</option>}
            {LOCALES.map((locale) => (
              <optgroup key={locale} label={localeName(locale)}>
                {view.presets
                  .filter((p) => p.locale === locale)
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </SelectField>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={t("certificates.name")} value={draft.name} maxLength={80} required autoComplete="off" error={fieldErrors.name} onChange={(e) => patch({ name: e.target.value })} data-testid="template-name" />
            <SelectField label={t("certificates.kind")} value={draft.kind} onChange={(e) => patch({ kind: e.target.value as CertificateKind })}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(CERTIFICATE_KIND_KEY[k])}
                </option>
              ))}
            </SelectField>
            <SelectField label={t("certificates.language")} value={draft.locale} onChange={(e) => patch({ locale: e.target.value as Draft["locale"] })}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {localeName(l)}
                </option>
              ))}
            </SelectField>
            <TextField label={t("certificates.serialPrefix")} hint={t("certificates.serialHint")} value={draft.serialPrefix} maxLength={12} autoComplete="off" error={fieldErrors.serialPrefix} onChange={(e) => patch({ serialPrefix: e.target.value })} />
          </div>
          <CheckboxField label={t("certificates.active")} checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} />
        </CardBody>
      </Card>

      {/* ---- the words ---- */}
      <Card>
        <CardHeader title={t("certificates.heading")} />
        <CardBody className="space-y-4">
          <TextField label={t("certificates.heading")} value={draft.title} maxLength={120} required autoComplete="off" error={fieldErrors.title} onChange={(e) => patch({ title: e.target.value })} data-field="title" onFocus={rememberFocus} data-testid="template-title" />
          <TextAreaField label={t("certificates.introText")} rows={4} value={draft.intro} maxLength={2000} onChange={(e) => patch({ intro: e.target.value })} data-field="intro" onFocus={rememberFocus} />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("certificates.rows")}</legend>
            {draft.rows.map((row, index) => {
              const rowName = row.label || String(index + 1);
              return (
                <div key={row.key} className="grid grid-cols-2 items-end gap-2 rounded-[--radius-md] border border-border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto_auto_auto]">
                  <TextField label={t("certificates.rowLabel")} value={row.label} maxLength={80} autoComplete="off" error={fieldErrors[`row-${row.key}`]} onChange={(e) => patchRow(row.key, { label: e.target.value })} className={compact} />
                  <TextField label={t("certificates.rowValue")} value={row.value} maxLength={200} autoComplete="off" onChange={(e) => patchRow(row.key, { value: e.target.value })} data-field={`value:${row.key}`} onFocus={rememberFocus} className={compact} />
                  <button type="button" className={iconButton} onClick={() => moveRow(row.key, -1)} disabled={index === 0} aria-label={[t("syllabus.moveUp"), rowName].join(": ")} title={t("syllabus.moveUp")}>
                    <ArrowUpIcon weight="bold" className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" className={iconButton} onClick={() => moveRow(row.key, 1)} disabled={index === draft.rows.length - 1} aria-label={[t("syllabus.moveDown"), rowName].join(": ")} title={t("syllabus.moveDown")}>
                    <ArrowDownIcon weight="bold" className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" className={`${iconButton} hover:text-danger`} onClick={() => removeRow(row.key)} aria-label={[t("certificates.removeRow"), rowName].join(": ")} title={t("certificates.removeRow")}>
                    <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
            <Button type="button" variant="secondary" size="sm" onClick={addRow} icon={<PlusIcon weight="bold" />} disabled={draft.rows.length >= 40}>
              {t("certificates.addRow")}
            </Button>
          </fieldset>

          <TextAreaField label={t("certificates.outroText")} rows={3} value={draft.outro} maxLength={2000} onChange={(e) => patch({ outro: e.target.value })} data-field="outro" onFocus={rememberFocus} />
        </CardBody>
      </Card>

      {/* ---- the placeholder palette ---- */}
      <Card>
        <CardHeader title={t("certificates.placeholders")} description={t("certificates.placeholdersHint")} />
        <CardBody>
          <ul className="flex flex-wrap gap-2" aria-label={t("certificates.placeholders")}>
            {view.placeholders.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault() /* keep the focus where the text is */}
                  onClick={() => insertPlaceholder(p.key)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-left text-xs hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  title={[t("certificates.insert"), `[[${p.key}]]`].join(" ")}
                >
                  <span className="font-medium text-fg">{p.label}</span>
                  <span className="ml-1.5 text-fg-muted">{p.sample}</span>
                </button>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* ---- the printed layout ---- */}
      <Card>
        <CardHeader title={t("certificates.layoutTitle")} />
        <CardBody className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {LAYOUT_TOGGLES.map((key) => (
              <CheckboxField key={key} label={layoutLabel[key]} checked={draft.layout[key]} onChange={(e) => patchLayout({ [key]: e.target.checked })} />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={t("certificates.signatureLeft")} value={draft.layout.signatureLeft} maxLength={40} autoComplete="off" onChange={(e) => patchLayout({ signatureLeft: e.target.value })} />
            <TextField label={t("certificates.signatureRight")} value={draft.layout.signatureRight} maxLength={40} autoComplete="off" onChange={(e) => patchLayout({ signatureRight: e.target.value })} />
          </div>
          <TextField label={t("certificates.footerNote")} value={draft.layout.footerNote ?? ""} maxLength={240} autoComplete="off" onChange={(e) => patchLayout({ footerNote: e.target.value })} />
          <SelectField label={t("certificates.paper")} value={draft.layout.paper} onChange={(e) => patchLayout({ paper: e.target.value === "LETTER" ? "LETTER" : "A4" })} className="max-w-xs">
            <option value="A4">{t("reportCardConfig.paperA4")}</option>
            <option value="LETTER">{t("reportCardConfig.paperLetter")}</option>
          </SelectField>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="template-save">
          {t("certificates.save")}
        </Button>
      </div>
    </form>
  );
}
